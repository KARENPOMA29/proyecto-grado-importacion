import { useState, useRef, useEffect } from "react";
import { PencilLine, Trash, Eye } from "lucide-react";
import GridGenerico from "@/components/Grid";
import DetailsDialog from "@/components/details";
import DeleteConfirm from "@/components/deleteConfirm";
import EmpleadoForm from "./EmpleadoForm";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";
import ServiceEmpleado from "@/services/ServiceEmpleado";
import ServiceSucursal from "@/services/ServiceSucursal";

const IconBtn = ({ title, className = "", children, ...props }) => (
  <button
    title={title}
    className={`inline-flex items-center justify-center h-9 w-9 rounded-lg transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#592B2B]/30 ${className}`}
    {...props}
  >
    {children}
  </button>
);

const EmpleadoList = () => {
  const [selectedId, setSelectedId] = useState(null);
  const [idToDelete, setIdToDelete] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(null);
  const [sucursales, setSucursales] = useState([]);

  const gridRef = useRef(null);
  const { user } = useAuth();
  const isAdmin = user?.rol === "Administrador";

  // 🔄 Cargar sucursales para mostrar el nombre
  useEffect(() => {
    const fetchSucursales = async () => {
      try {
        const res = await ServiceSucursal.getAll();
        const items = Array.isArray(res) ? res : res.items || [];
        setSucursales(items);
      } catch (err) {
        console.error("Error cargando sucursales:", err);
        toast.error("Error al cargar sucursales");
      }
    };
    fetchSucursales();
  }, []);

  const getSucursalNombre = (idSucursal) => {
    if (!idSucursal) return "—";
    const idNum = Number(idSucursal);
    const suc = sucursales.find((s) => s.id === idNum);
    // 👇 ajusta "nombre" si tu modelo de sucursal tiene otra propiedad (ej: razonSocial)
    return suc?.nombre || "—";
  };

  const columns = [
    { name: "Nombre", selector: (r) => r.nombre, sortable: true, minWidth: "140px" },
    { name: "Apellido", selector: (r) => r.apellido, sortable: true, minWidth: "140px" },
    { name: "CI", selector: (r) => r.ci, sortable: true, minWidth: "110px" },
    { name: "Rol", selector: (r) => r.rol, sortable: true, minWidth: "140px" },
    {
      name: "Nombre",
      selector: (r) => getSucursalNombre(r.idSucursal),
      sortable: true,
      minWidth: "160px",
    },
    { name: "Teléfono", selector: (r) => r.telefono, sortable: true, minWidth: "140px" },
    { name: "Correo", selector: (r) => r.correo, sortable: true, minWidth: "220px", grow: 2 },
  ];

  const fields = [
    { label: "Nombre", key: "nombre" },
    { label: "Apellido", key: "apellido" },
    { label: "Segundo Apellido", key: "segundoApellido" },
    { label: "CI", key: "ci" },
    { label: "Teléfono", key: "telefono" },
    { label: "Rol", key: "rol" },
    {
      label: "Sucursal",
      key: "idSucursal",
      format: (id) => getSucursalNombre(id),
    },
    { label: "Usuario", key: "usuario" },
    { label: "Correo", key: "correo" },
    {
      label: "Fecha Registro",
      key: "fechaRegistro",
      format: (v) => (v ? new Date(v).toLocaleString() : "—"),
    },
  ];

  const handleDelete = async () => {
    try {
      await ServiceEmpleado.remove(idToDelete);
      toast.success("Empleado eliminado correctamente");
      gridRef.current?.refetch();
      return Promise.resolve();
    } catch (error) {
      console.error("Error eliminando empleado:", error);
      throw error;
    }
  };

  const handleEdit = async (id) => {
    try {
      const data = await ServiceEmpleado.getById(id);
      setFormData(data);
      setShowForm(true);
    } catch {
      toast.error("Error al cargar datos del empleado");
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 min-h-screen bg-[#F5F5F5]">
      {/* HEADER */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                Gestión de Empleados
              </h1>
              <p className="text-gray-600 text-sm mt-1"></p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => {
                setFormData(null);
                setShowForm(true);
              }}
              className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold 
                         hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all duration-200"
            >
              Nuevo Empleado
            </button>
          )}
        </div>
      </div>

      {/* GRID */}
      <div className="mt-2 bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <GridGenerico
          ref={gridRef}
          service={ServiceEmpleado}
          columns={columns}
          title="Listado de Empleados"
          defaultSortField="nombre"
          defaultSortAsc={true}
          pageSize={10}
          renderActions={(row) => (
            <div className="flex flex-nowrap gap-2 whitespace-nowrap">
              <IconBtn
                title="Ver detalles"
                className="bg-[#2B5959] text-white hover:bg-[#3B6a6a]"
                onClick={() => setSelectedId(row.id)}
              >
                <Eye size={16} />
              </IconBtn>

              {isAdmin && (
                <>
                  <IconBtn
                    title="Editar"
                    className="bg-[#592B2B] text-white hover:bg-[#733a3a]"
                    onClick={() => handleEdit(row.id)}
                  >
                    <PencilLine size={16} />
                  </IconBtn>

                  <IconBtn
                    title="Eliminar"
                    className="bg-[#8a2b2b] text-white hover:bg-[#a23a3a]"
                    onClick={() => setIdToDelete(row.id)}
                  >
                    <Trash size={16} />
                  </IconBtn>
                </>
              )}
            </div>
          )}
        />
      </div>

      <DetailsDialog
        open={!!selectedId}
        id={selectedId}
        fetchData={ServiceEmpleado.getById}
        fields={fields}
        onClose={() => setSelectedId(null)}
      />

      {idToDelete && (
        <DeleteConfirm
          title="¿Eliminar empleado?"
          message="Esta acción eliminará el empleado permanentemente y no se podrá deshacer."
          onConfirm={handleDelete}
          onCancel={() => setIdToDelete(null)}
        />
      )}

      {showForm && (
        <EmpleadoForm
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

export default EmpleadoList;
