import { useEffect, useMemo, useRef, useState } from "react";
import { PencilLine, Trash, Eye } from "lucide-react";
import GridGenerico from "@/components/Grid";
import DeleteConfirm from "@/components/deleteConfirm";
import DetailsDialog from "@/components/details";
import SeccionForm from "./seccionForm";
import { toast } from "react-toastify";
import { Box, Typography, Button } from "@mui/material";
import { useAuth } from "@/context/AuthContext"; // 👈
import ServiceSeccion from "@/services/ServiceSeccion";
import ServiceAlmacen from "@/services/ServiceAlmacen";
import ServiceModeloProducto from "@/services/ServiceModeloProducto";

// Util robusta para nombre de modelo
const resolveModelName = (m) =>
  m?.nombre ??
  m?.nombreModelo ??
  m?.modeloNombre ??
  m?.descripcion ??
  (m?.id != null ? `Modelo #${m.id}` : "—");

const SeccionList = () => {
  const [selectedId, setSelectedId] = useState(null);
  const [idToDelete, setIdToDelete] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(null);

  const [almacenes, setAlmacenes] = useState([]);
  const [modelos, setModelos] = useState([]);

  const gridRef = useRef(null);

  // 👇 rol
  const { user } = useAuth();
  const roleKey = (user?.rol || "").trim().toLowerCase();
  const canCreate = roleKey === "administrador" || roleKey === "almacen";
  const canEdit   = roleKey === "administrador" || roleKey === "almacen";
  const canDelete = roleKey === "administrador";

  // Cargar catálogos (almacenes y modelos)
  useEffect(() => {
    (async () => {
      try {
        const almRes = await ServiceAlmacen.getAll();
        const almList = Array.isArray(almRes) ? almRes : almRes.items ?? [];
        setAlmacenes(almList);

        const modRes = await ServiceModeloProducto.getAll({
          page: 1,
          pageSize: 1000,
        });

        const modListRaw = Array.isArray(modRes)
          ? modRes
          : modRes.items ?? [];

        const modList = modListRaw.map((m) => ({
          ...m,
          _nombre: resolveModelName(m),
        }));

        setModelos(modList);
      } catch (e) {
        console.error("Error cargando catálogos:", e);
      }
    })();
  }, []);

  // Mapas id → nombre
  const almacenMap = useMemo(() => {
    const m = {};
    for (const a of almacenes) m[a.id] = a?.nombre ?? a?.descripcion ?? `Almacén #${a?.id}`;
    return m;
  }, [almacenes]);

  const modeloMap = useMemo(() => {
    const m = {};
    for (const mod of modelos) m[mod.id] = mod._nombre ?? resolveModelName(mod);
    return m;
  }, [modelos]);

  const columns = [
    {
      name: "Nombre",
      selector: (r) => r.nombre ?? "—",
      sortable: true,
      minWidth: "180px",
    },
    {
      name: "Almacén",
      selector: (r) => r.almacenNombre ?? "—",
      sortable: true,
      minWidth: "180px",
    },
    {
      name: "Modelo",
      selector: (r) => r.modeloNombre ?? "—",
      sortable: true,
      minWidth: "180px",
    },
    {
      name: "Registrado",
      selector: (r) =>
        r.fechaRegistro
          ? new Date(r.fechaRegistro).toLocaleDateString()
          : "—",
      sortable: true,
      minWidth: "200px",
    },
  ];
  const detailsFields = [
    { label: "Nombre", key: "nombre" },

    {
      label: "Almacén",
      key: "almacenId",
      format: (v) => almacenMap[v] ?? `Almacén #${v}`,
    },

    {
      label: "Modelo",
      key: "modeloId",
      format: (v) => modeloMap[v] ?? `Modelo #${v}`,
    },

    { label: "Descripción", key: "descripcion" },

    {
      label: "Fecha Registro",
      key: "fechaRegistro",
      format: (v) =>
      v
        ? new Date(v).toLocaleDateString()
        : "—",
    },
  ];

  const handleEdit = async (id) => {
    try {
      const data = await ServiceSeccion.getById(id);
      setFormData(data);
      setShowForm(true);
    } catch {
      toast.error("Error al cargar datos de la sección");
    }
  };

  const handleDelete = async () => {
    try {
      await ServiceSeccion.remove(idToDelete);
      toast.success("Sección eliminada correctamente");
      gridRef.current?.refetch();
      return Promise.resolve();
    } catch (e) {
      console.error("Error eliminando sección:", e);
      throw e;
    }
  };

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
            Gestión de Secciones
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: "text.secondary",
              fontSize: "1rem",
            }}
          >
            Administra secciones registradas por almacén y modelo de producto.
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
            Nueva Sección
          </Button>
        )}
      </Box>

      <GridGenerico
        ref={gridRef}
        service={ServiceSeccion}
        columns={columns}
        defaultSortField="fechaRegistro"
        defaultSortAsc={false}
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
        fetchData={ServiceSeccion.getById}
        fields={detailsFields}
        onClose={() => setSelectedId(null)}
        title="Detalles de la Sección"
      />

      {idToDelete && canDelete && (
        <DeleteConfirm
          title="¿Eliminar sección?"
          message="Esta acción eliminará la sección lógicamente y no se podrá deshacer."
          onConfirm={handleDelete}
          onCancel={() => setIdToDelete(null)}
        />
      )}

      {showForm && (
        <SeccionForm
          open={showForm}
          onClose={(shouldRefetch) => {
            setShowForm(false);
            if (shouldRefetch) gridRef.current?.refetch();
          }}
          seccion={formData}
          almacenes={almacenes}
          modelos={modelos}
        />
      )}
    </Box>
  );
};

export default SeccionList;
