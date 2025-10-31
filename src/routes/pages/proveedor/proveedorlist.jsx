import { useState, useRef } from "react";
import { PencilLine, Trash, Eye } from "lucide-react";
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

  // 👇 permisos
  const canCreate =
    roleKey === "administrador" || roleKey === "pilotero";
  const canEdit = roleKey === "administrador";
  const canDelete = roleKey === "administrador";

  const columns = [
    { name: "Razón Social", selector: (r) => r.razonSocial, sortable: true, minWidth: "180px" },
    { name: "Encargado", selector: (r) => r.encargado, sortable: true, minWidth: "140px" },
    { name: "CI", selector: (r) => r.ci, sortable: true, minWidth: "100px" },
    { name: "Teléfono", selector: (r) => r.telefono, sortable: true, minWidth: "120px" },
    { name: "Dirección", selector: (r) => r.direccion, sortable: true, minWidth: "200px", grow: 2 },
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
    <div className="flex flex-col gap-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Gestión de Proveedores
        </h1>

        {canCreate && (
          <button
            onClick={() => {
              setFormData(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 font-medium"
          >
            <PencilLine size={18} />
            Nuevo Proveedor
          </button>
        )}
      </div>

      <GridGenerico
        ref={gridRef}
        service={ServiceProveedor}
        columns={columns}
        defaultSortField="razonSocial"
        defaultSortAsc={true}
        pageSize={10}
        renderActions={(row) => (
          <div className="flex gap-x-2 justify-end">
            {/* 👁 todos pueden ver */}
            <button
              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors duration-200"
              onClick={() => setSelectedId(row.id)}
              title="Ver detalles"
            >
              <Eye size={16} />
            </button>

            {/* ✏️ solo admin */}
            {canEdit && (
              <button
                className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors duration-200"
                onClick={() => handleEdit(row.id)}
                title="Editar"
              >
                <PencilLine size={16} />
              </button>
            )}

            {/* 🗑 solo admin */}
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
        fetchData={ServiceProveedor.getById}
        fields={fields}
        onClose={() => setSelectedId(null)}
      />

      {idToDelete && canDelete && (
        <DeleteConfirm
          title="¿Eliminar proveedor?"
          message="Esta acción eliminará el proveedor permanentemente y no se podrá deshacer."
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
    </div>
  );
};

export default ProveedorList;
