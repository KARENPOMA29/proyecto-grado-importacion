import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";

const CreateButton = ({ to, text = "Crear", className = "" }) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(to)}
      className={`flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition ${className}`}
    >
      <Plus size={18} />
      {text}
    </button>
  );
};

export default CreateButton;
