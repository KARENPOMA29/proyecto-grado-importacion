// src/routes/pages/almacen/AlmacenesSucursalDialog.jsx
import { useRef, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
} from "@mui/material";
import { Boxes, Eye, PencilLine, Trash, LayoutList } from "lucide-react";

import GridGenerico from "@/components/Grid";
import DetailsDialog from "@/components/details";
import DeleteConfirm from "@/components/deleteConfirm";

import ServiceAlmacen from "@/services/ServiceAlmacen";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";
import AlmacenForm from "./almacenForm";

// 👇 importa el dialog de secciones
import SeccionesAlmacenDialog from "@/routes/pages/seccion/SeccionesAlmacenDialog";

const AlmacenesSucursalDialog = ({ open, sucursal, onClose }) => {
  const gridRef = useRef(null);

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

  // ⛔ si no hay sucursal seleccionada, no mostramos nada
  if (!sucursal) return null;

  // 🔹 servicio adaptado para GridGenerico
  const serviceFiltrado = {
    getAll: async () => {
      // devuelve { items, total } igual que el resto de servicios
      return ServiceAlmacen.getBySucursal(sucursal.id);
    },
  };

  const columns = [
    {
      name: "Nombre almacén",
      selector: (r) => r.nombre,
      sortable: true,
      minWidth: "220px",
    },
    {
      name: "Dirección",
      selector: (r) => r.direccion || "—",
      sortable: false,
      minWidth: "260px",
    },
  ];

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

  const handleDelete = async () => {
    try {
      await ServiceAlmacen.remove(idToDelete);
      toast.success("Almacén eliminado correctamente");
      setIdToDelete(null);
      gridRef.current?.refetch();
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
        {/* HEADER con gradiente vino */}
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
            gap={1.5}
            justifyContent="space-between"
          >
            <Box display="flex" alignItems="center" gap={1.5}>
              <Boxes size={22} />
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Almacenes de {sucursal.nombre}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Revisa y gestiona los almacenes registrados para esta sucursal.
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
                Nuevo Almacén
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
          <GridGenerico
            key={sucursal.id} // 👈 para que recargue si cambias de sucursal
            ref={gridRef}
            service={serviceFiltrado}
            columns={columns}
            title={`Almacenes de ${sucursal.nombre}`}
            pageSize={5}
            enableSearch={true}
            renderActions={(row) => (
              <div className="flex gap-x-2 justify-end">
                {/* 🔎 Ver secciones de este almacén */}
                <button
                  className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors duration-200"
                  onClick={() => {
                    setAlmacenSeleccionado(row);
                    setOpenSecciones(true);
                  }}
                  title="Ver secciones"
                >
                  <LayoutList size={16} />
                </button>

                {/* 👁 ver siempre */}
                <button
                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors duration-200"
                  onClick={() => setSelectedId(row.id)}
                  title="Ver detalles"
                >
                  <Eye size={16} />
                </button>

                {/* ✏️ editar: Admin + Almacen */}
                {canEdit && (
                  <button
                    className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors duración-200"
                    onClick={() => handleEdit(row.id)}
                    title="Editar"
                  >
                    <PencilLine size={16} />
                  </button>
                )}

                {/* 🗑️ eliminar: solo Admin */}
                {canDelete && (
                  <button
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duración-200"
                    onClick={() => setIdToDelete(row.id)}
                    title="Eliminar"
                  >
                    <Trash size={16} />
                  </button>
                )}
              </div>
            )}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={onClose}
            variant="outlined"
            sx={{
              textTransform: "none",
              borderRadius: 999,
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detalles del almacén */}
      <DetailsDialog
        open={!!selectedId}
        id={selectedId}
        fetchData={ServiceAlmacen.getById}
        fields={fields}
        onClose={() => setSelectedId(null)}
      />

      {/* Confirm eliminar */}
      {idToDelete && canDelete && (
        <DeleteConfirm
          title="¿Eliminar almacén?"
          message="Esta acción eliminará el almacén y no se podrá deshacer."
          onConfirm={handleDelete}
          onCancel={() => setIdToDelete(null)}
        />
      )}

      {/* Form (crear / editar) */}
      {showForm && (
        <AlmacenForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            gridRef.current?.refetch();
            setShowForm(false);
          }}
          initialData={formData}
          sucursales={[sucursal]}      // 👈 solo esta sucursal
          sucursalContext={sucursal}   // 👈 para que el combo venga preseleccionado
        />
      )}

      {/* Dialog de secciones del almacén seleccionado */}
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
