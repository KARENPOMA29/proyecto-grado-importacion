import { useState, useRef } from "react";
import { PencilLine, Trash, Eye } from "lucide-react";
import { Box, Typography, Button } from "@mui/material";
import GridGenerico from "@/components/Grid";
import DetailsDialog from "@/components/details";
import DeleteConfirm from "@/components/deleteConfirm";
import ProveedorForm from "./proveedorForm";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";
import ServiceProveedor from "@/services/ServiceProveedor";

const ProveedorList = () => {
  const [selectedId, setSelectedId] = useState(null);
  const [idToDelete, setIdToDelete] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(null);
  const gridRef = useRef(null);

  const { user } = useAuth();
  const roleKey = (user?.rol || "").trim().toLowerCase();

  const canCreate = roleKey === "administrador" || roleKey === "pilotero";
  const canEdit = roleKey === "administrador";
  const canDelete = roleKey === "administrador";

  const columns = [
    { name: "Razón Social", selector: (r) => r.razonSocial, sortable: true, width: "260px" },
    { name: "Encargado", selector: (r) => r.encargado, sortable: true, width: "210px" },
    { name: "CI", selector: (r) => r.ci, sortable: true, width: "140px" },
    { name: "Teléfono", selector: (r) => r.telefono, sortable: true, width: "170px" },
    { name: "Dirección", selector: (r) => r.direccion, sortable: true, width: "320px" },
  ];

  const fields = [
    { label: "Razón Social", key: "razonSocial" },
    { label: "Encargado", key: "encargado" },
    { label: "CI", key: "ci" },
    { label: "Teléfono", key: "telefono" },
    { label: "Dirección", key: "direccion" },
    {
      label: "Fecha Registro",
      key: "fechaRegistro",
      format: (v) => (v ? new Date(v).toLocaleString() : "—"),
    },
  ];

  const actions = [
    {
      show: true,
      icon: <Eye size={16} />,
      className: "p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors duration-200",
      title: "Ver detalles",
      onClick: (row) => setSelectedId(row.id),
    },
    {
      show: canEdit,
      icon: <PencilLine size={16} />,
      className: "p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors duration-200",
      title: "Editar",
      onClick: (row) => handleEdit(row.id),
    },
    {
      show: canDelete,
      icon: <Trash size={16} />,
      className: "p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200",
      title: "Eliminar",
      onClick: (row) => setIdToDelete(row.id),
    },
  ];

  const handleDelete = async () => {
    try {
      await ServiceProveedor.remove(idToDelete);
      toast.success("Proveedor eliminado correctamente");
      gridRef.current?.refetch();
      return Promise.resolve();
    } catch (error) {
      console.error("Error eliminando proveedor:", error);
      throw error;
    }
  };

  const handleEdit = async (id) => {
    try {
      const data = await ServiceProveedor.getById(id);
      setFormData(data);
      setShowForm(true);
    } catch {
      toast.error("Error al cargar datos del proveedor");
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
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
          <Typography variant="h4" sx={{ fontWeight: 700, color: "#3A1A1A", mb: 1 }}>
            Gestión de Proveedores
          </Typography>

          <Typography variant="body1" sx={{ color: "text.secondary", fontSize: "1rem" }}>
            Administra proveedores registrados y consulta su información.
          </Typography>
        </Box>

        {canCreate && (
          <Button
            variant="contained"
            onClick={() => {
              setFormData(null);
              setShowForm(true);
            }}
            startIcon={<PencilLine size={18} />}
            sx={{
              borderRadius: 999,
              px: 3.5,
              py: 1.3,
              fontWeight: 700,
              textTransform: "none",
              fontSize: "15px",
              background: "linear-gradient(135deg, #592B2B 0%, #3A1A1A 100%)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
              "&:hover": {
                background: "linear-gradient(135deg, #3A1A1A 0%, #592B2B 100%)",
                boxShadow: "0 6px 16px rgba(0,0,0,0.35)",
              },
            }}
          >
            Nuevo Proveedor
          </Button>
        )}
      </Box>

      <GridGenerico
        ref={gridRef}
        service={ServiceProveedor}
        columns={columns}
        pageSize={10}
        renderActions={(row) => (
          <div className="flex items-center justify-center gap-2 whitespace-nowrap">
            {actions
              .filter((a) => a.show)
              .map((a) => (
                <button
                  key={a.title}
                  className={a.className}
                  onClick={() => a.onClick(row)}
                  title={a.title}
                >
                  {a.icon}
                </button>
              ))}
          </div>
        )}
      />

      <DetailsDialog
        open={!!selectedId}
        id={selectedId}
        fetchData={ServiceProveedor.getById}
        fields={fields}
        onClose={() => setSelectedId(null)}
      />

      {idToDelete && canDelete && (
        <DeleteConfirm
          title="¿Eliminar proveedor?"
          message="Esta acción eliminará el proveedor lógicamente y no se podrá deshacer."
          onConfirm={handleDelete}
          onCancel={() => setIdToDelete(null)}
        />
      )}

      {showForm && (
        <ProveedorForm
          initialData={formData}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            gridRef.current?.refetch();
            setShowForm(false);
          }}
        />
      )}
    </Box>
  );
};

export default ProveedorList;