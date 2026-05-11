import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  Button,
  CircularProgress,
  Typography,
  Box,
  Divider,
  Chip,
} from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

export default function DetailsDialog({
  open,
  id,
  fields,
  fetchData,
  onClose,
}) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const getImageSrc = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;

    const base =
      import.meta.env.VITE_FILES_URL || import.meta.env.VITE_API_URL || "";

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
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth={data?.urlImagen ? "md" : "sm"}
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: "hidden",
          boxShadow: "0 12px 36px rgba(0,0,0,0.18)",
        },
      }}
    >
      <DialogTitle
        sx={{
          background: "linear-gradient(135deg, #592B2B 0%, #3A1A1A 100%)",
          color: "white",
          px: 3,
          py: 2.5,
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <VisibilityOutlinedIcon />
          <Box>
            <Typography component="div" variant="h6" fontWeight={700}>
              Detalles
            </Typography>
            <Typography component="div" variant="body2" sx={{ opacity: 0.85 }}>
              Información registrada del elemento seleccionado
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ bgcolor: "#FAFAFA", px: 3, py: 3 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={6}>
            <CircularProgress size={30} sx={{ color: "#592B2B" }} />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : data ? (
          <Box
            sx={{
              bgcolor: "#FFFFFF",
              borderRadius: 3,
              p: 2.5,
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: {
                  xs: "column",
                  md: data.urlImagen ? "row" : "column",
                },
                gap: 3,
                alignItems: data.urlImagen ? "flex-start" : "stretch",
              }}
            >
              {data.urlImagen && (
                <Box
                  sx={{
                    width: { xs: "100%", md: 270 },
                    flexShrink: 0,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <Box
                    component="img"
                    src={getImageSrc(data.urlImagen)}
                    alt={data.nombre || "Imagen"}
                    sx={{
                      width: { xs: "100%", sm: 250 },
                      height: 270,
                      objectFit: "cover",
                      borderRadius: 3,
                      border: "4px solid #F1E5E5",
                      boxShadow: "0 8px 22px rgba(0,0,0,0.16)",
                      bgcolor: "#F8F2F2",
                    }}
                  />
                </Box>
              )}

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <List disablePadding>
                  {fields.map((f, index) => {
                    if (f.key === "urlImagen" && data.urlImagen) return null;

                    const value = data[f.key];

                    return (
                      <React.Fragment key={f.key}>
                        <ListItem sx={{ px: 0, py: 1.5, alignItems: "flex-start" }}>
                          <Box sx={{ width: "100%" }}>
                            <Typography
                              variant="body2"
                              sx={{
                                color: "#592B2B",
                                fontWeight: 700,
                                mb: 0.5,
                              }}
                            >
                              {f.label}
                            </Typography>

                            {f.key === "estado" ? (
                              <Chip
                                label={f.format ? f.format(value) : value}
                                size="small"
                                sx={{
                                  mt: 0.5,
                                  bgcolor: value === 1 ? "#E8F5E9" : "#FFEBEE",
                                  color: value === 1 ? "#2E7D32" : "#C62828",
                                  fontWeight: 600,
                                }}
                              />
                            ) : (
                              <Typography variant="body1" sx={{ color: "#444" }}>
                                {f.format ? f.format(value) : value || "—"}
                              </Typography>
                            )}
                          </Box>
                        </ListItem>

                        {index !== fields.length - 1 && <Divider />}
                      </React.Fragment>
                    );
                  })}
                </List>
              </Box>
            </Box>
          </Box>
        ) : (
          <Typography>No hay datos disponibles</Typography>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          bgcolor: "#FAFAFA",
          borderTop: "1px solid #E0E0E0",
        }}
      >
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            textTransform: "none",
            borderRadius: 999,
            px: 4,
            fontWeight: 600,
            background: "linear-gradient(135deg, #592B2B 0%, #3A1A1A 100%)",
            "&:hover": {
              background: "linear-gradient(135deg, #3A1A1A 0%, #592B2B 100%)",
            },
          }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}