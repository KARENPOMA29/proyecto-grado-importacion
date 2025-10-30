import { Trash2 } from "lucide-react";
import { Card } from "./cards";

const EliminatePopUp = ({onClose}) => {
    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                {/* Modal */}
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose} />
                <Card closeCard={onClose}>
                    <div className="flex flex-col items-center justify-center p-4">
                        <Trash2 size={48} className="text-red-500 mb-4" />
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                            ¿Estás seguro de que quieres eliminar este elemento?
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Esta acción no se puede deshacer.
                        </p>
                        <div className="flex space-x-4">
                            <button
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                                onClick={() => console.log("Eliminar")}
                            >
                                Eliminar
                            </button>
                            <button
                                className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white rounded hover:bg-gray-400 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                onClick={() => console.log("Cancelar")}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}

export default EliminatePopUp