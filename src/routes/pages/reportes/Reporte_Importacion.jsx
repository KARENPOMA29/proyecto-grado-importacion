import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Grid,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Checkbox,
  FormControlLabel,
} from "@mui/material";

import {
  AlertTriangle,
  CheckCircle,
  Download,
  FileText,
  Filter,
  RefreshCcw,
  Search,
  ShipWheel,
  TrendingUp,
  Truck,
} from "lucide-react";

import { toast } from "react-toastify";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import ServiceReporteImportaciones from "@/services/ServiceReporteImportaciones";

const money = (value) => `Bs ${Number(value || 0).toFixed(2)}`;

const BRAND = {
  light: "#e4e0e1",
  gray: "#7f7f7f",
  red: "#a4193d",
  dark: "#1f2329",
  white: "#ffffff",
};

const COLORS = {
  primary: [164, 25, 61],
  dark: [31, 35, 41],
  light: [228, 224, 225],
  gray: [127, 127, 127],
};

const fieldStyle = {
  minWidth: 170,
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    bgcolor: "white",
    minHeight: 42,
  },
  "& .MuiInputLabel-root": {
    fontSize: 14,
  },
};

const exportOptions = [
  ["retrasadas", "Importaciones retrasadas"],
  ["concluidas", "Importaciones concluidas"],
  ["proveedores", "Rendimiento de proveedores"],
  ["empleados", "Importaciones por empleado"],
  ["mes", "Importaciones por mes"],
  ["modelo", "Importaciones por modelo"],
  ["rentables", "Top modelos rentables"],
  ["observados", "Productos observados"],
];

const tabMap = [
  "retrasadas",
  "concluidas",
  "proveedores",
  "empleados",
  "mes",
  "modelo",
  "rentables",
  "observados",
];

const ReporteImportacion = () => {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    fechaDesde: "",
    fechaHasta: "",
    proveedor: "",
    empleado: "",
    nivelRetraso: "",
    estadoRetraso: "",
  });

  const [dashboard, setDashboard] = useState({});
  const [retrasadas, setRetrasadas] = useState([]);
  const [concluidas, setConcluidas] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [porMes, setPorMes] = useState([]);
  const [porModelo, setPorModelo] = useState([]);
  const [rentables, setRentables] = useState([]);
  const [observados, setObservados] = useState([]);

  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const [openExportDialog, setOpenExportDialog] = useState(false);
  const [selectedExports, setSelectedExports] = useState([]);

  const openExportMenu = Boolean(exportAnchorEl);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const limpiarFiltros = () => {
    setFilters({
      search: "",
      fechaDesde: "",
      fechaHasta: "",
      proveedor: "",
      empleado: "",
      nivelRetraso: "",
      estadoRetraso: "",
    });
  };

  const cargarReporte = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      const params = {
        search: filters.search || undefined,
        fechaDesde: filters.fechaDesde || undefined,
        fechaHasta: filters.fechaHasta || undefined,
        proveedor: filters.proveedor || undefined,
        empleado: filters.empleado || undefined,
        nivelRetraso: filters.nivelRetraso || undefined,
        estadoRetraso: filters.estadoRetraso || undefined,
      };

      const [
        dashRes,
        retrasadasRes,
        concluidasRes,
        proveedoresRes,
        empleadosRes,
        mesRes,
        modeloRes,
        rentablesRes,
        observadosRes,
      ] = await Promise.all([
        ServiceReporteImportaciones.getDashboard(),
        ServiceReporteImportaciones.getRetrasadas(params),
        ServiceReporteImportaciones.getConcluidas(params),
        ServiceReporteImportaciones.getProveedores(),
        ServiceReporteImportaciones.getEmpleados(),
        ServiceReporteImportaciones.getPorMes(),
        ServiceReporteImportaciones.getPorModelo(),
        ServiceReporteImportaciones.getTopModelosRentables(),
        ServiceReporteImportaciones.getProductosObservados(params),
      ]);

      setDashboard(dashRes || {});
      setRetrasadas(Array.isArray(retrasadasRes) ? retrasadasRes : []);
      setConcluidas(Array.isArray(concluidasRes) ? concluidasRes : []);
      setProveedores(Array.isArray(proveedoresRes) ? proveedoresRes : []);
      setEmpleados(Array.isArray(empleadosRes) ? empleadosRes : []);
      setPorMes(Array.isArray(mesRes) ? mesRes : []);
      setPorModelo(Array.isArray(modeloRes) ? modeloRes : []);
      setRentables(Array.isArray(rentablesRes) ? rentablesRes : []);
      setObservados(Array.isArray(observadosRes) ? observadosRes : []);
    } catch (error) {
      console.error(error);
      setErrorMsg("Error al cargar el reporte de importaciones.");
      toast.error("Error al cargar el reporte de importaciones.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(cargarReporte, 350);
    return () => clearTimeout(timer);
  }, [filters]);

  const proveedoresOptions = useMemo(() => {
    const data = [...retrasadas, ...concluidas, ...observados, ...proveedores]
      .map((x) => x.proveedorNombre || x.razonSocial)
      .filter(Boolean);

    return [...new Set(data)];
  }, [retrasadas, concluidas, observados, proveedores]);

  const empleadosOptions = useMemo(() => {
    const data = [...retrasadas, ...concluidas, ...observados, ...empleados]
      .map((x) => x.empleadoEncargado || x.empleadoNombre)
      .filter(Boolean);

    return [...new Set(data)];
  }, [retrasadas, concluidas, observados, empleados]);

  const cards = [
    {
      title: "Importaciones",
      subtitle: "Total registradas",
      value: dashboard.totalImportaciones || 0,
      icon: Truck,
      color: "#592B2B",
    },
    {
      title: "Concluidas",
      subtitle: "Importaciones finalizadas",
      value: dashboard.importacionesConcluidas || 0,
      icon: CheckCircle,
      color: "#0D8C47",
    },
    {
      title: "Retrasadas",
      subtitle: "Llegaron fuera de fecha",
      value: dashboard.importacionesRetrasadas || 0,
      icon: AlertTriangle,
      color: "#B91C1C",
    },
    {
      title: "Ganancia estimada",
      subtitle: "Venta - inversión",
      value: money(dashboard.gananciaEstimada),
      icon: TrendingUp,
      color: "#2563EB",
    },
  ];

  const addHeaderPDF = (doc, titulo) => {
    const width = doc.internal.pageSize.getWidth();

    doc.setFillColor(...COLORS.dark);
    doc.rect(0, 0, width, 30, "F");

    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 30, width, 3, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("COMERCIAL POMA", 14, 16);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("15 años en la industria de ventas de línea blanca", 14, 24);

    doc.setTextColor(...COLORS.light);
    doc.setFontSize(8);
    doc.text(new Date().toLocaleString("es-BO"), width - 58, 18);

    doc.setTextColor(...COLORS.dark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text(titulo, 14, 45);

    const filtros = [
      filters.search ? `Búsqueda: ${filters.search}` : null,
      filters.fechaDesde ? `Desde: ${filters.fechaDesde}` : null,
      filters.fechaHasta ? `Hasta: ${filters.fechaHasta}` : null,
      filters.proveedor ? `Proveedor: ${filters.proveedor}` : null,
      filters.empleado ? `Empleado: ${filters.empleado}` : null,
      filters.nivelRetraso ? `Retraso: ${filters.nivelRetraso}` : null,
    ]
      .filter(Boolean)
      .join("   |   ");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.gray);
    doc.text(filtros || "Sin filtros aplicados", 14, 52);
  };

  const addTablaPDF = (doc, titulo, head, body, startY) => {
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.dark);
    doc.text(titulo, 14, startY);

    autoTable(doc, {
      startY: startY + 6,
      head: [head],
      body,
      theme: "striped",
      styles: {
        fontSize: 8.5,
        cellPadding: 3,
        overflow: "linebreak",
        textColor: COLORS.dark,
        lineColor: [230, 230, 230],
      },
      headStyles: {
        fillColor: COLORS.primary,
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
      },
      alternateRowStyles: {
        fillColor: [252, 249, 249],
      },
      margin: { left: 14, right: 14 },
    });

    return doc.lastAutoTable.finalY + 10;
  };

  const getReporteData = (tipo) => {
    if (tipo === "retrasadas") {
      return {
        id: "retrasadas",
        titulo: "Importaciones retrasadas",
        head: [
          "Código",
          "Proveedor",
          "Empleado",
          "Llegada",
          "Días",
          "Nivel",
          "Productos",
          "Inversión",
        ],
        body: retrasadas.map((r) => [
          r.codigo || "—",
          r.proveedorNombre || "—",
          r.empleadoEncargado || "—",
          formatDate(r.fechaLlegada),
          r.diasRetraso || 0,
          r.nivelRetraso || "—",
          r.totalProductos || 0,
          money(r.inversionTotal),
        ]),
      };
    }

    if (tipo === "concluidas") {
      return {
        id: "concluidas",
        titulo: "Importaciones concluidas",
        head: [
          "Código",
          "Proveedor",
          "Empleado",
          "Registro",
          "Llegada",
          "Productos",
          "Inversión",
          "Ganancia",
        ],
        body: concluidas.map((r) => [
          r.codigo || "—",
          r.proveedorNombre || "—",
          r.empleadoEncargado || "—",
          formatDate(r.fechaRegistro),
          formatDate(r.fechaLlegada),
          r.totalProductos || 0,
          money(r.inversionTotal),
          money(r.gananciaEstimada),
        ]),
      };
    }

    if (tipo === "proveedores") {
      return {
        id: "proveedores",
        titulo: "Rendimiento de proveedores",
        head: [
          "Proveedor",
          "Encargado",
          "Teléfono",
          "Total",
          "Concluidas",
          "Retrasadas",
          "Productos",
          "Ganancia",
        ],
        body: proveedores.map((r) => [
          r.razonSocial || "—",
          r.encargado || "—",
          r.telefono || "—",
          r.totalImportaciones || 0,
          r.importacionesConcluidas || 0,
          r.importacionesRetrasadas || 0,
          r.productosImportados || 0,
          money(r.gananciaEstimada),
        ]),
      };
    }

    if (tipo === "empleados") {
      return {
        id: "empleados",
        titulo: "Importaciones por empleado",
        head: [
          "Empleado",
          "Rol",
          "Total",
          "En proceso",
          "Concluidas",
          "Retrasadas",
          "Productos",
          "Inversión",
        ],
        body: empleados.map((r) => [
          r.empleadoNombre || "—",
          r.rol || "—",
          r.totalImportaciones || 0,
          r.enProceso || 0,
          r.concluidas || 0,
          r.retrasadas || 0,
          r.productosGestionados || 0,
          money(r.inversionGestionada),
        ]),
      };
    }

    if (tipo === "mes") {
      return {
        id: "mes",
        titulo: "Importaciones por mes",
        head: [
          "Año",
          "Mes",
          "Importaciones",
          "Productos",
          "Inversión",
          "Venta",
          "Ganancia",
        ],
        body: porMes.map((r) => [
          r.anio || "—",
          r.mes || "—",
          r.totalImportaciones || 0,
          r.productosImportados || 0,
          money(r.inversionTotal),
          money(r.valorVentaTotal),
          money(r.gananciaEstimada),
        ]),
      };
    }

    if (tipo === "modelo") {
      return {
        id: "modelo",
        titulo: "Importaciones por modelo",
        head: ["Modelo", "Color", "Capacidad", "Cantidad", "Costo", "Venta", "Ganancia"],
        body: porModelo.map((r) => [
          r.nombreModelo || "—",
          r.color || "—",
          r.capacidadOTamano || "—",
          r.cantidadProductos || 0,
          money(r.costoTotal),
          money(r.valorVentaTotal),
          money(r.gananciaEstimada),
        ]),
      };
    }

    if (tipo === "rentables") {
      return {
        id: "rentables",
        titulo: "Top modelos rentables",
        head: ["Modelo", "Cantidad", "Costo", "Venta", "Ganancia", "Margen"],
        body: rentables.map((r) => [
          r.nombreModelo || "—",
          r.cantidadProductos || 0,
          money(r.costoTotal),
          money(r.valorVentaTotal),
          money(r.gananciaEstimada),
          `${Number(r.margenPorcentaje || 0).toFixed(2)}%`,
        ]),
      };
    }

    return {
      id: "observados",
      titulo: "Productos observados",
      head: ["Serie", "Modelo", "Importación", "Proveedor", "Empleado", "Estado", "Observación"],
      body: observados.map((r) => [
        r.numeroSerie || "—",
        r.nombreModelo || "—",
        r.codigoImportacion || "—",
        r.proveedorNombre || "—",
        r.empleadoEncargado || "—",
        r.estadoProducto || "—",
        r.obsDescripcion || "—",
      ]),
    };
  };

  const exportarReportesPDF = (reportes) => {
    const reportesConDatos = reportes.filter((r) => r.body?.length);

    if (!reportesConDatos.length) {
      toast.warning("No hay datos para exportar.");
      return;
    }

    const doc = new jsPDF("landscape");

    reportesConDatos.forEach((reporte, index) => {
      if (index > 0) doc.addPage();

      addHeaderPDF(doc, reporte.titulo);
      addTablaPDF(doc, reporte.titulo, reporte.head, reporte.body, 60);
    });

    doc.save(`comercial_poma_importaciones_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const exportarVistaActualPDF = () => {
    const tipoActual = tabMap[tab];
    exportarReportesPDF([getReporteData(tipoActual)]);
    setExportAnchorEl(null);
  };

  const exportarSeleccionadosPDF = () => {
    if (!selectedExports.length) {
      toast.warning("Selecciona al menos un reporte.");
      return;
    }

    const reportes = selectedExports.map((tipo) => getReporteData(tipo));
    exportarReportesPDF(reportes);

    setOpenExportDialog(false);
    setExportAnchorEl(null);
  };
  const ChipEstadoRetraso = ({ label }) => {
    const value = String(label || "").toLowerCase();

    const color = value.includes("concluida")
      ? { bg: "#FEF3C7", text: "#92400E" }
      : { bg: "#FEE2E2", text: "#991B1B" };

    return (
      <Chip
        label={label || "—"}
        size="small"
        sx={{ bgcolor: color.bg, color: color.text, fontWeight: 800 }}
      />
    );
  };
  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              bgcolor: "#592B2B20",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShipWheel size={25} color="#592B2B" />
          </Box>

          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, color: BRAND.dark }}>
              Reporte de Importaciones - COMERCIAL POMA
            </Typography>

            <Typography variant="body2" sx={{ color: BRAND.gray }}>
              Análisis de importaciones concluidas, retrasadas, proveedores,
              empleados, modelos, observaciones y rentabilidad.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            startIcon={<RefreshCcw size={16} />}
            onClick={cargarReporte}
            disabled={loading}
            sx={{
              borderRadius: 2,
              borderColor: "#592B2B",
              color: "#592B2B",
              textTransform: "none",
              fontWeight: 700,
              bgcolor: "white",
            }}
          >
            Actualizar
          </Button>

          <Button
            variant="contained"
            startIcon={<Download size={17} />}
            onClick={(e) => setExportAnchorEl(e.currentTarget)}
            disabled={loading}
            sx={{
              borderRadius: 2,
              bgcolor: BRAND.red,
              textTransform: "none",
              fontWeight: 800,
              px: 2.5,
              boxShadow: "0 8px 18px rgba(164,25,61,0.25)",
              "&:hover": { bgcolor: "#861331" },
            }}
          >
            Exportar PDF
          </Button>
        </Box>

        <Menu
          anchorEl={exportAnchorEl}
          open={openExportMenu}
          onClose={() => setExportAnchorEl(null)}
          PaperProps={{
            sx: {
              borderRadius: 3,
              mt: 1,
              minWidth: 260,
              boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
            },
          }}
        >
          <MenuItem onClick={exportarVistaActualPDF}>
            <ListItemIcon>
              <FileText size={18} />
            </ListItemIcon>
            <ListItemText primary="Exportar vista actual" />
          </MenuItem>

          <MenuItem
            onClick={() => {
              setSelectedExports([tabMap[tab]].filter(Boolean));
              setOpenExportDialog(true);
            }}
          >
            <ListItemIcon>
              <Download size={18} />
            </ListItemIcon>
            <ListItemText primary="Elegir reportes a exportar" />
          </MenuItem>
        </Menu>
      </Box>

      <Card
        variant="outlined"
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 3,
          borderColor: "#f1d2d2",
          bgcolor: "#fdf5f5",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <Filter size={18} color="#592B2B" />
          <Typography sx={{ fontWeight: 700, color: "#3A1A1A" }}>
            Filtros del reporte
          </Typography>
        </Box>

        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar por código, proveedor, empleado, modelo o serie..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              sx={{
                ...fieldStyle,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                  bgcolor: "white",
                  height: 46,
                },
              }}
              InputProps={{
                startAdornment: (
                  <Box sx={{ display: "flex", alignItems: "center", mr: 1 }}>
                    <Search size={17} color="#777" />
                  </Box>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Desde"
              value={filters.fechaDesde}
              onChange={(e) => handleFilterChange("fechaDesde", e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={fieldStyle}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Hasta"
              value={filters.fechaHasta}
              onChange={(e) => handleFilterChange("fechaHasta", e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={fieldStyle}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <TextField
              select
              fullWidth
              size="small"
              label="Proveedor"
              value={filters.proveedor}
              onChange={(e) => handleFilterChange("proveedor", e.target.value)}
              sx={fieldStyle}
            >
              <MenuItem value="">Todos</MenuItem>
              {proveedoresOptions.map((item) => (
                <MenuItem key={item} value={item}>
                  {item}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <TextField
              select
              fullWidth
              size="small"
              label="Estado retraso"
              value={filters.estadoRetraso}
              onChange={(e) => handleFilterChange("estadoRetraso", e.target.value)}
              sx={fieldStyle}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="Pendiente con retraso">Pendiente con retraso</MenuItem>
              <MenuItem value="Concluida con retraso">Concluida con retraso</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <TextField
              select
              fullWidth
              size="small"
              label="Empleado"
              value={filters.empleado}
              onChange={(e) => handleFilterChange("empleado", e.target.value)}
              sx={fieldStyle}
            >
              <MenuItem value="">Todos</MenuItem>
              {empleadosOptions.map((item) => (
                <MenuItem key={item} value={item}>
                  {item}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Retraso"
              value={filters.nivelRetraso}
              onChange={(e) => handleFilterChange("nivelRetraso", e.target.value)}
              sx={fieldStyle}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="Retraso leve">Leve</MenuItem>
              <MenuItem value="Retraso moderado">Moderado</MenuItem>
              <MenuItem value="Retraso crítico">Crítico</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={1.8}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<RefreshCcw size={16} />}
              onClick={limpiarFiltros}
              sx={{
                height: 42,
                borderRadius: 2,
                borderColor: "#592B2B",
                color: "#592B2B",
                bgcolor: "white",
                textTransform: "none",
                fontWeight: 800,
                whiteSpace: "nowrap",
              }}
            >
              Limpiar
            </Button>
          </Grid>
        </Grid>
      </Card>

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {errorMsg}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {cards.map((item) => {
          const Icon = item.icon;

          return (
            <Grid item xs={12} sm={6} md={3} key={item.title}>
              <Card
                variant="outlined"
                sx={{
                  p: 2.2,
                  borderRadius: 4,
                  borderColor: "#eee",
                  height: "100%",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
                }}
              >
                <Box sx={{ display: "flex", gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 46,
                      height: 46,
                      borderRadius: "16px",
                      bgcolor: `${item.color}18`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={23} color={item.color} />
                  </Box>

                  <Box>
                    <Typography sx={{ fontWeight: 800, color: "#2B1111" }}>
                      {item.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.subtitle}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: item.color }}>
                      {item.value}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Card
        variant="outlined"
        sx={{ borderRadius: 3, borderColor: "#f1d2d2", overflow: "hidden" }}
      >
        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          variant="scrollable"
          sx={{
            px: 2,
            borderBottom: "1px solid #eee",
            "& .MuiTab-root": { textTransform: "none", fontWeight: 700 },
            "& .Mui-selected": { color: "#592B2B !important" },
            "& .MuiTabs-indicator": { bgcolor: "#592B2B" },
          }}
        >
          <Tab label="Retrasadas" />
          <Tab label="Concluidas" />
          <Tab label="Proveedores" />
          <Tab label="Empleados" />
          <Tab label="Por mes" />
          <Tab label="Por modelo" />
          <Tab label="Rentables" />
          <Tab label="Observados" />
        </Tabs>

        {loading ? (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <>
            {tab === 0 && (
              <SimpleTable
                rows={retrasadas}
                columns={[
                  ["codigo", "Código"],
                  ["proveedorNombre", "Proveedor"],
                  ["empleadoEncargado", "Empleado"],
                  ["fechaLlegada", "Fecha llegada", formatDate],
                  ["diasRetraso", "Días"],
                  ["nivelRetraso", "Nivel", (v) => <ChipRetraso label={v} />],
                  ["estadoRetraso", "Estado", (v) => <ChipEstadoRetraso label={v} />],
                  ["totalProductos", "Productos"],
                  ["inversionTotal", "Inversión", money],
                ]}
                empty="No hay importaciones retrasadas."
              />
            )}

            {tab === 1 && (
              <SimpleTable
                rows={concluidas}
                columns={[
                  ["codigo", "Código"],
                  ["proveedorNombre", "Proveedor"],
                  ["empleadoEncargado", "Empleado"],
                  ["fechaRegistro", "Fecha registro", formatDate],
                  ["fechaLlegada", "Fecha llegada", formatDate],
                  ["totalProductos", "Productos"],
                  ["inversionTotal", "Inversión", money],
                  ["gananciaEstimada", "Ganancia", money],
                ]}
                empty="No hay importaciones concluidas."
              />
            )}

            {tab === 2 && (
              <SimpleTable
                rows={proveedores}
                columns={[
                  ["razonSocial", "Proveedor"],
                  ["encargado", "Encargado"],
                  ["telefono", "Teléfono"],
                  ["totalImportaciones", "Importaciones"],
                  ["importacionesConcluidas", "Concluidas"],
                  ["importacionesRetrasadas", "Retrasadas"],
                  ["productosImportados", "Productos"],
                  ["gananciaEstimada", "Ganancia", money],
                ]}
                empty="No hay datos de proveedores."
              />
            )}

            {tab === 3 && (
              <SimpleTable
                rows={empleados}
                columns={[
                  ["empleadoNombre", "Empleado"],
                  ["rol", "Rol"],
                  ["totalImportaciones", "Total"],
                  ["enProceso", "En proceso"],
                  ["concluidas", "Concluidas"],
                  ["retrasadas", "Retrasadas"],
                  ["productosGestionados", "Productos"],
                  ["inversionGestionada", "Inversión", money],
                ]}
                empty="No hay datos por empleado."
              />
            )}

            {tab === 4 && (
              <SimpleTable
                rows={porMes}
                columns={[
                  ["anio", "Año"],
                  ["mes", "Mes"],
                  ["totalImportaciones", "Importaciones"],
                  ["productosImportados", "Productos"],
                  ["inversionTotal", "Inversión", money],
                  ["valorVentaTotal", "Valor venta", money],
                  ["gananciaEstimada", "Ganancia", money],
                ]}
                empty="No hay datos por mes."
              />
            )}

            {tab === 5 && (
              <SimpleTable
                rows={porModelo}
                columns={[
                  ["nombreModelo", "Modelo"],
                  ["color", "Color"],
                  ["capacidadOTamano", "Capacidad"],
                  ["cantidadProductos", "Cantidad"],
                  ["costoTotal", "Costo", money],
                  ["valorVentaTotal", "Valor venta", money],
                  ["gananciaEstimada", "Ganancia", money],
                ]}
                empty="No hay datos por modelo."
              />
            )}

            {tab === 6 && (
              <SimpleTable
                rows={rentables}
                columns={[
                  ["nombreModelo", "Modelo"],
                  ["cantidadProductos", "Cantidad"],
                  ["costoTotal", "Costo", money],
                  ["valorVentaTotal", "Valor venta", money],
                  ["gananciaEstimada", "Ganancia", money],
                  ["margenPorcentaje", "Margen", (v) => `${Number(v || 0).toFixed(2)}%`],
                ]}
                empty="No hay modelos rentables."
              />
            )}

            {tab === 7 && (
              <SimpleTable
                rows={observados}
                columns={[
                  ["numeroSerie", "Serie"],
                  ["nombreModelo", "Modelo"],
                  ["codigoImportacion", "Importación"],
                  ["proveedorNombre", "Proveedor"],
                  ["empleadoEncargado", "Empleado"],
                  ["estadoProducto", "Estado", (v) => <ChipObservado label={v} />],
                  ["obsDescripcion", "Observación"],
                ]}
                empty="No hay productos observados."
              />
            )}
          </>
        )}
      </Card>

      <Dialog
        open={openExportDialog}
        onClose={() => setOpenExportDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: "#2B1111" }}>
          Seleccionar reportes para exportar
        </DialogTitle>

        <DialogContent dividers>
          {exportOptions.map(([id, label]) => (
            <FormControlLabel
              key={id}
              control={
                <Checkbox
                  checked={selectedExports.includes(id)}
                  onChange={(e) => {
                    setSelectedExports((prev) =>
                      e.target.checked
                        ? [...prev, id]
                        : prev.filter((item) => item !== id)
                    );
                  }}
                  sx={{
                    color: "#592B2B",
                    "&.Mui-checked": {
                      color: "#A4193D",
                    },
                  }}
                />
              }
              label={label}
              sx={{
                display: "block",
                mb: 0.5,
              }}
            />
          ))}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setOpenExportDialog(false)}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              color: "#592B2B",
            }}
          >
            Cancelar
          </Button>

          <Button
            variant="contained"
            startIcon={<Download size={17} />}
            onClick={exportarSeleccionadosPDF}
            sx={{
              borderRadius: 2,
              bgcolor: "#A4193D",
              textTransform: "none",
              fontWeight: 800,
              "&:hover": { bgcolor: "#861331" },
            }}
          >
            Exportar PDF
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const formatDate = (value) => {
  if (!value) return "—";
  return String(value).substring(0, 10);
};

const ChipRetraso = ({ label }) => {
  const value = String(label || "").toLowerCase();

  const color = value.includes("crítico")
    ? { bg: "#FEE2E2", text: "#991B1B" }
    : value.includes("moderado")
    ? { bg: "#FEF3C7", text: "#92400E" }
    : { bg: "#DBEAFE", text: "#1D4ED8" };

  return (
    <Chip
      label={label || "—"}
      size="small"
      sx={{ bgcolor: color.bg, color: color.text, fontWeight: 800 }}
    />
  );
};

const ChipObservado = ({ label }) => (
  <Chip
    label={label || "Observado"}
    size="small"
    sx={{ bgcolor: "#FEE2E2", color: "#991B1B", fontWeight: 800 }}
  />
);

const SimpleTable = ({ rows = [], columns = [], empty = "Sin datos" }) => (
  <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 620 }}>
    <Table stickyHeader size="small">
      <TableHead>
        <TableRow>
          {columns.map(([key, label]) => (
            <TableCell
              key={key}
              sx={{
                fontWeight: 800,
                bgcolor: "#FAFAFA",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>

      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
              {empty}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row, index) => (
            <TableRow
              key={`${index}-${row.codigo || row.numeroSerie || row.proveedorNombre || row.empleadoNombre || "row"}`}
              hover
            >
              {columns.map(([key, , format]) => (
                <TableCell key={key} sx={{ whiteSpace: "nowrap" }}>
                  {format ? format(row[key], row) : row[key] ?? "—"}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </TableContainer>
);

export default ReporteImportacion;