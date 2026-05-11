import { useState, useRef } from "react";
import { PencilLine, Trash, Eye } from "lucide-react";
import { Box, Typography, Button } from "@mui/material";
import GridGenerico from "@/components/Grid";
import DetailsDialog from "@/components/details";
import DeleteConfirm from "@/components/deleteConfirm";
import ClienteForm from "./clienteForm";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";
import ServiceCliente from "@/services/ServiceCliente";

const ClienteList = () => {
  const [selectedId, setSelectedId] = useState(null);
  const [idToDelete, setIdToDelete] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(null);
  const gridRef = useRef(null);

  const { user } = useAuth();
  // 👇 normalizamos el rol
  const roleKey = (user?.rol || "").trim().toLowerCase();

  // 👇 permisos al estilo de AlmacenList
  const canCreate =
    roleKey === "administrador" || roleKey === "ventas";
  const canEdit =
    roleKey === "administrador" || roleKey === "ventas";
  const canDelete = roleKey === "administrador";

  // 🔄 AHORA columnas según nuevo schema
const columns = [
  {
    name: "Razón Social",
    selector: (r) => r.razonSocial,
    sortable: true,
    width: "280px",
  },
  {
    name: "NIT",
    selector: (r) => r.nit,
    sortable: true,
    width: "180px",
  },
  {
    name: "Correo",
    selector: (r) => r.correo,
    sortable: true,
    width: "380px",
  },
  {
    name: "Teléfono",
    selector: (r) => r.telefono,
    sortable: true,
    width: "190px",
  },
];

  // 🔄 Campos para el diálogo de detalles
  const fields = [
    { label: "Razón Social", key: "razonSocial" },
    { label: "NIT", key: "nit" },
    { label: "Correo", key: "correo" },
    { label: "Teléfono", key: "telefono" },
    {
      label: "Fecha Registro",
      key: "fechaRegistro",
      format: (v) => (v ? new Date(v).toLocaleString() : "—"),
    },
    {
      label: "Estado",
      key: "estado",
      format: (v) => (v === 1 ? "Activo" : "Inactivo"),
    },
  ];

  const handleDelete = async () => {
    try {
      await ServiceCliente.remove(idToDelete);
      toast.success("Cliente eliminado correctamente");
      gridRef.current?.refetch();
      return Promise.resolve();
    } catch (error) {
      console.error("Error eliminando cliente:", error);
      throw error;
    }
  };

  const handleEdit = async (id) => {
    try {
      const data = await ServiceCliente.getById(id);
      setFormData(data);
      setShowForm(true);
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar datos del cliente");
    }
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
      {/* TITULOS */}
      <Box>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: "#3A1A1A",
            mb: 1,
            lineHeight: 1.1,
          }}
        >
          Gestión de Clientes
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: "text.secondary",
            fontSize: "1rem",
          }}
        >
          Administra clientes registrados y consulta su información.
        </Typography>
      </Box>

      {/* BOTON */}
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
            background:
              "linear-gradient(135deg, #592B2B 0%, #3A1A1A 100%)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
            "&:hover": {
              background:
                "linear-gradient(135deg, #3A1A1A 0%, #592B2B 100%)",
              boxShadow: "0 6px 16px rgba(0,0,0,0.35)",
            },
          }}
        >
          Nuevo Cliente
        </Button>
      )}
    </Box>

      <GridGenerico
        ref={gridRef}
        service={ServiceCliente}
        columns={columns}
        defaultSortField="razonSocial"
        defaultSortAsc={true}
        pageSize={10}
        renderActions={(row) => (
          <div className="flex items-center justify-center gap-2 whitespace-nowrap">
            <button
              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors duration-200"
              onClick={() => setSelectedId(row.id)}
              title="Ver detalles"
            >
              <Eye size={16} />
            </button>

            {canEdit && (
              <button
                className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors duration-200"
                onClick={() => handleEdit(row.id)}
                title="Editar"
              >
                <PencilLine size={16} />
              </button>
            )}

            {canDelete && (
              <button
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                onClick={() => setIdToDelete(row.id)}
                title="Eliminar"
              >
                <Trash size={16} />
              </button>
            )}
          </div>
        )}
      />

      <DetailsDialog
        open={!!selectedId}
        id={selectedId}
        fetchData={ServiceCliente.getById}
        fields={fields}
        onClose={() => setSelectedId(null)}
      />

      {idToDelete && canDelete && (
        <DeleteConfirm
          title="¿Eliminar cliente?"
          message="Esta acción eliminará el cliente lógicamente y no se podrá deshacer."
          onConfirm={handleDelete}
          onCancel={() => setIdToDelete(null)}
        />
      )}

      {showForm && (
        <ClienteForm
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

export default ClienteList;
