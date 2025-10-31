// src/pages/importaciones/ImportacionList.jsx
import { useEffect, useRef, useState } from "react";
import { PencilLine, Trash, Eye } from "lucide-react";
import GridGenerico from "@/components/Grid";
import Details from "@/components/details";
import DeleteConfirm from "@/components/deleteConfirm";
import ImportacionForm from "./ImportacionForm";
import ServiceImportacion from "@/services/ServiceImportacion";
import ServiceProveedor from "@/services/ServiceProveedor";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext"; // 👈

const ImportacionList = () => {
  const [selectedId, setSelectedId] = useState(null);
  const [idToDelete, setIdToDelete] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(null);
  const [proveedores, setProveedores] = useState([]);
  const gridRef = useRef(null);

  const { user } = useAuth();
  const roleKey = (user?.rol || "").trim().toLowerCase();
  const canCreate = roleKey === "administrador" || roleKey === "almacen" || roleKey === "pilotero" ;
  const canEdit = roleKey === "administrador";
  const canDelete = roleKey === "administrador";

  // id/nombre del usuario logueado (para guardar quién creó la importación)
  const usuarioIdLogueado = user?.id ?? user?.empleadoId ?? null;
  const usuarioNombre = user?.nombre ?? `${user?.nombres ?? ""} ${user?.apellidos ?? ""}`.trim();

  // cargar proveedores una sola vez
  useEffect(() => {
    (async () => {
      try {
        const res = await ServiceProveedor.getAll();
        const list = Array.isArray(res) ? res : res.items || [];
        setProveedores(list);
      } catch (e) {
        console.error("Error cargando proveedores:", e);
      }
    })();
  }, []);

  const getProveedorNombre = (id) => {
    if (!id) return "—";
    const p = proveedores.find((x) => x.id === id);
    return p ? p.razonSocial : id;
  };

  const columns = [
    { name: "Código", selector: (r) => r.codigo ?? "—", sortable: true, minWidth: "140px" },
    {
      name: "Proveedor",
      selector: (r) => getProveedorNombre(r.proveedorId),
      sortable: true,
      minWidth: "180px",
    },
    {
      name: "Fecha llegada",
      selector: (r) => (r.fechaLlegada ? new Date(r.fechaLlegada).toLocaleDateString() : "—"),
      sortable: true,
      minWidth: "150px",
    },
    { name: "Estado", selector: (r) => r.estado ?? "—", sortable: true, minWidth: "140px" },
    { name: "Observaciones", selector: (r) => r.observaciones ?? "—", minWidth: "240px", grow: 2 },
  ];

  const detailsFields = [
    { label: "Código", key: "codigo" },
    {
      label: "Proveedor",
      key: "proveedorId",
      format: (v) => getProveedorNombre(v),
    },
    {
      label: "Fecha llegada",
      key: "fechaLlegada",
      format: (v) => (v ? new Date(v).toLocaleString() : "—"),
    },
    { label: "Estado", key: "estado" },
    { label: "Observaciones", key: "observaciones" },
    {
      label: "Empleado / Usuario",
      key: "empleado",
      format: (emp, row) =>
        emp?.nombre ??
        row?.empleadoNombre ??
        row?.empleadoId ??
        row?.usuarioNombre ??
        "—",
    },
    {
      label: "Fecha Registro",
      key: "fechaRegistro",
      format: (v) => (v ? new Date(v).toLocaleString() : "—"),
    },
  ];

  const handleEdit = (row) => {
    setFormData(row);
    setShowForm(true);
  };

  const handleDelete = async () => {
    try {
      await ServiceImportacion.remove(idToDelete);
      toast.success("Importación eliminada");
      gridRef.current?.refetch();
      setIdToDelete(null);
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  return (
    <div className="flex flex-col gap-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Gestión de Importaciones
          </h1>
          
        </div>

        {canCreate && (
          <button
            onClick={() => {
              setFormData(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 font-medium"
          >
            <PencilLine size={18} />
            Nueva Importación
          </button>
        )}
      </div>

      {/* Grid */}
      <GridGenerico
        ref={gridRef}
        service={{
          // sobreescribimos create/update para enviar el usuario
          ...ServiceImportacion,
          create: async (data) => {
            const payload = {
              ...data,
              empleadoId: data.empleadoId ?? usuarioIdLogueado ?? null,
            };
            return ServiceImportacion.create(payload);
          },
          update: async (id, data) => {
            const payload = {
              ...data,
              empleadoId: data.empleadoId ?? usuarioIdLogueado ?? null,
            };
            return ServiceImportacion.update(id, payload);
          },
        }}
        columns={columns}
        title="Importaciones"
        defaultSortField="fechaRegistro"
        defaultSortAsc={false}
        pageSize={10}
        renderActions={(row) => (
          <div className="flex gap-x-2 justify-end">
            {/* ver detalles: todos */}
            <button
              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors duration-200"
              onClick={() => setSelectedId(row.id)}
              title="Ver detalles"
            >
              <Eye size={16} />
            </button>

            {/* editar: solo admin */}
            {canEdit && (
              <button
                className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors duration-200"
                onClick={() => handleEdit(row)}
                title="Editar"
              >
                <PencilLine size={16} />
              </button>
            )}

            {/* eliminar: solo admin */}
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

      {/* Detalles */}
      <Details
        open={!!selectedId}
        id={selectedId}
        fetchData={ServiceImportacion.getById}
        fields={detailsFields}
        onClose={() => setSelectedId(null)}
      />

      {/* Confirmación eliminar */}
      {idToDelete && canDelete && (
        <DeleteConfirm
          title="¿Eliminar importación?"
          message="Esta acción eliminará la importación y no se podrá deshacer."
          onConfirm={handleDelete}
          onCancel={() => setIdToDelete(null)}
        />
      )}

      {/* Formulario */}
      {showForm && (
        <ImportacionForm
          open={showForm}
          initialData={formData}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            gridRef.current?.refetch();
            setShowForm(false);
          }}
          // si tu form necesita saber quién es el usuario
          usuarioId={usuarioIdLogueado}
        />
      )}
    </div>
  );
};

export default ImportacionList;
