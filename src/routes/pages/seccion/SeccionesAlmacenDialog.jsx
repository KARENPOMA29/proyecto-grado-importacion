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
} from "@mui/material";
import { LayoutList, PencilLine, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

import ServiceSeccion from "@/services/ServiceSeccion";
import ServiceModeloProducto from "@/services/ServiceModeloProducto"; // 👈 import modelos
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

  const [modelos, setModelos] = useState([]); // 👈 modelos para el combo del form

  const { user } = useAuth();
  const roleKey = (user?.rol || "").trim().toLowerCase();
  const canCreate = roleKey === "administrador" || roleKey === "almacen";
  const canEdit = roleKey === "administrador" || roleKey === "almacen";
  const canDelete = roleKey === "administrador";

  const fetchSecciones = async () => {
    if (!almacen?.id) return;
    try {
      setLoading(true);
      const res = await ServiceSeccion.getAll({ almacenId: almacen.id });
      const items = Array.isArray(res) ? res : res.items || [];
      setSecciones(items);
    } catch (err) {
      console.error("Error cargando secciones:", err);
      toast.error(err.message || "Error al cargar secciones del almacén");
    } finally {
      setLoading(false);
    }
  };

  const fetchModelos = async () => {
    try {
      const res = await ServiceModeloProducto.getAll();
      const items = Array.isArray(res) ? res : res.items || [];
      setModelos(items);
    } catch (err) {
      console.error("Error cargando modelos:", err);
      toast.error("Error al cargar modelos");
    }
  };

  useEffect(() => {
    if (open && almacen?.id) {
      fetchSecciones();
      fetchModelos();
    }
  }, [open, almacen?.id]);

  // 👇 después de los hooks
  if (!almacen) return null;

  const filtered = secciones.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (s.nombre || "").toLowerCase().includes(q) ||
      (s.descripcion || "").toLowerCase().includes(q) ||
      (s.modeloNombre || "").toLowerCase().includes(q)
    );
  });

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
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
          },
        }}
      >
        {/* HEADER vino */}
        <DialogTitle
          sx={{
            background: "linear-gradient(135deg, #592B2B 0%, #3A1A1A 100%)",
            color: "#F5F5F5",
            py: 2,
            px: 3,
          }}
        >
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            gap={1.5}
          >
            <Box display="flex" alignItems="center" gap={1.5}>
              <LayoutList size={22} />
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Secciones de {almacen.nombre}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Revisa y gestiona las secciones registradas en este almacén.
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
                  px: 3,
                  py: 0.8,
                  fontWeight: 600,
                  background:
                    "linear-gradient(135deg, #14AE5C 0%, #0D8C47 100%)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #0D8C47 0%, #0A6B37 100%)",
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
            bgcolor: "#FAFAFA",
            py: 3,
            px: 3,
          }}
        >
          {/* BUSCADOR SIMPLE */}
          <Box
            sx={{
              mb: 3,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <TextField
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, modelo o descripción..."
              size="small"
              sx={{
                width: "60%",
                minWidth: 280,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 999,
                  backgroundColor: "#fff",
                },
              }}
            />
          </Box>

          {/* CONTENIDO */}
          {loading ? (
            <Box
              sx={{
                py: 4,
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
          ) : filtered.length === 0 ? (
            <Box
              sx={{
                p: 3,
                borderRadius: 2,
                border: "1px dashed #D6C6C6",
                bgcolor: "#FFFFFF",
                textAlign: "center",
              }}
            >
              <Typography variant="subtitle1" color="text.secondary">
                No hay secciones registradas para este almacén.
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {filtered.map((s) => (
                <Grid item xs={12} sm={6} md={4} key={s.id}>
                  <Card
                    elevation={1}
                    sx={{
                      borderRadius: 2,
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 700, mb: 0.5, color: "#3A1A1A" }}
                      >
                        {s.nombre || "Sección sin nombre"}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        {s.descripcion}
                      </Typography>

                      <Chip
                        size="small"
                        label={s.modeloNombre || "Modelo no asignado"}
                        sx={{ mb: 1, bgcolor: "#F3E5F5" }}
                      />

                      <Typography variant="caption" color="text.secondary">
                        Registrado:{" "}
                        {s.fechaRegistro
                          ? new Date(s.fechaRegistro).toLocaleDateString(
                              "es-ES",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )
                          : "—"}
                      </Typography>
                    </CardContent>

                    {(canEdit || canDelete) && (
                      <CardActions
                        sx={{
                          justifyContent: "flex-end",
                          px: 2,
                          pb: 1.5,
                          pt: 0,
                          gap: 0.5,
                        }}
                      >
                        {canEdit && (
                          <Button
                            size="small"
                            onClick={() => handleEdit(s.id)}
                            startIcon={<PencilLine size={16} />}
                            sx={{ textTransform: "none" }}
                          >
                            Editar
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            size="small"
                            color="error"
                            onClick={() => setIdToDelete(s.id)}
                            startIcon={<Trash2 size={16} />}
                            sx={{ textTransform: "none" }}
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

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={onClose}
            variant="outlined"
            sx={{ textTransform: "none", borderRadius: 999 }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm eliminar sección */}
      {idToDelete && canDelete && (
        <DeleteConfirm
          title="¿Eliminar sección?"
          message="Esta acción eliminará la sección y no se podrá deshacer."
          onConfirm={handleDelete}
          onCancel={() => setIdToDelete(null)}
        />
      )}

      {/* Form crear/editar sección */}
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
