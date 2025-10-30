import { useState, useRef } from "react";
import { PencilLine, Trash, Eye } from "lucide-react";
import GridGenerico from "@/components/Grid";
import DetailsDialog from "@/components/details";
import DeleteConfirm from "@/components/deleteConfirm";
import ModeloProductoForm from "./modeloproductoForm";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";
import ServiceModeloProducto from "@/services/ServiceModeloProducto";

const ModeloProductoList = () => {
  const [selectedId, setSelectedId] = useState(null);
  const [idToDelete, setIdToDelete] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(null);
  const gridRef = useRef(null);
  const { user } = useAuth();
  const isAdmin = user?.rol === "Administrador";

  const columns = [
    { name: "Modelo", selector: r => r.nombreModelo, sortable: true, minWidth: "150px" },
    { name: "Marca", selector: r => r.marca, sortable: true, minWidth: "120px" },
    { name: "Capacidad/Tamaño", selector: r => r.capacidadOTamano ?? '-', sortable: true, minWidth: "140px" },
    { name: "Unidad", selector: r => r.unidadMedida ?? '-', sortable: true, minWidth: "100px" },
    { name: "Stock Actual", selector: r => r.stockActual, sortable: true, minWidth: "120px" },
    { name: "Stock Mínimo", selector: r => r.stockMinimo, sortable: true, minWidth: "120px" },
  ];

  const fields = [
    { label: "Modelo", key: "nombreModelo" },
    { label: "Marca", key: "marca" },
    { label: "Capacidad/Tamaño", key: "capacidadOTamano" },
    { label: "Unidad", key: "unidadMedida" },
    { label: "Stock Actual", key: "stockActual" },
    { label: "Stock Mínimo", key: "stockMinimo" },
    { label: "Fecha Registro", key: "fechaRegistro", format: v => new Date(v).toLocaleString() },
  ];

  const handleDelete = async () => {
    try {
      await ServiceModeloProducto.remove(idToDelete);
      toast.success("Modelo eliminado correctamente");
      gridRef.current?.refetch();
      return Promise.resolve();
    } catch (error) {
      console.error("Error eliminando modelo:", error);
      throw error;
    }
  };

  const handleEdit = async (id) => {
    try {
      const data = await ServiceModeloProducto.getById(id);
      setFormData(data);
      setShowForm(true);
    } catch {
      toast.error("Error al cargar datos del modelo");
    }
  };

  return (
    <div className="flex flex-col gap-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Gestión de Modelos de Producto</h1>

        {isAdmin && (
          <button
            onClick={() => { setFormData(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 font-medium"
          >
            <PencilLine size={18} />
            Nuevo Modelo
          </button>
        )}
      </div>

      <GridGenerico
        ref={gridRef}
        service={ServiceModeloProducto}
        columns={columns}
        defaultSortField="nombreModelo"
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

      <DetailsDialog
        open={!!selectedId}
        id={selectedId}
        fetchData={ServiceModeloProducto.getById}
        fields={fields}
        onClose={() => setSelectedId(null)}
      />

      {idToDelete && (
        <DeleteConfirm
          title="¿Eliminar modelo?"
          message="Esta acción eliminará el modelo de producto (lógicamente)."
          onConfirm={handleDelete}
          onCancel={() => setIdToDelete(null)}
        />
      )}

      {showForm && (
        <ModeloProductoForm
          initialData={formData}
          onClose={() => setShowForm(false)}
          onSuccess={() => { gridRef.current?.refetch(); setShowForm(false); }}
        />
      )}
    </div>
  );
};

export default ModeloProductoList;
