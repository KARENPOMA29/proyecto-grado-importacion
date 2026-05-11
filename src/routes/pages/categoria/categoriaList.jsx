import { useState, useRef } from "react";
import { PencilLine, Trash, Eye } from "lucide-react";
import { Box, Typography, Button } from "@mui/material";
import GridGenerico from "@/components/Grid";
import DetailsDialog from "@/components/details";
import DeleteConfirm from "@/components/deleteConfirm";
import CategoriaForm from "./categoriaForm";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";
import ServiceCategoria from "@/services/ServiceCategoria";

const CategoriaList = () => {
  const [selectedId, setSelectedId] = useState(null);
  const [idToDelete, setIdToDelete] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(null);
  const gridRef = useRef(null);

  const { user } = useAuth();
  const roleKey = (user?.rol || "").trim().toLowerCase();

  const canCreate = roleKey === "administrador" || roleKey === "almacen";
  const canEdit = roleKey === "administrador" || roleKey === "almacen";
  const canDelete = roleKey === "administrador";

  const columns = [
    {
      name: "Nombre",
      selector: (r) => r.nombre,
      sortable: true,
      grow: 1,
      minWidth: "300px",
    },
  ];

  const fields = [{ label: "Nombre", key: "nombre" }];

  const handleDelete = async () => {
    try {
      await ServiceCategoria.remove(idToDelete);
      toast.success("Categoría eliminada correctamente");
      gridRef.current?.refetch();
      return Promise.resolve();
    } catch (error) {
      console.error("Error eliminando categoría:", error);
      throw error;
    }
  };

  const handleEdit = async (id) => {
    try {
      const data = await ServiceCategoria.getById(id);
      setFormData(data);
      setShowForm(true);
    } catch {
      toast.error("Error al cargar datos de la categoría");
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
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "#3A1A1A",
              mb: 1,
              lineHeight: 1.1,
            }}
          >
            Gestión de Categorías
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: "text.secondary",
              fontSize: "1rem",
            }}
          >
            Administra las categorías registradas y consulta su información.
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
            Nueva Categoría
          </Button>
        )}
      </Box>

      <GridGenerico
        ref={gridRef}
        service={ServiceCategoria}
        columns={columns}
        defaultSortField="nombre"
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
        fetchData={ServiceCategoria.getById}
        fields={fields}
        onClose={() => setSelectedId(null)}
      />

      {idToDelete && canDelete && (
        <DeleteConfirm
          title="¿Eliminar categoría?"
          message="Esta acción eliminará la categoría lógicamente y no se podrá deshacer."
          onConfirm={handleDelete}
          onCancel={() => setIdToDelete(null)}
        />
      )}

      {showForm && (
        <CategoriaForm
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

export default CategoriaList;