import { useState, useRef } from "react";
import { Eye, PencilLine, Plus, Route } from "lucide-react";
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Typography,
  Chip,
} from "@mui/material";
import { toast } from "react-toastify";

import GridGenerico from "@/components/Grid";
import DetailsDialog from "@/components/details";

import ImportacionForm from "./ImportacionForm";
import MovimientoImportacionDialog from "./MovimientoImportacionDialog";

import ServiceImportacion from "@/services/ServiceImportacion";
import { useAuth } from "@/context/AuthContext";

const ImportacionList = () => {
  const gridRef = useRef(null);
  const { user } = useAuth(); // para detectar el rol

  // 👇 obtenemos el rol crudo y lo normalizamos (trim + minúsculas)
  const rawRoleKey =
    user?.rolKey ||
    user?.role ||
    user?.rol ||
    user?.perfil?.rol ||
    user?.perfil?.nombre ||
    "";
  const roleKey = rawRoleKey.toString().trim().toLowerCase();
  const empleadoId = user?.id;

  // 👇 permisos por rol
  const canCreate = roleKey === "administrador" || roleKey === "almacen";
  const canEdit = roleKey === "administrador";
  const canDelete = roleKey === "administrador"; // por si luego lo usas

  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(null);

  const [showDetails, setShowDetails] = useState(false);
  const [showMovimientos, setShowMovimientos] = useState(false);

  // ✅ servicio que usará el Grid según el rol
  const serviceForGrid =
    roleKey === "pilotero" && empleadoId
      ? {
          // copiamos el servicio original
          ...ServiceImportacion,
          // y sobreescribimos getAll SOLO para pilotero
          getAll: async (...args) => {
            try {
              const data = await ServiceImportacion.getByEmpleado(empleadoId);
              return data;
            } catch (e) {
              console.error("Error cargando importaciones del pilotero:", e);
              throw e;
            }
          },
        }
      : ServiceImportacion;

  // 🔁 refrescar grilla
  const refetchGrid = () => {
    try {
      gridRef.current?.refetch?.();
    } catch (e) {
      console.error("No se pudo recargar la grilla de importaciones:", e);
    }
  };

  // NUEVA IMPORTACIÓN
  const handleNew = () => {
    setFormData(null);
    setShowForm(true);
  };

  // EDITAR
  const handleEdit = (row) => {
    setFormData(row);
    setShowForm(true);
  };

  // DETALLE
  const handleView = (row) => {
    setSelectedRow(row);
    setSelectedId(row.id);
    setShowDetails(true);
  };

  // MOVIMIENTO / SEGUIMIENTO
  const handleMovimientos = (row) => {
    setSelectedRow(row);
    setShowMovimientos(true);
  };

  // CIERRES
  const handleCloseForm = () => {
    setShowForm(false);
    setFormData(null);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedRow(null);
    setSelectedId(null);
  };

  const handleCloseMovimientos = () => {
    setShowMovimientos(false);
    setSelectedRow(null);
  };

  const handleSuccessForm = () => {
    handleCloseForm();
    refetchGrid();
  };

  const handleUpdatedMovimientos = () => {
    refetchGrid();
    toast.info("Seguimiento de importación actualizado");
  };

  // 🔸 Solo se puede editar si:
  // - el rol tiene permiso (canEdit)
  // - y la importación está ACTIVA (estado = 1)
  const canEditRow = (row) => {
    const estado = Number(row.estado);
    return canEdit && estado === 1;
  };

  // 🔹 Columnas de la tabla
  const columns = [
    {
      name: "Código",
      selector: (row) => row.codigo || `IMP-${row.id}`,
      minWidth: "150px",
    },
    {
      name: "Proveedor",
      selector: (row) =>
        row.proveedor?.razonSocial || `ID: ${row.proveedorId}`,
      minWidth: "160px",
    },

    {
      name: "Fecha Llegada Estimada",
      selector: (row) =>
        row.fechaLlegada
          ? new Date(row.fechaLlegada).toLocaleDateString()
          : "",
      minWidth: "190px",
    },
    {
      name: "Empleado asignado",
      selector: (row) => {
        if (row.empleadoAsignado) {
          const { nombre, apellido } = row.empleadoAsignado;
          return `${nombre || ""} ${apellido || ""}`.trim();
        }
        return `ID: ${row.idEmpleadoAsignado}`;
      },
      minWidth: "180px",
    },
    {
      name: "Estado",
      selector: (row) => row.estado,
      minWidth: "130px",
      cell: (row) => {
        const estado = Number(row.estado);
        let label = "";
        let color = "default";
        let variant = "filled";

        if (estado === 1) {
          label = "Activa";
          color = "success";
        } else if (estado === 2) {
          label = "Concluida";
          color = "info";
        } else {
          label = "Cerrada";
          color = "default";
          variant = "outlined";
        }

        return (
          <Chip
            size="small"
            label={label}
            color={color}
            variant={variant}
          />
        );
      },
    },
  ];

  // 🔹 Campos para el DetailsDialog
  const detailFields = [
    { key: "codigo", label: "Código" },
    {
      key: "proveedor",
      label: "Proveedor",
      format: (v, row) =>
        row?.proveedor?.razonSocial || `ID: ${row?.proveedorId ?? ""}`,
    },
    {
      key: "fechaRegistro",
      label: "Fecha Registro",
      format: (v) => (v ? new Date(v).toLocaleString() : ""),
    },
    {
      key: "fechaLlegada",
      label: "Fecha Llegada Estimada",
      format: (v) => (v ? new Date(v).toLocaleDateString() : ""),
    },
    { key: "descripcion", label: "Descripción" },
    {
      key: "empleadoAsignado",
      label: "Empleado asignado",
      format: (v, row) => {
        if (row?.empleadoAsignado) {
          const { nombre, apellido } = row.empleadoAsignado;
          return `${nombre || ""} ${apellido || ""}`.trim();
        }
        return `ID: ${row?.idEmpleadoAsignado ?? ""}`;
      },
    },
    {
      key: "estado",
      label: "Estado",
      format: (v) => {
        const estado = Number(v);
        if (estado === 1) return "Activa";
        if (estado === 2) return "Concluida";
        return "Cerrada";
      },
    },
  ];

  // 🔹 Botones de acción por fila
  const renderActions = (row) => (
    <>
      <Tooltip title="Ver detalles">
        <IconButton size="small" onClick={() => handleView(row)}>
          <Eye size={18} />
        </IconButton>
      </Tooltip>

      {canEditRow(row) && (
        <Tooltip title="Editar importación">
          <IconButton size="small" onClick={() => handleEdit(row)}>
            <PencilLine size={18} />
          </IconButton>
        </Tooltip>
      )}

      <Tooltip
        title={
          Number(row.estado) === 2
            ? "Importación concluida (solo seguimiento)"
            : "Seguimiento / Movimiento"
        }
      >
        <IconButton size="small" onClick={() => handleMovimientos(row)}>
          <Route size={18} />
        </IconButton>
      </Tooltip>
    </>
  );

  return (
    <>
      {/* 🔹 Encabezado */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h5" fontWeight={600}>
          Importaciones
        </Typography>

        {/* 🔹 Botón para agregar importación */}
        {canCreate && (
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={handleNew}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 2,
              px: 2.5,
              py: 1,
              backgroundColor: "#8b5e83",
              "&:hover": {
                backgroundColor: "#72486a",
              },
            }}
          >
            Nueva Importación
          </Button>
        )}
      </Box>

      {/* Grilla principal */}
      <GridGenerico
        ref={gridRef}
        title="Listado de Importaciones"
        service={serviceForGrid}
        columns={columns}
        renderActions={renderActions}
      />

      {/* Modal: Crear / Editar */}
      {showForm && (
        <ImportacionForm
          open={showForm}
          onClose={handleCloseForm}
          initialData={formData}
          onSuccess={handleSuccessForm}
        />
      )}

      {/* Modal: Detalles */}
      {showDetails && selectedId && (
        <DetailsDialog
          open={showDetails}
          id={selectedId}
          fields={detailFields}
          fetchData={ServiceImportacion.getById}
          onClose={handleCloseDetails}
        />
      )}

      {/* Modal: Seguimiento / Movimiento */}
      {showMovimientos && selectedRow && (
        <MovimientoImportacionDialog
          open={showMovimientos}
          onClose={handleCloseMovimientos}
          importacion={selectedRow}
          onUpdated={handleUpdatedMovimientos}
        />
      )}
    </>
  );
};

export default ImportacionList;
