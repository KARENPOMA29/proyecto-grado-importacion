// src/routes/pages/ventas/VentasList.jsx
import { useState, useRef, useEffect, useMemo } from "react";
import { Eye, PencilLine, Trash } from "lucide-react";
import GridGenerico from "@/components/Grid";
import DetailsDialog from "@/components/details";
import ServiceVentas from "@/services/ServiceVentas";
import ServiceCliente from "@/services/ServiceCliente";
import ServiceSucursal from "@/services/ServiceSucursal";
import ServiceEmpleado from "@/services/ServiceEmpleado";
import { toast } from "react-toastify";
import VentasForm from "./VentasForm";
import DeleteConfirm from "@/components/deleteConfirm";
import { useAuth } from "@/context/AuthContext"; // 👈

const VentasList = () => {
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(null);
  const [idToCancel, setIdToCancel] = useState(null);
  const gridRef = useRef(null);

  const [clientes, setClientes] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [empleados, setEmpleados] = useState([]);

  // 👇 usuario y permisos
  const { user } = useAuth();
  const roleKey = (user?.rol || "").trim().toLowerCase();
  const canCreate = roleKey === "administrador" || roleKey === "ventas";
  const canCancel = roleKey === "administrador";
  // (ver siempre pueden todos)

  // cargar datos base
  useEffect(() => {
    (async () => {
      try {
        const [cliRes, sucRes, empRes] = await Promise.all([
          ServiceCliente.getAll(),
          ServiceSucursal.getAll(),
          ServiceEmpleado.getAll(),
        ]);

        const cliData = Array.isArray(cliRes) ? cliRes : cliRes.items ?? [];
        const sucData = Array.isArray(sucRes) ? sucRes : sucRes.items ?? [];
        const empData = Array.isArray(empRes) ? empRes : empRes.items ?? [];

        setClientes(cliData);
        setSucursales(sucData);
        setEmpleados(empData);
      } catch (err) {
        console.error(err);
        toast.error("Error al cargar datos base (clientes, sucursales, empleados)");
      }
    })();
  }, []);

  // maps para mostrar nombres bonitos
  const clienteMap = useMemo(() => {
    const m = {};
    for (const c of clientes) {
      const posibleNombre =
        c.nombreCompleto ||
        c.nombre ||
        (c.nombre && c.apellido ? `${c.nombre} ${c.apellido}` : null) ||
        c.razonSocial ||
        c.razon_social ||
        c.identificacion ||
        `Cliente #${c.id}`;
      m[c.id] = posibleNombre;
    }
    return m;
  }, [clientes]);

  const sucursalMap = useMemo(() => {
    const m = {};
    for (const s of sucursales) m[s.id] = s.nombre || `Sucursal #${s.id}`;
    return m;
  }, [sucursales]);

  const empleadoMap = useMemo(() => {
    const m = {};
    for (const e of empleados)
      m[e.id] =
        e.nombreCompleto ||
        (e.nombre && e.apellido ? `${e.nombre} ${e.apellido}` : null) ||
        e.nombre ||
        e.nombres ||
        e.username ||
        `Empleado #${e.id}`;
    return m;
  }, [empleados]);

  // columnas de la tabla
  const columns = [
    {
      name: "Código",
      selector: (r) => r.codigoVenta || "-",
      sortable: true,
      minWidth: "110px",
      wrap: true,
    },
    {
      name: "Cliente",
      selector: (r) => clienteMap[r.clienteId] ?? `ID: ${r.clienteId}`,
      sortable: true,
      grow: 1,
      wrap: true,
      minWidth: "140px",
    },
    {
      name: "Empleado",
      selector: (r) => empleadoMap[r.empleadoId] ?? `ID: ${r.empleadoId}`,
      sortable: true,
      wrap: true,
      minWidth: "140px",
    },
    {
      name: "Total (Bs)",
      selector: (r) => Number(r.total || 0).toFixed(2),
      sortable: true,
      right: true,
      minWidth: "110px",
    },
    {
      name: "Fecha",
      selector: (r) =>
        r.fechaRegistro ? new Date(r.fechaRegistro).toLocaleString() : "",
      sortable: true,
      minWidth: "210px",
      wrap: true,
    },
  ];

  // campos para el modal de detalles
  const fields = [
    { label: "Código", key: "codigoVenta" },
    {
      label: "Cliente",
      key: "clienteId",
      format: (v) => clienteMap[v] ?? `ID: ${v}`,
    },
    {
      label: "Empleado",
      key: "empleadoId",
      format: (v) => empleadoMap[v] ?? `ID: ${v}`,
    },
    {
      label: "Sucursal",
      key: "sucursalId",
      format: (v) => sucursalMap[v] ?? `ID: ${v}`,
    },
    {
      label: "Total",
      key: "total",
      format: (v) => (v ? `Bs ${Number(v).toFixed(2)}` : "—"),
    },
    {
      label: "Fecha de registro",
      key: "fechaRegistro",
      format: (v) => (v ? new Date(v).toLocaleString() : "—"),
    },
    {
      label: "Detalle",
      key: "detalles",
      format: (detalles) => {
        if (!detalles || !Array.isArray(detalles) || !detalles.length)
          return "—";
        return detalles
          .map(
            (d, i) =>
              `#${i + 1} Prod ${d.productoId} — Bs ${Number(d.subtotal).toFixed(
                2
              )}`
          )
          .join("\n");
      },
    },
  ];

  const handleOpenNew = () => {
    setFormData(null);
    setShowForm(true);
  };

  const handleSuccess = () => {
    gridRef.current?.refetch();
    setShowForm(false);
  };

  const handleCancelVenta = async () => {
    if (!idToCancel) return;
    await ServiceVentas.cancel(idToCancel);
    toast.success("Venta cancelada y productos devueltos al stock");
    gridRef.current?.refetch();
    setIdToCancel(null);
  };

  return (
    <div className="w-full h-full flex flex-col gap-y-6 p-3 sm:p-4 lg:p-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 w-full">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white break-words">
          Gestión de Ventas
        </h1>
        {canCreate && (
          <button
            onClick={handleOpenNew}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duración-200 font-medium"
          >
            <PencilLine size={18} />
            Nueva Venta
          </button>
        )}
      </div>

      {/* TABLA */}
      <div className="w-full overflow-x-auto">
        <div className="min-w-[600px] lg:min-w-0">
          <GridGenerico
            ref={gridRef}
            service={ServiceVentas}
            columns={columns}
            defaultSortField="fechaRegistro"
            defaultSortAsc={false}
            pageSize={10}
            renderActions={(row) => (
              <div className="flex gap-x-2 justify-end">
                {/* 👁 ver: todos */}
                <button
                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors duración-200"
                  onClick={() => setSelectedId(row.id)}
                  title="Ver detalles"
                >
                  <Eye size={16} />
                </button>

                {/* 🗑 cancelar: solo admin */}
                {canCancel && (
                  <button
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duración-200"
                    onClick={() => setIdToCancel(row.id)}
                    title="Cancelar venta"
                  >
                    <Trash size={16} />
                  </button>
                )}
              </div>
            )}
          />
        </div>
      </div>

      {/* MODAL DETALLES */}
      <DetailsDialog
        open={!!selectedId}
        id={selectedId}
        fetchData={ServiceVentas.getById}
        fields={fields}
        onClose={() => setSelectedId(null)}
      />

      {/* FORM VENTA */}
      {showForm && (
        <VentasForm
          initialData={formData}
          onClose={() => setShowForm(false)}
          onSuccess={handleSuccess}
        />
      )}

      {/* CONFIRMAR CANCELACIÓN (solo si admin puso cancelar) */}
      {idToCancel && canCancel && (
        <DeleteConfirm
          title="¿Cancelar venta?"
          message="Se marcará como cancelada y los productos volverán al stock."
          confirmText="Sí, cancelar"
          loadingText="Cancelando..."
          onConfirm={handleCancelVenta}
          onCancel={() => setIdToCancel(null)}
        />
      )}
    </div>
  );
};

export default VentasList;
