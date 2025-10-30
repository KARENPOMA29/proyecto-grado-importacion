// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "./routes/loginauth/loginauth";

// Dashboards por rol (usa tus archivos creados con MUI)
import AdminDashboard from "@/routes/pages/dashboards/AdminDashboard";
import VentasDashboard from "@/routes/pages/dashboards/VentasDashboard";
import AlmacenDashboard from "@/routes/pages/dashboards/AlmacenDashboard";
import PilotoDashboard from "@/routes/pages/dashboards/PilotoDashboard";

// Página simple para “no autorizado”
const Unauthorized = () => <div style={{ padding: 24 }}>No tiene permisos para ver esta página</div>;

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Rutas protegidas por rol */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={["Administrador"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/ventas/*"
            element={
              <ProtectedRoute allowedRoles={["Ventas", "Administrador"]}>
                <VentasDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/almacen/*"
            element={
              <ProtectedRoute allowedRoles={["Almacen", "Administrador"]}>
                <AlmacenDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/pilotero/*"
            element={
              <ProtectedRoute allowedRoles={["Pilotero", "Administrador"]}>
                <PilotoDashboard />
              </ProtectedRoute>
            }
          />

          {/* Redirecciones y 404 básico */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/unauthorized" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
