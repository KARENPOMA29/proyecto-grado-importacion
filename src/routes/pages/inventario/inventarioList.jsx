import { useEffect, useRef, useState } from "react";
import { Eye, Trash, Plus, Pencil } from "lucide-react";

import GridGenerico from "@/components/Grid";
import Details from "@/components/details"; // tu wrapper al DetailsDialog
import DeleteConfirm from "@/components/deleteConfirm";

import ServiceMovimiento from "@/services/ServiceMovimiento";
import ServiceProducto from "@/services/ServiceProducto";

import { toast } from "react-toastify";
import InventarioFlow from "./InventarioFlow";

export default function MovimientoList() {
  const [selectedId, setSelectedId] = useState(null);
  const [idToDelete, setIdToDelete] = useState(null);
  const [showInventarioFlow, setShowInventarioFlow] = useState(false);
  const [productos, setProductos] = useState([]);

  const gridRef = useRef(null);

  // 🔐 obtenemos el empleado logueado, pero NO lo mostramos
  const usuarioIdLogueado = (() => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.empleadoId || parsed?.id || null;
    } catch {
      return null;
    }
  })();

  // cargar cache de productos
  useEffect(() => {
    (async () => {
      try {
        const res = await ServiceProducto.getAll?.();
        const list = Array.isArray(res) ? res : res?.items || [];
        setProductos(list);
      } catch (e) {
        console.warn("Error cargando productos:", e);
      }
    })();
  }, []);

  const getProductoIdFromRow = (rowOrId) => {
    if (!rowOrId) return null;
    if (typeof rowOrId === "number") return rowOrId;
    return (
      rowOrId.productoId ||
      rowOrId.producto_id ||
      rowOrId.producto?.id ||
      null
    );
  };

  const getProductoFromCache = (id) => {
    if (!id) return null;
    return productos.find((x) => x.id === id) || null;
  };

  // 👇 ESTA función tiene que ir ANTES de "columns"
  const getTextoProducto = (row) => {
    // si el backend ya trae el producto embebido
    if (row.producto) {
      return (
        row.producto.numeroSerie ||
        row.producto.descripcion ||
        `Producto #${row.producto.id}`
      );
    }
    // fallback al caché
    const prodId = getProductoIdFromRow(row);
    if (!prodId) return "—";
    const p = getProductoFromCache(prodId);
    if (!p) return `Producto #${prodId}`;
    return (
      p.numeroSerie ||
      p.serie ||
      p.codigo ||
      p.nombre ||
      p.descripcion ||
      `Producto #${prodId}`
    );
  };

  // 👇 columnas
  const columns = [
    {
      name: "Producto",
      selector: (r) => getTextoProducto(r),
      sortable: true,
      minWidth: "170px",
    },
    {
      name: "Almacén",
      selector: (r) => r.almacen?.nombre || r.almacenNombre || r.almacenId || "—",
      sortable: true,
      minWidth: "140px",
    },
    {
      name: "Tipo",
      selector: (r) => r.tipoMovimiento ?? "—",
      sortable: true,
      minWidth: "110px",
    },
    {
      name: "Fecha",
      selector: (r) =>
        r.fecha
          ? new Date(r.fecha).toLocaleString()
          : r.fechaRegistro
          ? new Date(r.fechaRegistro).toLocaleString()
          : "—",
      sortable: true,
      minWidth: "160px",
    },
  ];

const detailsFields = [
  // ==== Movimiento ====
  { label: "Producto (serie)", key: "productoSerie" },
  { label: "Producto (descripción)", key: "productoDescripcion" },
  { label: "Tipo de movimiento", key: "tipoMovimiento" },
  {
    label: "Almacén",
    key: "almacen",
    format: (a, row) => a?.nombre ?? row?.almacenNombre ?? "—",
  },
  {
    label: "Fecha",
    key: "fecha",
    format: (v) => (v ? new Date(v).toLocaleString() : "—"),
  },
  {
    label: "Usuario que registró",
    key: "usuarioId",
    format: (v) => v ?? "—",
  },

  // ==== Producto ====
  {
    label: "Color",
    key: "producto",
    format: (p) => p?.color ?? "—",
  },
  {
    label: "Precio",
    key: "producto",
    format: (p) => (p?.precio != null ? `${p.precio} Bs` : "—"),
  },
  {
    label: "Garantía",
    key: "producto",
    format: (p) =>
      p?.duracionGarantia
        ? `${p.duracionGarantia} ${p.tipoGarantia ?? ""}`.trim()
        : "—",
  },

  // ==== Nombres de relaciones ====
  {
    label: "Categoría",
    key: "categoria",
    format: (c) => c?.nombre ?? "—",
  },
  {
    label: "Modelo",
    key: "modeloProducto",
    format: (m) => m?.nombreModelo ?? "—",
  },
  {
    label: "Importación",
    key: "importacion",
    format: (i) => i?.codigo ?? "—",
  },
];



  // 👉 ahora SÍ: no llamamos al backend aquí,
  // dejamos que <Details /> lo haga
  const handleOpenDetails = (movId) => {
    setSelectedId(movId);
  };

  const handleDelete = async () => {
    try {
      await ServiceMovimiento.remove(idToDelete);
      toast.success("Movimiento eliminado");
      setIdToDelete(null);
      gridRef.current?.refetch();
    } catch (e) {
      toast.error(e.message || "No se pudo eliminar el movimiento");
    }
  };

  return (
    <div className="flex flex-col gap-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Registro de entradas
        </h1>

        <button
          onClick={() => setShowInventarioFlow(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 font-medium"
        >
          <Plus size={18} />
          Agregar movimiento
        </button>
      </div>

      <GridGenerico
        ref={gridRef}
        service={{
          ...ServiceMovimiento,
          create: async (data) => {
            const payload = {
              ...data,
              usuarioId: data.usuarioId ?? usuarioIdLogueado ?? null,
            };
            return ServiceMovimiento.create(payload);
          },
          update: async (id, data) => {
            const payload = {
              ...data,
              usuarioId: data.usuarioId ?? usuarioIdLogueado ?? null,
            };
            return ServiceMovimiento.update(id, payload);
          },
        }}
        columns={columns}
        title="Movimientos"
        defaultSortField="fecha"
        defaultSortAsc={false}
        pageSize={10}
        renderActions={(row) => (
          <div className="flex gap-x-2 justify-end">
            {/* ver detalles */}
            <button
              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors duration-200"
              onClick={() => handleOpenDetails(row.id)}
              title="Ver detalles"
            >
              <Eye size={16} />
            </button>

            {/* editar (si tu GridGenerico expone un método de edición) */}
            <button
              className="p-2 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors duration-200"
              onClick={() => gridRef.current?.openEdit?.(row)}
              title="Editar"
            >
              <Pencil size={16} />
            </button>

            {/* eliminar */}
            <button
              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
              onClick={() => setIdToDelete(row.id)}
              title="Eliminar"
            >
              <Trash size={16} />
            </button>
          </div>
        )}
      />

      <Details
        open={!!selectedId}
        id={selectedId}
        fetchData={ServiceMovimiento.getById}
        fields={detailsFields}
        onClose={() => setSelectedId(null)}
      />

      {idToDelete && (
        <DeleteConfirm
          title="¿Eliminar movimiento?"
          message="Esta acción eliminará el movimiento de inventario y no se podrá deshacer."
          onConfirm={handleDelete}
          onCancel={() => setIdToDelete(null)}
        />
      )}

      {showInventarioFlow && (
        <InventarioFlow
          isOpen={showInventarioFlow}
          onClose={() => {
            setShowInventarioFlow(false);
            gridRef.current?.refetch();
          }}
          usuarioId={usuarioIdLogueado}
        />
      )}
    </div>
  );
}
