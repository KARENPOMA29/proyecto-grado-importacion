// src/routes/pages/reportes/ReportesPage.jsx
import { useEffect, useState } from "react";
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Grid,
  TextField,
  Button,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { toast } from "react-toastify";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


import ServiceReportes from "@/services/ServiceReportes";
import ServiceSucursal from "@/services/ServiceSucursal";
import ServiceEmpleado from "@/services/ServiceEmpleado";
import ServiceProveedor from "@/services/ServiceProveedor";

const TabPanel = ({ children, value, index }) => {
  if (value !== index) return null;
  return <Box sx={{ mt: 2 }}>{children}</Box>;
};

/* ========= HELPERS DESCARGA ========= */

// CSV genérico
const downloadCSV = (filename, headers, rows) => {
  const csvContent = [
    headers.join(";"),
    ...rows.map(row => row.map(col => `${col ?? ""}`).join(";")),
  ].join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// PDF genérico
// PDF genérico
const downloadPDF = (filename, title, headers, rows) => {
  // 👇 en versiones nuevas de jsPDF es mejor pasar un objeto
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  doc.setFontSize(14);
  doc.text(title, 40, 40);

  // 👇 usamos la función importada autoTable
  autoTable(doc, {
    startY: 65,
    head: [headers],
    body: rows,
    margin: { left: 40, right: 40 },
    styles: { fontSize: 9 },
  });

  doc.save(filename);
};


export default function ReportesPage() {
  const [tab, setTab] = useState(0);

  // catálogos
  const [sucursales, setSucursales] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [proveedores, setProveedores] = useState([]);

  // filtros ventas
  const [ventasFilters, setVentasFilters] = useState({
    fecha_desde: "",
    fecha_hasta: "",
    sucursal_id: "",
    empleado_id: "",
  });
  const [ventasData, setVentasData] = useState(null);
  const [loadingVentas, setLoadingVentas] = useState(false);

  // filtros importaciones
  const [impFilters, setImpFilters] = useState({
    fecha_desde: "",
    fecha_hasta: "",
    proveedor_id: "",
  });
  const [impData, setImpData] = useState(null);
  const [loadingImp, setLoadingImp] = useState(false);

  // stock
  const [soloEnAlerta, setSoloEnAlerta] = useState(false);
  const [stockData, setStockData] = useState(null);
  const [loadingStock, setLoadingStock] = useState(false);

  // ====================== CARGA DE CATALOGOS ======================
  useEffect(() => {
    const loadCatalogos = async () => {
      try {
        const [sucRes, empRes, provRes] = await Promise.all([
          ServiceSucursal.getAll?.() ?? ServiceSucursal.listar?.() ?? [],
          ServiceEmpleado.getAll?.() ?? ServiceEmpleado.listar?.() ?? [],
          ServiceProveedor.getAll?.() ?? ServiceProveedor.listar?.() ?? [],
        ]);

        setSucursales(Array.isArray(sucRes) ? sucRes : []);
        setEmpleados(Array.isArray(empRes) ? empRes : []);
        setProveedores(Array.isArray(provRes) ? provRes : []);
      } catch (err) {
        console.error(err);
        toast.error("Error al cargar catálogos para los reportes");
      }
    };

    loadCatalogos();
  }, []);

  // ====================== HANDLERS GENERALES ======================
  const handleChangeTab = (_, newValue) => {
    setTab(newValue);
  };

  const handleChangeVentasFilter = (field, value) => {
    setVentasFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleChangeImpFilter = (field, value) => {
    setImpFilters(prev => ({ ...prev, [field]: value }));
  };

  // ====================== LLAMADAS A SERVICIO ======================

  const fetchReporteVentas = async () => {
    try {
      setLoadingVentas(true);

      const params = {};
      if (ventasFilters.fecha_desde)
        params.fecha_desde = ventasFilters.fecha_desde;
      if (ventasFilters.fecha_hasta)
        params.fecha_hasta = ventasFilters.fecha_hasta;
      if (ventasFilters.sucursal_id)
        params.sucursal_id = ventasFilters.sucursal_id;
      if (ventasFilters.empleado_id)
        params.empleado_id = ventasFilters.empleado_id;

      const data = await ServiceReportes.getVentas(params);
      setVentasData(data);
    } catch (err) {
      console.error(err);
      toast.error("Error al obtener reporte de ventas");
    } finally {
      setLoadingVentas(false);
    }
  };

  const fetchReporteImportaciones = async () => {
    try {
      setLoadingImp(true);

      const params = {};
      if (impFilters.fecha_desde) params.fecha_desde = impFilters.fecha_desde;
      if (impFilters.fecha_hasta) params.fecha_hasta = impFilters.fecha_hasta;
      if (impFilters.proveedor_id)
        params.proveedor_id = impFilters.proveedor_id;

      const data = await ServiceReportes.getImportaciones(params);
      setImpData(data);
    } catch (err) {
      console.error(err);
      toast.error("Error al obtener reporte de importaciones");
    } finally {
      setLoadingImp(false);
    }
  };

  const fetchReporteStock = async () => {
    try {
      setLoadingStock(true);
      const data = await ServiceReportes.getStock(soloEnAlerta);
      setStockData(data);
    } catch (err) {
      console.error(err);
      toast.error("Error al obtener reporte de stock");
    } finally {
      setLoadingStock(false);
    }
  };

  // ====================== DESCARGAS CSV / PDF ======================

  // VENTAS POR DÍA
  const downloadVentasPorDiaCSV = () => {
    if (!ventasData || !Array.isArray(ventasData.por_dia)) return;
    downloadCSV(
      "reporte_ventas_por_dia.csv",
      ["Fecha", "CantidadVentas", "TotalBs"],
      ventasData.por_dia.map(row => [
        row.fecha,
        row.cantidad_ventas,
        row.total_ventas,
      ])
    );
  };

  const downloadVentasPorDiaPDF = () => {
  if (!ventasData || !Array.isArray(ventasData.por_dia)) return;
  downloadPDF(
    "reporte_ventas_por_dia.pdf",
    "Reporte de Ventas por Día",
    ["Fecha", "Cantidad de Ventas", "Total (Bs.)"],
    ventasData.por_dia.map(row => [
      row.fecha,
      row.cantidad_ventas,
      Number(row.total_ventas ?? 0).toFixed(2),
    ])
  );
};


  // VENTAS POR SUCURSAL
  const downloadVentasPorSucursalCSV = () => {
    if (!ventasData || !Array.isArray(ventasData.por_sucursal)) return;
    downloadCSV(
      "reporte_ventas_por_sucursal.csv",
      ["Sucursal", "CantidadVentas", "TotalBs"],
      ventasData.por_sucursal.map(row => [
        row.sucursalNombre,
        row.cantidad_ventas,
        row.total_ventas,
      ])
    );
  };

  const downloadVentasPorSucursalPDF = () => {
  if (!ventasData || !Array.isArray(ventasData.por_sucursal)) return;
  downloadPDF(
    "reporte_ventas_por_sucursal.pdf",
    "Reporte de Ventas por Sucursal",
    ["Sucursal", "Cantidad de Ventas", "Total (Bs.)"],
    ventasData.por_sucursal.map(row => [
      row.sucursalNombre,
      row.cantidad_ventas,
      Number(row.total_ventas ?? 0).toFixed(2),
    ])
  );
};

  // IMPORTACIONES
  const downloadImportacionesCSV = () => {
    if (!impData || !Array.isArray(impData.por_proveedor)) return;
    downloadCSV(
      "reporte_importaciones_por_proveedor.csv",
      ["Proveedor", "CantidadImportaciones"],
      impData.por_proveedor.map(row => [
        row.proveedorNombre,
        row.cantidad_importaciones,
      ])
    );
  };

  const downloadImportacionesPDF = () => {
  if (!impData || !Array.isArray(impData.por_proveedor)) return;
  downloadPDF(
    "reporte_importaciones_por_proveedor.pdf",
    "Importaciones por Proveedor",
    ["Proveedor", "# Importaciones"],
    impData.por_proveedor.map(row => [
      row.proveedorNombre,
      row.cantidad_importaciones,
    ])
  );
};

  // STOCK
  const downloadStockCSV = () => {
    if (!stockData || !Array.isArray(stockData.items)) return;
    downloadCSV(
      "reporte_stock_modelos.csv",
      [
        "Modelo",
        "Marca",
        "StockActual",
        "StockMinimo",
        "Estado",
      ],
      stockData.items.map(item => [
        item.nombreModelo,
        item.marca,
        item.stock_actual,
        item.stock_minimo,
        item.en_alerta ? "En alerta" : "OK",
      ])
    );
  };

  const downloadStockPDF = () => {
  if (!stockData || !Array.isArray(stockData.items)) return;
  downloadPDF(
    "reporte_stock_modelos.pdf",
    "Reporte de Stock por Modelo",
    ["Modelo", "Marca", "Stock Actual", "Stock Mínimo", "Estado"],
    stockData.items.map(item => [
      item.nombreModelo,
      item.marca,
      Number(item.stock_actual ?? 0),
      Number(item.stock_minimo ?? 0),
      item.en_alerta ? "En alerta" : "OK",
    ])
  );
};


  // ====================== RENDER ======================

  return (
    <Box sx={{ p: 2, bgcolor: "#f5f5f5", minHeight: "100vh" }}>
      <Paper
        sx={{
          p: 2.5,
          mb: 2,
          borderRadius: 2,
          boxShadow: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Reportes del Sistema
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Consulta y descarga los reportes de ventas, importaciones y control de
            stock.
          </Typography>
        </Box>
      </Paper>

      <Paper
        sx={{
          borderRadius: 2,
          boxShadow: 1,
          overflow: "hidden",
        }}
      >
        <Tabs
          value={tab}
          onChange={handleChangeTab}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Ventas" />
          <Tab label="Importaciones" />
          <Tab label="Control de Stock" />
        </Tabs>

        <Box sx={{ p: 2 }}>
          {/* ===================== TAB VENTAS ===================== */}
          <TabPanel value={tab} index={0}>
            <Paper sx={{ p: 2, mb: 2, borderRadius: 2, boxShadow: 1 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                Filtros de búsqueda
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <TextField
                    label="Fecha desde"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={ventasFilters.fecha_desde}
                    onChange={e =>
                      handleChangeVentasFilter("fecha_desde", e.target.value)
                    }
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    label="Fecha hasta"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={ventasFilters.fecha_hasta}
                    onChange={e =>
                      handleChangeVentasFilter("fecha_hasta", e.target.value)
                    }
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Sucursal</InputLabel>
                    <Select
                      label="Sucursal"
                      value={ventasFilters.sucursal_id}
                      onChange={e =>
                        handleChangeVentasFilter("sucursal_id", e.target.value)
                      }
                    >
                      <MenuItem value="">Todas</MenuItem>
                      {Array.isArray(sucursales) &&
                        sucursales.map(s => (
                          <MenuItem key={s.id} value={s.id}>
                            {s.nombre}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Empleado</InputLabel>
                    <Select
                      label="Empleado"
                      value={ventasFilters.empleado_id}
                      onChange={e =>
                        handleChangeVentasFilter("empleado_id", e.target.value)
                      }
                    >
                      <MenuItem value="">Todos</MenuItem>
                      {Array.isArray(empleados) &&
                        empleados.map(emp => (
                          <MenuItem key={emp.id} value={emp.id}>
                            {emp.nombre} {emp.apellido}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sx={{ textAlign: "right" }}>
                  <Button
                    variant="contained"
                    onClick={fetchReporteVentas}
                    disabled={loadingVentas}
                  >
                    {loadingVentas ? "Cargando..." : "Generar reporte"}
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {ventasData && (
              <Box>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={6}>
                    <Paper
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        boxShadow: 1,
                        bgcolor: "#e3f2fd",
                      }}
                    >
                      <Typography variant="subtitle2">Total vendido</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Bs. {ventasData.total_ventas.toFixed(2)}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        boxShadow: 1,
                        bgcolor: "#e8f5e9",
                      }}
                    >
                      <Typography variant="subtitle2">Cantidad de ventas</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {ventasData.cantidad_ventas}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                <Grid container spacing={2} alignItems="flex-start">
                  <Grid item xs={12} md={6}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ mb: 1 }}
                    >
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Ventas por día
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<DownloadIcon />}
                          onClick={downloadVentasPorDiaCSV}
                        >
                          CSV
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<PictureAsPdfIcon />}
                          onClick={downloadVentasPorDiaPDF}
                        >
                          PDF
                        </Button>
                      </Stack>
                    </Stack>

                    <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Fecha</TableCell>
                            <TableCell align="right">Cantidad</TableCell>
                            <TableCell align="right">Total (Bs.)</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {ventasData.por_dia.map(row => (
                            <TableRow key={row.fecha}>
                              <TableCell>{row.fecha}</TableCell>
                              <TableCell align="right">
                                {row.cantidad_ventas}
                              </TableCell>
                              <TableCell align="right">
                                {row.total_ventas.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                          {ventasData.por_dia.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={3} align="center">
                                Sin datos
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ mb: 1 }}
                    >
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Ventas por sucursal
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<DownloadIcon />}
                          onClick={downloadVentasPorSucursalCSV}
                        >
                          CSV
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<PictureAsPdfIcon />}
                          onClick={downloadVentasPorSucursalPDF}
                        >
                          PDF
                        </Button>
                      </Stack>
                    </Stack>

                    <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Sucursal</TableCell>
                            <TableCell align="right">Cantidad</TableCell>
                            <TableCell align="right">Total (Bs.)</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {ventasData.por_sucursal.map(row => (
                            <TableRow key={row.sucursalId}>
                              <TableCell>{row.sucursalNombre}</TableCell>
                              <TableCell align="right">
                                {row.cantidad_ventas}
                              </TableCell>
                              <TableCell align="right">
                                {row.total_ventas.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                          {ventasData.por_sucursal.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={3} align="center">
                                Sin datos
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                </Grid>
              </Box>
            )}
          </TabPanel>

          {/* ===================== TAB IMPORTACIONES ===================== */}
          <TabPanel value={tab} index={1}>
            <Paper sx={{ p: 2, mb: 2, borderRadius: 2, boxShadow: 1 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                Filtros de búsqueda
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <TextField
                    label="Fecha desde"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={impFilters.fecha_desde}
                    onChange={e =>
                      handleChangeImpFilter("fecha_desde", e.target.value)
                    }
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    label="Fecha hasta"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={impFilters.fecha_hasta}
                    onChange={e =>
                      handleChangeImpFilter("fecha_hasta", e.target.value)
                    }
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Proveedor</InputLabel>
                    <Select
                      label="Proveedor"
                      value={impFilters.proveedor_id}
                      onChange={e =>
                        handleChangeImpFilter("proveedor_id", e.target.value)
                      }
                    >
                      <MenuItem value="">Todos</MenuItem>
                      {Array.isArray(proveedores) &&
                        proveedores.map(p => (
                          <MenuItem key={p.id} value={p.id}>
                            {p.razonSocial}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3} sx={{ textAlign: "right" }}>
                  <Button
                    variant="contained"
                    onClick={fetchReporteImportaciones}
                    disabled={loadingImp}
                    sx={{ mt: { xs: 2, md: 0 } }}
                  >
                    {loadingImp ? "Cargando..." : "Generar reporte"}
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {impData && (
              <Box>
                <Paper
                  sx={{
                    p: 2,
                    mb: 2,
                    borderRadius: 2,
                    boxShadow: 1,
                    bgcolor: "#fff3e0",
                  }}
                >
                  <Typography variant="subtitle2">Total importaciones</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {impData.total_importaciones}
                  </Typography>
                </Paper>

                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 1 }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Importaciones por proveedor
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={downloadImportacionesCSV}
                    >
                      CSV
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<PictureAsPdfIcon />}
                      onClick={downloadImportacionesPDF}
                    >
                      PDF
                    </Button>
                  </Stack>
                </Stack>

                <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Proveedor</TableCell>
                        <TableCell align="right"># Importaciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {impData.por_proveedor.map(row => (
                        <TableRow key={row.proveedorId}>
                          <TableCell>{row.proveedorNombre}</TableCell>
                          <TableCell align="right">
                            {row.cantidad_importaciones}
                          </TableCell>
                        </TableRow>
                      ))}
                      {impData.por_proveedor.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={2} align="center">
                            Sin datos
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </TabPanel>

          {/* ===================== TAB STOCK ===================== */}
          <TabPanel value={tab} index={2}>
            <Paper sx={{ p: 2, mb: 2, borderRadius: 2, boxShadow: 1 }}>
              <Grid container alignItems="center" spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={soloEnAlerta}
                        onChange={e => setSoloEnAlerta(e.target.checked)}
                      />
                    }
                    label="Mostrar solo modelos en alerta (stock ≤ mínimo)"
                  />
                </Grid>
                <Grid item xs={12} md={6} sx={{ textAlign: "right" }}>
                  <Button
                    variant="contained"
                    onClick={fetchReporteStock}
                    disabled={loadingStock}
                  >
                    {loadingStock ? "Cargando..." : "Generar reporte"}
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {stockData && (
              <Box>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={6}>
                    <Paper
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        boxShadow: 1,
                        bgcolor: "#e3f2fd",
                      }}
                    >
                      <Typography variant="subtitle2">Total modelos</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {stockData.total_modelos}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        boxShadow: 1,
                        bgcolor: "#ffebee",
                      }}
                    >
                      <Typography variant="subtitle2">
                        Modelos en alerta
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {stockData.total_en_alerta}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 1 }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Detalle de stock por modelo
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={downloadStockCSV}
                    >
                      CSV
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<PictureAsPdfIcon />}
                      onClick={downloadStockPDF}
                    >
                      PDF
                    </Button>
                  </Stack>
                </Stack>

                <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Modelo</TableCell>
                        <TableCell>Marca</TableCell>
                        <TableCell align="right">Stock actual</TableCell>
                        <TableCell align="right">Stock mínimo</TableCell>
                        <TableCell align="center">Estado</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stockData.items.map(item => (
                        <TableRow
                          key={item.modeloId}
                          sx={
                            item.en_alerta
                              ? { bgcolor: "rgba(255,0,0,0.05)" }
                              : undefined
                          }
                        >
                          <TableCell>{item.nombreModelo}</TableCell>
                          <TableCell>{item.marca}</TableCell>
                          <TableCell align="right">
                            {item.stock_actual}
                          </TableCell>
                          <TableCell align="right">
                            {item.stock_minimo}
                          </TableCell>
                          <TableCell align="center">
                            {item.en_alerta ? "En alerta" : "OK"}
                          </TableCell>
                        </TableRow>
                      ))}
                      {stockData.items.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            Sin datos
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  );
}
