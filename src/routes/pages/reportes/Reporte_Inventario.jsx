// src/pages/reportes/Reporte_Inventario.jsx
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
  TablePagination,
  TextField,
  Typography,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
} from "@mui/material";

import {
  BarChart3,
  Boxes,
  CircleAlert,
  DollarSign,
  Download,
  FileText,
  Filter,
  Package,
  RefreshCcw,
  TrendingUp,
  Warehouse,
} from "lucide-react";

import { toast } from "react-toastify";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import ServiceCiudad from "@/services/ServiceCiudad";
import ServiceSucursal from "@/services/ServiceSucursal";
import ServiceAlmacen from "@/services/ServiceAlmacen";
import ServiceCategoria from "@/services/ServiceCategoria";
import ServiceModelo from "@/services/ServiceModeloProducto";
import ServiceProveedor from "@/services/ServiceProveedor";
import ServiceReporteInventario from "@/services/ServiceReporteInventario";

const money = (value) => `Bs ${Number(value || 0).toFixed(2)}`;
const normalizeList = (res) => {
  if (Array.isArray(res)) {
    return { items: res, total: res.length };
  }

  return {
    items: res?.items || res?.data || [],
    total: res?.total ?? res?.count ?? res?.items?.length ?? res?.data?.length ?? 0,
  };
};
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



const entradaTabs = [
  "Detalle completo",
  "Resumen diario",
  "Sucursal / Almacén",
  "Productos",
  "Importaciones",
  "Proveedores",
  "Observados",
];

const stockTabs = ["Stock agrupado", "Productos disponibles"];

const defaultPagination = {
  porDia: { page: 0, pageSize: 20, total: 0 },
  porSucursal: { page: 0, pageSize: 20, total: 0 },
  porProducto: { page: 0, pageSize: 20, total: 0 },
  porImportacion: { page: 0, pageSize: 20, total: 0 },
  porProveedor: { page: 0, pageSize: 20, total: 0 },
  observados: { page: 0, pageSize: 20, total: 0 },
  stockActual: { page: 0, pageSize: 20, total: 0 },
};

const tabStyle = {
  px: 2,
  mt: 1,
  borderBottom: "1px solid #eee",
  "& .MuiTab-root": {
    textTransform: "none",
    fontWeight: 700,
  },
  "& .Mui-selected": {
    color: "#592B2B !important",
  },
  "& .MuiTabs-indicator": {
    bgcolor: "#592B2B",
  },
};

const SimpleTable = ({
  rows = [],
  columns = [],
  empty = "Sin datos",
  loading = false,
  total = 0,
  page = 0,
  rowsPerPage = 20,
  onPageChange,
  onRowsPerPageChange,
}) => {
  const showPagination =
    typeof onPageChange === "function" &&
    typeof onRowsPerPageChange === "function";

  return (
    <Box>
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ maxHeight: 620, borderRadius: 0 }}
      >
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {columns.map(([key, label]) => (
                <TableCell
                  key={key}
                  sx={{
                    fontWeight: 800,
                    bgcolor: "#faf7f7",
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
                <TableCell colSpan={columns.length} align="center" sx={{ py: 8 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  align="center"
                  sx={{ py: 8, color: "text.secondary" }}
                >
                  {empty}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow
                  key={`${page}-${rowsPerPage}-${index}-${
                    row.movimientoId ||
                    row.productoId ||
                    row.numeroSerie ||
                    row.importacionId ||
                    row.proveedorId ||
                    row.modeloId ||
                    row.sucursalId ||
                    row.almacenId ||
                    "row"
                  }`}
                  hover
                >
                  {columns.map(([key, , format]) => {
                    const value = row[key];

                    return (
                      <TableCell key={key} sx={{ whiteSpace: "nowrap" }}>
                        {format ? format(value, row) : value ?? "—"}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {showPagination && (
        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, newPage) => onPageChange(newPage)}
          onRowsPerPageChange={(e) => {
            onRowsPerPageChange(parseInt(e.target.value, 10));
            onPageChange(0);
          }}
          rowsPerPageOptions={[10, 20, 50, 100]}
          labelRowsPerPage="Filas por página"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          sx={{ borderTop: "1px solid #eee", bgcolor: "#fff" }}
        />
      )}
    </Box>
  );
};

export default function Reporte_Inventario() {
  const [mainTab, setMainTab] = useState(0);
  const [entradaTab, setEntradaTab] = useState(0);
  const [stockTab, setStockTab] = useState(0);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [dashboardEntradas, setDashboardEntradas] = useState({});
  const [dashboardStock, setDashboardStock] = useState({});

  const [detalle, setDetalle] = useState([]);
  const [porDia, setPorDia] = useState([]);
  const [porSucursal, setPorSucursal] = useState([]);
  const [porProducto, setPorProducto] = useState([]);
  const [porImportacion, setPorImportacion] = useState([]);
  const [porProveedor, setPorProveedor] = useState([]);
  const [observados, setObservados] = useState([]);

  const [stockActual, setStockActual] = useState([]);
  const [stockDetalle, setStockDetalle] = useState([]);

  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const [openExportDialog, setOpenExportDialog] = useState(false);
  const [selectedExports, setSelectedExports] = useState([]);
  const openExportMenu = Boolean(exportAnchorEl);

  const [ciudades, setCiudades] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [proveedores, setProveedores] = useState([]);

  const [detalleTotal, setDetalleTotal] = useState(0);
  const [stockDetalleTotal, setStockDetalleTotal] = useState(0);

  const [detallePage, setDetallePage] = useState(0);
  const [detallePageSize, setDetallePageSize] = useState(20);

  const [stockDetallePage, setStockDetallePage] = useState(0);
  const [stockDetallePageSize, setStockDetallePageSize] = useState(20);

  const [tablePagination, setTablePagination] = useState(defaultPagination);

  const [filters, setFilters] = useState({
    search: "",
    fechaDesde: "",
    fechaHasta: "",
    ciudadId: "",
    sucursalId: "",
    almacenId: "",
    categoriaId: "",
    modeloId: "",
    proveedorId: "",
    observado: "",
  });

  // ============================================================
  // DETERMINAR FILTROS ACTIVOS SEGÚN TAB Y SUBTAB
  // ============================================================
  const getActiveFilters = () => {
    if (mainTab === 0) {
      // ENTRADAS - Todos los filtros disponibles
      return [
        "search",
        "fechaDesde",
        "fechaHasta",
        "ciudadId",
        "sucursalId",
        "almacenId",
        "categoriaId",
        "modeloId",
        "proveedorId",
        "observado",
      ];
    }

    if (mainTab === 1) {
      if (stockTab === 0) {
        // STOCK AGRUPADO - Solo filtros básicos
        return [
          "search",
          "ciudadId",
          "sucursalId",
          "almacenId",
          "categoriaId",
          "modeloId",
        ];
      }

      if (stockTab === 1) {
        // STOCK DETALLE - Todos excepto importación
        return [
          "search",
          "fechaDesde",
          "fechaHasta",
          "ciudadId",
          "sucursalId",
          "almacenId",
          "categoriaId",
          "modeloId",
          "proveedorId",
          "observado",
        ];
      }
    }

    return [];
  };



  const handleTablePageChange = (key, page) => {
    setTablePagination((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        page,
      },
    }));
  };

  const handleTablePageSizeChange = (key, pageSize) => {
    setTablePagination((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        page: 0,
        pageSize,
      },
    }));
  };

  const setTableTotal = (key, total) => {
    setTablePagination((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        total: total || 0,
      },
    }));
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => {
      const updated = { ...prev, [field]: value };

      if (field === "ciudadId") {
        updated.sucursalId = "";
        updated.almacenId = "";
      }

      if (field === "sucursalId") {
        updated.almacenId = "";
      }

      return updated;
    });
  };

  const limpiarFiltros = () => {
    setFilters({
      search: "",
      fechaDesde: "",
      fechaHasta: "",
      ciudadId: "",
      sucursalId: "",
      almacenId: "",
      categoriaId: "",
      modeloId: "",
      proveedorId: "",
      observado: "",
    });
  };

  const sucursalesFiltradas = useMemo(() => {
    if (!filters.ciudadId) return sucursales;

    return sucursales.filter(
      (s) => Number(s.idCiudad || s.ciudadId) === Number(filters.ciudadId)
    );
  }, [sucursales, filters.ciudadId]);

  const almacenesFiltrados = useMemo(() => {
    if (!filters.sucursalId) return almacenes;

    return almacenes.filter(
      (a) => Number(a.sucursalId) === Number(filters.sucursalId)
    );
  }, [almacenes, filters.sucursalId]);

  const cargarReporte = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      const [
        dashEntradasRes,
        detalleRes,
        diaRes,
        sucursalRes,
        productoRes,
        importacionRes,
        proveedorRes,
        observadosRes,
        dashStockRes,
        stockRes,
        stockDetalleRes,
      ] = await Promise.allSettled([
        ServiceReporteInventario.getDashboard(params),

        ServiceReporteInventario.getDetalle({
          ...params,
          page: detallePage + 1,
          pageSize: detallePageSize,
        }),

        ServiceReporteInventario.getPorDia({
          ...params,
          page: tablePagination.porDia.page + 1,
          pageSize: tablePagination.porDia.pageSize,
        }),

        ServiceReporteInventario.getPorSucursalAlmacen({
          ...params,
          page: tablePagination.porSucursal.page + 1,
          pageSize: tablePagination.porSucursal.pageSize,
        }),

        ServiceReporteInventario.getPorProducto({
          ...params,
          page: tablePagination.porProducto.page + 1,
          pageSize: tablePagination.porProducto.pageSize,
        }),

        ServiceReporteInventario.getPorImportacion({
          ...params,
          page: tablePagination.porImportacion.page + 1,
          pageSize: tablePagination.porImportacion.pageSize,
        }),

        ServiceReporteInventario.getPorProveedor({
          ...params,
          page: tablePagination.porProveedor.page + 1,
          pageSize: tablePagination.porProveedor.pageSize,
        }),

        ServiceReporteInventario.getObservados({
          ...params,
          page: tablePagination.observados.page + 1,
          pageSize: tablePagination.observados.pageSize,
        }),

        ServiceReporteInventario.getStockDashboard(params),

        // ✅ NO enviar observado a getStockActual
        ServiceReporteInventario.getStockActual({
          search: params.search,
          ciudadId: params.ciudadId,
          sucursalId: params.sucursalId,
          almacenId: params.almacenId,
          categoriaId: params.categoriaId,
          modeloId: params.modeloId,
          page: tablePagination.stockActual.page + 1,
          pageSize: tablePagination.stockActual.pageSize,
        }),

        ServiceReporteInventario.getStockDetalle({
          ...params,
          page: stockDetallePage + 1,
          pageSize: stockDetallePageSize,
        }),
      ]);

      // ✅ AGREGAR: Procesar dashboard de entradas
      if (dashEntradasRes.status === "fulfilled") {
        setDashboardEntradas(dashEntradasRes.value || {});
      }

      if (detalleRes.status === "fulfilled") {
        const data = normalizeList(detalleRes.value);
        setDetalle(data.items);
        setDetalleTotal(data.total);
      }

      if (diaRes.status === "fulfilled") {
        const data = normalizeList(diaRes.value);
        setPorDia(data.items);
        setTableTotal("porDia", data.total);
      }

      if (sucursalRes.status === "fulfilled") {
        const data = normalizeList(sucursalRes.value);
        setPorSucursal(data.items);
        setTableTotal("porSucursal", data.total);
      }

      if (productoRes.status === "fulfilled") {
        const data = normalizeList(productoRes.value);
        setPorProducto(data.items);
        setTableTotal("porProducto", data.total);
      }

      if (importacionRes.status === "fulfilled") {
        const data = normalizeList(importacionRes.value);
        setPorImportacion(data.items);
        setTableTotal("porImportacion", data.total);
      }

      if (proveedorRes.status === "fulfilled") {
        const data = normalizeList(proveedorRes.value);
        setPorProveedor(data.items);
        setTableTotal("porProveedor", data.total);
      }

      if (observadosRes.status === "fulfilled") {
        const data = normalizeList(observadosRes.value);
        setObservados(data.items);
        setTableTotal("observados", data.total);
      }

      // ✅ AGREGAR: Procesar dashboard de stock
      if (dashStockRes.status === "fulfilled") {
        setDashboardStock(dashStockRes.value || {});
      }

      if (stockRes.status === "fulfilled") {
        const data = normalizeList(stockRes.value);
        setStockActual(data.items);
        setTableTotal("stockActual", data.total);
      }

      if (stockDetalleRes.status === "fulfilled") {
        const data = normalizeList(stockDetalleRes.value);
        setStockDetalle(data.items);
        setStockDetalleTotal(data.total);
      }

      const rejected = [
        dashEntradasRes,
        detalleRes,
        diaRes,
        sucursalRes,
        productoRes,
        importacionRes,
        proveedorRes,
        observadosRes,
        dashStockRes,
        stockRes,
        stockDetalleRes,
      ].find((r) => r.status === "rejected");

      if (rejected) throw rejected.reason;
    } catch (error) {
      console.error(error);
      setErrorMsg(error.message || "Error al cargar reporte de inventario");
      toast.error(error.message || "Error al cargar reporte de inventario");
    } finally {
      setLoading(false);
    }
  };
  const activeFilters = useMemo(() => getActiveFilters(), [mainTab, stockTab]);

    const params = useMemo(() => {
      const p = {};

      if (filters.search?.trim()) p.search = filters.search.trim();
      if (activeFilters.includes("fechaDesde") && filters.fechaDesde)
        p.fechaDesde = filters.fechaDesde;
      if (activeFilters.includes("fechaHasta") && filters.fechaHasta)
        p.fechaHasta = filters.fechaHasta;
      if (activeFilters.includes("ciudadId") && filters.ciudadId)
        p.ciudadId = Number(filters.ciudadId);
      if (activeFilters.includes("sucursalId") && filters.sucursalId)
        p.sucursalId = Number(filters.sucursalId);
      if (activeFilters.includes("almacenId") && filters.almacenId)
        p.almacenId = Number(filters.almacenId);
      if (activeFilters.includes("categoriaId") && filters.categoriaId)
        p.categoriaId = Number(filters.categoriaId);
      if (activeFilters.includes("modeloId") && filters.modeloId)
        p.modeloId = Number(filters.modeloId);
      if (activeFilters.includes("proveedorId") && filters.proveedorId)
        p.proveedorId = Number(filters.proveedorId);
      if (activeFilters.includes("observado") && filters.observado)
        p.observado = Number(filters.observado);

      return p;
    }, [filters, activeFilters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      cargarReporte();
    }, 350);

    return () => clearTimeout(timer);
  }, [
    params,
    mainTab,           // ✅ AGREGAR
    stockTab,   
    detallePage,
    detallePageSize,
    stockDetallePage,
    stockDetallePageSize,
    tablePagination.porDia.page,
    tablePagination.porDia.pageSize,
    tablePagination.porSucursal.page,
    tablePagination.porSucursal.pageSize,
    tablePagination.porProducto.page,
    tablePagination.porProducto.pageSize,
    tablePagination.porImportacion.page,
    tablePagination.porImportacion.pageSize,
    tablePagination.porProveedor.page,
    tablePagination.porProveedor.pageSize,
    tablePagination.observados.page,
    tablePagination.observados.pageSize,
    tablePagination.stockActual.page,
    tablePagination.stockActual.pageSize,
  ]);

  useEffect(() => {
    setDetallePage(0);
    setStockDetallePage(0);

    setTablePagination((prev) => ({
      porDia: { ...prev.porDia, page: 0 },
      porSucursal: { ...prev.porSucursal, page: 0 },
      porProducto: { ...prev.porProducto, page: 0 },
      porImportacion: { ...prev.porImportacion, page: 0 },
      porProveedor: { ...prev.porProveedor, page: 0 },
      observados: { ...prev.observados, page: 0 },
      stockActual: { ...prev.stockActual, page: 0 },
    }));
  }, [params, mainTab, stockTab]);

  useEffect(() => {
    const cargarCombos = async () => {
      try {
        const [ciuRes, sucRes, almRes, catRes, modRes, provRes] =
          await Promise.all([
            ServiceCiudad.getAll({ page: 1, pageSize: 1000 }),
            ServiceSucursal.getAll({ page: 1, pageSize: 1000 }),
            ServiceAlmacen.getAll({ page: 1, pageSize: 1000 }),
            ServiceCategoria.getAll({ page: 1, pageSize: 1000 }),
            ServiceModelo.getAll({ page: 1, pageSize: 1000 }),
            ServiceProveedor.getAll({ page: 1, pageSize: 1000 }),
          ]);

        setCiudades(Array.isArray(ciuRes) ? ciuRes : ciuRes.items || []);
        setSucursales(Array.isArray(sucRes) ? sucRes : sucRes.items || []);
        setAlmacenes(Array.isArray(almRes) ? almRes : almRes.items || []);
        setCategorias(Array.isArray(catRes) ? catRes : catRes.items || []);
        setModelos(Array.isArray(modRes) ? modRes : modRes.items || []);
        setProveedores(Array.isArray(provRes) ? provRes : provRes.items || []);
      } catch (error) {
        console.error(error);
        toast.error(error.message || "Error al cargar filtros");
      }
    };

    cargarCombos();
  }, []);

  const renderEstadoStock = (estado) => {
    const bajo = estado === "Stock Bajo";

    return (
      <Chip
        label={estado || "—"}
        size="small"
        sx={{
          fontWeight: 800,
          bgcolor: bajo ? "#FEE2E2" : "#DCFCE7",
          color: bajo ? "#991B1B" : "#166534",
        }}
      />
    );
  };

  const renderObservado = (value) => {
    const observado = Number(value) === 2;

    return (
      <Chip
        label={observado ? "Observado" : "Normal"}
        size="small"
        sx={{
          fontWeight: 800,
          bgcolor: observado ? "#FEE2E2" : "#DCFCE7",
          color: observado ? "#991B1B" : "#166534",
        }}
      />
    );
  };

  const entradaCards = [
    {
      title: "Productos ingresados",
      subtitle: "Histórico de entradas",
      value: dashboardEntradas.productosIngresados || 0,
      icon: Package,
      color: "#2563EB",
    },
    {
      title: "Costo origen",
      subtitle: "Inversión de entradas",
      value: money(dashboardEntradas.costoTotalOrigen),
      icon: DollarSign,
      color: "#0D8C47",
    },
    {
      title: "Valor venta",
      subtitle: "Proyección comercial",
      value: money(dashboardEntradas.valorVentaEstimado),
      icon: TrendingUp,
      color: "#B45309",
    },
    {
      title: "Importaciones",
      subtitle: "Relacionadas a entradas",
      value: dashboardEntradas.importacionesRelacionadas || 0,
      icon: Boxes,
      color: "#592B2B",
    },
    {
      title: "Observados",
      subtitle: "Productos con observación",
      value: dashboardEntradas.productosObservados || 0,
      icon: CircleAlert,
      color: "#991B1B",
    },
  ];

  const stockCards = [
    {
      title: "Stock actual",
      subtitle: "Productos disponibles",
      value: dashboardStock.stockTotal || 0,
      icon: Boxes,
      color: "#0F766E",
    },
    {
      title: "Valor stock",
      subtitle: "Valor venta disponible",
      value: money(dashboardStock.valorVentaStock),
      icon: TrendingUp,
      color: "#B45309",
    },
    {
      title: "Costo stock",
      subtitle: "Costo origen disponible",
      value: money(dashboardStock.costoTotalStock),
      icon: DollarSign,
      color: "#0D8C47",
    },
    {
      title: "Modelos",
      subtitle: "Modelos con stock",
      value: dashboardStock.modelosConStock || 0,
      icon: Package,
      color: "#2563EB",
    },
    {
      title: "Almacenes",
      subtitle: "Almacenes con stock",
      value: dashboardStock.almacenesConStock || 0,
      icon: Warehouse,
      color: "#475569",
    },
  ];

  const cards = mainTab === 0 ? entradaCards : stockCards;

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

const getAllReportesPDF = () => {
  return [
    {
      id: "detalle",
      grupo: "Entradas",
      titulo: "Detalle histórico de entradas",
      head: ["Fecha", "Serie", "Modelo", "Categoría", "Proveedor", "Sucursal", "Almacén"],
      body: detalle.map((r) => [
        r.fechaEntradaSolo || "—",
        r.numeroSerie || "—",
        r.nombreModelo || "—",
        r.categoriaNombre || "—",
        r.proveedorNombre || "—",
        r.sucursalNombre || "—",
        r.almacenNombre || "—",
      ]),
    },
    {
      id: "porDia",
      grupo: "Entradas",
      titulo: "Resumen diario de entradas",
      head: ["Fecha", "Ingresados", "Observados", "Costo origen", "Valor venta"],
      body: porDia.map((r) => [
        r.fecha || "—",
        r.productosIngresados || 0,
        r.productosObservados || 0,
        money(r.costoTotalOrigen),
        money(r.valorVentaEstimado),
      ]),
    },
    {
      id: "porSucursal",
      grupo: "Entradas",
      titulo: "Entradas por sucursal y almacén",
      head: ["Ciudad", "Sucursal", "Almacén", "Productos", "Observados", "Costo origen"],
      body: porSucursal.map((r) => [
        r.ciudadNombre || "—",
        r.sucursalNombre || "—",
        r.almacenNombre || "—",
        r.productosIngresados || 0,
        r.productosObservados || 0,
        money(r.costoTotalOrigen),
      ]),
    },
    {
      id: "porProducto",
      grupo: "Entradas",
      titulo: "Entradas por producto",
      head: ["Categoría", "Modelo", "Capacidad", "Ingresados", "Observados", "Valor venta"],
      body: porProducto.map((r) => [
        r.categoriaNombre || "—",
        r.nombreModelo || "—",
        r.capacidadTexto || "—",
        r.productosIngresados || 0,
        r.productosObservados || 0,
        money(r.valorVentaEstimado),
      ]),
    },
    {
      id: "porImportacion",
      grupo: "Entradas",
      titulo: "Entradas por importación",
      head: ["Importación", "Proveedor", "Fecha llegada", "Productos", "Observados"],
      body: porImportacion.map((r) => [
        r.importacionCodigo || "—",
        r.proveedorNombre || "—",
        r.fechaLlegada || "—",
        r.productosIngresados || 0,
        r.productosObservados || 0,
      ]),
    },
    {
      id: "porProveedor",
      grupo: "Entradas",
      titulo: "Entradas por proveedor",
      head: ["Proveedor", "Encargado", "Productos", "Observados", "Costo origen"],
      body: porProveedor.map((r) => [
        r.proveedorNombre || "—",
        r.proveedorEncargado || "—",
        r.productosIngresados || 0,
        r.productosObservados || 0,
        money(r.costoTotalOrigen),
      ]),
    },
    {
      id: "observados",
      grupo: "Entradas",
      titulo: "Productos observados",
      head: ["Serie", "Modelo", "Categoría", "Sucursal", "Almacén", "Observación"],
      body: observados.map((r) => [
        r.numeroSerie || "—",
        r.nombreModelo || "—",
        r.categoriaNombre || "—",
        r.sucursalNombre || "—",
        r.almacenNombre || "—",
        r.obsDescripcion || "—",
      ]),
    },
    {
      id: "stockActual",
      grupo: "Stock",
      titulo: "Stock actual agrupado",
      head: ["Ciudad", "Sucursal", "Almacén", "Sección", "Modelo", "Cantidad", "Estado"],
      body: stockActual.map((r) => [
        r.ciudad || "—",
        r.sucursal || "—",
        r.almacen || "—",
        r.seccion || "—",
        r.nombreModelo || "—",
        r.cantidad || 0,
        r.estadoStock || "—",
      ]),
    },
    {
      id: "stockDetalle",
      grupo: "Stock",
      titulo: "Productos disponibles en stock",
      head: ["Serie", "Modelo", "Sucursal", "Almacén", "Sección", "Precio venta"],
      body: stockDetalle.map((r) => [
        r.numeroSerie || "—",
        r.nombreModelo || "—",
        r.sucursal || "—",
        r.almacen || "—",
        r.seccion || "—",
        money(r.precioVenta),
      ]),
    },
  ];
};

const getReporteActualPDF = () => {
  if (mainTab === 0) {
    return getAllReportesPDF()[entradaTab];
  }

  return stockTab === 0
    ? getAllReportesPDF().find((r) => r.id === "stockActual")
    : getAllReportesPDF().find((r) => r.id === "stockDetalle");
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

  doc.save(`comercial_poma_reporte_${new Date().toISOString().slice(0, 10)}.pdf`);
};

const exportarVistaActualPDF = () => {
  exportarReportesPDF([getReporteActualPDF()]);
  setExportAnchorEl(null);
};

const exportarSeleccionadosPDF = () => {
  const reportes = getAllReportesPDF().filter((r) => selectedExports.includes(r.id));

  if (!selectedExports.length) {
    toast.warning("Selecciona al menos un reporte.");
    return;
  }

  exportarReportesPDF(reportes);
  setOpenExportDialog(false);
  setExportAnchorEl(null);
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
            <BarChart3 size={25} color="#592B2B" />
          </Box>

          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, color: BRAND.dark }}>
               Reporte de Inventario - COMERCIAL POMA
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
              setSelectedExports([getReporteActualPDF()?.id].filter(Boolean));
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
          {/* Búsqueda - Siempre visible */}
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar serie, modelo, proveedor, importación..."
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
            />
          </Grid>

          {/* Fechas - Solo si están activos */}
          {activeFilters.includes("fechaDesde") && (
            <Grid item xs={12} sm={6} md={3}>
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
          )}

          {activeFilters.includes("fechaHasta") && (
            <Grid item xs={12} sm={6} md={3}>
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
          )}

          {/* Ciudad - Siempre */}
          {activeFilters.includes("ciudadId") && (
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Ciudad"
                value={filters.ciudadId}
                onChange={(e) => handleFilterChange("ciudadId", e.target.value)}
                sx={fieldStyle}
              >
                <MenuItem value="">Todas</MenuItem>
                {ciudades.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.nombre || item.Nombre}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          )}

          {/* Sucursal - Siempre */}
          {activeFilters.includes("sucursalId") && (
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Sucursal"
                value={filters.sucursalId}
                onChange={(e) => handleFilterChange("sucursalId", e.target.value)}
                sx={fieldStyle}
              >
                <MenuItem value="">Todas</MenuItem>
                {sucursalesFiltradas.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.nombre}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          )}

          {/* Almacén - Siempre */}
          {activeFilters.includes("almacenId") && (
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Almacén"
                value={filters.almacenId}
                onChange={(e) => handleFilterChange("almacenId", e.target.value)}
                sx={fieldStyle}
              >
                <MenuItem value="">Todos</MenuItem>
                {almacenesFiltrados.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.nombre}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          )}

          {/* Categoría - Siempre */}
          {activeFilters.includes("categoriaId") && (
            <Grid item xs={12} sm={6} md={3}>
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
                {categorias.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.nombre}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          )}

          {/* Modelo - Siempre */}
          {activeFilters.includes("modeloId") && (
            <Grid item xs={12} sm={6} md={3}>
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
                {modelos.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.nombreModelo || item.nombre}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          )}

          {/* Proveedor - Solo si activo */}
          {activeFilters.includes("proveedorId") && (
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Proveedor"
                value={filters.proveedorId}
                onChange={(e) => handleFilterChange("proveedorId", e.target.value)}
                sx={fieldStyle}
              >
                <MenuItem value="">Todos</MenuItem>
                {proveedores.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.razonSocial || item.nombre}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          )}

          {/* Observado - Solo si activo */}
          {activeFilters.includes("observado") && (
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Estado producto"
                value={filters.observado}
                onChange={(e) => handleFilterChange("observado", e.target.value)}
                sx={fieldStyle}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="1">Normal</MenuItem>
                <MenuItem value="2">Observado</MenuItem>
              </TextField>
            </Grid>
          )}

          {/* Botón Limpiar */}
          <Grid item xs={12} sm={6} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<RefreshCcw size={16} />}
              onClick={limpiarFiltros}
              sx={{
                height: 40,
                borderRadius: 2,
                borderColor: "#592B2B",
                color: "#592B2B",
                bgcolor: "white",
                textTransform: "none",
                fontWeight: 700,
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

      <Tabs
        value={mainTab}
        onChange={(_, value) => setMainTab(value)}
        sx={{
          mb: 2,
          "& .MuiTab-root": {
            textTransform: "none",
            fontWeight: 800,
            fontSize: 15,
          },
          "& .Mui-selected": {
            color: "#592B2B !important",
          },
          "& .MuiTabs-indicator": {
            bgcolor: "#592B2B",
            height: 3,
            borderRadius: 2,
          },
        }}
      >
        <Tab label="Reporte de Entradas" />
        <Tab label="Stock Actual" />
      </Tabs>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {cards.map((item) => {
          const Icon = item.icon;

          return (
            <Grid item xs={12} sm={6} md={3} lg={2.4} key={item.title}>
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

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mb: 0.5 }}
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
          borderRadius: 3,
          borderColor: "#f1d2d2",
          overflow: "hidden",
        }}
      >
        {mainTab === 0 && (
          <>
            <Box sx={{ px: 2, pt: 2 }}>
              <Typography sx={{ fontWeight: 900, color: "#2B1111" }}>
                Entradas históricas
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Muestra todo lo que ingresó al sistema mediante movimientos de entrada.
              </Typography>
            </Box>

            <Tabs
              value={entradaTab}
              onChange={(_, value) => setEntradaTab(value)}
              variant="scrollable"
              scrollButtons="auto"
              sx={tabStyle}
            >
              {entradaTabs.map((item) => (
                <Tab key={item} label={item} />
              ))}
            </Tabs>

            {entradaTab === 0 && (
              <SimpleTable
                loading={loading}
                rows={detalle}
                total={detalleTotal}
                page={detallePage}
                rowsPerPage={detallePageSize}
                onPageChange={setDetallePage}
                onRowsPerPageChange={setDetallePageSize}
                empty="No se encontraron entradas de inventario."
                columns={[
                  ["fechaEntradaSolo", "Fecha"],
                  ["numeroSerie", "Serie"],
                  ["nombreModelo", "Modelo"],
                  ["categoriaNombre", "Categoría"],
                  ["proveedorNombre", "Proveedor"],
                  ["sucursalNombre", "Sucursal"],
                  ["almacenNombre", "Almacén"],
                  ["observado", "Estado", renderObservado],
                ]}
              />
            )}

            {entradaTab === 1 && (
              <SimpleTable
                loading={loading}
                rows={porDia}
                total={tablePagination.porDia.total}
                page={tablePagination.porDia.page}
                rowsPerPage={tablePagination.porDia.pageSize}
                onPageChange={(page) => handleTablePageChange("porDia", page)}
                onRowsPerPageChange={(size) => handleTablePageSizeChange("porDia", size)}
                empty="No hay datos por día."
                columns={[
                  ["fecha", "Fecha"],
                  ["productosIngresados", "Ingresados"],
                  ["productosObservados", "Observados"],
                  ["costoTotalOrigen", "Costo origen", money],
                  ["valorVentaEstimado", "Valor venta", money],
                ]}
              />
            )}

            {entradaTab === 2 && (
              <SimpleTable
                loading={loading}
                rows={porSucursal}
                total={tablePagination.porSucursal.total}
                page={tablePagination.porSucursal.page}
                rowsPerPage={tablePagination.porSucursal.pageSize}
                onPageChange={(page) => handleTablePageChange("porSucursal", page)}
                onRowsPerPageChange={(size) => handleTablePageSizeChange("porSucursal", size)}
                empty="No hay datos por sucursal y almacén."
                columns={[
                  ["ciudadNombre", "Ciudad"],
                  ["sucursalNombre", "Sucursal"],
                  ["almacenNombre", "Almacén"],
                  ["productosIngresados", "Productos"],
                  ["productosObservados", "Observados"],
                  ["costoTotalOrigen", "Costo origen", money],
                ]}
              />
            )}

            {entradaTab === 3 && (
              <SimpleTable
                loading={loading}
                rows={porProducto}
                total={tablePagination.porProducto.total}
                page={tablePagination.porProducto.page}
                rowsPerPage={tablePagination.porProducto.pageSize}
                onPageChange={(page) => handleTablePageChange("porProducto", page)}
                onRowsPerPageChange={(size) => handleTablePageSizeChange("porProducto", size)}
                empty="No hay datos por producto."
                columns={[
                  ["categoriaNombre", "Categoría"],
                  ["nombreModelo", "Modelo"],
                  ["capacidadTexto", "Capacidad"],
                  ["productosIngresados", "Ingresados"],
                  ["productosObservados", "Observados"],
                  ["valorVentaEstimado", "Valor venta", money],
                ]}
              />
            )}

            {entradaTab === 4 && (
              <SimpleTable
                loading={loading}
                rows={porImportacion}
                total={tablePagination.porImportacion.total}
                page={tablePagination.porImportacion.page}
                rowsPerPage={tablePagination.porImportacion.pageSize}
                onPageChange={(page) => handleTablePageChange("porImportacion", page)}
                onRowsPerPageChange={(size) => handleTablePageSizeChange("porImportacion", size)}
                empty="No hay datos por importación."
                columns={[
                  ["importacionCodigo", "Importación"],
                  ["proveedorNombre", "Proveedor"],
                  ["fechaLlegada", "Fecha llegada"],
                  ["productosIngresados", "Productos"],
                  ["productosObservados", "Observados"],
                ]}
              />
            )}

            {entradaTab === 5 && (
              <SimpleTable
                loading={loading}
                rows={porProveedor}
                total={tablePagination.porProveedor.total}
                page={tablePagination.porProveedor.page}
                rowsPerPage={tablePagination.porProveedor.pageSize}
                onPageChange={(page) => handleTablePageChange("porProveedor", page)}
                onRowsPerPageChange={(size) => handleTablePageSizeChange("porProveedor", size)}
                empty="No hay datos por proveedor."
                columns={[
                  ["proveedorNombre", "Proveedor"],
                  ["proveedorEncargado", "Encargado"],
                  ["productosIngresados", "Productos"],
                  ["productosObservados", "Observados"],
                  ["costoTotalOrigen", "Costo origen", money],
                ]}
              />
            )}

            {entradaTab === 6 && (
              <SimpleTable
                loading={loading}
                rows={observados}
                total={tablePagination.observados.total}
                page={tablePagination.observados.page}
                rowsPerPage={tablePagination.observados.pageSize}
                onPageChange={(page) => handleTablePageChange("observados", page)}
                onRowsPerPageChange={(size) => handleTablePageSizeChange("observados", size)}
                empty="No hay productos observados."
                columns={[
                  ["numeroSerie", "Serie"],
                  ["nombreModelo", "Modelo"],
                  ["categoriaNombre", "Categoría"],
                  ["sucursalNombre", "Sucursal"],
                  ["almacenNombre", "Almacén"],
                  ["obsDescripcion", "Observación"],
                ]}
              />
            )}
          </>
        )}

        {mainTab === 1 && (
          <>
            <Box sx={{ px: 2, pt: 2 }}>
              <Typography sx={{ fontWeight: 900, color: "#2B1111" }}>
                Stock actual
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Muestra únicamente productos disponibles según su último movimiento activo.
              </Typography>
            </Box>

            <Tabs
              value={stockTab}
              onChange={(_, value) => setStockTab(value)}
              variant="scrollable"
              scrollButtons="auto"
              sx={tabStyle}
            >
              {stockTabs.map((item) => (
                <Tab key={item} label={item} />
              ))}
            </Tabs>

            {stockTab === 0 && (
              <SimpleTable
                loading={loading}
                rows={stockActual}
                total={tablePagination.stockActual.total}
                page={tablePagination.stockActual.page}
                rowsPerPage={tablePagination.stockActual.pageSize}
                onPageChange={(page) => handleTablePageChange("stockActual", page)}
                onRowsPerPageChange={(size) => handleTablePageSizeChange("stockActual", size)}
                empty="No hay stock actual."
                columns={[
                  ["ciudad", "Ciudad"],
                  ["sucursal", "Sucursal"],
                  ["almacen", "Almacén"],
                  ["seccion", "Sección"],
                  ["categoriaNombre", "Categoría"],
                  ["nombreModelo", "Modelo"],
                  ["cantidad", "Cantidad"],
                  ["stockMinimo", "Stock mínimo"],
                  ["valorVentaStock", "Valor stock", money],
                  ["estadoStock", "Estado", renderEstadoStock],
                ]}
              />
            )}

            {stockTab === 1 && (
              <SimpleTable
                loading={loading}
                rows={stockDetalle}
                total={stockDetalleTotal}
                page={stockDetallePage}
                rowsPerPage={stockDetallePageSize}
                onPageChange={setStockDetallePage}
                onRowsPerPageChange={setStockDetallePageSize}
                empty="No hay productos disponibles."
                columns={[
                  ["fechaUltimoMovimiento", "Último movimiento"],
                  ["numeroSerie", "Serie"],
                  ["nombreModelo", "Modelo"],
                  ["categoriaNombre", "Categoría"],
                  ["sucursal", "Sucursal"],
                  ["almacen", "Almacén"],
                  ["seccion", "Sección"],
                  ["precioVenta", "Precio venta", money],
                  ["observado", "Estado", renderObservado],
                ]}
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
          Exportar reportes
        </DialogTitle>

        <DialogContent sx={{ p: 3, bgcolor: "#fafafa" }}>
          <Typography sx={{ fontWeight: 800, color: BRAND.dark, mb: 0.5 }}>
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
                bgcolor: selectedExports.includes(item.id) ? "#a4193d12" : "white",
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
}