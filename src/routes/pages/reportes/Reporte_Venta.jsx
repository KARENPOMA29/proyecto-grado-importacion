// src/routes/pages/reportes/Reporte_Venta.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Grid,
  TextField,
  MenuItem,
  Button,
  Typography,
  Chip,
  Divider,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  Stack,
  LinearProgress,
} from "@mui/material";
import { FilterAlt, Refresh, PictureAsPdf, Download, Search } from "@mui/icons-material";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import ServiceReporteVentas from "@/services/ServiceReporteVentas";
import ServiceEmpleado from "@/services/ServiceEmpleado";
import ServiceCliente from "@/services/ServiceCliente";
import ServiceCiudad from "@/services/ServiceCiudad";
import ServiceSucursal from "@/services/ServiceSucursal";

const Reporte_Venta = () => {
  // ======== filtros =========
  const [filtros, setFiltros] = useState({
    fecha_desde: "",
    fecha_hasta: "",
    empleado_id: "",
    ciudad_id: "",
    sucursal_id: "",
    cliente_id: "",
  });

  // ======== catálogos para combos =========
  const [empleados, setEmpleados] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [ciudades, setCiudades] = useState([]);
  const [sucursales, setSucursales] = useState([]);

  // ======== datos del reporte =========
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);

  // ======== cargar catálogos al inicio =========
  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        setLoadingCatalogos(true);
        const [resEmp, resCli, resCiu, resSuc] = await Promise.all([
          ServiceEmpleado.getAll(),
          ServiceCliente.getAll(),
          ServiceCiudad.getAll(),
          ServiceSucursal.getAll(),
        ]);

        // 👇 aseguramos que siempre sean arrays
        setEmpleados(
          Array.isArray(resEmp) ? resEmp : resEmp?.items || resEmp?.data || []
        );
        setClientes(
          Array.isArray(resCli) ? resCli : resCli?.items || resCli?.data || []
        );
        setCiudades(
          Array.isArray(resCiu) ? resCiu : resCiu?.items || resCiu?.data || []
        );
        setSucursales(
          Array.isArray(resSuc) ? resSuc : resSuc?.items || resSuc?.data || []
        );
      } catch (error) {
        console.error(error);
        toast.error("Error cargando catálogos para filtros");
      } finally {
        setLoadingCatalogos(false);
      }
    };

    cargarCatalogos();
  }, []);

  // ======== manejar cambios en filtros =========
  const handleFiltroChange = (e) => {
    const { name, value } = e.target;

    setFiltros((prev) => ({
      ...prev,
      [name]: value,
      // cuando cambia ciudad, reseteo sucursal
      ...(name === "ciudad_id" ? { sucursal_id: "" } : {}),
    }));
  };

  // ======== sucursales filtradas por ciudad ========
  const sucursalesFiltradas = useMemo(() => {
    if (!filtros.ciudad_id) return sucursales;
    return sucursales.filter((s) => String(s.idCiudad) === String(filtros.ciudad_id));
  }, [sucursales, filtros.ciudad_id]);

  // ======== buscar reporte =========
  const handleBuscar = async () => {
    try {
      setLoading(true);
      const data = await ServiceReporteVentas.getReporteVentas(filtros);
      setRows(data || []);
      if (!data || data.length === 0) {
        toast.info("No se encontraron ventas con esos filtros");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error obteniendo reporte de ventas");
    } finally {
      setLoading(false);
    }
  };

  // ======== limpiar filtros =========
  const handleLimpiar = () => {
    setFiltros({
      fecha_desde: "",
      fecha_hasta: "",
      empleado_id: "",
      ciudad_id: "",
      sucursal_id: "",
      cliente_id: "",
    });
    setRows([]);
  };

  // ======== resumen de totales =========
  const resumen = useMemo(() => {
    let totalSubtotal = 0;
    let totalVenta = 0;
    let totalDescuento = 0;
    
    rows.forEach((r) => {
      totalSubtotal += Number(r.subtotal ?? 0);
      totalVenta += Number(r.totalVenta ?? 0);
      const precioVenta = Number(r.precioVenta ?? 0);
      const precioFinal = Number(r.subtotal ?? 0);
      totalDescuento += precioVenta - precioFinal;
    });
    
    return {
      registros: rows.length,
      totalSubtotal,
      totalVenta,
      totalDescuento,
    };
  }, [rows]);

  // ======== chips de filtros activos =========
  const chipsFiltros = useMemo(() => {
    const chips = [];

    if (filtros.fecha_desde || filtros.fecha_hasta) {
      chips.push(
        `Fecha: ${filtros.fecha_desde || "∞"} - ${filtros.fecha_hasta || "∞"}`
      );
    }

    if (filtros.empleado_id) {
      const emp = empleados.find((e) => String(e.id) === String(filtros.empleado_id));
      if (emp) chips.push(`Empleado: ${emp.nombreCompleto || emp.nombre}`);
    }

    if (filtros.cliente_id) {
      const cli = clientes.find((c) => String(c.id) === String(filtros.cliente_id));
      if (cli) chips.push(`Cliente: ${cli.razonSocial || cli.nombre}`);
    }

    if (filtros.ciudad_id) {
      const ciu = ciudades.find((c) => String(c.id) === String(filtros.ciudad_id));
      if (ciu) chips.push(`Ciudad: ${ciu.nombre || ciu.Nombre}`);
    }

    if (filtros.sucursal_id) {
      const suc = sucursales.find((s) => String(s.id) === String(filtros.sucursal_id));
      if (suc) chips.push(`Sucursal: ${suc.nombre}`);
    }

    return chips;
  }, [filtros, empleados, clientes, ciudades, sucursales]);

  // ======== exportar a PDF =========
  const handleExportPDF = () => {
    if (!rows.length) {
      toast.info("No hay datos para exportar");
      return;
    }

    try {
      // Crear documento PDF
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      // Título del reporte
      const fechaGeneracion = new Date().toLocaleDateString();
      const horaGeneracion = new Date().toLocaleTimeString();
      
      doc.setFontSize(16);
      doc.text("REPORTE DE VENTAS", 14, 15);
      doc.setFontSize(10);
      doc.text(`Generado el: ${fechaGeneracion} ${horaGeneracion}`, 14, 22);
      
      // Información de filtros aplicados
      if (chipsFiltros.length > 0) {
        doc.setFontSize(9);
        let yPos = 28;
        chipsFiltros.forEach((filtro) => {
          doc.text(`• ${filtro}`, 14, yPos);
          yPos += 5;
        });
      }

      // Preparar datos para la tabla
      const tableColumn = [
        "Fecha",
        "Código",
        "Cliente",
        "Empleado",
        "Sucursal/Ciudad",
        "Serie",
        "Modelo",
        "Categoría",
        "Marca",
        "Precio Origen",
        "Precio Venta",
        "Precio Final",
      ];

      const tableRows = rows.map((row) => [
        row.fechaVenta ? new Date(row.fechaVenta).toLocaleDateString() : "",
        row.codigoVenta || "",
        row.clienteNombre || "",
        row.empleadoNombre || "",
        `${row.sucursalNombre || ""}${row.ciudadNombre ? ` / ${row.ciudadNombre}` : ""}`,
        row.numeroSerie || "",
        row.modeloNombre || "",
        row.categoriaNombre || "",
        row.marcaNombre || "",
        `S/. ${Number(row.precioOrigen || 0).toFixed(2)}`,
        `S/. ${Number(row.precioVenta || 0).toFixed(2)}`,
        `S/. ${Number(row.subtotal || 0).toFixed(2)}`,
      ]);

      // Agregar tabla
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: chipsFiltros.length > 0 ? 28 + (chipsFiltros.length * 5) : 28,
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 9 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 10 },
      });

      // Agregar resumen al final
      const finalY = doc.lastAutoTable.finalY || 100;
      doc.setFontSize(10);
      doc.text(`Total Registros: ${resumen.registros}`, 14, finalY + 10);
      doc.text(`Total Subtotal: S/. ${resumen.totalSubtotal.toFixed(2)}`, 14, finalY + 16);
      doc.text(`Total Venta: S/. ${resumen.totalVenta.toFixed(2)}`, 14, finalY + 22);
      doc.text(`Total Descuento: S/. ${resumen.totalDescuento.toFixed(2)}`, 14, finalY + 28);

      // Guardar PDF
      const nombreArchivo = `Reporte_Ventas_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(nombreArchivo);
      
      toast.success("PDF generado exitosamente");
    } catch (error) {
      console.error("Error generando PDF:", error);
      toast.error("Error al generar el PDF");
    }
  };

  // ======== exportar a Excel =========
  const handleExportExcel = () => {
    if (!rows.length) {
      toast.info("No hay datos para exportar");
      return;
    }
    
    // Para Excel, podrías usar una biblioteca como xlsx
    // Por ahora mostramos un mensaje
    toast.info("Exportar a Excel aún no implementado");
  };

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold" color="primary">
          Reporte de Ventas
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExportExcel}
            disabled={!rows.length}
            size="large"
          >
            Excel
          </Button>
          <Button
            variant="contained"
            startIcon={<PictureAsPdf />}
            onClick={handleExportPDF}
            disabled={!rows.length}
            size="large"
            sx={{ bgcolor: "#d32f2f", "&:hover": { bgcolor: "#b71c1c" } }}
          >
            PDF
          </Button>
        </Stack>
      </Box>

      {/* Panel de Filtros */}
      <Paper 
        elevation={2} 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 2,
          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)"
        }}
      >
        <Typography variant="h6" gutterBottom color="primary" fontWeight="medium">
          Filtros de Búsqueda
        </Typography>
        
        {loadingCatalogos && <LinearProgress sx={{ mb: 2 }} />}
        
        <Grid container spacing={3}>
          {/* Fechas */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Fecha Desde"
              type="date"
              name="fecha_desde"
              value={filtros.fecha_desde}
              onChange={handleFiltroChange}
              InputLabelProps={{ shrink: true }}
              size="medium"
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Fecha Hasta"
              type="date"
              name="fecha_hasta"
              value={filtros.fecha_hasta}
              onChange={handleFiltroChange}
              InputLabelProps={{ shrink: true }}
              size="medium"
              variant="outlined"
            />
          </Grid>

          {/* Empleado */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              name="empleado_id"
              label="Empleado"
              value={filtros.empleado_id}
              onChange={handleFiltroChange}
              size="medium"
              variant="outlined"
              SelectProps={{
                MenuProps: {
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                    },
                  },
                },
              }}
            >
              <MenuItem value="">-- Todos los empleados --</MenuItem>
              {(empleados || []).map((emp) => (
                <MenuItem key={emp.id} value={emp.id}>
                  {emp.nombreCompleto || `${emp.nombre} ${emp.apellido ?? ""}`}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Cliente */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              name="cliente_id"
              label="Cliente"
              value={filtros.cliente_id}
              onChange={handleFiltroChange}
              size="medium"
              variant="outlined"
              SelectProps={{
                MenuProps: {
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                    },
                  },
                },
              }}
            >
              <MenuItem value="">-- Todos los clientes --</MenuItem>
              {clientes.map((cli) => (
                <MenuItem key={cli.id} value={cli.id}>
                  {cli.razonSocial || cli.nombre}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Ciudad */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              name="ciudad_id"
              label="Ciudad"
              value={filtros.ciudad_id}
              onChange={handleFiltroChange}
              size="medium"
              variant="outlined"
            >
              <MenuItem value="">-- Todas las ciudades --</MenuItem>
              {ciudades.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.nombre || c.Nombre}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Sucursal */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              name="sucursal_id"
              label="Sucursal"
              value={filtros.sucursal_id}
              onChange={handleFiltroChange}
              size="medium"
              variant="outlined"
              disabled={!filtros.ciudad_id && sucursalesFiltradas.length === 0}
            >
              <MenuItem value="">-- Todas las sucursales --</MenuItem>
              {sucursalesFiltradas.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.nombre}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Botones de Acción */}
          <Grid item xs={12}>
            <Box display="flex" justifyContent="flex-end" gap={2} mt={1}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleLimpiar}
                size="large"
              >
                Limpiar
              </Button>
              <Button
                variant="contained"
                startIcon={<Search />}
                onClick={handleBuscar}
                disabled={loading}
                size="large"
                sx={{ minWidth: 150 }}
              >
                {loading ? "Buscando..." : "Buscar"}
              </Button>
            </Box>
          </Grid>
        </Grid>

        {/* Chips de filtros activos */}
        {chipsFiltros.length > 0 && (
          <>
            <Divider sx={{ my: 3 }} />
            <Box>
              <Typography variant="subtitle2" gutterBottom color="textSecondary">
                Filtros aplicados:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {chipsFiltros.map((txt) => (
                  <Chip
                    key={txt}
                    label={txt}
                    variant="outlined"
                    color="primary"
                    size="medium"
                  />
                ))}
              </Box>
            </Box>
          </>
        )}
      </Paper>

      {/* Resumen */}
      <Paper elevation={1} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center" p={1} bgcolor="#e3f2fd" borderRadius={1}>
              <Typography variant="subtitle2" color="primary">
                Registros
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {resumen.registros}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center" p={1} bgcolor="#e8f5e9" borderRadius={1}>
              <Typography variant="subtitle2" color="success.main">
                Total Subtotal
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="success.main">
                S/. {resumen.totalSubtotal.toFixed(2)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center" p={1} bgcolor="#fff3e0" borderRadius={1}>
              <Typography variant="subtitle2" color="warning.main">
                Total Venta
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="warning.main">
                S/. {resumen.totalVenta.toFixed(2)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center" p={1} bgcolor="#ffebee" borderRadius={1}>
              <Typography variant="subtitle2" color="error.main">
                Total Descuento
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="error.main">
                S/. {resumen.totalDescuento.toFixed(2)}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabla de Resultados */}
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
        {loading && <LinearProgress />}
        
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader size="medium">
            <TableHead>
              <TableRow>
                <TableCell sx={{ bgcolor: "primary.main", color: "white", fontWeight: "bold" }}>
                  Fecha
                </TableCell>
                <TableCell sx={{ bgcolor: "primary.main", color: "white", fontWeight: "bold" }}>
                  Código
                </TableCell>
                <TableCell sx={{ bgcolor: "primary.main", color: "white", fontWeight: "bold" }}>
                  Cliente
                </TableCell>
                <TableCell sx={{ bgcolor: "primary.main", color: "white", fontWeight: "bold" }}>
                  Empleado
                </TableCell>
                <TableCell sx={{ bgcolor: "primary.main", color: "white", fontWeight: "bold" }}>
                  Sucursal / Ciudad
                </TableCell>
                <TableCell sx={{ bgcolor: "primary.main", color: "white", fontWeight: "bold" }}>
                  Serie
                </TableCell>
                <TableCell sx={{ bgcolor: "primary.main", color: "white", fontWeight: "bold" }}>
                  Modelo
                </TableCell>
                <TableCell sx={{ bgcolor: "primary.main", color: "white", fontWeight: "bold" }}>
                  Categoría
                </TableCell>
                <TableCell sx={{ bgcolor: "primary.main", color: "white", fontWeight: "bold" }}>
                  Marca
                </TableCell>
                <TableCell align="right" sx={{ bgcolor: "primary.main", color: "white", fontWeight: "bold" }}>
                  Precio Origen
                </TableCell>
                <TableCell align="right" sx={{ bgcolor: "primary.main", color: "white", fontWeight: "bold" }}>
                  Precio Venta
                </TableCell>
                <TableCell align="right" sx={{ bgcolor: "primary.main", color: "white", fontWeight: "bold" }}>
                  Precio Final
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow 
                  key={row.detalleId} 
                  hover
                  sx={{ 
                    '&:nth-of-type(even)': { bgcolor: '#f8f9fa' },
                    '&:last-child td, &:last-child th': { border: 0 }
                  }}
                >
                  <TableCell>
                    {row.fechaVenta
                      ? new Date(row.fechaVenta).toLocaleDateString()
                      : ""}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={row.codigoVenta} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap title={row.clienteNombre}>
                      {row.clienteNombre}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap title={row.empleadoNombre}>
                      {row.empleadoNombre}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {row.sucursalNombre}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {row.ciudadNombre}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {row.numeroSerie}
                    </Typography>
                  </TableCell>
                  <TableCell>{row.modeloNombre}</TableCell>
                  <TableCell>
                    <Chip 
                      label={row.categoriaNombre} 
                      size="small" 
                      color="secondary" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{row.marcaNombre}</TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="textSecondary">
                      S/. {Number(row.precioOrigen).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="medium">
                      S/. {Number(row.precioVenta).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold" color="success.main">
                      S/. {Number(row.subtotal).toFixed(2)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}

              {rows.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={13} align="center" sx={{ py: 5 }}>
                    <Box py={3}>
                      <Typography variant="h6" color="textSecondary" gutterBottom>
                        No hay datos para mostrar
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Aplica filtros y haz clic en "Buscar" para ver los resultados
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Footer con totales */}
      {rows.length > 0 && (
        <Paper elevation={1} sx={{ mt: 2, p: 2, borderRadius: 2 }}>
          <Grid container spacing={2} justifyContent="flex-end">
            <Grid item xs={12} sm={4} md={3}>
              <Box textAlign="right">
                <Typography variant="subtitle2" color="textSecondary">
                  Subtotal General:
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  S/. {resumen.totalSubtotal.toFixed(2)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <Box textAlign="right">
                <Typography variant="subtitle2" color="textSecondary">
                  Total General:
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="primary">
                  S/. {resumen.totalVenta.toFixed(2)}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

export default Reporte_Venta;