import { useState, useRef } from "react";
import { PencilLine, Trash, Eye } from "lucide-react";
import GridGenerico from "@/components/Grid";
import DetailsDialog from "@/components/details";
import DeleteConfirm from "@/components/deleteConfirm";
import SucursalForm from "./sucursalForm";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";
import ServiceSucursal from "@/services/ServiceSucursal";

const SucursalList = () => {
  const [selectedId, setSelectedId] = useState(null);
  const [idToDelete, setIdToDelete] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(null);
  const gridRef = useRef(null);

  const { user } = useAuth();
  // 👇 mismo criterio en todos tus list
  const roleKey = (user?.rol || "").trim().toLowerCase();

  const canCreate = roleKey === "administrador" || roleKey === "almacen";
  const canEdit   = roleKey === "administrador" || roleKey === "almacen";
  const canDelete = roleKey === "administrador";

  const columns = [
    { name: "Nombre", selector: (r) => r.nombre, sortable: true, minWidth: "180px" },
    { name: "Teléfono", selector: (r) => r.telefono ?? "-", sortable: true, minWidth: "140px" },
  ];

  const fields = [
    { label: "Nombre", key: "nombre" },
    { label: "Teléfono", key: "telefono" },
    {
      label: "Fecha Registro",
      key: "fechaRegistro",
      format: (v) => (v ? new Date(v).toLocaleString() : "—"),
    },
  ];

  const handleDelete = async () => {
    try {
      await ServiceSucursal.remove(idToDelete);
      toast.success("Sucursal eliminada correctamente");
      gridRef.current?.refetch();
      return Promise.resolve();
    } catch (error) {
      console.error("Error eliminando sucursal:", error);
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

  return (
    <div className="flex flex-col gap-y-6 p-4 sm:p-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Gestión de Sucursales
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
            Nueva Sucursal
          </button>
        )}
      </div>

      <GridGenerico
        ref={gridRef}
        service={ServiceSucursal}
        columns={columns}
        defaultSortField="nombre"
        defaultSortAsc={true}
        pageSize={10}
        renderActions={(row) => (
          <div className="flex gap-x-2 justify-end">
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
                className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors duration-200"
                onClick={() => handleEdit(row.id)}
                title="Editar"
              >
                <PencilLine size={16} />
              </button>
            )}

            {/* 🗑️ eliminar: solo Admin */}
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
        fetchData={ServiceSucursal.getById}
        fields={fields}
        onClose={() => setSelectedId(null)}
      />

      {idToDelete && canDelete && (
        <DeleteConfirm
          title="¿Eliminar sucursal?"
          message="Esta acción eliminará la sucursal permanentemente y no se podrá deshacer."
          onConfirm={handleDelete}
          onCancel={() => setIdToDelete(null)}
        />
      )}

      {showForm && (
        <SucursalForm
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

export default SucursalList;
