import * as React from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  CircularProgress,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  RefreshCw,
  Zap,
  DollarSign,
  ShoppingCart,
  Boxes,
  Truck,
  PackageCheck,
  Calendar,
  Award,
  Activity,
} from "lucide-react";

import ServiceDashboardEmpleado from "@/services/ServiceDashboardEmpleado";

const COLORS = {
  primary: "#a4193d",
  dark: "#1f2329",
  white: "#ffffff",
  gray50: "#f9fafb",
  gray200: "#e5e7eb",
  gray500: "#6b7280",
  gray900: "#111827",
  success: "#10b981",
  warning: "#f59e0b",
  info: "#3b82f6",
};

const SHADOW = "0 10px 25px rgba(0,0,0,0.08)";

const formatMoney = (value) =>
  `Bs ${Number(value || 0).toLocaleString("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatNumber = (value) =>
  Number(value || 0).toLocaleString("es-BO");

const getUsuario = () => {
  try {
    return (
      JSON.parse(localStorage.getItem("usuario")) ||
      JSON.parse(localStorage.getItem("user")) ||
      {}
    );
  } catch {
    return {};
  }
};

function HeaderRol({ rol, empleado, loading, onRefresh }) {
  const subtitulo =
    rol === "Ventas"
      ? "Resumen de ventas, mejores resultados y rendimiento comercial"
      : rol === "Almacen"
      ? "Control de movimientos, productos gestionados y actividad de almacén"
      : "Seguimiento de importaciones asignadas y desempeño de entregas";

  return (
    <Box
      sx={{
        mb: 4,
        p: { xs: 3, md: 4 },
        borderRadius: "24px",
        background: "linear-gradient(135deg, #1f2329 0%, #3a3f47 100%)",
        color: COLORS.white,
        boxShadow: SHADOW,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={2}
      >
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
            <Zap size={24} />
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              Panel de {rol}
            </Typography>
          </Stack>

          <Typography sx={{ opacity: 0.88, fontSize: "0.9rem" }}>
            {subtitulo}
          </Typography>

          {empleado && (
            <Typography sx={{ opacity: 0.7, fontSize: "0.78rem", mt: 1 }}>
              Empleado: {empleado.nombre} {empleado.apellido}
            </Typography>
          )}
        </Box>

        <Button
          onClick={onRefresh}
          disabled={loading}
          startIcon={
            loading ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <RefreshCw size={18} />
            )
          }
          sx={{
            color: COLORS.white,
            border: "1px solid rgba(255,255,255,0.35)",
            borderRadius: "14px",
            px: 2.5,
            py: 1,
            fontWeight: 700,
            "&:hover": {
              background: "rgba(255,255,255,0.1)",
            },
          }}
        >
          Actualizar
        </Button>
      </Stack>
    </Box>
  );
}

function MetricCard({ title, value, subtitle, icon: Icon, color = COLORS.primary }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: "22px",
        border: `1px solid ${COLORS.gray200}`,
        boxShadow: SHADOW,
        height: "100%",
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: color,
        },
      }}
    >
      <Stack direction="row" justifyContent="space-between" spacing={2}>
        <Box>
          <Typography
            sx={{
              fontSize: "0.75rem",
              fontWeight: 800,
              color: COLORS.gray500,
              textTransform: "uppercase",
              mb: 1,
            }}
          >
            {title}
          </Typography>

          <Typography
            sx={{
              fontSize: { xs: "1.6rem", md: "1.9rem" },
              fontWeight: 900,
              color: COLORS.gray900,
              lineHeight: 1.2,
            }}
          >
            {value}
          </Typography>

          <Typography sx={{ fontSize: "0.78rem", color: COLORS.gray500, mt: 0.8 }}>
            {subtitle}
          </Typography>
        </Box>

        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: "16px",
            bgcolor: `${color}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={26} color={color} />
        </Box>
      </Stack>
    </Paper>
  );
}

function DetailCard({ title, children, icon: Icon }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: "22px",
        border: `1px solid ${COLORS.gray200}`,
        boxShadow: SHADOW,
        height: "100%",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: "12px",
            bgcolor: `${COLORS.primary}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={20} color={COLORS.primary} />
        </Box>

        <Typography sx={{ fontWeight: 900, color: COLORS.gray900 }}>
          {title}
        </Typography>
      </Stack>

      {children}
    </Paper>
  );
}

function VentasContent({ data }) {
  return (
    <>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Total vendido"
            value={formatMoney(data.montoTotalVendido)}
            subtitle="Monto acumulado por el empleado"
            icon={DollarSign}
            color={COLORS.primary}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Ventas realizadas"
            value={formatNumber(data.totalVentas)}
            subtitle="Cantidad de transacciones"
            icon={ShoppingCart}
            color={COLORS.success}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Productos vendidos"
            value={formatNumber(data.productosVendidos)}
            subtitle="Unidades comercializadas"
            icon={PackageCheck}
            color={COLORS.info}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Mejor venta"
            value={formatMoney(data.mejorVenta)}
            subtitle="Venta con mayor importe"
            icon={Award}
            color={COLORS.warning}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <DetailCard title="Modelo más vendido" icon={Award}>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              {data.modeloMasVendido || "Sin datos"}
            </Typography>
            <Typography sx={{ color: COLORS.gray500 }}>
              Producto con mayor rotación en sus ventas.
            </Typography>
          </DetailCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <DetailCard title="Mejor día de ventas" icon={Calendar}>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              {data.mejorDiaVentas || "Sin datos"}
            </Typography>
            <Typography sx={{ color: COLORS.gray500 }}>
              Día donde generó mayor monto vendido.
            </Typography>
          </DetailCard>
        </Grid>
      </Grid>
    </>
  );
}

function AlmacenContent({ data }) {
  return (
    <>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Movimientos"
            value={formatNumber(data.totalMovimientos)}
            subtitle="Entradas y salidas registradas"
            icon={Activity}
            color={COLORS.primary}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Productos gestionados"
            value={formatNumber(data.productosGestionados)}
            subtitle="Productos con movimiento"
            icon={Boxes}
            color={COLORS.info}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Entradas"
            value={formatNumber(data.entradas)}
            subtitle="Productos ingresados"
            icon={PackageCheck}
            color={COLORS.success}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Salidas"
            value={formatNumber(data.salidas)}
            subtitle="Productos retirados"
            icon={Truck}
            color={COLORS.warning}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <DetailCard title="Día con más movimientos" icon={Calendar}>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              {data.diaConMasMovimientos || "Sin datos"}
            </Typography>
          </DetailCard>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <DetailCard title="Almacén más usado" icon={Boxes}>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              {data.almacenMasUsado || "Sin datos"}
            </Typography>
          </DetailCard>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <DetailCard title="Último movimiento" icon={Activity}>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              {data.ultimoMovimiento || "Sin datos"}
            </Typography>
          </DetailCard>
        </Grid>
      </Grid>
    </>
  );
}

function PiloteroContent({ data }) {
  return (
    <>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Importaciones"
            value={formatNumber(data.totalImportaciones)}
            subtitle="Asignadas al pilotero"
            icon={Truck}
            color={COLORS.primary}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Concluidas"
            value={formatNumber(data.concluidas)}
            subtitle="Importaciones finalizadas"
            icon={PackageCheck}
            color={COLORS.success}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="En proceso"
            value={formatNumber(data.enProceso)}
            subtitle="Importaciones activas"
            icon={Activity}
            color={COLORS.info}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Retrasadas"
            value={formatNumber(data.retrasadas)}
            subtitle="Fuera de fecha estimada"
            icon={Calendar}
            color={COLORS.warning}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <DetailCard title="Llegó antes de fecha" icon={Award}>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              {data.importacionAntesDeFecha || "Sin datos"}
            </Typography>
            <Typography sx={{ color: COLORS.gray500 }}>
              Importación destacada por llegar antes de la fecha prevista.
            </Typography>
          </DetailCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <DetailCard title="Mayor importación gestionada" icon={Truck}>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              {data.mayorImportacionGestionada || "Sin datos"}
            </Typography>
            <Typography sx={{ color: COLORS.gray500 }}>
              Importación con mayor cantidad de productos gestionados.
            </Typography>
          </DetailCard>
        </Grid>
      </Grid>
    </>
  );
}

export default function EmpleadoInicioDashboard() {
  const usuario = getUsuario();
  const empleadoId = usuario.empleadoId || usuario.idEmpleado || usuario.id;

  const [loading, setLoading] = React.useState(false);
  const [empleado, setEmpleado] = React.useState(null);
  const [rol, setRol] = React.useState(usuario.rol || "");
  const [dashboard, setDashboard] = React.useState({});

  const cargarDashboard = React.useCallback(async () => {
    if (!empleadoId) return;

    try {
      setLoading(true);
      const res = await ServiceDashboardEmpleado.getDashboardEmpleado(empleadoId);

      setEmpleado(res.empleado || null);
      setRol(res.rol || usuario.rol || "");
      setDashboard(res.dashboard || {});
    } catch (error) {
      console.error("Error cargando dashboard del empleado:", error);
    } finally {
      setLoading(false);
    }
  }, [empleadoId]);

  React.useEffect(() => {
    cargarDashboard();
  }, [cargarDashboard]);

  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        maxWidth: "1600px",
        mx: "auto",
        minHeight: "100%",
        overflowY: "auto",
      }}
    >
      <HeaderRol
        rol={rol}
        empleado={empleado}
        loading={loading}
        onRefresh={cargarDashboard}
      />

      {loading && Object.keys(dashboard).length === 0 ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: COLORS.primary }} />
        </Box>
      ) : rol === "Ventas" ? (
        <VentasContent data={dashboard} />
      ) : rol === "Almacen" ? (
        <AlmacenContent data={dashboard} />
      ) : rol === "Pilotero" ? (
        <PiloteroContent data={dashboard} />
      ) : (
        <Paper sx={{ p: 3, borderRadius: "20px" }}>
          <Typography fontWeight={800}>
            Este rol no tiene dashboard configurado.
          </Typography>
        </Paper>
      )}
    </Box>
  );
}