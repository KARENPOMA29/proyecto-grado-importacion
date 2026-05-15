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
import { Box, Typography, Button } from "@mui/material";

const AlmacenList = () => {
  const [selectedId, setSelectedId] = useState(null);
  const [idToDelete, setIdToDelete] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(null);
  const [sucursales, setSucursales] = useState([]);
  const gridRef = useRef(null);

  const { user } = useAuth();
    const roleKey = (
    user?.rolKey ||
    user?.role ||
    user?.rol ||
    user?.perfil?.rol ||
    user?.perfil?.nombre ||
    ""
  )
    .toString()
    .trim()
    .toLowerCase();

  const isAdmin = roleKey === "administrador";
  const isAlmacen = roleKey === "almacen";

  const empleadoSucursalId =
    user?.idSucursal ??
    user?.sucursalId ??
    user?.empleado?.idSucursal ??
    user?.empleado?.sucursalId ??
    user?.empleado?.sucursal?.id ??
    null;

  const canCreate = isAdmin || isAlmacen;
  const canEdit = isAdmin || isAlmacen;
  const canDelete = isAdmin;

  useEffect(() => {
    (async () => {
      try {
        if (isAlmacen) {
          if (!empleadoSucursalId) {
            setSucursales([]);
            toast.error("Tu usuario no tiene una sucursal asignada.");
            return;
          }

          const sucursal = await ServiceSucursal.getById(empleadoSucursalId);
          setSucursales(sucursal ? [sucursal] : []);
          return;
        }

        const s = await ServiceSucursal.getAll();
        const list = Array.isArray(s) ? s : s.items ?? [];
        setSucursales(list);
      } catch (e) {
        console.error("Error cargando sucursales:", e);
      }
    })();
  }, [isAlmacen, empleadoSucursalId]);

  const sucursalMap = useMemo(() => {
  const m = {};

  for (const s of sucursales) {
    const ciudad =
      s.ciudadNombre || "Sin ciudad";

    m[s.id] = `${s.nombre} - ${ciudad}`;
  }

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
  const serviceAlmacenFiltrado = useMemo(() => {
    return {
        ...ServiceAlmacen,
        getAll: async (params = {}) => {
          if (isAlmacen) {
            if (!empleadoSucursalId) {
              return { items: [], total: 0 };
            }

            return ServiceAlmacen.getAll({
              ...params,
              sucursalId: empleadoSucursalId,
            });
          }

          return ServiceAlmacen.getAll(params);
        },
      };
    }, [isAlmacen, empleadoSucursalId]);

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
            Gestión de Almacenes
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: "text.secondary",
              fontSize: "1rem",
            }}
          >
            Administra almacenes registrados y consulta su sucursal asignada.
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
              background: "linear-gradient(135deg, #592B2B 0%, #3A1A1A 100%)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
              "&:hover": {
                background: "linear-gradient(135deg, #3A1A1A 0%, #592B2B 100%)",
                boxShadow: "0 6px 16px rgba(0,0,0,0.35)",
              },
            }}
          >
            Nuevo Almacén
          </Button>
        )}
      </Box>

      <GridGenerico
        ref={gridRef}
        service={serviceAlmacenFiltrado}
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
        fetchData={ServiceAlmacen.getById}
        fields={fields}
        onClose={() => setSelectedId(null)}
      />

      {idToDelete && canDelete && (
        <DeleteConfirm
          title="¿Eliminar almacén?"
          message="Solo se podrá eliminar si no tiene secciones activas vinculadas."
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
          sucursalContext={isAlmacen ? sucursales[0] : null}
          bloquearSucursal={isAlmacen}
        />
      )}
    </Box>
  );
};

export default AlmacenList;
