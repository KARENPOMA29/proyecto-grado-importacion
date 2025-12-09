import { useState, useRef } from "react";
import { PencilLine, Trash, Eye } from "lucide-react";
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
      minWidth: "180px",
      grow: 2,
    },
    {
      name: "NIT",
      selector: (r) => r.nit,
      sortable: true,
      minWidth: "120px",
    },
    {
      name: "Correo",
      selector: (r) => r.correo,
      sortable: true,
      minWidth: "180px",
      grow: 2,
    },
    {
      name: "Teléfono",
      selector: (r) => r.telefono,
      sortable: true,
      minWidth: "110px",
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
    <div className="flex flex-col gap-y-6 p-4 sm:p-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Gestión de Clientes
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
            Nuevo Cliente
          </button>
        )}
      </div>

      <GridGenerico
        ref={gridRef}
        service={ServiceCliente}
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

            {/* ✏️ editar: admin + ventas */}
            {canEdit && (
              <button
                className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors duration-200"
                onClick={() => handleEdit(row.id)}
                title="Editar"
              >
                <PencilLine size={16} />
              </button>
            )}

            {/* 🗑️ eliminar: solo admin */}
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
    </div>
  );
};

export default ClienteList;
