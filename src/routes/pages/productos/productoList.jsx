import { useState, useEffect, useRef } from "react";
import { Eye, PencilLine, Plus } from "lucide-react";
import GridGenerico from "@/components/Grid";
import DetailsDialog from "@/components/details";
import ProductoForm from "./ProductoForm";
import ServiceProducto from "@/services/ServiceProducto";
import ServiceModeloProducto from "@/services/ServiceModeloProducto";
import ServiceCategoria from "@/services/ServiceCategoria";
import ServiceImportacion from "@/services/ServiceImportacion";
import { toast } from "react-toastify";

const ProductList = () => {
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(null);

  const [modelos, setModelos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [importaciones, setImportaciones] = useState([]);

  const gridRef = useRef(null);

  // cargar catálogos (1 sola vez)
  useEffect(() => {
    (async () => {
      // modelos
      try {
        const data = await ServiceModeloProducto.getAll();
        const list = Array.isArray(data) ? data : data?.items ? data.items : [];
        setModelos(list);
      } catch {
        setModelos([]);
      }

      // categorías
      try {
        const data = await ServiceCategoria.getAll();
        const list = Array.isArray(data) ? data : data?.items ? data.items : [];
        setCategorias(list);
      } catch {
        setCategorias([]);
      }

      // importaciones
      try {
        const data = await ServiceImportacion.getAll();
        const list = Array.isArray(data) ? data : data?.items ? data.items : [];
        setImportaciones(list);
      } catch {
        setImportaciones([]);
      }
    })();
  }, []);

  // helpers seguros
  const getModeloNombre = (id) => {
    if (!id) return "";
    const arr = Array.isArray(modelos) ? modelos : [];
    const found = arr.find((x) => x.id === id);
    return found ? found.nombreModelo : id;
  };

  const getCategoriaNombre = (id) => {
    if (!id) return "";
    const arr = Array.isArray(categorias) ? categorias : [];
    const found = arr.find((x) => x.id === id);
    // cambia "nombre" si tu backend manda "nombreCategoria"
    return found ? (found.nombre || found.nombreCategoria || id) : id;
  };

  const getImportacionCodigo = (id) => {
    if (!id) return "";
    const arr = Array.isArray(importaciones) ? importaciones : [];
    const found = arr.find((x) => x.id === id);
    // cambia "codigo" si tu backend manda "codigoImportacion" o "nroFactura"
    return found ? (found.codigo || found.codigoImportacion || id) : id;
  };

  // ver detalles
  const handleView = (id) => {
    setSelectedId(id);
  };

  // editar
  const handleEdit = async (id) => {
    try {
      const data = await ServiceProducto.getById(id);
      setFormData(data);
      setShowForm(true);
    } catch (error) {
      toast.error("Error al cargar datos para editar");
    }
  };

  const handleCreate = () => {
    setFormData(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    if (gridRef.current?.reload) {
      gridRef.current.reload();
    }
  };

  // columnas
  const columns = [
    { name: "N° Serie", selector: (row) => row.numeroSerie, sortable: true },
    { name: "Descripción", selector: (row) => row.descripcion, sortable: true },
    {
      name: "Precio",
      selector: (row) => `${row.precio} Bs`,
      sortable: true,
      right: true,
    },
    { name: "Color", selector: (row) => row.color },
    { name: "Garantía", selector: (row) => row.duracionGarantia },
    { name: "Tipo Garantía", selector: (row) => row.tipoGarantia },
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
        <div className="flex gap-2 items-center justify-end">
          <button
            type="button"
            onClick={() => handleView(row.id)}
            className="p-1 rounded hover:bg-gray-100"
            title="Ver detalles"
          >
            <Eye size={18} className="text-blue-500" />
          </button>
          <button
            type="button"
            onClick={() => handleEdit(row.id)}
            className="p-1 rounded hover:bg-gray-100"
            title="Editar"
          >
            <PencilLine size={18} className="text-green-500" />
          </button>
        </div>
      ),
      width: "110px",
      right: true,
    },
  ];

  // fields para el dialog
  const detailFields = [
    { key: "numeroSerie", label: "Número de Serie" },
    { key: "descripcion", label: "Descripción" },
    { key: "precio", label: "Precio", format: (v) => `${v} Bs` },
    { key: "color", label: "Color" },
    { key: "duracionGarantia", label: "Duración de Garantía" },
    { key: "tipoGarantia", label: "Tipo de Garantía" },
    {
      key: "categoriaId",
      label: "Categoría",
      format: (v) => getCategoriaNombre(v),
    },
    {
      key: "modeloId",
      label: "Modelo",
      format: (v) => getModeloNombre(v),
    },
    {
      key: "importacionId",
      label: "Importación",
      format: (v) => getImportacionCodigo(v),
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
        <h2 className="text-xl font-semibold">Listado de Productos</h2>
        
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
          onClose={handleCloseForm}
          onSuccess={handleCloseForm}
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
