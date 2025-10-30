import { useEffect, useMemo, useRef, useState } from "react";
import { PencilLine, Trash, Eye } from "lucide-react";
import GridGenerico from "@/components/Grid";
import DeleteConfirm from "@/components/deleteConfirm";
import DetailsDialog from "@/components/details"; // 👈 usamos DetailsDialog (el que recibe id + fetchData)
import SeccionForm from "./seccionForm";
import { toast } from "react-toastify";

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
  const [selectedId, setSelectedId] = useState(null);     // 👈 ID para DetailsDialog
  const [idToDelete, setIdToDelete] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(null);

  const [almacenes, setAlmacenes] = useState([]);
  const [modelos, setModelos] = useState([]);

  const gridRef = useRef(null);

  // Cargar catálogos (almacenes y modelos)
  useEffect(() => {
    (async () => {
      try {
        const almRes = await ServiceAlmacen.getAll();
        const almList = Array.isArray(almRes) ? almRes : (almRes.items ?? []);
        setAlmacenes(almList);

        const modRes = await ServiceModeloProducto.getAll();
        const modListRaw = Array.isArray(modRes) ? modRes : (modRes.items ?? []);
        // Normaliza cada modelo con _nombre
        const modList = modListRaw.map((m) => ({ ...m, _nombre: resolveModelName(m) }));
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

  // Columnas para react-data-table-component
  const columns = [
    { name: "Almacén", selector: (r) => almacenMap[r.almacenId] ?? "—", sortable: true, minWidth: "180px" },
    { name: "Modelo", selector: (r) => modeloMap[r.modeloId] ?? "—", sortable: true, minWidth: "180px" },
    { name: "Descripción", selector: (r) => r.descripcion ?? "—", sortable: true, minWidth: "240px", grow: 2 },
    {
      name: "Registrado",
      selector: (r) => (r.fechaRegistro ? new Date(r.fechaRegistro).toLocaleString() : "—"),
      sortable: true,
      minWidth: "200px",
    },
  ];

  // Campos para DetailsDialog (usa 'key' + 'format')
  const detailsFields = [
    { label: "Almacén", key: "almacenId", format: (v) => almacenMap[v] ?? "—" },
    { label: "Modelo",  key: "modeloId",  format: (v) => modeloMap[v]  ?? "—" },
    { label: "Descripción", key: "descripcion" },
    { label: "Fecha Registro", key: "fechaRegistro", format: (v) => (v ? new Date(v).toLocaleString() : "—") },
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
    <div className="flex flex-col gap-y-6 p-4 sm:p-6">
      {/* Header al estilo Sucursal/Almacén */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Gestión de Secciones
        </h1>

        <button
          onClick={() => {
            setFormData(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 font-medium"
        >
          <PencilLine size={18} />
          Nueva Sección
        </button>
      </div>

      {/* GridGenerico con service (como en las otras pantallas) */}
      <GridGenerico
        ref={gridRef}
        service={ServiceSeccion}
        columns={columns}
        title="Secciones"
        defaultSortField="fechaRegistro"
        defaultSortAsc={false}
        pageSize={10}
        renderActions={(row) => (
          <div className="flex gap-x-2 justify-end">
            <button
              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors duration-200"
              onClick={() => setSelectedId(row.id)}   // 👈 solo pasamos el ID
              title="Ver detalles"
            >
              <Eye size={16} />
            </button>

            <>
              <button
                className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors duration-200"
                onClick={() => handleEdit(row.id)}
                title="Editar"
              >
                <PencilLine size={16} />
              </button>

              <button
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duración-200"
                onClick={() => setIdToDelete(row.id)}
                title="Eliminar"
              >
                <Trash size={16} />
              </button>
            </>
          </div>
        )}
      />

      {/* DetailsDialog (id + fetchData + fields con 'key') */}
      <DetailsDialog
        open={!!selectedId}
        id={selectedId}
        fetchData={ServiceSeccion.getById}
        fields={detailsFields}
        onClose={() => setSelectedId(null)}
        title="Detalles de la Sección"
      />

      {/* Confirmar eliminar (condicional) */}
      {idToDelete && (
        <DeleteConfirm
          title="¿Eliminar sección?"
          message="Esta acción eliminará la sección permanentemente y no se podrá deshacer."
          onConfirm={handleDelete}
          onCancel={() => setIdToDelete(null)}
        />
      )}

      {/* Formulario (mismo estilo MUI que Sucursal/Almacén) */}
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
    </div>
  );
};

export default SeccionList;
