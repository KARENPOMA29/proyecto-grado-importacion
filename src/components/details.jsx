import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Button,
  CircularProgress,
} from "@mui/material";

export default function DetailsDialog({ open, id, fields, fetchData, onClose }) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  // 👇 Base URL del backend (ajusta si usas otra variable)
  const baseUrl = import.meta.env.VITE_API_URL || "";
  // arriba del componente (o importas el mismo helper)
  const getImageSrc = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const base =
      import.meta.env.VITE_FILES_URL ||
      import.meta.env.VITE_API_URL ||
      "";
    const baseClean = base.endsWith("/") ? base.slice(0, -1) : base;
    const pathClean = url.startsWith("/") ? url : `/${url}`;
    return `${baseClean}${pathClean}`;
  };

  React.useEffect(() => {
    let mounted = true;
    if (!open || !id || !fetchData) return;
    setLoading(true);
    setError("");
    setData(null);

    fetchData(id)
      .then((res) => {
        if (mounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(err);
        if (mounted) {
          setError("Error al cargar los datos");
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [open, id, fetchData]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Detalles</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
            <CircularProgress size={28} />
          </div>
        ) : error ? (
          <div style={{ color: "#d32f2f" }}>{error}</div>
        ) : data ? (
          <>
            {/* 👇 Vista previa de imagen si existe urlImagen */}
            {data.urlImagen && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <img
                  src={getImageSrc(data.urlImagen)}
                  alt={data.nombre || "Imagen"}
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid #ddd",
                  }}
                />
              </div>
            )}


            <List dense>
              {fields.map((f) => {
                // ❌ No mostrar urlImagen como texto si ya estamos mostrando la imagen
                if (f.key === "urlImagen" && data.urlImagen) return null;

                const value = data[f.key];

                return (
                  <ListItem key={f.key} divider>
                    <ListItemText
                      primary={f.label}
                      secondary={f.format ? f.format(value) : value}
                      primaryTypographyProps={{ fontWeight: 600 }}
                    />
                  </ListItem>
                );
              })}
            </List>
          </>
        ) : (
          <div>No hay datos</div>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
