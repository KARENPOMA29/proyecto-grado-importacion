// src/pages/reportes/ReporteVenta.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
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
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import {
  BarChart3,
  DollarSign,
  Download,
  FileText,
  Filter,
  Package,
  RefreshCcw,
  ShoppingCart,
} from "lucide-react";

import { toast } from "react-toastify";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import ServiceReporteVentas from "@/services/ServiceReporteVentas";
import ServiceSucursal from "@/services/ServiceSucursal";
import ServiceCategoria from "@/services/ServiceCategoria";
import ServiceModelo from "@/services/ServiceModeloProducto";
import ServiceEmpleado from "@/services/ServiceEmpleado";

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
  success: [16, 138, 76],
  info: [37, 99, 235],
  warning: [202, 138, 4],
};

const estadoTexto = (estado) => {
  if (estado === 1) return "Activa";
  if (estado === 0) return "Anulada";
  return "Desconocido";
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
  "& .MuiSelect-select": {
    display: "flex",
    alignItems: "center",
  },
};

const ReporteVenta = () => {
  const [tab, setTab] = useState(0);

  const [filters, setFilters] = useState({
    search: "",
    fechaDesde: "",
    fechaHasta: "",
    estado: 1,
    sucursalId: "",
    categoriaId: "",
    modeloId: "",
    empleadoId: "",
  });

  const [dashboard, setDashboard] = useState({
    cantidadVentas: 0,
    productosVendidos: 0,
    totalVendido: 0,
    ticketPromedio: 0,
  });

  const [detalle, setDetalle] = useState([]);
  const [porDia, setPorDia] = useState([]);
  const [porSucursal, setPorSucursal] = useState([]);
  const [porProducto, setPorProducto] = useState([]);

  const [totalDetalle, setTotalDetalle] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [sucursales, setSucursales] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [empleados, setEmpleados] = useState([]);

  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const [openExportDialog, setOpenExportDialog] = useState(false);
  const [selectedExports, setSelectedExports] = useState([]);

  const openExportMenu = Boolean(exportAnchorEl);

  const buildParams = useMemo(() => {
    const params = {
      page: page + 1,
      pageSize,
    };

    if (filters.search?.trim()) params.search = filters.search.trim();
    if (filters.fechaDesde) params.fechaDesde = filters.fechaDesde;
    if (filters.fechaHasta) params.fechaHasta = filters.fechaHasta;

    if (filters.estado !== "" && filters.estado !== null) {
      params.estado = Number(filters.estado);
    }

    if (filters.sucursalId) params.sucursalId = Number(filters.sucursalId);
    if (filters.categoriaId) params.categoriaId = Number(filters.categoriaId);
    if (filters.modeloId) params.modeloId = Number(filters.modeloId);
    if (filters.empleadoId) params.empleadoId = Number(filters.empleadoId);

    return params;
  }, [filters, page, pageSize]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));

    setPage(0);
  };

  const limpiarFiltros = () => {
    setFilters({
      search: "",
      fechaDesde: "",
      fechaHasta: "",
      estado: 1,
      sucursalId: "",
      categoriaId: "",
      modeloId: "",
      empleadoId: "",
    });

    setPage(0);
  };

  const cargarReporte = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      const [dashRes, detalleRes, diaRes, sucRes, prodRes] =
        await Promise.allSettled([
          ServiceReporteVentas.getDashboard(buildParams),
          ServiceReporteVentas.getDetalle(buildParams),
          ServiceReporteVentas.getPorDia(buildParams),
          ServiceReporteVentas.getPorSucursal(buildParams),
          ServiceReporteVentas.getPorProducto(buildParams),
        ]);

      if (dashRes.status === "fulfilled") {
        setDashboard(dashRes.value || {});
      }

      if (detalleRes.status === "fulfilled") {
        setDetalle(detalleRes.value?.items || []);
        setTotalDetalle(detalleRes.value?.total || 0);
      }

      if (diaRes.status === "fulfilled") {
        setPorDia(Array.isArray(diaRes.value) ? diaRes.value : []);
      }

      if (sucRes.status === "fulfilled") {
        setPorSucursal(Array.isArray(sucRes.value) ? sucRes.value : []);
      }

      if (prodRes.status === "fulfilled") {
        setPorProducto(Array.isArray(prodRes.value) ? prodRes.value : []);
      }

      const rejected = [dashRes, detalleRes, diaRes, sucRes, prodRes].find(
        (r) => r.status === "rejected"
      );

      if (rejected) throw rejected.reason;
    } catch (error) {
      console.error(error);
      setErrorMsg(error.message || "Error al cargar reporte de ventas");
      toast.error(error.message || "Error al cargar reporte de ventas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cargarCombos = async () => {
      try {
        const [sucRes, catRes, modRes, empRes] = await Promise.all([
          ServiceSucursal.getAll({ page: 1, pageSize: 1000 }),
          ServiceCategoria.getAll({ page: 1, pageSize: 1000 }),
          ServiceModelo.getAll({ page: 1, pageSize: 1000 }),
          ServiceEmpleado.getAll({ page: 1, pageSize: 1000, rol: "Ventas" }),
        ]);

        setSucursales(Array.isArray(sucRes) ? sucRes : sucRes.items || []);
        setCategorias(Array.isArray(catRes) ? catRes : catRes.items || []);
        setModelos(Array.isArray(modRes) ? modRes : modRes.items || []);

        const empleadosData = Array.isArray(empRes) ? empRes : empRes.items || [];

        setEmpleados(
          empleadosData.filter(
            (e) => String(e.rol || "").toLowerCase() === "ventas"
          )
        );
      } catch (error) {
        console.error(error);
        toast.error(error.message || "Error al cargar filtros");
      }
    };

    cargarCombos();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      cargarReporte();
    }, 350);

    return () => clearTimeout(timer);
  }, [buildParams]);

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
      filters.estado === 1 ? "Estado: Activas" : null,
      filters.estado === 0 ? "Estado: Anuladas" : null,
    ]
      .filter(Boolean)
      .join("   |   ");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.gray);
    doc.text(filtros || "Sin filtros aplicados", 14, 52);
  };

  const addResumenPDF = (doc, startY = 60) => {
    autoTable(doc, {
      startY,
      head: [["Indicador", "Valor"]],
      body: [
        ["Ingresos por ventas", money(dashboard.totalVendido)],
        ["Ventas realizadas", dashboard.cantidadVentas || 0],
        ["Productos vendidos", dashboard.productosVendidos || 0],
        ["Promedio por venta", money(dashboard.ticketPromedio)],
      ],
      theme: "grid",
      styles: {
        fontSize: 10,
        cellPadding: 5,
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
        fillColor: COLORS.light,
      },
      didParseCell: (data) => {
        if (data.section === "body") {
          if (data.row.index === 0) {
            data.cell.styles.textColor = COLORS.success;
            data.cell.styles.fontStyle = "bold";
          }

          if (data.row.index === 2) {
            data.cell.styles.textColor = COLORS.info;
            data.cell.styles.fontStyle = "bold";
          }

          if (data.row.index === 3) {
            data.cell.styles.textColor = COLORS.warning;
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
    });

    return doc.lastAutoTable.finalY + 10;
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
      bodyStyles: {
        valign: "middle",
      },
      alternateRowStyles: {
        fillColor: [252, 249, 249],
      },
      margin: {
        left: 14,
        right: 14,
      },
      didDrawPage: () => {
        const pageCount = doc.internal.getNumberOfPages();

        doc.setFontSize(8);
        doc.setTextColor(...COLORS.gray);
        doc.text(
          `COMERCIAL POMA • Página ${pageCount}`,
          14,
          doc.internal.pageSize.height - 6
        );
      },
    });

    return doc.lastAutoTable.finalY + 10;
  };

  const getReporteData = (tipo) => {
    if (tipo === "detalle") {
      return {
        titulo: "Detalle completo de ventas",
        head: [
          "Fecha",
          "Código",
          "Cliente",
          "Empleado",
          "Sucursal",
          "Producto",
          "Categoría",
          "Modelo",
          "Estado",
          "Subtotal",
        ],
        body: detalle.map((row) => [
          row.fechaVentaSolo || "—",
          row.codigoVenta || "—",
          row.clienteNombre || "—",
          row.empleadoNombre || "—",
          row.sucursalNombre || "—",
          row.numeroSerie || "—",
          row.categoriaNombre || "—",
          row.nombreModelo || "—",
          row.estadoVentaTexto || estadoTexto(row.estadoVenta),
          money(row.subtotal),
        ]),
      };
    }

    if (tipo === "dia") {
      return {
        titulo: "Resumen diario de ventas",
        head: [
          "Fecha",
          "Ventas realizadas",
          "Productos vendidos",
          "Ingresos",
          "Promedio por venta",
        ],
        body: porDia.map((row) => [
          row.fecha || "—",
          row.cantidadVentas || 0,
          row.productosVendidos || 0,
          money(row.totalVendido),
          money(row.ticketPromedio),
        ]),
      };
    }

    if (tipo === "sucursal") {
      return {
        titulo: "Rendimiento por sucursales",
        head: [
          "Ciudad",
          "Sucursal",
          "Ventas realizadas",
          "Productos vendidos",
          "Ingresos",
          "Ventas anuladas",
        ],
        body: porSucursal.map((row) => [
          row.ciudadNombre || "—",
          row.sucursalNombre || "—",
          row.cantidadVentas || 0,
          row.productosVendidos || 0,
          money(row.totalVendido),
          row.ventasAnuladas || 0,
        ]),
      };
    }

    return {
      titulo: "Productos más vendidos",
      head: [
        "Categoría",
        "Modelo",
        "Color",
        "Vendidos",
        "Ingresos",
        "Precio promedio",
      ],
      body: porProducto.map((row) => [
        row.categoriaNombre || "—",
        row.nombreModelo || "—",
        row.color || "—",
        row.productosVendidos || 0,
        money(row.totalVendido),
        money(row.precioPromedioVenta),
      ]),
    };
  };

  const getAllReportesPDF = () => [
    {
      id: "detalle",
      grupo: "Ventas",
      ...getReporteData("detalle"),
    },
    {
      id: "dia",
      grupo: "Ventas",
      ...getReporteData("dia"),
    },
    {
      id: "sucursal",
      grupo: "Ventas",
      ...getReporteData("sucursal"),
    },
    {
      id: "producto",
      grupo: "Ventas",
      ...getReporteData("producto"),
    },
  ];

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

      let y = 60;

      if (index === 0) {
        y = addResumenPDF(doc, 60);
      }

      addTablaPDF(doc, reporte.titulo, reporte.head, reporte.body, y);
    });

    doc.save(
      `comercial_poma_reporte_ventas_${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`
    );

    setExportAnchorEl(null);
  };

  const exportarPDF = (tipo = "actual") => {
    const tabMap = ["detalle", "dia", "sucursal", "producto"];
    const tipoFinal = tipo === "actual" ? tabMap[tab] : tipo;

    if (tipoFinal === "todo") {
      exportarReportesPDF(getAllReportesPDF());
      return;
    }

    const data = getReporteData(tipoFinal);

    exportarReportesPDF([
      {
        id: tipoFinal,
        grupo: "Ventas",
        ...data,
      },
    ]);
  };

  const exportarSeleccionadosPDF = () => {
    if (!selectedExports.length) {
      toast.warning("Selecciona al menos un reporte.");
      return;
    }

    const reportes = getAllReportesPDF().filter((item) =>
      selectedExports.includes(item.id)
    );

    exportarReportesPDF(reportes);
    setOpenExportDialog(false);
  };

  const cards = [
    {
      title: "Ingresos por ventas",
      subtitle: "Monto total vendido",
      value: money(dashboard.totalVendido),
      icon: DollarSign,
      color: "#0D8C47",
    },
    {
      title: "Ventas realizadas",
      subtitle: "Cantidad de ventas registradas",
      value: dashboard.cantidadVentas || 0,
      icon: ShoppingCart,
      color: BRAND.red,
    },
    {
      title: "Productos vendidos",
      subtitle: "Unidades vendidas",
      value: dashboard.productosVendidos || 0,
      icon: Package,
      color: "#2563EB",
    },
    {
      title: "Promedio por venta",
      subtitle: "Monto promedio de cada venta",
      value: money(dashboard.ticketPromedio),
      icon: BarChart3,
      color: "#B45309",
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: "#fbfbfb", minHeight: "100vh" }}>
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
              width: 50,
              height: 50,
              borderRadius: "18px",
              bgcolor: "#a4193d18",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `1px solid ${BRAND.light}`,
            }}
          >
            <BarChart3 size={25} color={BRAND.red} />
          </Box>

          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, color: BRAND.dark }}>
              Reporte de Ventas - COMERCIAL POMA
            </Typography>

            <Typography variant="body2" sx={{ color: BRAND.gray }}>
              15 años en la industria de ventas de línea blanca.
            </Typography>
          </Box>
        </Box>
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

        <Menu
          anchorEl={exportAnchorEl}
          open={openExportMenu}
          onClose={() => setExportAnchorEl(null)}
          PaperProps={{
            sx: {
              borderRadius: 3,
              mt: 1,
              minWidth: 280,
              boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
            },
          }}
        >
          <MenuItem onClick={() => exportarPDF("actual")}>
            <ListItemIcon>
              <FileText size={18} />
            </ListItemIcon>
            <ListItemText primary="Exportar pestaña actual" />
          </MenuItem>

          <MenuItem
            onClick={() => {
              const tabMap = ["detalle", "dia", "sucursal", "producto"];
              setSelectedExports([tabMap[tab]]);
              setOpenExportDialog(true);
            }}
          >
            <ListItemIcon>
              <Download size={18} />
            </ListItemIcon>
            <ListItemText primary="Elegir reportes a exportar" />
          </MenuItem>

          <MenuItem onClick={() => exportarPDF("todo")}>
            <ListItemIcon>
              <Download size={18} />
            </ListItemIcon>
            <ListItemText primary="Exportar todo el reporte" />
          </MenuItem>

          <Divider />

         
        </Menu>
      </Box>

      <Card
        variant="outlined"
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 4,
          borderColor: BRAND.light,
          bgcolor: "#f8f6f6",
          boxShadow: "0 8px 24px rgba(0,0,0,0.03)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <Filter size={18} color={BRAND.red} />
          <Typography sx={{ fontWeight: 800, color: BRAND.dark }}>
            Filtros del reporte
          </Typography>
        </Box>

        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar por código, cliente, producto, modelo, serie o sucursal..."
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
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mr: 1,
                      color: BRAND.gray,
                    }}
                  >
                    🔍
                  </Box>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2.2}>
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

          <Grid item xs={12} sm={6} md={2.2}>
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

          <Grid item xs={12} sm={6} md={1.7}>
            <TextField
              select
              fullWidth
              size="small"
              label="Estado"
              value={filters.estado}
              onChange={(e) => handleFilterChange("estado", e.target.value)}
              sx={fieldStyle}
            >
              <MenuItem value="">Todas</MenuItem>
              <MenuItem value={1}>Activas</MenuItem>
              <MenuItem value={0}>Anuladas</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={2.2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Sucursal"
              value={filters.sucursalId}
              onChange={(e) => handleFilterChange("sucursalId", e.target.value)}
              sx={fieldStyle}
              SelectProps={{
                MenuProps: {
                  PaperProps: {
                    sx: {
                      maxHeight: 320,
                    },
                  },
                },
              }}
            >
              <MenuItem value="">Todas</MenuItem>
              {sucursales.map((sucursal) => (
                <MenuItem key={sucursal.id} value={sucursal.id}>
                  {sucursal.nombre}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={2.2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Categoría"
              value={filters.categoriaId}
              onChange={(e) => handleFilterChange("categoriaId", e.target.value)}
              sx={fieldStyle}
            >
              <MenuItem value="">Todas</MenuItem>
              {categorias.map((categoria) => (
                <MenuItem key={categoria.id} value={categoria.id}>
                  {categoria.nombre}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={2.2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Modelo"
              value={filters.modeloId}
              onChange={(e) => handleFilterChange("modeloId", e.target.value)}
              sx={fieldStyle}
            >
              <MenuItem value="">Todos</MenuItem>
              {modelos.map((modelo) => (
                <MenuItem key={modelo.id} value={modelo.id}>
                  {modelo.nombreModelo || modelo.nombre}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={2.2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Empleado"
              value={filters.empleadoId}
              onChange={(e) => handleFilterChange("empleadoId", e.target.value)}
              sx={fieldStyle}
            >
              <MenuItem value="">Todos</MenuItem>
              {empleados.map((empleado) => (
                <MenuItem key={empleado.id} value={empleado.id}>
                  {[empleado.nombre, empleado.apellido].filter(Boolean).join(" ")}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={1.8}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<RefreshCcw size={16} />}
              onClick={limpiarFiltros}
              sx={{
                height: 40,
                borderRadius: 2,
                borderColor: BRAND.red,
                color: BRAND.red,
                bgcolor: "white",
                textTransform: "none",
                fontWeight: 800,
                whiteSpace: "nowrap",
                "&:hover": {
                  borderColor: BRAND.red,
                  bgcolor: "#a4193d10",
                },
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
                  borderColor: BRAND.light,
                  height: "100%",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
                  bgcolor: "white",
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
                    <Typography sx={{ fontWeight: 900, color: BRAND.dark }}>
                      {item.title}
                    </Typography>

                    <Typography
                      variant="caption"
                      sx={{ display: "block", mb: 0.5, color: BRAND.gray }}
                    >
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
        sx={{
          borderRadius: 4,
          borderColor: BRAND.light,
          overflow: "hidden",
          bgcolor: "white",
          boxShadow: "0 8px 24px rgba(0,0,0,0.03)",
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 2,
            borderBottom: "1px solid #eee",
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 800,
            },
            "& .Mui-selected": {
              color: `${BRAND.red} !important`,
            },
            "& .MuiTabs-indicator": {
              bgcolor: BRAND.red,
              height: 3,
              borderRadius: 2,
            },
          }}
        >
          <Tab label="Detalle completo" />
          <Tab label="Resumen diario" />
          <Tab label="Rendimiento sucursales" />
          <Tab label="Productos más vendidos" />
        </Tabs>

        {tab === 0 && (
          <>
            <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 620 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    {[
                      "Fecha",
                      "Código",
                      "Cliente",
                      "Empleado",
                      "Sucursal",
                      "Producto",
                      "Categoría",
                      "Modelo",
                      "Estado",
                      "Subtotal",
                    ].map((label) => (
                      <TableCell
                        key={label}
                        align={label === "Subtotal" ? "right" : "left"}
                        sx={{
                          fontWeight: 900,
                          bgcolor: "#f8f6f6",
                          color: BRAND.dark,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                        <CircularProgress size={30} />
                      </TableCell>
                    </TableRow>
                  ) : detalle.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                        No se encontraron ventas.
                      </TableCell>
                    </TableRow>
                  ) : (
                    detalle.map((row, index) => (
                      <TableRow
                        key={`${page}-${pageSize}-${index}-${
                          row.detalleVentaId ||
                          row.ventaId ||
                          row.codigoVenta ||
                          row.numeroSerie ||
                          "venta"
                        }`}
                        hover
                      >
                        <TableCell>{row.fechaVentaSolo || "—"}</TableCell>

                        <TableCell sx={{ fontWeight: 800 }}>
                          {row.codigoVenta || "—"}
                        </TableCell>

                        <TableCell>{row.clienteNombre || "—"}</TableCell>

                        <TableCell>{row.empleadoNombre || "—"}</TableCell>

                        <TableCell>
                          <Typography variant="body2">
                            {row.sucursalNombre || "—"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {row.ciudadNombre || "—"}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography sx={{ fontWeight: 800 }}>
                            {row.numeroSerie || "—"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {row.productoDescripcion || "Sin descripción"}
                          </Typography>
                        </TableCell>

                        <TableCell>{row.categoriaNombre || "—"}</TableCell>

                        <TableCell>
                          <Typography sx={{ fontWeight: 800 }}>
                            {row.nombreModelo || "—"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {[row.color, row.capacidadOTamano]
                              .filter(Boolean)
                              .join(" • ") || "—"}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={row.estadoVentaTexto || estadoTexto(row.estadoVenta)}
                            size="small"
                            sx={{
                              bgcolor:
                                row.estadoVenta === 1 ? "#0D8C4720" : "#FEE2E2",
                              color: row.estadoVenta === 1 ? "#0D8C47" : "#991B1B",
                              fontWeight: 800,
                            }}
                          />
                        </TableCell>

                        <TableCell align="right" sx={{ fontWeight: 900 }}>
                          {money(row.subtotal)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={totalDetalle}
              page={page}
              rowsPerPage={pageSize}
              rowsPerPageOptions={[10, 20, 50, 100]}
              labelRowsPerPage="Filas por página"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
              }
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setPageSize(parseInt(e.target.value, 10));
                setPage(0);
              }}
              sx={{
                borderTop: "1px solid #eee",
                bgcolor: "#fff",
              }}
            />
          </>
        )}

        {tab === 1 && (
          <SimpleTable
            rows={porDia}
            columns={[
              ["fecha", "Fecha"],
              ["cantidadVentas", "Ventas realizadas"],
              ["productosVendidos", "Productos vendidos"],
              ["totalVendido", "Ingresos", money],
              ["ticketPromedio", "Promedio por venta", money],
            ]}
            empty="No hay ventas por día."
          />
        )}

        {tab === 2 && (
          <SimpleTable
            rows={porSucursal}
            columns={[
              ["ciudadNombre", "Ciudad"],
              ["sucursalNombre", "Sucursal"],
              ["cantidadVentas", "Ventas realizadas"],
              ["productosVendidos", "Productos vendidos"],
              ["totalVendido", "Ingresos", money],
              ["ventasAnuladas", "Ventas anuladas"],
            ]}
            empty="No hay ventas por sucursal."
          />
        )}

        {tab === 3 && (
          <SimpleTable
            rows={porProducto}
            columns={[
              ["categoriaNombre", "Categoría"],
              ["nombreModelo", "Modelo"],
              ["color", "Color"],
              ["productosVendidos", "Vendidos"],
              ["totalVendido", "Ingresos", money],
              ["precioPromedioVenta", "Precio promedio", money],
            ]}
            empty="No hay ventas por producto."
          />
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
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: BRAND.dark,
            color: "white",
            fontWeight: 900,
          }}
        >
          Exportar reportes de ventas
        </DialogTitle>

        <DialogContent sx={{ p: 3, bgcolor: "#fafafa" }}>
          <Typography sx={{ fontWeight: 900, color: BRAND.dark }}>
            COMERCIAL POMA
          </Typography>

          <Typography variant="body2" sx={{ color: BRAND.gray, mb: 2 }}>
            Selecciona una o varias pestañas para exportarlas en un solo PDF.
          </Typography>

          <Divider sx={{ mb: 2 }} />

          {getAllReportesPDF().map((item) => (
            <FormControlLabel
              key={item.id}
              sx={{
                display: "flex",
                mb: 1,
                px: 1.5,
                py: 0.7,
                borderRadius: 2,
                bgcolor: selectedExports.includes(item.id)
                  ? "#a4193d12"
                  : "white",
                border: selectedExports.includes(item.id)
                  ? `1px solid ${BRAND.red}`
                  : "1px solid #eee",
              }}
              control={
                <Checkbox
                  checked={selectedExports.includes(item.id)}
                  onChange={(e) => {
                    setSelectedExports((prev) =>
                      e.target.checked
                        ? [...prev, item.id]
                        : prev.filter((id) => id !== item.id)
                    );
                  }}
                  sx={{
                    color: BRAND.red,
                    "&.Mui-checked": {
                      color: BRAND.red,
                    },
                  }}
                />
              }
              label={
                <Box>
                  <Typography sx={{ fontWeight: 800, color: BRAND.dark }}>
                    {item.titulo}
                  </Typography>

                  <Typography variant="caption" sx={{ color: BRAND.gray }}>
                    {item.grupo}
                  </Typography>
                </Box>
              }
            />
          ))}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, bgcolor: BRAND.light }}>
          <Button
            onClick={() => setOpenExportDialog(false)}
            sx={{
              color: BRAND.dark,
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            Cancelar
          </Button>

          <Button
            variant="contained"
            onClick={exportarSeleccionadosPDF}
            sx={{
              bgcolor: BRAND.red,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 800,
              "&:hover": {
                bgcolor: "#861331",
              },
            }}
          >
            Exportar seleccionados
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const SimpleTable = ({ rows = [], columns = [], empty = "Sin datos" }) => {
  return (
    <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 620 }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            {columns.map(([key, label]) => (
              <TableCell
                key={key}
                sx={{
                  fontWeight: 900,
                  bgcolor: "#f8f6f6",
                  color: BRAND.dark,
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
                key={`${index}-${
                  row.fecha ||
                  row.sucursalId ||
                  row.modeloId ||
                  row.categoriaId ||
                  row.nombreModelo ||
                  "row"
                }`}
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
};

export default ReporteVenta;