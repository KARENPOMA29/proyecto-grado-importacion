// src/routes/pages/sucursal/SucursalList.jsx
import { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Button,
  CircularProgress,
  TextField,
  MenuItem,
} from "@mui/material";

import { Eye, PencilLine, Trash2, MapPin } from "lucide-react";
import ServiceCiudad from "@/services/ServiceCiudad";
import DetailsDialog from "@/components/details";
import DeleteConfirm from "@/components/deleteConfirm";
import SucursalForm from "./sucursalForm";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";
import ServiceSucursal from "@/services/ServiceSucursal";

// dialog para ver almacenes por sucursal
import AlmacenesSucursalDialog from "@/routes/pages/almacen/AlmacenesSucursalDialog";

const SucursalList = () => {
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [idToDelete, setIdToDelete] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(null);

  // 🔥 estado para ver almacenes
  const [openAlmacenesDialog, setOpenAlmacenesDialog] = useState(false);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState(null);
  const [ciudadFiltro, setCiudadFiltro] = useState("");
  const [ciudades, setCiudades] = useState([]);
  const { user } = useAuth();
  const roleKey = (user?.rol || "").trim().toLowerCase();

  const canCreate = roleKey === "administrador" || roleKey === "almacen";
  const canEdit = roleKey === "administrador" || roleKey === "almacen";
  const canDelete = roleKey === "administrador";

  // Campos para DetailsDialog
  const fields = [
    { label: "Nombre", key: "nombre" },
    { label: "Teléfono", key: "telefono" },
    { label: "Dirección", key: "direccion" },
    { label: "Ciudad", key: "ciudadNombre" },
    {
      label: "Fecha Registro",
      key: "fechaRegistro",
      format: (v) => (v ? new Date(v).toLocaleString() : "—"),
    },
  ];
  const fetchCiudades = async () => {
    try {
      const res = await ServiceCiudad.getAll();
      setCiudades(res.items || []);
    } catch (error) {
      console.error(error);
    }
  };
  const fetchSucursales = async () => {
    try {
      setLoading(true);
      const params = {};
      if (ciudadFiltro) {
        params.ciudadId = ciudadFiltro;
      }
      const res = await ServiceSucursal.getAll(params);
      setSucursales(res.items || []);
    } catch (error) {
      toast.error(error.message || "Error al cargar sucursales");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchCiudades();
  }, []);

  useEffect(() => {
    fetchSucursales();
  }, [ciudadFiltro]);

  const handleDelete = async () => {
    try {
      await ServiceSucursal.remove(idToDelete);
      toast.success("Sucursal eliminada correctamente");
      setIdToDelete(null);
      fetchSucursales();
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const handleEdit = async (id) => {
    try {
      const data = await ServiceSucursal.getById(id);
      setFormData(data);
      setShowForm(true);
    } catch {
      toast.error("Error al cargar datos de la sucursal");
    }
  };

  // 👉 abrir dialog de almacenes para una sucursal
  const handleVerAlmacenes = (sucursal) => {
    setSucursalSeleccionada(sucursal);
    setOpenAlmacenesDialog(true);
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      
      {/* HEADER */}
      
      <Box
        sx={{
          mb: 4,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "flex-start", md: "center" },
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, color: "#3A1A1A", mb: 0.5 }}
          >
            Gestión de Sucursales
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Administra las sucursales activas y revisa sus almacenes asociados.
          </Typography>
        </Box>

        {canCreate && (
          <Button
            variant="contained"
            onClick={() => {
              setFormData(null);
              setShowForm(true);
            }}
            sx={{
              borderRadius: 999,
              px: 3,
              py: 1,
              fontWeight: 600,
              textTransform: "none",
              background: "linear-gradient(135deg, #592B2B 0%, #3A1A1A 100%)",
              boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
              "&:hover": {
                background:
                  "linear-gradient(135deg, #3A1A1A 0%, #592B2B 100%)",
                boxShadow: "0 6px 16px rgba(0,0,0,0.35)",
              },
            }}
            startIcon={<PencilLine size={18} />}
          >
            Nueva Sucursal
          </Button>
        )}
      </Box>
    <Box
      sx={{
        mb: 3,
        display: "flex",
        justifyContent: "flex-start",
      }}
    >
      <TextField
        select
        size="small"
        label="Filtrar por ciudad"
        value={ciudadFiltro}
        onChange={(e) => setCiudadFiltro(e.target.value)}
        sx={{
          width: 280,
          bgcolor: "#fff",
          borderRadius: 2,
          "& .MuiOutlinedInput-root": {
            borderRadius: 2,
          },
        }}
      >
        <MenuItem value="">Todas las ciudades</MenuItem>

        {ciudades.map((c) => (
          <MenuItem key={c.id} value={c.id}>
            {c.nombre}
          </MenuItem>
        ))}
      </TextField>
    </Box>
      {/* LOADING */}
      {loading && (
        <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
          <Box sx={{ textAlign: "center" }}>
            <CircularProgress sx={{ color: "#592B2B", mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Cargando sucursales...
            </Typography>
          </Box>
        </Box>
      )}

      {/* EMPTY */}
      {!loading && sucursales.length === 0 && (
        <Box
          sx={{
            borderRadius: 3,
            border: "1px dashed #ccc",
            p: 4,
            textAlign: "center",
            bgcolor: "#fafafa",
          }}
        >
          <Typography variant="subtitle1" color="text.secondary">
            No hay sucursales registradas.
          </Typography>
        </Box>
      )}

      {/* GRID */}
      {!loading && sucursales.length > 0 && (
        <Grid container spacing={3}>
          {sucursales.map((suc) => (
            <Grid item xs={12} sm={6} lg={4} xl={3} key={suc.id}>
              <Card
                elevation={2}
                sx={{
                  borderRadius: 3,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}
              >
                {/* Barra vino */}
                <Box
                  sx={{
                    height: 6,
                    background:
                      "linear-gradient(90deg, #592B2B 0%, #3A1A1A 50%, #592B2B 100%)",
                  }}
                />

                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, color: "#3A1A1A", mb: 1 }}
                  >
                    {suc.nombre}
                  </Typography>

                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <MapPin size={18} style={{ marginRight: 6, color: "#592B2B" }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {suc.ciudadNombre || "Ciudad no asignada"}
                    </Typography>
                  </Box>

                  <Typography variant="caption" color="text.secondary">
                    Registrado:{" "}
                    {new Date(suc.fechaRegistro).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </Typography>
                </CardContent>

                {/* ACCIONES */}
                <CardActions
                  sx={{
                    justifyContent: "flex-end",
                    px: 1.5,
                    pb: 1.5,
                    pt: 0,
                    gap: 0.5,
                  }}
                >
                  {/* 👉 botón ver almacenes */}
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleVerAlmacenes(suc)}
                    sx={{
                      textTransform: "none",
                      borderRadius: 999,
                      borderColor: "#592B2B",
                      color: "#592B2B",
                      "&:hover": {
                        borderColor: "#3A1A1A",
                        backgroundColor: "rgba(89,43,43,0.04)",
                      },
                    }}
                  >
                    Ver almacenes
                  </Button>

                  <IconButton
                    size="small"
                    onClick={() => setSelectedId(suc.id)}
                    sx={{ color: "#3A1A1A" }}
                  >
                    <Eye size={18} />
                  </IconButton>

                  {canEdit && (
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(suc.id)}
                      sx={{ color: "#0D8C47" }}
                    >
                      <PencilLine size={18} />
                    </IconButton>
                  )}

                  {canDelete && (
                    <IconButton
                      size="small"
                      onClick={() => setIdToDelete(suc.id)}
                      sx={{ color: "#d32f2f" }}
                    >
                      <Trash2 size={18} />
                    </IconButton>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog detalles */}
      <DetailsDialog
        open={!!selectedId}
        id={selectedId}
        fetchData={ServiceSucursal.getById}
        fields={fields}
        onClose={() => setSelectedId(null)}
      />

      {/* Confirm eliminar */}
      {idToDelete && (
        <DeleteConfirm
          title="¿Eliminar sucursal?"
          message="Esta acción eliminará la sucursal del sistema."
          onConfirm={handleDelete}
          onCancel={() => setIdToDelete(null)}
        />
      )}

      {/* Form crear/editar */}
      {showForm && (
        <SucursalForm
          initialData={formData}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            fetchSucursales();
            setShowForm(false);
          }}
        />
      )}

      {/* DIALOG: almacenes por sucursal */}
      <AlmacenesSucursalDialog
        open={openAlmacenesDialog}
        sucursal={sucursalSeleccionada}
        onClose={() => {
          setOpenAlmacenesDialog(false);
          setSucursalSeleccionada(null);
        }}
      />
    </Box>
  );
};

export default SucursalList;
