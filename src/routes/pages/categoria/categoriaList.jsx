import { useState, useRef } from "react";
import { PencilLine, Trash, Eye } from "lucide-react";
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
  const isAdmin = user?.rol === "Administrador";

  // Columnas con el mismo formato que Sucursales (react-data-table-component)
  const columns = [
    { name: "Nombre", selector: r => r.nombre, sortable: true, minWidth: "260px" },
  ];

  // Campos para el modal de detalles
  const fields = [
    { label: "Nombre", key: "nombre" },
  ];

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
    <div className="flex flex-col gap-y-6 p-4 sm:p-6">
      {/* Encabezado idéntico al de Sucursales */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Gestión de Categorías
        </h1>

        {isAdmin && (
          <button
            onClick={() => { setFormData(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 font-medium"
          >
            <PencilLine size={18} />
            Nueva Categoría
          </button>
        )}
      </div>

      {/* Grid con el mismo skin + acciones con íconos */}
      <GridGenerico
        ref={gridRef}
        service={ServiceCategoria}
        columns={columns}
        defaultSortField="nombre"
        defaultSortAsc={true}
        pageSize={10}
        renderActions={(row) => (
          <div className="flex gap-x-2 justify-end">
            <button
              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors duration-200"
              onClick={() => setSelectedId(row.id)}
              title="Ver detalles"
            >
              <Eye size={16} />
            </button>

            {isAdmin && (
              <>
                <button
                  className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors duration-200"
                  onClick={() => handleEdit(row.id)}
                  title="Editar"
                >
                  <PencilLine size={16} />
                </button>

                <button
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                  onClick={() => setIdToDelete(row.id)}
                  title="Eliminar"
                >
                  <Trash size={16} />
                </button>
              </>
            )}
          </div>
        )}
      />

      {/* Detalles (igual patrón) */}
      <DetailsDialog
        open={!!selectedId}
        id={selectedId}
        fetchData={ServiceCategoria.getById}
        fields={fields}
        onClose={() => setSelectedId(null)}
      />

      {/* Confirmación eliminar – render condicional */}
      {idToDelete && (
        <DeleteConfirm
          title="¿Eliminar categoría?"
          message="Esta acción eliminará la categoría permanentemente y no se podrá deshacer."
          onConfirm={handleDelete}
          onCancel={() => setIdToDelete(null)}
        />
      )}

      {/* Formulario – mismo patrón de apertura/cierre/refetch */}
      {showForm && (
        <CategoriaForm
          initialData={formData}
          onClose={() => setShowForm(false)}
          onSuccess={() => { gridRef.current?.refetch(); setShowForm(false); }}
        />
      )}
    </div>
  );
};

export default CategoriaList;
