import { useEffect, useState } from "react";

function App() {
  const [mensaje, setMensaje] = useState("");
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetch(`${API_URL}/`)
      .then((res) => res.json())
      .then((data) => setMensaje(data.mensaje))
      .catch((err) => console.error("Error al conectar con backend:", err));
  }, [API_URL]);

  return (
    <div>
      <h1>Frontend con React + Vite</h1>
      <p>{mensaje}</p>
    </div>
  );
}

export default App;
