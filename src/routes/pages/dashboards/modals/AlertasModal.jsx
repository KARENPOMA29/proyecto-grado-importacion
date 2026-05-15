// src/routes/pages/dashboards/modals/AlertasModal.jsx

import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
} from "@mui/material";

import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";

const BRAND = {
  red: "#a4193d",
  dark: "#1f2329",
  white: "#ffffff",
  gray: "#7f7f7f",
};

const COLORS = {
  primary: [164, 25, 61],
  dark: [31, 35, 41],
};

const rgba = (rgb, alpha = 1) =>
  `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;

export default function AlertasModal({
  open,
  onClose,
  alertas,
  onMarcarLeida,
  onMarcarTodas,
  loading,
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          background: `linear-gradient(135deg, ${BRAND.dark} 0%, ${BRAND.red} 100%)`,
          color: BRAND.white,
          fontWeight: 900,
          fontSize: 18,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <NotificationsActiveOutlinedIcon />
          Alertas de Importación ({alertas.length})
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {alertas.length === 0 ? (
          <Box sx={{ py: 4, textAlign: "center", color: BRAND.gray }}>
            <NotificationsActiveOutlinedIcon
              sx={{
                fontSize: 50,
                mb: 1,
                opacity: 0.4,
              }}
            />

            <Typography variant="body2">
              {loading
                ? "Cargando alertas..."
                : "No hay alertas de importación"}
            </Typography>
          </Box>
        ) : (
          <List dense sx={{ mt: 1 }}>
            {alertas.map((alerta, index) => {
              const fechaFormato = alerta.fecha
                ? new Date(alerta.fecha).toLocaleString("es-BO", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Sin fecha";

              return (
                <React.Fragment key={alerta.id}>
                  <ListItem
                    alignItems="flex-start"
                    sx={{
                      mb: 1.2,
                      px: 1.5,
                      py: 1.5,
                      borderRadius: 3,
                      bgcolor: rgba(COLORS.primary, 0.04),
                      border: `1px solid ${rgba(COLORS.primary, 0.12)}`,
                      transition: "all .2s ease",

                      "&:hover": {
                        transform: "translateY(-2px)",
                        bgcolor: rgba(COLORS.primary, 0.06),
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 38 }}>
                      <NotificationsActiveOutlinedIcon
                        sx={{
                          color: BRAND.red,
                          bgcolor: rgba(COLORS.primary, 0.08),
                          p: 0.6,
                          borderRadius: 2,
                          fontSize: 28,
                        }}
                      />
                    </ListItemIcon>

                    <ListItemText
                      primary={
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            color: BRAND.dark,
                            lineHeight: 1.4,
                          }}
                        >
                          {alerta.mensaje}
                        </Typography>
                      }
                      secondary={
                        <Box
                          sx={{
                            mt: 1,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: 1,
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              color: BRAND.gray,
                            }}
                          >
                            {fechaFormato}
                          </Typography>

                          <Button
                            size="small"
                            variant="contained"
                            onClick={() =>
                              onMarcarLeida(alerta.id)
                            }
                            sx={{
                              bgcolor: BRAND.red,
                              color: BRAND.white,
                              textTransform: "none",
                              borderRadius: 2,
                              fontWeight: 700,
                              boxShadow: "none",

                              "&:hover": {
                                bgcolor: "#8c1634",
                                boxShadow: "none",
                              },
                            }}
                          >
                            Marcar leída
                          </Button>
                        </Box>
                      }
                    />
                  </ListItem>

                  {index < alertas.length - 1 && (
                    <Divider sx={{ my: 0.7 }} />
                  )}
                </React.Fragment>
              );
            })}
          </List>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1.5 }}>
        <Button
          onClick={onClose}
          sx={{
            color: BRAND.gray,
            textTransform: "none",
            fontWeight: 700,
          }}
        >
          Cerrar
        </Button>

        {alertas.length > 0 && (
          <Button
            variant="outlined"
            onClick={onMarcarTodas}
            sx={{
              borderColor: BRAND.red,
              color: BRAND.red,
              fontWeight: 700,
              textTransform: "none",

              "&:hover": {
                borderColor: BRAND.red,
                bgcolor: rgba(COLORS.primary, 0.05),
              },
            }}
          >
            Marcar todas
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}