import { useState, useRef, useEffect } from "react";
import { PencilLine, Trash, Eye } from "lucide-react";
import { Box, Typography, Button, Avatar } from "@mui/material";
import GridGenerico from "@/components/Grid";
import DetailsDialog from "@/components/details";
import DeleteConfirm from "@/components/deleteConfirm";
import EmpleadoForm from "./EmpleadoForm";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";
import ServiceEmpleado from "@/services/ServiceEmpleado";
import ServiceSucursal from "@/services/ServiceSucursal";

const getImageSrc = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;

  const base =
    import.meta.env.VITE_FILES_URL ||
    import.meta.env.VITE_API_URL ||
    "";

  const baseClean = base.endsWith("/") ? base.slice(0, -1) : base;
  const pathClean = url.startsWith("/") ? url : `/${url}`;

  return `${baseClean}${pathClean}`;
};

const EmpleadoList = () => {
  const [selectedId, setSelectedId] = useState(null);
  const [idToDelete, setIdToDelete] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(null);
  const [sucursales, setSucursales] = useState([]);

  const gridRef = useRef(null);
  const { user } = useAuth();
  const isAdmin = user?.rol === "Administrador";

  useEffect(() => {
    const fetchSucursales = async () => {
      try {
        const res = await ServiceSucursal.getAll();
        setSucursales(Array.isArray(res) ? res : res.items || []);
      } catch {
        toast.error("Error al cargar sucursales");
      }
    };

    fetchSucursales();
  }, []);

  const getSucursalNombre = (idSucursal) => {
    const suc = sucursales.find((s) => s.id === Number(idSucursal));
    return suc?.nombre || "—";
  };

  const columns = [
    {
      name: "Foto",
      width: "90px",
      cell: (r) => (
        <Avatar
          src={getImageSrc(r.urlImagen)}
          alt={r.nombre}
          sx={{
            width: 46,
            height: 46,
            border: "2px solid #F1E5E5",
            bgcolor: "#592B2B",
            fontWeight: 700,
          }}
        >
          {r.nombre?.charAt(0)}
        </Avatar>
      ),
    },
    { name: "Nombre", selector: (r) => r.nombre, sortable: true, width: "160px" },
    { name: "Apellido", selector: (r) => r.apellido, sortable: true, width: "160px" },
    { name: "CI", selector: (r) => r.ci, sortable: true, width: "130px" },
    { name: "Rol", selector: (r) => r.rol, sortable: true, width: "150px" },
    {
      name: "Sucursal",
      selector: (r) => getSucursalNombre(r.idSucursal),
      sortable: true,
      width: "180px",
    },
    { name: "Teléfono", selector: (r) => r.telefono, sortable: true, width: "150px" },
    { name: "Correo", selector: (r) => r.correo, sortable: true, width: "280px" },
  ];

  const fields = [
    { label: "Imagen", key: "urlImagen" },
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

  const actions = [
    {
      show: true,
      icon: <Eye size={16} />,
      title: "Ver detalles",
      className:
        "p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors duration-200",
      onClick: (row) => setSelectedId(row.id),
    },
    {
      show: isAdmin,
      icon: <PencilLine size={16} />,
      title: "Editar",
      className:
        "p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors duration-200",
      onClick: (row) => handleEdit(row.id),
    },
    {
      show: isAdmin,
      icon: <Trash size={16} />,
      title: "Eliminar",
      className:
        "p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200",
      onClick: (row) => setIdToDelete(row.id),
    },
  ];

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
          <Typography variant="h4" sx={{ fontWeight: 700, color: "#3A1A1A", mb: 1 }}>
            Gestión de Empleados
          </Typography>

          <Typography variant="body1" sx={{ color: "text.secondary", fontSize: "1rem" }}>
            Administra empleados registrados y consulta su información.
          </Typography>
        </Box>

        {isAdmin && (
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
              background: "linear-gradient(135deg, #592B2B 0%, #3A1A1A 100%)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
              "&:hover": {
                background: "linear-gradient(135deg, #3A1A1A 0%, #592B2B 100%)",
              },
            }}
          >
            Nuevo Empleado
          </Button>
        )}
      </Box>

      <GridGenerico
        ref={gridRef}
        service={ServiceEmpleado}
        columns={columns}
        title="Listado de Empleados"
        pageSize={10}
        renderActions={(row) => (
          <div className="flex items-center justify-center gap-2 whitespace-nowrap">
            {actions
              .filter((a) => a.show)
              .map((a) => (
                <button
                  key={a.title}
                  className={a.className}
                  onClick={() => a.onClick(row)}
                  title={a.title}
                >
                  {a.icon}
                </button>
              ))}
          </div>
        )}
      />

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
          message="Esta acción eliminará el empleado lógicamente y no se podrá deshacer."
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
    </Box>
  );
};

export default EmpleadoList;