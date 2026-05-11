// src/routes/pages/almacen/AlmacenesSucursalDialog.jsx
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  IconButton,
  CircularProgress,
} from "@mui/material";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import {
  Boxes,
  Eye,
  PencilLine,
  Trash,
  LayoutList,
  MapPin,
} from "lucide-react";

import DetailsDialog from "@/components/details";
import DeleteConfirm from "@/components/deleteConfirm";

import ServiceAlmacen from "@/services/ServiceAlmacen";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";
import AlmacenForm from "./almacenForm";

import SeccionesAlmacenDialog from "@/routes/pages/seccion/SeccionesAlmacenDialog";

const AlmacenesSucursalDialog = ({ open, sucursal, onClose }) => {
  const [almacenes, setAlmacenes] = useState([]);
  const [search, setSearch] = useState("");
  const [loadingAlmacenes, setLoadingAlmacenes] = useState(false);

  const [selectedId, setSelectedId] = useState(null);
  const [idToDelete, setIdToDelete] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(null);

  const [openSecciones, setOpenSecciones] = useState(false);
  const [almacenSeleccionado, setAlmacenSeleccionado] = useState(null);

  const { user } = useAuth();
  const roleKey = (user?.rol || "").trim().toLowerCase();

  const canCreate = roleKey === "administrador" || roleKey === "almacen";
  const canEdit = roleKey === "administrador" || roleKey === "almacen";
  const canDelete = roleKey === "administrador";

  const fetchAlmacenes = async () => {
    if (!sucursal?.id) return;

    try {
      setLoadingAlmacenes(true);

      const res = await ServiceAlmacen.getBySucursal(sucursal.id, {
        search,
        page: 1,
        pageSize: 50,
      });

      setAlmacenes(res.items || []);
    } catch (error) {
      console.error("Error cargando almacenes:", error);
      toast.error("Error al cargar almacenes");
    } finally {
      setLoadingAlmacenes(false);
    }
  };

  useEffect(() => {
    if (!open) return;

    setAlmacenes([]);
    setSearch("");
    setSelectedId(null);
    setIdToDelete(null);
    setShowForm(false);
    setFormData(null);
    setOpenSecciones(false);
    setAlmacenSeleccionado(null);
    setLoadingAlmacenes(true);
  }, [sucursal?.id, open]);

  useEffect(() => {
    if (!open || !sucursal?.id) return;

    const timer = setTimeout(() => {
      fetchAlmacenes();
    }, search ? 400 : 0);

    return () => clearTimeout(timer);
  }, [open, sucursal?.id, search]);

  const fields = [
    { label: "Nombre", key: "nombre" },
    { label: "Dirección", key: "direccion" },
    {
      label: "Sucursal",
      key: "sucursalId",
      format: () => sucursal.nombre ?? "—",
    },
    {
      label: "Fecha Registro",
      key: "fechaRegistro",
      format: (v) =>
        v
          ? new Date(v).toLocaleString("es-ES", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—",
    },
  ];

  const handleCloseDialog = () => {
    setAlmacenes([]);
    setSearch("");
    setSelectedId(null);
    setIdToDelete(null);
    setShowForm(false);
    setFormData(null);
    setOpenSecciones(false);
    setAlmacenSeleccionado(null);
    setLoadingAlmacenes(false);

    onClose?.();
  };

  const handleDelete = async () => {
    try {
      await ServiceAlmacen.remove(idToDelete);
      toast.success("Almacén eliminado correctamente");
      setIdToDelete(null);
      fetchAlmacenes();
      return Promise.resolve();
    } catch (error) {
      console.error("Error eliminando almacén:", error);
      throw error;
    }
  };

  const handleEdit = async (id) => {
    try {
      const data = await ServiceAlmacen.getById(id);
      setFormData(data);
      setShowForm(true);
    } catch {
      toast.error("Error al cargar datos del almacén");
    }
  };

  const handleNewAlmacen = () => {
    setFormData(null);
    setShowForm(true);
  };

  if (!sucursal) return null;

  return (
    <>
      <Dialog
        open={open}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: "hidden",
            boxShadow: "0 18px 50px rgba(0,0,0,0.25)",
          },
        }}
      >
        <DialogTitle
          sx={{
            background: "linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 100%)",
            color: "#1F2937",
            py: 3,
            px: 4,
            borderBottom: "1px solid #E5E7EB",
          }}
        >
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            gap={2}
          >
            <Box display="flex" alignItems="center" gap={2}>
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: "16px",
                  bgcolor: "#E0E7FF",
                  color: "#592B2B",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Boxes size={28} />
              </Box>

              <Box>
                <Typography variant="h5" fontWeight={800}>
                  Almacenes
                </Typography>

                <Typography variant="body1" sx={{ color: "#4B5563", mt: 0.3 }}>
                  Sucursal: <strong>{sucursal.nombre}</strong>
                </Typography>

                <Typography variant="body2" sx={{ color: "#6B7280", mt: 0.4 }}>
                  Organiza y administra los almacenes registrados.
                </Typography>
              </Box>
            </Box>

            {canCreate && (
              <Button
                variant="contained"
                onClick={handleNewAlmacen}
                sx={{
                  textTransform: "none",
                  borderRadius: 999,
                  px: 3.5,
                  py: 1.1,
                  fontWeight: 700,
                  background:
                    "linear-gradient(135deg, #592B2B 0%, #371A1A 100%)",
                  boxShadow: "0 8px 18px rgba(89,43,43,0.28)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #371A1A 0%, #2C1515 100%)",
                  },
                }}
              >
                Nuevo Almacén
              </Button>
            )}
          </Box>
        </DialogTitle>

        <DialogContent
          sx={{
            bgcolor: "#F8FAFC",
            pt: 4,
            pb: 3,
            px: 4,
          }}
        >
          <Box
            sx={{
              maxWidth: 620,
              mx: "auto",
              mb: 4,
            }}
          >
            <TextField
              fullWidth
              placeholder="Buscar almacén..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="medium"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlinedIcon sx={{ color: "#592B2B" }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 999,
                  bgcolor: "#FFFFFF",
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#CBD5E1",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#592B2B",
                },
              }}
            />
          </Box>

          {loadingAlmacenes ? (
            <Box
              sx={{
                py: 5,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <CircularProgress sx={{ color: "#592B2B" }} />
              <Typography variant="body2" color="text.secondary">
                Cargando almacenes...
              </Typography>
            </Box>
          ) : almacenes.length === 0 ? (
            <Box
              sx={{
                p: 4,
                borderRadius: 3,
                border: "1px dashed #CBD5E1",
                bgcolor: "#FFFFFF",
                textAlign: "center",
              }}
            >
              <Typography fontWeight={700} color="#1F2937">
                No hay almacenes registrados
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Puedes crear un nuevo almacén para esta sucursal.
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(3, 1fr)",
                },
                gap: 2.5,
              }}
            >
              {almacenes.map((row) => (
                <Card
                  key={row.id}
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: "1px solid #E5E7EB",
                    boxShadow: "0 6px 18px rgba(15,23,42,0.06)",
                    overflow: "hidden",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      transform: "translateY(-3px)",
                      boxShadow: "0 10px 28px rgba(15,23,42,0.12)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      height: 6,
                      background:
                        "linear-gradient(135deg, #592B2B 0%, #371A1A 100%)",
                    }}
                  />

                  <CardContent sx={{ p: 2.5 }}>
                    <Typography
                      fontWeight={800}
                      fontSize={17}
                      sx={{ mb: 1, color: "#1F2937" }}
                    >
                      {row.nombre}
                    </Typography>

                    <Box display="flex" alignItems="center" gap={1} sx={{ mb: 2 }}>
                      <MapPin size={17} color="#592B2B" />
                      <Typography variant="body2" color="text.secondary">
                        {row.direccion || "Sin dirección"}
                      </Typography>
                    </Box>

                    <Box
                      display="flex"
                      justifyContent="flex-end"
                      alignItems="center"
                      gap={1}
                    >
                      <IconButton
                        onClick={() => {
                          setAlmacenSeleccionado(row);
                          setOpenSecciones(true);
                        }}
                        title="Ver secciones"
                        sx={{
                          bgcolor: "#F7F3FF",
                          "&:hover": { bgcolor: "#EEE6FF" },
                        }}
                      >
                        <LayoutList size={18} color="#6D28D9" />
                      </IconButton>

                      <IconButton
                        onClick={() => setSelectedId(row.id)}
                        title="Ver detalles"
                        sx={{
                          bgcolor: "#EEF6FF",
                          "&:hover": { bgcolor: "#DDEEFF" },
                        }}
                      >
                        <Eye size={18} color="#2563EB" />
                      </IconButton>

                      {canEdit && (
                        <IconButton
                          onClick={() => handleEdit(row.id)}
                          title="Editar"
                          sx={{
                            bgcolor: "#ECFDF3",
                            "&:hover": { bgcolor: "#D1FAE5" },
                          }}
                        >
                          <PencilLine size={18} color="#0D8C47" />
                        </IconButton>
                      )}

                      {canDelete && (
                        <IconButton
                          onClick={() => setIdToDelete(row.id)}
                          title="Eliminar"
                          sx={{
                            bgcolor: "#FEF2F2",
                            "&:hover": { bgcolor: "#FEE2E2" },
                          }}
                        >
                          <Trash size={18} color="#D32F2F" />
                        </IconButton>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 4, py: 2.5, bgcolor: "#FFFFFF" }}>
          <Button
            onClick={handleCloseDialog}
            variant="outlined"
            sx={{
              textTransform: "none",
              borderRadius: 999,
              px: 3,
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      <DetailsDialog
        open={!!selectedId}
        id={selectedId}
        fetchData={ServiceAlmacen.getById}
        fields={fields}
        onClose={() => setSelectedId(null)}
      />

      {idToDelete && canDelete && (
        <DeleteConfirm
          title="¿Eliminar almacén?"
          message="Esta acción eliminará el almacén y no se podrá deshacer."
          onConfirm={handleDelete}
          onCancel={() => setIdToDelete(null)}
        />
      )}

      {showForm && (
        <AlmacenForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            fetchAlmacenes();
            setShowForm(false);
          }}
          initialData={formData}
          sucursales={[sucursal]}
          sucursalContext={sucursal}
        />
      )}

      <SeccionesAlmacenDialog
        open={openSecciones}
        almacen={almacenSeleccionado}
        onClose={() => {
          setOpenSecciones(false);
          setAlmacenSeleccionado(null);
        }}
      />
    </>
  );
};

export default AlmacenesSucursalDialog;