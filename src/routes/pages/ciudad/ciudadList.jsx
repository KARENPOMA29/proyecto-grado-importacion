import { useState, useEffect } from "react";
import { PencilLine, Trash } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";
import ServiceCiudad from "@/services/ServiceCiudad";
import CiudadForm from "./CiudadForm";
import DeleteConfirm from "@/components/deleteConfirm";

const CiudadList = () => {
  const [ciudades, setCiudades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(null);
  const [idToDelete, setIdToDelete] = useState(null);

  const { user } = useAuth();
  const roleKey = (user?.rol || "").trim().toLowerCase();

  const canCreate = roleKey === "administrador";
  const canEdit = roleKey === "administrador";
  const canDelete = roleKey === "administrador";

  const fetchCiudades = async () => {
    try {
      setLoading(true);
      const res = await ServiceCiudad.getAll();
      setCiudades(res.items || []);
    } catch (err) {
      console.error("Error cargando ciudades:", err);
      toast.error(err.message || "Error al cargar ciudades");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCiudades();
  }, []);

  const handleDelete = async () => {
    try {
      await ServiceCiudad.remove(idToDelete);
      toast.success("Ciudad eliminada correctamente");
      setIdToDelete(null);
      fetchCiudades();
      return Promise.resolve();
    } catch (err) {
      console.error("Error eliminando ciudad:", err);
      throw err;
    }
  };

  const handleEdit = (ciudad) => {
    setFormData(ciudad);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    fetchCiudades();
  };

  return (
    <div className="flex flex-col gap-y-6 p-4 sm:p-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Gestión de Ciudades
        </h1>

        {canCreate && (
          <button
            onClick={() => {
              setFormData(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium"
          >
            <PencilLine size={18} />
            Nueva Ciudad
          </button>
        )}
      </div>

      {loading && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Cargando ciudades...
        </p>
      )}

      {!loading && ciudades.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No hay ciudades registradas.
        </p>
      )}

      {!loading && ciudades.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ciudades.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white shadow-sm px-4 py-3 dark:bg-slate-900 dark:border-slate-700"
            >
              <span className="text-base font-medium text-gray-900 dark:text-white">
                {c.nombre}
              </span>

              <div className="flex gap-x-1">
                {canEdit && (
                  <button
                    className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors duration-200"
                    onClick={() => handleEdit(c)}
                    title="Editar"
                  >
                    <PencilLine size={16} />
                  </button>
                )}

                {canDelete && (
                  <button
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                    onClick={() => setIdToDelete(c.id)}
                    title="Eliminar"
                  >
                    <Trash size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal formulario */}
      {showForm && (
        <CiudadForm
          initialData={formData}
          onClose={() => setShowForm(false)}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Confirm eliminar */}
      {idToDelete && canDelete && (
        <DeleteConfirm
          title="¿Eliminar ciudad?"
          message="Esta acción eliminará la ciudad definitivamente y no se podrá deshacer."
          onConfirm={handleDelete}
          onCancel={() => setIdToDelete(null)}
        />
      )}
    </div>
  );
};

export default CiudadList;
