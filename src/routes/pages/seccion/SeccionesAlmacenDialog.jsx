// src/routes/pages/seccion/SeccionesAlmacenDialog.jsx
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  TextField,
  Card,
  CardContent,
  CardActions,
  Chip,
  Grid,
  InputAdornment,
} from "@mui/material";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import {
  LayoutList,
  PencilLine,
  Trash2,
  PackageSearch,
} from "lucide-react";
import { toast } from "react-toastify";

import ServiceSeccion from "@/services/ServiceSeccion";
import ServiceModeloProducto from "@/services/ServiceModeloProducto";
import DeleteConfirm from "@/components/deleteConfirm";
import { useAuth } from "@/context/AuthContext";
import SeccionForm from "./SeccionForm";

const SeccionesAlmacenDialog = ({ open, almacen, onClose }) => {
  const [secciones, setSecciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [idToDelete, setIdToDelete] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(null);
  const [modelos, setModelos] = useState([]);

  const { user } = useAuth();
  const roleKey = (user?.rol || "").trim().toLowerCase();

  const canCreate = roleKey === "administrador" || roleKey === "almacen";
  const canEdit = roleKey === "administrador" || roleKey === "almacen";
  const canDelete = roleKey === "administrador";

  const fetchSecciones = async () => {
    if (!almacen?.id) return;

    try {
      setLoading(true);

      const res = await ServiceSeccion.getByAlmacen(almacen.id, {
        search,
        page: 1,
        pageSize: 50,
      });

      setSecciones(res.items || []);
    } catch (err) {
      console.error("Error cargando secciones:", err);
      toast.error(err.message || "Error al cargar secciones del almacén");
    } finally {
      setLoading(false);
    }
  };

  const fetchModelos = async () => {
    try {
      const res = await ServiceModeloProducto.getAll({
        page: 1,
        pageSize: 1000,
      });

      const items = Array.isArray(res) ? res : res.items || [];
      setModelos(items);
    } catch (err) {
      console.error("Error cargando modelos:", err);
      toast.error("Error al cargar modelos");
    }
  };

  useEffect(() => {
    if (!open || !almacen?.id) return;

    const timer = setTimeout(() => {
      fetchSecciones();
    }, search ? 400 : 0);

    return () => clearTimeout(timer);
  }, [open, almacen?.id, search]);

  useEffect(() => {
    if (open && almacen?.id) {
      fetchModelos();
    }
  }, [open, almacen?.id]);

  const handleCloseDialog = () => {
    setSecciones([]);
    setSearch("");
    setIdToDelete(null);
    setShowForm(false);
    setFormData(null);
    setLoading(false);

    onClose?.();
  };

  if (!almacen) return null;

  const handleDelete = async () => {
    try {
      await ServiceSeccion.remove(idToDelete);
      toast.success("Sección eliminada correctamente");
      setIdToDelete(null);
      fetchSecciones();
      return Promise.resolve();
    } catch (err) {
      console.error("Error eliminando sección:", err);
      throw err;
    }
  };

  const handleNew = () => {
    setFormData(null);
    setShowForm(true);
  };

  const handleEdit = async (id) => {
    try {
      const data = await ServiceSeccion.getById(id);
      setFormData(data);
      setShowForm(true);
    } catch {
      toast.error("Error al cargar datos de la sección");
    }
  };

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
                  color: "#3730A3",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <LayoutList size={28} />
              </Box>

              <Box>
                <Typography variant="h5" fontWeight={800}>
                  Secciones
                </Typography>

                <Typography variant="body1" sx={{ color: "#4B5563", mt: 0.3 }}>
                  Almacén: <strong>{almacen.nombre}</strong>
                </Typography>

                <Typography variant="body2" sx={{ color: "#6B7280", mt: 0.4 }}>
                  Organiza los espacios internos y modelos asignados.
                </Typography>
              </Box>
            </Box>

            {canCreate && (
              <Button
                variant="contained"
                onClick={handleNew}
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
                Nueva Sección
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, modelo o descripción..."
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
                  backgroundColor: "#fff",
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

          {loading ? (
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
                Cargando secciones...
              </Typography>
            </Box>
          ) : secciones.length === 0 ? (
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
                No hay secciones registradas
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Puedes crear una nueva sección para este almacén.
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2.5}>
              {secciones.map((s) => (
                <Grid item xs={12} sm={6} md={4} key={s.id}>
                  <Card
                    elevation={0}
                    sx={{
                      borderRadius: 3,
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
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

                    <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                      <Box display="flex" alignItems="center" gap={1.3} sx={{ mb: 1 }}>
                        <Box
                          sx={{
                            width: 34,
                            height: 34,
                            borderRadius: "12px",
                            bgcolor: "#EFF6FF",
                            color: "#592B2B",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <PackageSearch size={18} />
                        </Box>

                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 800,
                            color: "#1F2937",
                            lineHeight: 1.2,
                          }}
                        >
                          {s.nombre || "Sección sin nombre"}
                        </Typography>
                      </Box>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1.5, minHeight: 22 }}
                      >
                        {s.descripcion || "Sin descripción"}
                      </Typography>

                      <Chip
                        size="small"
                        label={s.modeloNombre || "Modelo no asignado"}
                        sx={{
                          mb: 1.5,
                          bgcolor: "#E0E7FF",
                          color: "#3730A3",
                          fontWeight: 700,
                        }}
                      />

                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                      >
                        Registrado:{" "}
                        {s.fechaRegistro
                          ? new Date(s.fechaRegistro).toLocaleDateString("es-ES", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "—"}
                      </Typography>
                    </CardContent>

                    {(canEdit || canDelete) && (
                      <CardActions
                        sx={{
                          justifyContent: "flex-end",
                          px: 2,
                          pb: 2,
                          pt: 0,
                          gap: 1,
                        }}
                      >
                        {canEdit && (
                          <Button
                            size="small"
                            onClick={() => handleEdit(s.id)}
                            startIcon={<PencilLine size={15} />}
                            sx={{
                              textTransform: "none",
                              borderRadius: 999,
                              color: "#592B2B",
                              fontWeight: 700,
                            }}
                          >
                            Editar
                          </Button>
                        )}

                        {canDelete && (
                          <Button
                            size="small"
                            color="error"
                            onClick={() => setIdToDelete(s.id)}
                            startIcon={<Trash2 size={15} />}
                            sx={{
                              textTransform: "none",
                              borderRadius: 999,
                              fontWeight: 700,
                            }}
                          >
                            Eliminar
                          </Button>
                        )}
                      </CardActions>
                    )}
                  </Card>
                </Grid>
              ))}
            </Grid>
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

      {idToDelete && canDelete && (
        <DeleteConfirm
          title="¿Eliminar sección?"
          message="Esta acción eliminará la sección y no se podrá deshacer."
          onConfirm={handleDelete}
          onCancel={() => setIdToDelete(null)}
        />
      )}

      {showForm && (
        <SeccionForm
          open={showForm}
          onClose={(ok) => {
            setShowForm(false);
            setFormData(null);
            if (ok) fetchSecciones();
          }}
          seccion={formData}
          almacenes={[almacen]}
          modelos={modelos}
          almacenContext={almacen}
        />
      )}
    </>
  );
};

export default SeccionesAlmacenDialog;