// src/routes/pages/almacen/AlmacenList.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { PencilLine, Trash, Eye } from "lucide-react";
import GridGenerico from "@/components/Grid";
import DetailsDialog from "@/components/details";
import DeleteConfirm from "@/components/deleteConfirm";
import AlmacenForm from "./almacenForm";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";
import ServiceAlmacen from "@/services/ServiceAlmacen";
import ServiceSucursal from "@/services/ServiceSucursal";

const AlmacenList = () => {
  const [selectedId, setSelectedId] = useState(null);
  const [idToDelete, setIdToDelete] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(null);
  const [sucursales, setSucursales] = useState([]);
  const gridRef = useRef(null);

  const { user } = useAuth();
  const roleKey = (user?.rol || "").trim().toLowerCase(); // "Almacen" -> "almacen"

  const canCreate = roleKey === "administrador" || roleKey === "almacen";
  const canEdit = roleKey === "administrador" || roleKey === "almacen";
  const canDelete = roleKey === "administrador";


  useEffect(() => {
    (async () => {
      try {
        const s = await ServiceSucursal.getAll();
        const list = Array.isArray(s) ? s : s.items ?? [];
        setSucursales(list);
      } catch (e) {
        console.error("Error cargando sucursales:", e);
      }
    })();
  }, []);

  const sucursalMap = useMemo(() => {
    const m = {};
    for (const s of sucursales) m[s.id] = s.nombre;
    return m;
  }, [sucursales]);

  const columns = [
    { name: "Nombre", selector: (r) => r.nombre, minWidth: "220px" },
    {
      name: "Sucursal",
      selector: (r) => sucursalMap[r.sucursalId] ?? "—",
      minWidth: "180px",
    },
  ];

  const fields = [
    { label: "Nombre", key: "nombre" },
    { label: "Dirección", key: "direccion" },
    {
      label: "Sucursal",
      key: "sucursalId",
      format: (v) => sucursalMap[v] ?? "—",
    },
    {
      label: "Fecha Registro",
      key: "fechaRegistro",
      format: (v) => (v ? new Date(v).toLocaleString() : "—"),
    },
  ];

  const handleDelete = async () => {
    try {
      await ServiceAlmacen.remove(idToDelete);
      toast.success("Almacén eliminado correctamente");
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

  return (
    <div className="flex flex-col gap-y-6 p-4 sm:p-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Gestión de Almacenes
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
            Nuevo Almacén
          </button>
        )}
      </div>

      <GridGenerico
        ref={gridRef}
        service={ServiceAlmacen}
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

            {/* ✏️ editar: Administrador + Almacen */}
            {canEdit && (
              <button
                className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors duration-200"
                onClick={() => handleEdit(row.id)}
                title="Editar"
              >
                <PencilLine size={16} />
              </button>
            )}

            {/* 🗑️ eliminar: solo Administrador */}
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
        fetchData={ServiceAlmacen.getById}
        fields={fields}
        onClose={() => setSelectedId(null)}
      />

      {idToDelete && canDelete && (
        <DeleteConfirm
          title="¿Eliminar almacén?"
          message="Esta acción eliminará el almacén permanentemente y no se podrá deshacer."
          onConfirm={handleDelete}
          onCancel={() => setIdToDelete(null)}
        />
      )}

      {showForm && (
        <AlmacenForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            gridRef.current?.refetch();
            setShowForm(false);
          }}
          initialData={formData}
          sucursales={sucursales}
        />
      )}
    </div>
  );
};

export default AlmacenList;
