import { useState, useRef } from "react";
import { Eye, PencilLine, Plus, Route, Trash } from "lucide-react";
import { Box, Button, Typography, Chip } from "@mui/material";
import { toast } from "react-toastify";

import GridGenerico from "@/components/Grid";
import DetailsDialog from "@/components/details";
import DeleteConfirm from "@/components/deleteConfirm";

import ImportacionForm from "./ImportacionForm";
import MovimientoImportacionDialog from "./MovimientoImportacionDialog";

import ServiceImportacion from "@/services/ServiceImportacion";
import { useAuth } from "@/context/AuthContext";

const ImportacionList = () => {
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

  const empleadoId = user?.id;

  const canCreate = roleKey === "administrador" || roleKey === "almacen";
  const canEdit = roleKey === "administrador";
  const canDelete = roleKey === "administrador";

  const [selectedId, setSelectedId] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [idToDelete, setIdToDelete] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(null);
  const [showMovimientos, setShowMovimientos] = useState(false);

  const serviceForGrid =
    roleKey === "pilotero" && empleadoId
      ? {
          ...ServiceImportacion,
          getAll: async () => {
            const data = await ServiceImportacion.getByEmpleado(empleadoId);
            return { items: data, total: data.length };
          },
        }
      : ServiceImportacion;

  const refetchGrid = () => {
    gridRef.current?.refetch?.();
  };

  const handleEdit = async (row) => {
    try {
      const data = await ServiceImportacion.getById(row.id);
      setFormData(data);
      setShowForm(true);
    } catch {
      toast.error("Error al cargar datos de la importación");
    }
  };

  const handleDelete = async () => {
    try {
      await ServiceImportacion.remove(idToDelete);
      toast.success("Importación eliminada correctamente");
      refetchGrid();
      return Promise.resolve();
    } catch (error) {
      console.error(error);
      throw error;
    }
  };
  const formatDateOnly = (value) => {
    if (!value) return "—";

    // Para fechas tipo: 2026-12-04
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [yyyy, mm, dd] = value.split("-");
      return `${dd}/${mm}/${yyyy}`;
    }

    return new Date(value).toLocaleDateString("es-BO");
  };

  const columns = [
    {
      name: "Código",
      selector: row => row.codigo,
      sortable: true,
      minWidth: "150px",
    },

    {
      name: "Proveedor",
      selector: row => row.proveedorNombre,
      sortable: true,
      minWidth: "250px",
    },

    {
      name: "Encargado proveedor",
      selector: row => row.proveedorEncargado,
      sortable: true,
      minWidth: "220px",
    },

    {
      name: "Empleado asignado",
      selector: row => row.empleadoAsignadoNombre,
      sortable: true,
      minWidth: "240px",
    },

   {
      name: "Fecha llegada",
      selector: row => formatDateOnly(row.fechaLlegada),
      sortable: true,
      minWidth: "170px",
    },

    {
      name: "Días",
      cell: (row) => {

        const dias = row.diasParaLlegada;

        if (dias == null) return "—";

        if (dias < 0) {
          return (
            <span style={{
              color: "#d32f2f",
              fontWeight: 700
            }}>
              {Math.abs(dias)} días retraso
            </span>
          );
        }

        if (dias === 0) {
          return (
            <span style={{
              color: "#ed6c02",
              fontWeight: 700
            }}>
              Hoy
            </span>
          );
        }

        return `${dias} días`;
      },
      sortable: true,
      width: "120px",
    },

    {
      name: "Situación",
      selector: row => row.situacion,
      sortable: true,
      minWidth: "180px",

      cell: (row) => {

        if (row.situacion === "Retrasada") {
          return (
            <Chip
              label="Retrasada"
              color="error"
              size="small"
            />
          );
        }

        if (row.situacion === "Llega hoy") {
          return (
            <Chip
              label="Llega hoy"
              color="warning"
              size="small"
            />
          );
        }

        if (row.situacion === "Próxima") {
          return (
            <Chip
              label="Próxima"
              color="info"
              size="small"
            />
          );
        }

        if (row.situacion === "Concluida") {
          return (
            <Chip
              label="Concluida"
              color="success"
              size="small"
            />
          );
        }

        return (
          <Chip
            label="En proceso"
            size="small"
          />
        );
      },
    },
  ];

  const fields = [
    { key: "codigo", label: "Código" },

    {
      key: "proveedor",
      label: "Proveedor",
      format: (v) => {
        if (!v) return "—";

        const razon = v.razonSocial || "";
        const encargado = v.encargado || "";

        if (razon && encargado) return `${razon} - Encargado: ${encargado}`;
        if (razon) return razon;

        return "—";
      },
    },

    {
      key: "fechaLlegada",
      label: "Fecha Llegada",
      format: (v) => formatDateOnly(v),
    },
    {
      key: "fechaRegistro",
      label: "Fecha Registro",
      format: (v) => {
        if (!v) return "—";

        return new Date(v).toLocaleDateString("es-BO");
      },
    },
    { key: "descripcion", label: "Descripción" },

    {
      key: "empleadoAsignado",
      label: "Empleado asignado",
      format: (v) => {
        if (!v) return "—";

        return `${v.nombre || ""} ${v.apellido || ""}`.trim() || "—";
      },
    },

    {
      key: "estado",
      label: "Estado",
      format: (v) => {
        if (Number(v) === 1) return "Activa";
        if (Number(v) === 2) return "Concluida";
        return "Cerrada";
      },
    },
  ];

  const actions = [
    {
      show: true,
      icon: <Eye size={16} />,
      className:
        "p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors duration-200",
      title: "Ver detalles",
      onClick: (row) => setSelectedId(row.id),
    },
    {
      show: (row) => canEdit && Number(row.estado) === 1,
      icon: <PencilLine size={16} />,
      className:
        "p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors duration-200",
      title: "Editar",
      onClick: (row) => handleEdit(row),
    },
    {
      show: true,
      icon: <Route size={16} />,
      className:
        "p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors duration-200",
      title: "Seguimiento / Movimiento",
      onClick: (row) => {
        setSelectedRow(row);
        setShowMovimientos(true);
      },
    },
    {
      show: (row) => canDelete && Number(row.estado) === 1,
      icon: <Trash size={16} />,
      className:
        "p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200",
      title: "Eliminar",
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
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, color: "#3A1A1A", mb: 1 }}
          >
            Gestión de Importaciones
          </Typography>

          <Typography
            variant="body1"
            sx={{ color: "text.secondary", fontSize: "1rem" }}
          >
            Administra importaciones, proveedores y seguimiento de llegada.
          </Typography>
        </Box>

        {canCreate && (
          <Button
            variant="contained"
            onClick={() => {
              setFormData(null);
              setShowForm(true);
            }}
            startIcon={<Plus size={18} />}
            sx={{
              borderRadius: 999,
              px: 3.5,
              py: 1.3,
              fontWeight: 700,
              textTransform: "none",
              fontSize: "15px",
              background:
                "linear-gradient(135deg, #592B2B 0%, #3A1A1A 100%)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
              "&:hover": {
                background:
                  "linear-gradient(135deg, #3A1A1A 0%, #592B2B 100%)",
                boxShadow: "0 6px 16px rgba(0,0,0,0.35)",
              },
            }}
          >
            Nueva Importación
          </Button>
        )}
      </Box>

      <GridGenerico
        ref={gridRef}
        service={{
          ...serviceForGrid,
          getAll: ServiceImportacion.getControl,
        }}
        columns={columns}
        pageSize={10}
        renderActions={(row) => (
          <div className="flex items-center justify-center gap-2 whitespace-nowrap min-w-[150px]">
            {actions
              .filter((a) =>
                typeof a.show === "function" ? a.show(row) : a.show
              )
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
        fetchData={ServiceImportacion.getById}
        fields={fields}
        onClose={() => setSelectedId(null)}
      />

      {idToDelete && canDelete && (
        <DeleteConfirm
          title="¿Eliminar importación?"
          message="Esta acción desactivará la importación. No se podrá eliminar si tiene productos activos vinculados."
          onConfirm={handleDelete}
          onCancel={() => setIdToDelete(null)}
        />
      )}

      {showForm && (
        <ImportacionForm
          open={showForm}
          initialData={formData}
          onClose={() => {
            setShowForm(false);
            setFormData(null);
          }}
          onSuccess={() => {
            refetchGrid();
            setShowForm(false);
            setFormData(null);
          }}
        />
      )}

      {showMovimientos && selectedRow && (
        <MovimientoImportacionDialog
          open={showMovimientos}
          onClose={() => {
            setShowMovimientos(false);
            setSelectedRow(null);
          }}
          importacion={selectedRow}
          onUpdated={() => {
            refetchGrid();
            toast.info("Seguimiento de importación actualizado");
          }}
        />
      )}
    </Box>
  );
};

export default ImportacionList;