// src/routes/pages/dashboards/AdminDashboard.jsx

import * as React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import {
  Typography,
  Box,
  Paper,
  Stack,
  Button,
  CircularProgress,
  Chip,
  Divider,
  IconButton,
  useTheme,
  useMediaQuery,
} from "@mui/material";

import Grid from "@mui/material/Grid";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  Legend,
} from "recharts";

import {
  Bell,
  Boxes,
  TrendingUp,
  ShoppingCart,
  PackageCheck,
  AlertTriangle,
  Truck,
  DollarSign,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Image,
  Zap,
  Award,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart,
  Store,
  Calendar,
  TrendingDown,
} from "lucide-react";

import DashboardLayout from "@/layouts/DashboardLayout";
import { adminMenu } from "./menuConfig";
import SuccessDialog from "@/components/SuccessDialog";
import ServiceAlerta from "@/services/ServiceAlerta";
import ServiceReporteVentas from "@/services/ServiceReporteVentas";
import ServiceReporteInventario from "@/services/ServiceReporteInventario";
import ServiceReporteImportaciones from "@/services/ServiceReporteImportaciones";

import AlertasModal from "./modals/AlertasModal";
import StockBajoModal from "./modals/StockBajoModal";

// páginas
import EmpleadoList from "@/routes/pages/Empleado/empleadoList";
import ClienteList from "@/routes/pages/clientes/clientelist";
import ModeloProductoList from "@/routes/pages/modelo_producto/modeloProductoList";
import ProveedorList from "@/routes/pages/proveedor/proveedorlist";
import SucursalList from "@/routes/pages/sucursal/sucursalList";
import CategoriaList from "@/routes/pages/categoria/categoriaList";
import AlmacenList from "@/routes/pages/almacen/almacenList";
import SeccionList from "@/routes/pages/seccion/seccionList";
import InventarioList from "@/routes/pages/inventario/inventarioList";
import ImportList from "@/routes/pages/importaciones/ImportacionList";
import VentasList from "@/routes/pages/ventas/ventasList";
import ProductList from "@/routes/pages/productos/productoList";
import Reporte_Venta from "@/routes/pages/reportes/Reporte_Venta";
import Reporte_Inventario from "@/routes/pages/reportes/Reporte_Inventario";
import Reporte_Importacion from "@/routes/pages/reportes/Reporte_Importacion";

// ─── Imágenes del carrusel ────────────────────────────────────────────────────
import img1 from "@/assets/scroall/im1.jpg";
import img2 from "@/assets/scroall/im2.jpg";
import img3 from "@/assets/scroall/im3.jpg";
import img4 from "@/assets/scroall/im4.jpg";
import img5 from "@/assets/scroall/im5.jpg";
import img6 from "@/assets/scroall/im6.jpg";
import img7 from "@/assets/scroall/im7.jpg";
import img8 from "@/assets/scroall/im8.jpg";
import img9 from "@/assets/scroall/im9.jpg";
import img10 from "@/assets/scroall/im10.jpg";

const CAROUSEL_IMAGES = [img1, img2, img3, img4, img5, img6, img7, img8, img9, img10];

// ─── Sistema de diseño mejorado ────────────────────────────────────────────────
const COLORS = {
  primary: {
    main: "#a4193d",
    light: "#c75b76",
    dark: "#7a0f2d",
    soft: "#f8e8ed",
    gradient: "linear-gradient(135deg, #a4193d 0%, #c75b76 100%)",
  },
  secondary: {
    main: "#1f2329",
    light: "#3a3f47",
    dark: "#0f1217",
    soft: "#eef0f3",
    gradient: "linear-gradient(135deg, #1f2329 0%, #3a3f47 100%)",
  },
  success: {
    main: "#10b981",
    light: "#34d399",
    dark: "#059669",
    soft: "#d1fae5",
    gradient: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
  },
  warning: {
    main: "#f59e0b",
    light: "#fbbf24",
    dark: "#d97706",
    soft: "#fef3c7",
    gradient: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)",
  },
  error: {
    main: "#ef4444",
    light: "#f87171",
    dark: "#dc2626",
    soft: "#fee2e2",
    gradient: "linear-gradient(135deg, #ef4444 0%, #f87171 100%)",
  },
  info: {
    main: "#3b82f6",
    light: "#60a5fa",
    dark: "#2563eb",
    soft: "#dbeafe",
    gradient: "linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)",
  },
  neutral: {
    white: "#ffffff",
    gray50: "#f9fafb",
    gray100: "#f3f4f6",
    gray200: "#e5e7eb",
    gray300: "#d1d5db",
    gray400: "#9ca3af",
    gray500: "#6b7280",
    gray600: "#4b5563",
    gray700: "#374151",
    gray800: "#1f2937",
    gray900: "#111827",
  },
};

const SHADOWS = {
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
};

const BORDER_RADIUS = {
  sm: "0.5rem",
  md: "0.75rem",
  lg: "1rem",
  xl: "1.5rem",
};

// ─── Constantes de variantes para métricas ────────────────────────────────────
const METRIC_VARIANTS = {
  primary: {
    gradient: COLORS.primary.gradient,
    bgSoft: COLORS.primary.soft,
    iconBg: COLORS.primary.main,
    borderColor: COLORS.primary.main,
  },
  secondary: {
    gradient: COLORS.secondary.gradient,
    bgSoft: COLORS.secondary.soft,
    iconBg: COLORS.secondary.main,
    borderColor: COLORS.secondary.main,
  },
  success: {
    gradient: COLORS.success.gradient,
    bgSoft: COLORS.success.soft,
    iconBg: COLORS.success.main,
    borderColor: COLORS.success.main,
  },
  warning: {
    gradient: COLORS.warning.gradient,
    bgSoft: COLORS.warning.soft,
    iconBg: COLORS.warning.main,
    borderColor: COLORS.warning.main,
  },
  error: {
    gradient: COLORS.error.gradient,
    bgSoft: COLORS.error.soft,
    iconBg: COLORS.error.main,
    borderColor: COLORS.error.main,
  },
  info: {
    gradient: COLORS.info.gradient,
    bgSoft: COLORS.info.soft,
    iconBg: COLORS.info.main,
    borderColor: COLORS.info.main,
  },
};

const formatMoney = (value) =>
  `Bs ${Number(value || 0).toLocaleString("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatNumber = (value) => Number(value || 0).toLocaleString("es-BO");
const formatCompactNumber = (value) => {
  const num = Number(value || 0);
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const getItems = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.items)) return res.items;
  return [];
};

const getValue = (obj, keys = []) => {
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj?.[key] !== null) return obj[key];
  }
  return 0;
};

// ─── Componente de carga mejorado ─────────────────────────────────────────────
const LoadingSkeleton = () => (
  <Box sx={{ p: 3 }}>
    <Grid container spacing={3}>
      {[1, 2, 3, 4].map((i) => (
        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
          <Paper sx={{ p: 3, borderRadius: BORDER_RADIUS.lg }}>
            <Stack direction="row" justifyContent="space-between">
              <Box>
                <Box sx={{ width: 100, height: 12, bgcolor: COLORS.neutral.gray200, borderRadius: 1, mb: 2 }} />
                <Box sx={{ width: 80, height: 28, bgcolor: COLORS.neutral.gray200, borderRadius: 1, mb: 1 }} />
                <Box sx={{ width: 120, height: 12, bgcolor: COLORS.neutral.gray200, borderRadius: 1 }} />
              </Box>
              <Box sx={{ width: 48, height: 48, borderRadius: "50%", bgcolor: COLORS.neutral.gray200 }} />
            </Stack>
          </Paper>
        </Grid>
      ))}
    </Grid>
  </Box>
);

// ─── Carrusel de imágenes mejorado ────────────────────────────────────────────
function ImageCarousel() {
  const [current, setCurrent] = React.useState(0);
  const [loaded, setLoaded] = React.useState({});
  const timerRef = React.useRef(null);

  const total = CAROUSEL_IMAGES.length;

  const goTo = React.useCallback(
    (index) => {
      setCurrent((index + total) % total);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setCurrent((prev) => (prev + 1) % total);
        }, 5000);
      }
    },
    [total]
  );

  React.useEffect(() => {
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % total);
    }, 5000);
    return () => clearInterval(timerRef.current);
  }, [total]);

  const handleLoad = (i) => setLoaded((prev) => ({ ...prev, [i]: true }));

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: BORDER_RADIUS.xl,
        border: `1px solid ${COLORS.neutral.gray200}`,
        boxShadow: SHADOWS.lg,
        background: COLORS.neutral.white,
        mb: 4,
        overflow: "hidden",
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: BORDER_RADIUS.lg,
              background: COLORS.primary.gradient,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Image size={20} color={COLORS.neutral.white} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, color: COLORS.neutral.gray900, fontSize: "1.1rem" }}>
              Galería Comercial Poma
            </Typography>
            <Typography sx={{ fontSize: "0.75rem", color: COLORS.neutral.gray500 }}>
              {current + 1} / {total}
            </Typography>
          </Box>
        </Stack>
       
      </Stack>

      <Box
        sx={{
          position: "relative",
          borderRadius: BORDER_RADIUS.lg,
          overflow: "hidden",
          height: { xs: 240, sm: 320, md: 400 },
          bgcolor: COLORS.neutral.gray100,
        }}
      >
        {CAROUSEL_IMAGES.map((src, i) => (
          <Box
            key={i}
            component="img"
            src={src}
            alt={`Producto ${i + 1}`}
            loading={i === 0 ? "eager" : "lazy"}
            onLoad={() => handleLoad(i)}
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: i === current ? 1 : 0,
              transition: "opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        ))}

        {!loaded[current] && (
          <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CircularProgress size={32} sx={{ color: COLORS.primary.main }} />
          </Box>
        )}

        <IconButton
          onClick={() => goTo(current - 1)}
          sx={{
            position: "absolute",
            left: 16,
            top: "50%",
            transform: "translateY(-50%)",
            bgcolor: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(4px)",
            "&:hover": { bgcolor: COLORS.neutral.white },
            width: 40,
            height: 40,
            boxShadow: SHADOWS.md,
          }}
        >
          <ChevronLeft size={20} />
        </IconButton>
        <IconButton
          onClick={() => goTo(current + 1)}
          sx={{
            position: "absolute",
            right: 16,
            top: "50%",
            transform: "translateY(-50%)",
            bgcolor: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(4px)",
            "&:hover": { bgcolor: COLORS.neutral.white },
            width: 40,
            height: 40,
            boxShadow: SHADOWS.md,
          }}
        >
          <ChevronRight size={20} />
        </IconButton>

        <Stack
          direction="row"
          spacing={1}
          sx={{
            position: "absolute",
            bottom: 16,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          {CAROUSEL_IMAGES.map((_, i) => (
            <Box
              key={i}
              onClick={() => goTo(i)}
              sx={{
                width: i === current ? 24 : 8,
                height: 8,
                borderRadius: 4,
                bgcolor: i === current ? COLORS.primary.main : "rgba(255,255,255,0.6)",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            />
          ))}
        </Stack>
      </Box>
    </Paper>
  );
}

// ─── MetricCard mejorada con variantes ────────────────────────────────────────
function MetricCard({ title, value, subtitle, trend, trendValue, icon: Icon, variant = "primary", onClick }) {
  const variantStyle = METRIC_VARIANTS[variant];
  const isPositiveTrend = trend === "up";

  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        p: 3,
        borderRadius: BORDER_RADIUS.xl,
        cursor: onClick ? "pointer" : "default",
        border: `1px solid ${COLORS.neutral.gray200}`,
        background: COLORS.neutral.white,
        boxShadow: SHADOWS.md,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: variantStyle.gradient,
        },
        "&:hover": onClick
          ? {
              transform: "translateY(-4px)",
              boxShadow: SHADOWS.xl,
            }
          : {},
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box flex={1}>
          <Typography
            sx={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: COLORS.neutral.gray500,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              mb: 1.5,
            }}
          >
            {title}
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: "1.75rem", md: "2rem" },
              fontWeight: 800,
              color: COLORS.neutral.gray900,
              lineHeight: 1.2,
              mb: 0.5,
            }}
          >
            {value}
          </Typography>
          <Typography sx={{ fontSize: "0.75rem", color: COLORS.neutral.gray500, mb: 1 }}>
            {subtitle}
          </Typography>
          {trend && (
            <Stack direction="row" alignItems="center" spacing={0.5}>
              {isPositiveTrend ? (
                <TrendingUp size={14} color={COLORS.success.main} />
              ) : (
                <TrendingDown size={14} color={COLORS.error.main} />
              )}
              <Typography
                sx={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: isPositiveTrend ? COLORS.success.main : COLORS.error.main,
                }}
              >
                {trendValue}
              </Typography>
            </Stack>
          )}
        </Box>
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: BORDER_RADIUS.lg,
            background: variantStyle.bgSoft,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={26} color={variantStyle.iconBg} />
        </Box>
      </Stack>
    </Paper>
  );
}

// ─── ChartCard mejorada ───────────────────────────────────────────────────────
function ChartCard({ title, subtitle, icon: Icon, children, action, height = 320 }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: BORDER_RADIUS.xl,
        border: `1px solid ${COLORS.neutral.gray200}`,
        boxShadow: SHADOWS.md,
        background: COLORS.neutral.white,
        height: "100%",
        transition: "all 0.3s ease",
        "&:hover": {
          boxShadow: SHADOWS.lg,
        },
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2.5 }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          {Icon && (
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: BORDER_RADIUS.lg,
                background: COLORS.primary.soft,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon size={18} color={COLORS.primary.main} />
            </Box>
          )}
          <Box>
            <Typography sx={{ fontWeight: 700, color: COLORS.neutral.gray900 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography sx={{ fontSize: "0.75rem", color: COLORS.neutral.gray500 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>
        {action}
      </Stack>
      <Box sx={{ height }}>{children}</Box>
    </Paper>
  );
}

// ─── Sección de encabezado mejorada ───────────────────────────────────────────
function DashboardHeader({ onRefresh, loading, lastUpdated }) {
  return (
    <Box
      sx={{
        mb: 4,
        p: { xs: 3, md: 4 },
        borderRadius: BORDER_RADIUS.xl,
        background: COLORS.secondary.gradient,
        color: COLORS.neutral.white,
        boxShadow: SHADOWS.xl,
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.05)",
        },
        "&::after": {
          content: '""',
          position: "absolute",
          bottom: -80,
          left: -80,
          width: 250,
          height: 250,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.03)",
        },
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={2}
        sx={{ position: "relative", zIndex: 1 }}
      >
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
            <Zap size={24} />
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
              Comercial Poma
            </Typography>
          </Stack>
          <Typography sx={{ opacity: 0.85, fontSize: "0.875rem" }}>
            Panel de administración · Resumen ejecutivo del negocio
          </Typography>
          {lastUpdated && (
            <Typography sx={{ opacity: 0.7, fontSize: "0.7rem", mt: 1 }}>
              Última actualización: {lastUpdated}
            </Typography>
          )}
        </Box>
        <Button
          onClick={onRefresh}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <RefreshCw size={18} />}
          sx={{
            color: COLORS.neutral.white,
            borderColor: "rgba(255,255,255,0.3)",
            border: "1px solid",
            borderRadius: BORDER_RADIUS.lg,
            px: 2.5,
            py: 1,
            fontWeight: 600,
            "&:hover": {
              borderColor: COLORS.neutral.white,
              background: "rgba(255,255,255,0.1)",
            },
          }}
        >
          Actualizar datos
        </Button>
      </Stack>
    </Box>
  );
}

// ─── Dashboard principal optimizado ───────────────────────────────────────────
export default function AdminDashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [alertas, setAlertas] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [lastUpdated, setLastUpdated] = React.useState(null);
  const [openAlertasModal, setOpenAlertasModal] = React.useState(false);
  const [openStockModal, setOpenStockModal] = React.useState(false);
  const [openSuccess, setOpenSuccess] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState("");
  const [successTitle, setSuccessTitle] = React.useState("");
  const [ventasDash, setVentasDash] = React.useState({});
  const [stockDash, setStockDash] = React.useState({});
  const [importDash, setImportDash] = React.useState({});
  const [ventasDia, setVentasDia] = React.useState([]);
  const [ventasSucursal, setVentasSucursal] = React.useState([]);
  const [ventasProducto, setVentasProducto] = React.useState([]);
  const [stockActual, setStockActual] = React.useState([]);
  const [importacionesMes, setImportacionesMes] = React.useState([]);
  const [topRentables, setTopRentables] = React.useState([]);

  const alertasStockBajo = React.useMemo(
    () => alertas.filter((a) => a.tipo === "STOCK_BAJO"),
    [alertas]
  );
  const alertasImportacion = React.useMemo(
    () => alertas.filter((a) => a.tipo !== "STOCK_BAJO"),
    [alertas]
  );

  const pieObservados = React.useMemo(() => {
    const sinObs = Number(stockDash.productosSinObservacion || 0);
    const obs = Number(stockDash.productosObservados || 0);
    if (sinObs === 0 && obs === 0) return [{ name: "Sin datos", value: 1 }];
    return [
      { name: "Sin observación", value: sinObs },
      { name: "Con observación", value: obs },
    ].filter((x) => x.value > 0);
  }, [stockDash]);

  const cargarDatos = React.useCallback(async () => {
    try {
      setLoading(true);
      await ServiceAlerta.verificarStockBajo();

      const [alertasRes, ventasDashRes, stockDashRes, importDashRes] = await Promise.allSettled([
        ServiceAlerta.getDashboard(1000),
        ServiceReporteVentas.getDashboard(),
        ServiceReporteInventario.getStockDashboard(),
        ServiceReporteImportaciones.getDashboard(),
      ]);

      if (alertasRes.status === "fulfilled") setAlertas(Array.isArray(alertasRes.value) ? alertasRes.value : []);
      if (ventasDashRes.status === "fulfilled") setVentasDash(ventasDashRes.value || {});
      if (stockDashRes.status === "fulfilled") setStockDash(stockDashRes.value || {});
      if (importDashRes.status === "fulfilled") setImportDash(importDashRes.value || {});

      const [
        ventasDiaRes,
        ventasSucursalRes,
        ventasProductoRes,
        stockActualRes,
        importMesRes,
        topRentablesRes,
      ] = await Promise.allSettled([
        ServiceReporteVentas.getPorDia(),
        ServiceReporteVentas.getPorSucursal(),
        ServiceReporteVentas.getPorProducto(),
        ServiceReporteInventario.getStockActual({ page: 1, pageSize: 8 }),
        ServiceReporteImportaciones.getPorMes(),
        ServiceReporteImportaciones.getTopModelosRentables(),
      ]);

      if (ventasDiaRes.status === "fulfilled") setVentasDia(getItems(ventasDiaRes.value).slice(-12));
      if (ventasSucursalRes.status === "fulfilled") setVentasSucursal(getItems(ventasSucursalRes.value).slice(0, 8));
      if (ventasProductoRes.status === "fulfilled") setVentasProducto(getItems(ventasProductoRes.value).slice(0, 8));
      if (stockActualRes.status === "fulfilled") setStockActual(getItems(stockActualRes.value).slice(0, 8));
      if (importMesRes.status === "fulfilled") setImportacionesMes(getItems(importMesRes.value).slice(-12));
      if (topRentablesRes.status === "fulfilled") setTopRentables(getItems(topRentablesRes.value).slice(0, 8));

      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Error cargando dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  React.useEffect(() => {
    if (!openSuccess) return;

    const timer = setTimeout(() => {
      setOpenSuccess(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, [openSuccess]);
  
  const handleMarcarLeida = async (id) => {
    try {
      await ServiceAlerta.marcarLeida(id);
      setAlertas((prev) => prev.filter((a) => a.id !== id));
    } catch (error) {
      console.error("Error marcando alerta:", error);
    }
  };

  const handleMarcarTodas = async (tipo) => {
    try {
      const lista = tipo === "STOCK_BAJO" ? alertasStockBajo : alertasImportacion;
      await Promise.all(lista.map((a) => ServiceAlerta.marcarLeida(a.id)));
      setAlertas((prev) =>
        prev.filter((a) =>
          tipo === "STOCK_BAJO" ? a.tipo !== "STOCK_BAJO" : a.tipo === "STOCK_BAJO"
        )
      );
    } catch (error) {
      console.error("Error marcando todas:", error);
    }
  };

  const handleEnviarStockCorreo = async () => {
    try {
      await ServiceAlerta.enviarStockBajoCorreo();

      setSuccessTitle("¡Correo enviado!");
      setSuccessMessage(
        "El resumen de productos con stock bajo fue enviado correctamente."
      );

      setOpenSuccess(true);

    } catch (error) {
      console.error("Error enviando correo:", error);

      setSuccessTitle("Error");
      setSuccessMessage(
        "No se pudo enviar el resumen al correo."
      );

      setOpenSuccess(true);
    }
  };

  if (loading && Object.keys(ventasDash).length === 0) {
    return <LoadingSkeleton />;
  }

  return (
    <DashboardLayout title="Panel de Administrador" menuItems={adminMenu}>
      <Routes>
        <Route
          index
          element={
            <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: "1600px", mx: "auto" }}>
              <DashboardHeader onRefresh={cargarDatos} loading={loading} lastUpdated={lastUpdated} />

              {/* ── Primera fila: Métricas principales ── */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <MetricCard
                    title="Ventas totales"
                    value={formatMoney(ventasDash.totalVendido)}
                    subtitle={`${formatNumber(ventasDash.cantidadVentas)} transacciones`}
                    icon={DollarSign}
                    variant="primary"
                    trend="up"
                    trendValue="+12% vs mes anterior"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <MetricCard
                    title="Unidades vendidas"
                    value={formatNumber(ventasDash.productosVendidos)}
                    subtitle={`Ticket promedio: ${formatMoney(ventasDash.ticketPromedio)}`}
                    icon={ShoppingCart}
                    variant="success"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <MetricCard
                    title="Stock disponible"
                    value={formatNumber(stockDash.stockTotal)}
                    subtitle={`${formatNumber(stockDash.modelosConStock)} modelos en stock`}
                    icon={Boxes}
                    variant="info"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <MetricCard
                    title="Valor del inventario"
                    value={formatMoney(stockDash.valorVentaStock)}
                    subtitle={`Utilidad: ${formatMoney(stockDash.utilidadEstimadaStock)}`}
                    icon={PackageCheck}
                    variant="secondary"
                  />
                </Grid>
              </Grid>

              {/* ── Segunda fila: Métricas secundarias y alertas ── */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <MetricCard
                    title="Importaciones"
                    value={formatNumber(getValue(importDash, ["totalImportaciones", "importaciones", "cantidadImportaciones"]))}
                    subtitle="Órdenes de compra"
                    icon={Truck}
                    variant="warning"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <MetricCard
                    title="Productos observados"
                    value={formatNumber(stockDash.productosObservados)}
                    subtitle="Requieren atención"
                    icon={AlertTriangle}
                    variant="warning"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <MetricCard
                    title="Alertas activas"
                    value={formatNumber(alertasImportacion.length)}
                    subtitle="Importaciones pendientes"
                    icon={Bell}
                    variant="info"
                    onClick={() => setOpenAlertasModal(true)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <MetricCard
                    title="Stock crítico"
                    value={formatNumber(alertasStockBajo.length)}
                    subtitle="Productos por reponer"
                    icon={AlertTriangle}
                    variant="error"
                    onClick={() => setOpenStockModal(true)}
                  />
                </Grid>
              </Grid>

              {/* ── Galería ── */}
              <ImageCarousel />

              {/* ── Sección de gráficos ── */}
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  color: COLORS.neutral.gray900,
                  mb: 2.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <BarChart3 size={20} color={COLORS.primary.main} />
                Análisis y tendencias
              </Typography>

              <Grid container spacing={3}>
                {/* Evolución de ventas */}
                <Grid size={{ xs: 12, lg: 7 }}>
                  <ChartCard
                    title="Evolución de ventas"
                    subtitle="Últimos 12 días"
                    icon={LineChart}
                    height={340}
                    action={
                      <Chip
                        label="Tendencia positiva"
                        size="small"
                        sx={{
                          bgcolor: COLORS.success.soft,
                          color: COLORS.success.main,
                          fontWeight: 600,
                          borderRadius: BORDER_RADIUS.md,
                        }}
                      />
                    }
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={ventasDia}>
                        <defs>
                          <linearGradient id="ventasGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.primary.main} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={COLORS.primary.main} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.neutral.gray200} vertical={false} />
                        <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: COLORS.neutral.gray500 }} />
                        <YAxis tick={{ fontSize: 11, fill: COLORS.neutral.gray500 }} tickFormatter={formatCompactNumber} />
                        <ReTooltip
                          contentStyle={{
                            borderRadius: BORDER_RADIUS.lg,
                            border: `1px solid ${COLORS.neutral.gray200}`,
                            boxShadow: SHADOWS.md,
                          }}
                          formatter={(v) => [formatMoney(v), "Total vendido"]}
                        />
                        <Area
                          type="monotone"
                          dataKey="totalVendido"
                          stroke={COLORS.primary.main}
                          strokeWidth={3}
                          fill="url(#ventasGradient)"
                          name="Ventas"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </Grid>

                {/* Estado de productos */}
                <Grid size={{ xs: 12, lg: 5 }}>
                  <ChartCard
                    title="Estado del inventario"
                    subtitle="Productos observados vs en regla"
                    icon={PieChartIcon}
                    height={340}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieObservados}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={isMobile ? 50 : 70}
                          outerRadius={isMobile ? 80 : 110}
                          paddingAngle={4}
                          label={!isMobile}
                          labelLine={false}
                        >
                          {pieObservados.map((entry, index) => (
                            <Cell key={entry.name} fill={[COLORS.primary.main, COLORS.warning.main][index % 2]} />
                          ))}
                        </Pie>
                        <ReTooltip formatter={(v) => [formatNumber(v), "Productos"]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </Grid>

                {/* Ventas por sucursal */}
                <Grid item xs={12} md={6}>
                  <ChartCard
                    title="Rendimiento por sucursal"
                    subtitle="Ventas totales por ubicación"
                    icon={Store}
                    height={360}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ventasSucursal} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.neutral.gray200} horizontal={false} />
                        <XAxis type="number" tickFormatter={formatCompactNumber} tick={{ fontSize: 11, fill: COLORS.neutral.gray500 }} />
                        <YAxis type="category" dataKey="sucursalNombre" width={100} tick={{ fontSize: 11, fill: COLORS.neutral.gray600 }} />
                        <ReTooltip formatter={(v) => [formatMoney(v), "Ventas"]} />
                        <Bar
                          dataKey="totalVendido"
                          name="Ventas"
                          fill={COLORS.primary.main}
                          radius={[0, 8, 8, 0]}
                          barSize={32}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </Grid>

                {/* Productos más vendidos */}
                <Grid item xs={12} md={6}>
                  <ChartCard
                    title="Top productos"
                    subtitle="Modelos con mayor rotación"
                    icon={Award}
                    height={360}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ventasProducto} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.neutral.gray200} horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11, fill: COLORS.neutral.gray500 }} />
                        <YAxis type="category" dataKey="nombreModelo" width={110} tick={{ fontSize: 11, fill: COLORS.neutral.gray600 }} />
                        <ReTooltip formatter={(v) => [formatNumber(v), "Unidades"]} />
                        <Bar
                          dataKey="productosVendidos"
                          name="Unidades vendidas"
                          fill={COLORS.secondary.main}
                          radius={[0, 8, 8, 0]}
                          barSize={32}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </Grid>

                {/* Stock actual */}
                <Grid item xs={12} md={6}>
                  <ChartCard
                    title="Niveles de stock"
                    subtitle="Inventario actual por producto"
                    icon={Boxes}
                    height={360}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stockActual} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.neutral.gray200} horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11, fill: COLORS.neutral.gray500 }} />
                        <YAxis type="category" dataKey="nombreModelo" width={110} tick={{ fontSize: 11, fill: COLORS.neutral.gray600 }} />
                        <ReTooltip formatter={(v) => [formatNumber(v), "Unidades"]} />
                        <Bar
                          dataKey="cantidad"
                          name="Stock disponible"
                          fill={COLORS.info.main}
                          radius={[0, 8, 8, 0]}
                          barSize={32}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </Grid>




              </Grid>

              {/* ── Footer informativo ── */}
              <Paper
                elevation={0}
                sx={{
                  mt: 4,
                  p: 3,
                  borderRadius: BORDER_RADIUS.xl,
                  border: `1px solid ${COLORS.neutral.gray200}`,
                  background: `linear-gradient(135deg, ${COLORS.neutral.gray50} 0%, ${COLORS.neutral.white} 100%)`,
                }}
              >
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box sx={{ width: 40, height: 40, borderRadius: BORDER_RADIUS.lg, bgcolor: COLORS.primary.soft, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <TrendingUp size={20} color={COLORS.primary.main} />
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: 700, color: COLORS.neutral.gray900, fontSize: "0.875rem" }}>
                          Rendimiento general
                        </Typography>
                        <Typography sx={{ fontSize: "0.75rem", color: COLORS.neutral.gray500 }}>
                          Ventas en crecimiento sostenido
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box sx={{ width: 40, height: 40, borderRadius: BORDER_RADIUS.lg, bgcolor: COLORS.warning.soft, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <AlertTriangle size={20} color={COLORS.warning.main} />
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: 700, color: COLORS.neutral.gray900, fontSize: "0.875rem" }}>
                          Puntos de atención
                        </Typography>
                        <Typography sx={{ fontSize: "0.75rem", color: COLORS.neutral.gray500 }}>
                          Revisar productos con stock bajo
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box sx={{ width: 40, height: 40, borderRadius: BORDER_RADIUS.lg, bgcolor: COLORS.success.soft, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Zap size={20} color={COLORS.success.main} />
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: 700, color: COLORS.neutral.gray900, fontSize: "0.875rem" }}>
                          Recomendación
                        </Typography>
                        <Typography sx={{ fontSize: "0.75rem", color: COLORS.neutral.gray500 }}>
                          Reabastecer productos de alta rotación
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          }
        />

        {/* ── Rutas anidadas ── */}
        <Route path="empleados" element={<EmpleadoList />} />
        <Route path="reportes/ventas" element={<Reporte_Venta />} />
        <Route path="reportes/inventario" element={<Reporte_Inventario />} />
        <Route path="reportes/importacion" element={<Reporte_Importacion />} />
        <Route path="configuracion" element={<Configuracion />} />
        <Route path="importaciones" element={<ImportList />} />
        <Route path="inventario" element={<InventarioList />} />
        <Route path="clientes" element={<ClienteList />} />
        <Route path="proveedores" element={<ProveedorList />} />
        <Route path="modelos" element={<ModeloProductoList />} />
        <Route path="sucursales" element={<SucursalList />} />
        <Route path="categorias" element={<CategoriaList />} />
        <Route path="almacenes" element={<AlmacenList />} />
        <Route path="secciones" element={<SeccionList />} />
        <Route path="ventas" element={<VentasList />} />
        <Route path="productos" element={<ProductList />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>

      <AlertasModal
        open={openAlertasModal}
        onClose={() => setOpenAlertasModal(false)}
        alertas={alertasImportacion}
        onMarcarLeida={handleMarcarLeida}
        onMarcarTodas={() => handleMarcarTodas("IMPORTACION")}
        loading={loading}
      />

     <StockBajoModal
        open={openStockModal}
        onClose={() => setOpenStockModal(false)}
        alertas={alertasStockBajo}
        onMarcarLeida={handleMarcarLeida}
        onMarcarTodas={() => handleMarcarTodas("STOCK_BAJO")}
        onEnviarCorreo={handleEnviarStockCorreo}
        loading={loading}
      />
      <SuccessDialog
        open={openSuccess}
        title={successTitle}
        message={successMessage}
      />
    </DashboardLayout>
  );
}

// ─── Componente de configuración ──────────────────────────────────────────────
const Configuracion = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
      Configuración
    </Typography>
    <Typography sx={{ color: COLORS.neutral.gray600 }}>
      Panel de configuración del sistema
    </Typography>
  </Box>
);