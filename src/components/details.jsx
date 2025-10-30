import * as React from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  List, ListItem, ListItemText, Button, CircularProgress
} from "@mui/material";

export default function DetailsDialog({ open, id, fields, fetchData, onClose }) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let mounted = true;
    if (!open || !id || !fetchData) return;
    setLoading(true);
    fetchData(id)
      .then((res) => mounted && (setData(res), setLoading(false)))
      .catch((err) => {
        console.error(err);
        if (mounted) { setError("Error al cargar los datos"); setLoading(false); }
      });
    return () => { mounted = false; };
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
          <List dense>
            {fields.map((f) => (
              <ListItem key={f.key} divider>
                <ListItemText
                  primary={f.label}
                  secondary={f.format ? f.format(data[f.key]) : data[f.key]}
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
              </ListItem>
            ))}
          </List>
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
