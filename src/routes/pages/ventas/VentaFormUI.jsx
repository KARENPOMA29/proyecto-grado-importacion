import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  TextField,
  Typography,
  Autocomplete,
} from "@mui/material";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  ChevronRight,
  Package,
  ShoppingCart,
  Store,
  Trash2,
  User,
} from "lucide-react";

export const brand = {
  900: "#2A0F0F",
  800: "#3A1A1A",
  700: "#4A1F1F",
  600: "#592B2B",
  500: "#7A3B3B",
  400: "#9B5555",
  300: "#B97878",
  200: "#E7CACA",
  100: "#F5EAEA",
  50: "#FDF8F8",
};

export const MotionCard = Card;

export const sxCard = {
  borderRadius: 4,
  border: "1px solid #EEE5E5",
  bgcolor: "#FFFFFF",
  boxShadow: "0 8px 26px rgba(89,43,43,0.07)",
  transition: "box-shadow .2s ease, transform .2s ease",
  "&:hover": {
    boxShadow: "0 12px 34px rgba(89,43,43,0.11)",
  },
};

export const sxSectionTitle = {
  fontWeight: 900,
  fontSize: 15.5,
  color: brand[800],
  display: "flex",
  alignItems: "center",
  gap: 1,
};

export const sxLabel = {
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "#9CA3AF",
  mb: 0.55,
};

export const comboSx = {
  "& .MuiOutlinedInput-root": {
    minHeight: 50,
    borderRadius: "16px",
    backgroundColor: "#fff",
    fontSize: 14,
    transition: "all .2s ease",
    boxShadow: "0 4px 14px rgba(42,15,15,.04)",

    "& fieldset": {
      borderColor: "#E7D8D8",
    },

    "&:hover": {
      transform: "translateY(-1px)",
    },

    "&:hover fieldset": {
      borderColor: brand[400],
    },

    "&.Mui-focused": {
      backgroundColor: "#fff",
      boxShadow: "0 0 0 5px rgba(122,59,59,.12)",
    },

    "&.Mui-focused fieldset": {
      borderColor: brand[500],
      borderWidth: "1px",
    },
  },

  "& .MuiAutocomplete-input": {
    fontWeight: 700,
  },

  "& .MuiAutocomplete-popupIndicator": {
    color: brand[500],
  },
};

export const readonlyInputSx = {
  "& .MuiOutlinedInput-root": {
    minHeight: 50,
    borderRadius: "16px",
    backgroundColor: "#FAFAFA",
    fontSize: 14,
    "& fieldset": {
      borderColor: "#E5E7EB",
    },
  },
};

export const Badge = ({ children, color = brand[600] }) => (
  <Box
    component="span"
    sx={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      px: 1.2,
      py: 0.35,
      borderRadius: 99,
      bgcolor: `${color}18`,
      color,
      fontSize: 11,
      fontWeight: 900,
      letterSpacing: "0.04em",
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </Box>
);

const InfoTile = ({ label, value, icon: Icon }) => (
  <Box
    sx={{
      p: 1.55,
      borderRadius: 3,
      bgcolor: "#FAFAFA",
      border: "1px solid #F0F0F0",
      display: "flex",
      gap: 1.2,
      alignItems: "flex-start",
      minWidth: 0,
    }}
  >
    {Icon && (
      <Box
        sx={{
          mt: 0.2,
          width: 30,
          height: 30,
          borderRadius: 2,
          bgcolor: brand[100],
          color: brand[600],
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={15} />
      </Box>
    )}

    <Box sx={{ minWidth: 0 }}>
      <Typography sx={sxLabel}>{label}</Typography>

      <Typography
        sx={{
          fontWeight: 800,
          color: "#111827",
          fontSize: 13.5,
          lineHeight: 1.3,
        }}
        noWrap
      >
        {value || "—"}
      </Typography>
    </Box>
  </Box>
);

export const ProductRow = ({
  d,
  idx,
  activeDetalle,
  productos,
  detalles,
  loadingData,
  submitted,
  productoInputRef,
  setActiveDetalle,
  setDetalles,
  removeDetalle,
}) => {
  const productosDisponibles = productos.filter(
    (p) =>
      !detalles.some(
        (det, i) => i !== idx && Number(det.productoId) === Number(p.id)
      )
  );

  const prodSeleccionado =
    productos.find((p) => Number(p.id) === Number(d.productoId)) || null;

  const precioBase = Number(
    prodSeleccionado?.precioOrigen ?? prodSeleccionado?.precio ?? 0
  );

  const precioLista = Number(prodSeleccionado?.precio ?? 0);
  const precioActual = Number(d.subtotal || 0);

  const esCero = prodSeleccionado && precioActual === 0;
  const esNegativo = prodSeleccionado && precioActual < 0;
  const esMenorOIgualBase =
    prodSeleccionado && precioActual > 0 && precioActual <= precioBase;
  const maxRazonable = precioBase > 0 ? precioBase * 10 : 100000;
  const esDemasiadoAlto = prodSeleccionado && precioActual > maxRazonable;

  const mostrarErrorPrecio =
    esCero || esNegativo || esMenorOIgualBase || esDemasiadoAlto;

  const isActive = idx === activeDetalle;

  const handlePrecioChange = (value) => {
    const num = Number(value);

    setDetalles((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, subtotal: isNaN(num) ? 0 : num } : item
      )
    );
  };

  const handlePrecioBlur = () => {
    setDetalles((prev) => {
      const copy = [...prev];
      const det = copy[idx];

      if (!det?.productoId) return prev;

      const prod = productos.find(
        (p) => Number(p.id) === Number(det.productoId)
      );

      if (!prod) return prev;

      const base = Number(prod.precioOrigen ?? prod.precio ?? 0);
      let valor = Number(det.subtotal);

      if (!valor || valor <= 0) {
        toast.warn(`Ajustado al mínimo Bs ${(base + 0.01).toFixed(2)}`);
        valor = base + 0.01;
      }

      if (valor <= base) {
        toast.warn(`Debe superar el precio origen (Bs ${base.toFixed(2)})`);
        valor = base + 0.01;
      }

      const max = base > 0 ? base * 10 : 100000;

      if (valor > max) {
        toast.warn(`Ajustado al máximo Bs ${max.toFixed(2)}`);
        valor = max;
      }

      copy[idx] = { ...det, subtotal: valor };
      return copy;
    });
  };

  const renderProductoOption = (props, option) => {
    const { key, ...optionProps } = props;

    return (
      <Box
        component="li"
        key={key}
        {...optionProps}
        sx={{
          py: 1.1,
          px: 1.5,
          display: "flex",
          alignItems: "center",
          gap: 1.4,
        }}
      >
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 2,
            bgcolor: brand[100],
            color: brand[600],
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Package size={16} />
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{ fontWeight: 900, fontSize: 13.5, color: "#1F2937" }}
            noWrap
          >
            {option.descripcion || option.numeroSerie || "Producto"}
          </Typography>

          <Typography sx={{ fontSize: 12, color: "#6B7280" }} noWrap>
            S/N: {option.numeroSerie || "—"} · Bs{" "}
            {Number(option.precio || 0).toFixed(2)}
          </Typography>
        </Box>
      </Box>
    );
  };

  const nombreProducto =
    prodSeleccionado?.descripcion ||
    prodSeleccionado?.numeroSerie ||
    "Producto sin seleccionar";

  return (
    <Box
      component={motion.div}
      sx={{
        borderRadius: 4,
        border: "1px solid",
        borderColor: isActive ? brand[400] : "#EEE5E5",
        bgcolor: isActive ? brand[50] : "#FAFAFA",
        transition: "all .18s ease",
        overflow: "hidden",
        boxShadow: isActive ? `0 0 0 4px ${brand[100]}` : "none",
      }}
    >
      <Box
        sx={{
          px: { xs: 1.5, md: 2 },
          py: 1.1,
          bgcolor: isActive ? brand[100] : "#F5F5F5",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          borderBottom: "1px solid",
          borderColor: isActive ? "#F1DADA" : "#EBEBEB",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              bgcolor: isActive ? brand[600] : "#C9C9C9",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 900,
              flexShrink: 0,
            }}
          >
            {idx + 1}
          </Box>

          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 900,
              color: isActive ? brand[700] : "#666",
            }}
            noWrap
          >
            {nombreProducto}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {prodSeleccionado && (
            <Badge>{`Bs ${Number(d.subtotal || 0).toFixed(2)}`}</Badge>
          )}

          {detalles.length > 1 && (
            <IconButton
              size="small"
              onClick={() => removeDetalle(idx)}
              sx={{
                color: "#DC2626",
                width: 30,
                height: 30,
                borderRadius: 2,
                "&:hover": { bgcolor: "#FEE2E2" },
              }}
            >
              <Trash2 size={15} />
            </IconButton>
          )}
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ p: { xs: 1.5, md: 2 } }}>
        <Grid size={{ xs: 12, md: 4.4 }}>
          <Typography sx={sxLabel}>Producto</Typography>

          <Autocomplete
            options={productosDisponibles}
            getOptionLabel={(p) => {
              if (!p) return "";

              const serie = p.numeroSerie || "Sin serie";
              const desc = p.descripcion || p.nombreModelo || "Producto";
              const precio = Number(p.precio || 0).toFixed(2);

              return `${serie} · ${desc} · Bs ${precio}`;
            }}
            value={prodSeleccionado}
            onChange={(_, val) => {
              setDetalles((prev) =>
                prev.map((item, i) =>
                  i === idx
                    ? val
                      ? {
                          ...item,
                          productoId: val.id,
                          subtotal: Number(val.precio ?? val.precioOrigen ?? 0),
                        }
                      : {
                          ...item,
                          productoId: "",
                          subtotal: 0,
                        }
                    : item
                )
              );
            }}
            onFocus={() => setActiveDetalle(idx)}
            isOptionEqualToValue={(opt, val) =>
              Number(opt.id) === Number(val.id)
            }
            renderOption={renderProductoOption}
            renderInput={(params) => (
              <TextField
                {...params}
                inputRef={isActive ? productoInputRef : null}
                placeholder={loadingData ? "Cargando..." : "Buscar producto..."}
                size="small"
                error={submitted && !d.productoId}
                helperText={submitted && !d.productoId ? "Requerido" : ""}
                fullWidth
                sx={comboSx}
              />
            )}
            loading={loadingData}
            loadingText="Cargando productos..."
            noOptionsText={
              productosDisponibles.length === 0
                ? "Sin productos disponibles"
                : "Sin coincidencias"
            }
            fullWidth
          />
        </Grid>

        <Grid size={{ xs: 12, md: 5.4 }}>
          {prodSeleccionado ? (
            <Box
              sx={{
                height: "100%",
                borderRadius: 3,
                border: `1px solid ${brand[100]}`,
                bgcolor: "#FFF",
                p: 1.5,
                boxShadow: "0 4px 12px rgba(89,43,43,0.04)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 1,
                  mb: 0.8,
                }}
              >
                <Typography
                  sx={{ fontWeight: 900, fontSize: 13.5, color: brand[800] }}
                  noWrap
                >
                  {prodSeleccionado.descripcion ||
                    prodSeleccionado.numeroSerie ||
                    "Producto"}
                </Typography>

                <Chip
                  label={`S/N: ${prodSeleccionado.numeroSerie || "N/A"}`}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: 10.5,
                    bgcolor: brand[100],
                    color: brand[600],
                    fontWeight: 900,
                    flexShrink: 0,
                  }}
                />
              </Box>

              <Divider sx={{ my: 1, borderColor: brand[100] }} />

              <Grid container spacing={0.8}>
                {[
                  [
                    "Modelo",
                    prodSeleccionado.nombreModelo ||
                      prodSeleccionado.modeloNombre ||
                      prodSeleccionado.modelo?.nombreModelo,
                  ],
                  [
                    "Color",
                    prodSeleccionado.color || prodSeleccionado.modelo?.color,
                  ],
                ].map(([k, v]) => (
                  <Grid size={{ xs: 6, sm: 4 }} key={k}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#9CA3AF",
                        display: "block",
                        lineHeight: 1.2,
                      }}
                    >
                      {k}
                    </Typography>

                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 900,
                        color: "#374151",
                        display: "block",
                      }}
                      noWrap
                    >
                      {v || "N/A"}
                    </Typography>
                  </Grid>
                ))}
              </Grid>

              <Box
                sx={{
                  mt: 1.1,
                  display: "flex",
                  gap: 1.5,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: 11, color: "#9CA3AF" }}>
                    Precio origen
                  </Typography>

                  <Typography
                    sx={{ fontSize: 13, fontWeight: 900, color: "#374151" }}
                  >
                    Bs {precioBase.toFixed(2)}
                  </Typography>
                </Box>

                <ChevronRight size={14} color="#CBD5E1" />

                <Box>
                  <Typography sx={{ fontSize: 11, color: "#9CA3AF" }}>
                    Precio lista
                  </Typography>

                  <Typography
                    sx={{ fontSize: 13, fontWeight: 900, color: brand[500] }}
                  >
                    Bs {precioLista.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          ) : (
            <Box
              sx={{
                height: "100%",
                minHeight: 104,
                border: "1.5px dashed #DDD",
                borderRadius: 3,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.7,
                color: "#BDBDBD",
                bgcolor: "#FFF",
              }}
            >
              <Package size={22} />
              <Typography variant="caption">Selecciona un producto</Typography>
            </Box>
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 2.2 }}>
          <Typography sx={sxLabel}>Precio (Bs)</Typography>

          <TextField
            fullWidth
            size="small"
            type="number"
            value={
              d.subtotal === 0 || d.subtotal === ""
                ? ""
                : Number(d.subtotal).toString()
            }
            onChange={(e) => handlePrecioChange(e.target.value)}
            onBlur={handlePrecioBlur}
            error={Boolean(mostrarErrorPrecio)}
            helperText={
              !prodSeleccionado
                ? ""
                : esCero
                ? "No puede ser 0"
                : esNegativo
                ? "No puede ser negativo"
                : esMenorOIgualBase
                ? `> Bs ${precioBase.toFixed(2)}`
                : esDemasiadoAlto
                ? "Precio muy alto"
                : `Base: Bs ${precioBase.toFixed(2)}`
            }
            slotProps={{
              htmlInput: {
                min: 1,
                max: maxRazonable,
                step: "0.01",
              },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                minHeight: 50,
                borderRadius: "16px",
                backgroundColor: "#fff",
                fontSize: 14,
                fontWeight: 900,
                "& fieldset": {
                  borderColor: mostrarErrorPrecio ? "#EF4444" : "#E8DADA",
                },
                "&:hover fieldset": {
                  borderColor: mostrarErrorPrecio ? "#EF4444" : brand[400],
                },
                "&.Mui-focused": {
                  boxShadow: mostrarErrorPrecio
                    ? "0 0 0 4px rgba(239,68,68,.12)"
                    : "0 0 0 4px rgba(122,59,59,.12)",
                },
                "&.Mui-focused fieldset": {
                  borderColor: mostrarErrorPrecio ? "#EF4444" : brand[500],
                },
              },
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export const VentaResumen = ({
  sucursalActual,
  clienteSeleccionado,
  detallesResumen,
  total,
}) => {
  return (
    <MotionCard
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.28, delay: 0.08 }}
      sx={{
        ...sxCard,
        position: { lg: "sticky" },
        top: { lg: 16 },
        border: `1px solid ${brand[100]}`,
        overflow: "hidden",
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.6,
              background: `linear-gradient(135deg, ${brand[700]} 0%, ${brand[900]} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              boxShadow: `0 8px 18px ${brand[600]}40`,
              flexShrink: 0,
            }}
          >
            <ShoppingCart size={21} />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{ fontWeight: 900, color: "#1F2937", fontSize: 15.5 }}
            >
              Resumen
            </Typography>

            <Typography variant="caption" color="text.secondary">
              Actualizado automáticamente
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "grid", gap: 1, mb: 2 }}>
          <InfoTile
            icon={Store}
            label="Sucursal"
            value={sucursalActual?.nombre}
          />

          <InfoTile
            icon={User}
            label="Cliente"
            value={clienteSeleccionado?.razonSocial}
          />
        </Box>

        <Divider sx={{ my: 2, borderColor: "#EEE5E5" }} />

        <Typography sx={{ ...sxLabel, mb: 1.2 }}>
          Productos ({detallesResumen.length})
        </Typography>

        {detallesResumen.length ? (
          <Box
            sx={{
              maxHeight: { xs: 220, lg: 280 },
              overflowY: "auto",
              display: "grid",
              gap: 1,
              mb: 2,
              pr: 0.5,
              "&::-webkit-scrollbar": { width: 5 },
              "&::-webkit-scrollbar-track": {
                borderRadius: 99,
                bgcolor: "#F3EEEE",
              },
              "&::-webkit-scrollbar-thumb": {
                borderRadius: 99,
                bgcolor: brand[200],
              },
            }}
          >
            {detallesResumen.map(({ prod, det, base }, index) => (
              <Box
                key={prod.id}
                component={motion.div}
                sx={{
                  p: 1.45,
                  borderRadius: 3,
                  border: "1px solid #EEE5E5",
                  bgcolor: "#FFF",
                  transition: "box-shadow .15s ease, transform .15s ease",
                  "&:hover": {
                    boxShadow: "0 4px 14px rgba(89,43,43,0.08)",
                    transform: "translateY(-1px)",
                  },
                }}
              >
                <Typography
                  sx={{ fontWeight: 900, color: "#1F2937", fontSize: 13 }}
                  noWrap
                >
                  {prod.descripcion || prod.numeroSerie || "Producto"}
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  S/N: {prod.numeroSerie || "N/A"}
                </Typography>

                <Box
                  sx={{
                    mt: 0.8,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 1,
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#9CA3AF" }}>
                    Base: Bs {base.toFixed(2)}
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 900, color: brand[600] }}
                  >
                    Bs {Number(det.subtotal || 0).toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        ) : (
          <Box
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1.5px dashed #DDD",
              textAlign: "center",
              mb: 2,
              color: "#BDBDBD",
              bgcolor: "#FFF",
            }}
          >
            <ShoppingCart size={25} />

            <Typography variant="body2" sx={{ mt: 1, color: "#9CA3AF" }}>
              Agrega productos para ver el resumen
            </Typography>
          </Box>
        )}

        <Box
          sx={{
            borderRadius: 4,
            p: 2.5,
            background: `linear-gradient(135deg, ${brand[900]} 0%, ${brand[500]} 100%)`,
            color: "white",
            boxShadow: `0 12px 28px ${brand[600]}44`,
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: -22,
              right: -22,
              width: 86,
              height: 86,
              borderRadius: "50%",
              bgcolor: "rgba(255,255,255,0.07)",
            }}
          />

          <Typography
            sx={{
              opacity: 0.8,
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Total de la venta
          </Typography>

          <Typography
            sx={{
              fontWeight: 950,
              fontSize: { xs: 30, md: 34 },
              letterSpacing: 0.4,
              lineHeight: 1.1,
              mt: 0.5,
            }}
          >
            Bs {total.toFixed(2)}
          </Typography>

          <Typography sx={{ opacity: 0.75, fontSize: 12, mt: 0.5 }}>
            {detallesResumen.length} producto
            {detallesResumen.length !== 1 ? "s" : ""}
          </Typography>
        </Box>
      </CardContent>
    </MotionCard>
  );
};