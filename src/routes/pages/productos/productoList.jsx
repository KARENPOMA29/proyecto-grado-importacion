
import { useState, useEffect, useRef } from "react";
import { Eye, PencilLine } from "lucide-react"; // 👈 Quitamos Plus
import GridGenerico from "@/components/Grid";
import DetailsDialog from "@/components/details";
import ProductoForm from "./ProductoForm";
import ServiceProducto from "@/services/ServiceProducto";
import ServiceModeloProducto from "@/services/ServiceModeloProducto";
import ServiceCategoria from "@/services/ServiceCategoria";
import ServiceImportacion from "@/services/ServiceImportacion";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";

const ProductList = () => {
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(null);

  const [modelos, setModelos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [importaciones, setImportaciones] = useState([]);

  const gridRef = useRef(null);

  // 👇 permisos por rol
  const { user } = useAuth();
  const roleKey = (user?.rol || "").trim().toLowerCase(); // "Almacen" -> "almacen"

  const canCreate = roleKey === "administrador" || roleKey === "almacen";
  const canEdit = roleKey === "administrador" || roleKey === "almacen";
  const canDelete = roleKey === "administrador"; // (por si luego agregas eliminar)

  useEffect(() => {
    (async () => {
      try {
        const data = await ServiceModeloProducto.getAll();
        setModelos(Array.isArray(data) ? data : data?.items || []);
      } catch {
        setModelos([]);
      }

      try {
        const data = await ServiceCategoria.getAll();
        setCategorias(Array.isArray(data) ? data : data?.items || []);
      } catch {
        setCategorias([]);
      }

      try {
        const data = await ServiceImportacion.getAll();
        setImportaciones(Array.isArray(data) ? data : data?.items || []);
      } catch {
        setImportaciones([]);
      }
    })();
  }, []);

  const getModeloNombre = (id) => {
    const found = modelos.find((x) => x.id === id);
    return found ? found.nombreModelo : `#${id}`;
  };

  const getCategoriaNombre = (id) => {
    const found = categorias.find((x) => x.id === id);
    return found ? found.nombre || found.nombreCategoria : `#${id}`;
  };

  const getImportacionCodigo = (id) => {
    const found = importaciones.find((x) => x.id === id);
    return found ? found.codigo || found.codigoImportacion : `#${id}`;
  };

  const handleEdit = async (id) => {
    try {
      const data = await ServiceProducto.getById(id);
      setFormData(data);
      setShowForm(true);
    } catch {
      toast.error("Error al cargar producto para editar");
    }
  };

  const columns = [
    { name: "N° Serie", selector: (row) => row.numeroSerie, sortable: true },
    { name: "Descripción", selector: (row) => row.descripcion, sortable: true },
    {
      name: "Precio (Bs)",
      selector: (row) => row.precio,
      sortable: true,
      right: true,
    },
    {
      name: "Categoría",
      selector: (row) => getCategoriaNombre(row.categoriaId),
      sortable: true,
    },
    {
      name: "Modelo",
      selector: (row) => getModeloNombre(row.modeloId),
      sortable: true,
    },
    {
      name: "Importación",
      selector: (row) => getImportacionCodigo(row.importacionId),
      sortable: true,
    },
    {
      name: "Estado",
      selector: (row) =>
        row.estado === 1 ? "Disponible" : row.estado === 2 ? "Vendido" : "Inactivo",
      sortable: true,
    },
    {
      name: "Acciones",
      cell: (row) => (
        <div className="flex gap-2 justify-end">
          {/* Ver detalles: todos */}
          <button
            onClick={() => setSelectedId(row.id)}
            className="p-1 rounded hover:bg-gray-100"
            title="Ver detalles"
          >
            <Eye size={18} className="text-blue-500" />
          </button>

          {/* Editar: solo admin / almacén */}
          {canEdit && (
            <button
              onClick={() => handleEdit(row.id)}
              className="p-1 rounded hover:bg-gray-100"
              title="Editar"
            >
              <PencilLine size={18} className="text-green-500" />
            </button>
          )}
        </div>
      ),
      width: "120px",
      right: true,
    },
  ];

  const detailFields = [
    { key: "numeroSerie", label: "Número de Serie" },
    { key: "descripcion", label: "Descripción" },
    { key: "precio", label: "Precio", format: (v) => `${v} Bs` },
    { key: "categoriaId", label: "Categoría", format: getCategoriaNombre },
    { key: "modeloId", label: "Modelo", format: getModeloNombre },
    { key: "importacionId", label: "Importación", format: getImportacionCodigo },
    {
      key: "observado",
      label: "Observado",
      format: (v) =>
        v === 1 ? "No" : v === 2 ? "Sí" : v == null ? "—" : String(v),
    },
    {
      key: "obsDescripcion",
      label: "Detalle observación",
    },
    {
      key: "estado",
      label: "Estado",
      format: (v) =>
        v === 1 ? "Disponible" : v === 2 ? "Vendido" : "Inactivo",
    },
    {
      key: "fechaRegistro",
      label: "Fecha de Registro",
      format: (v) => (v ? new Date(v).toLocaleString() : ""),
    },
  ];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-semibold">Gestión de Productos</h2>

        {/* 🔴 YA NO HAY BOTÓN PARA AGREGAR PRODUCTO */}
        {/* {canCreate && (...)}  -> eliminado */}
      </div>

      <GridGenerico
        ref={gridRef}
        title="Productos"
        service={ServiceProducto}
        columns={columns}
        enableSearch
        pageSize={10}
      />

      {showForm && (
        <ProductoForm
          initialData={formData}
          onClose={() => setShowForm(false)}
          onSuccess={() => gridRef.current?.reload?.()}
        />
      )}

      <DetailsDialog
        open={Boolean(selectedId)}
        id={selectedId}
        fields={detailFields}
        fetchData={ServiceProducto.getById}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
};

export default ProductList;