// src/routes/pages/reportes/Reporte_Inventario.jsx
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
  Stack,
  LinearProgress,
  Alert,
  Tooltip,
  Card,
  CardContent,
} from "@mui/material";
import {
  FilterAlt,
  Refresh,
  PictureAsPdf,
  Download,
  Search,
  Inventory,
  Warning,
  Storage,
  Category,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import ServiceReporteInventario from "@/services/ServiceReporteInventario";
import ServiceCiudad from "@/services/ServiceCiudad";
import ServiceSucursal from "@/services/ServiceSucursal";
import ServiceAlmacen from "@/services/ServiceAlmacen";
import ServiceSeccion from "@/services/ServiceSeccion";

const Reporte_Inventario = () => {
  // ================== FILTROS ==================
  const [filtros, setFiltros] = useState({
    fecha_desde: "",
    fecha_hasta: "",
    ciudad_id: "",
    sucursal_id: "",
    almacen_id: "",
    seccion_id: "",
  });

  // ================== CATALOGOS ==================
  const [ciudades, setCiudades] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [secciones, setSecciones] = useState([]);

  // ================== DATOS REPORTE ==================
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);

  // ================== CARGAR CATALOGOS ==================
  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        setLoadingCatalogos(true);
        const [resCiu, resSuc, resAlm, resSec] = await Promise.all([
          ServiceCiudad.getAll(),
          ServiceSucursal.getAll(),
          ServiceAlmacen.getAll(),
          ServiceSeccion.getAll(),
        ]);

        // aseguramos siempre arrays
        setCiudades(
          Array.isArray(resCiu) ? resCiu : resCiu?.data || resCiu?.items || []
        );
        setSucursales(
          Array.isArray(resSuc) ? resSuc : resSuc?.data || resSuc?.items || []
        );
        setAlmacenes(
          Array.isArray(resAlm) ? resAlm : resAlm?.data || resAlm?.items || []
        );
        setSecciones(
          Array.isArray(resSec) ? resSec : resSec?.data || resSec?.items || []
        );
      } catch (err) {
        console.error(err);
        toast.error("Error cargando catálogos para el reporte de inventario");
      } finally {
        setLoadingCatalogos(false);
      }
    };

    cargarCatalogos();
  }, []);

  // ================== MANEJO FILTROS ==================
  const handleFiltroChange = (e) => {
    const { name, value } = e.target;

    setFiltros((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "ciudad_id"
        ? { sucursal_id: "", almacen_id: "", seccion_id: "" }
        : {}),
      ...(name === "sucursal_id"
        ? { almacen_id: "", seccion_id: "" }
        : {}),
      ...(name === "almacen_id"
        ? { seccion_id: "" }
        : {}),
    }));
  };

  // ================== FILTRADOS DEPENDIENTES ==================
  const sucursalesFiltradas = useMemo(() => {
    if (!filtros.ciudad_id) return sucursales;
    return sucursales.filter(
      (s) => String(s.idCiudad) === String(filtros.ciudad_id)
    );
  }, [sucursales, filtros.ciudad_id]);

  const almacenesFiltrados = useMemo(() => {
    if (!filtros.sucursal_id) return almacenes;
    return almacenes.filter(
      (a) => String(a.sucursalId) === String(filtros.sucursal_id)
    );
  }, [almacenes, filtros.sucursal_id]);

  const seccionesFiltradas = useMemo(() => {
    if (!filtros.almacen_id) return secciones;
    return secciones.filter(
      (s) => String(s.almacenId) === String(filtros.almacen_id)
    );
  }, [secciones, filtros.almacen_id]);

  // ================== BUSCAR REPORTE ==================
  const handleBuscar = async () => {
    try {
      setLoading(true);
      const data = await ServiceReporteInventario.getReporteInventario(filtros);
      setRows(data || []);
      if (!data || data.length === 0) {
        toast.info("No se encontraron registros de inventario con esos filtros");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error obteniendo reporte de inventario");
    } finally {
      setLoading(false);
    }
  };

  // ================== LIMPIAR ==================
  const handleLimpiar = () => {
    setFiltros({
      fecha_desde: "",
      fecha_hasta: "",
      ciudad_id: "",
      sucursal_id: "",
      almacen_id: "",
      seccion_id: "",
    });
    setRows([]);
  };

  // ================== RESUMEN DETALLADO ==================
  const resumen = useMemo(() => {
    let totalModelos = rows.length;
    let sumaStockActual = 0;
    let sumaStockMinimo = 0;
    let modelosBajoStock = 0;
    let modelosSinStock = 0;
    let valorTotalInventario = 0;
    
    // Agrupar por categorías para análisis
    const categoriasMap = new Map();
    const marcasMap = new Map();

    rows.forEach((r) => {
      const actual = Number(r.stockActual ?? 0);
      const minimo = Number(r.stockMinimo ?? 0);
      const precioPromedio = Number(r.precioPromedio ?? 0);
      
      sumaStockActual += actual;
      sumaStockMinimo += minimo;
      valorTotalInventario += actual * precioPromedio;

      if (actual < minimo) {
        modelosBajoStock += 1;
      }
      if (actual === 0) {
        modelosSinStock += 1;
      }

      // Agrupar por categoría
      const categoria = r.categoriaNombre || "Sin categoría";
      const catActual = categoriasMap.get(categoria) || { count: 0, stock: 0 };
      categoriasMap.set(categoria, {
        count: catActual.count + 1,
        stock: catActual.stock + actual,
      });

      // Agrupar por marca
      const marca = r.marcaNombre || "Sin marca";
      const marcaActual = marcasMap.get(marca) || { count: 0, stock: 0 };
      marcasMap.set(marca, {
        count: marcaActual.count + 1,
        stock: marcaActual.stock + actual,
      });
    });

    // Ordenar categorías por cantidad
    const categoriasOrdenadas = Array.from(categoriasMap.entries())
      .map(([nombre, data]) => ({ nombre, ...data }))
      .sort((a, b) => b.count - a.count);

    // Ordenar marcas por cantidad
    const marcasOrdenadas = Array.from(marcasMap.entries())
      .map(([nombre, data]) => ({ nombre, ...data }))
      .sort((a, b) => b.count - a.count);

    return {
      totalModelos,
      sumaStockActual,
      sumaStockMinimo,
      modelosBajoStock,
      modelosSinStock,
      valorTotalInventario,
      topCategorias: categoriasOrdenadas.slice(0, 5),
      topMarcas: marcasOrdenadas.slice(0, 5),
    };
  }, [rows]);

  // ================== CHIPS FILTROS ACTIVOS ==================
  const chipsFiltros = useMemo(() => {
    const chips = [];

    if (filtros.fecha_desde || filtros.fecha_hasta) {
      chips.push(
        `Fecha: ${filtros.fecha_desde || "∞"} - ${filtros.fecha_hasta || "∞"}`
      );
    }

    if (filtros.ciudad_id) {
      const ciu = ciudades.find(
        (c) => String(c.id) === String(filtros.ciudad_id)
      );
      if (ciu) chips.push(`Ciudad: ${ciu.nombre || ciu.Nombre}`);
    }

    if (filtros.sucursal_id) {
      const suc = sucursales.find(
        (s) => String(s.id) === String(filtros.sucursal_id)
      );
      if (suc) chips.push(`Sucursal: ${suc.nombre}`);
    }

    if (filtros.almacen_id) {
      const alm = almacenes.find(
        (a) => String(a.id) === String(filtros.almacen_id)
      );
      if (alm) chips.push(`Almacén: ${alm.nombre}`);
    }

    if (filtros.seccion_id) {
      const sec = secciones.find(
        (s) => String(s.id) === String(filtros.seccion_id)
      );
      if (sec) chips.push(`Sección: ${sec.nombre}`);
    }

    return chips;
  }, [filtros, ciudades, sucursales, almacenes, secciones]);

  // ================== EXPORTAR PDF ==================
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
      
      doc.setFontSize(18);
      doc.setTextColor(33, 33, 33);
      doc.text("REPORTE DE INVENTARIO", 14, 15);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generado el: ${fechaGeneracion} ${horaGeneracion}`, 14, 22);
      doc.text(`Total de registros: ${resumen.totalModelos}`, 14, 28);
      
      // Información de filtros aplicados
      if (chipsFiltros.length > 0) {
        doc.setFontSize(9);
        let yPos = 34;
        chipsFiltros.forEach((filtro) => {
          doc.text(`• ${filtro}`, 14, yPos);
          yPos += 4;
        });
        yPos += 2;
      }

      // Alertas de stock crítico
      if (resumen.modelosBajoStock > 0 || resumen.modelosSinStock > 0) {
        const alertY = chipsFiltros.length > 0 ? 34 + (chipsFiltros.length * 4) + 2 : 34;
        doc.setFontSize(10);
        doc.setTextColor(211, 47, 47);
        if (resumen.modelosBajoStock > 0) {
          doc.text(`⚠ ${resumen.modelosBajoStock} modelos con stock por debajo del mínimo`, 14, alertY);
        }
        if (resumen.modelosSinStock > 0) {
          doc.text(`⚠ ${resumen.modelosSinStock} modelos sin stock disponible`, 14, alertY + 5);
        }
      }

      // Preparar datos para la tabla
      const tableColumn = [
        "Ciudad",
        "Sucursal",
        "Almacén",
        "Sección",
        "Modelo",
        "Marca",
        "Categoría",
        "Color",
        "Unidad",
        "Stock Actual",
        "Stock Mínimo",
        "Estado",
      ];

      const tableRows = rows.map((row) => {
        const stockActual = Number(row.stockActual ?? 0);
        const stockMinimo = Number(row.stockMinimo ?? 0);
        let estado = "Normal";
        let estadoColor = [33, 150, 83]; // Verde
        
        if (stockActual === 0) {
          estado = "Sin Stock";
          estadoColor = [211, 47, 47]; // Rojo
        } else if (stockMinimo > 0 && stockActual < stockMinimo) {
          estado = "Bajo Stock";
          estadoColor = [255, 152, 0]; // Naranja
        }

        return [
          row.ciudadNombre || "",
          row.sucursalNombre || "",
          row.almacenNombre || "",
          row.seccionNombre || "",
          row.modeloNombre || "",
          row.marcaNombre || "",
          row.categoriaNombre || "",
          row.modeloColor || "",
          row.unidadMedida || "",
          stockActual.toFixed(2),
          stockMinimo.toFixed(2),
          estado,
        ];
      });

      // Agregar tabla
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: chipsFiltros.length > 0 ? 45 + (chipsFiltros.length * 4) : 45,
        theme: "grid",
        styles: { 
          fontSize: 8, 
          cellPadding: 2,
          overflow: 'linebreak'
        },
        headStyles: { 
          fillColor: [41, 128, 185], 
          textColor: 255, 
          fontSize: 9,
          fontStyle: 'bold'
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 10 },
        didParseCell: function(data) {
          // Colorear celda de estado
          if (data.column.index === 11 && data.cell.raw === "Sin Stock") {
            data.cell.styles.fillColor = [211, 47, 47];
            data.cell.styles.textColor = 255;
          } else if (data.column.index === 11 && data.cell.raw === "Bajo Stock") {
            data.cell.styles.fillColor = [255, 152, 0];
            data.cell.styles.textColor = 255;
          }
        },
        columnStyles: {
          9: { halign: 'right' },
          10: { halign: 'right' },
          11: { cellWidth: 20 }
        }
      });

      // Agregar resumen al final
      const finalY = doc.lastAutoTable.finalY || 100;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      doc.text("RESUMEN DEL INVENTARIO", 14, finalY + 10);
      doc.setFontSize(9);
      doc.text(`• Total de modelos: ${resumen.totalModelos}`, 14, finalY + 17);
      doc.text(`• Stock total actual: ${resumen.sumaStockActual.toFixed(2)} unidades`, 14, finalY + 22);
      doc.text(`• Stock mínimo requerido: ${resumen.sumaStockMinimo.toFixed(2)} unidades`, 14, finalY + 27);
      doc.text(`• Valor estimado del inventario: S/. ${resumen.valorTotalInventario.toFixed(2)}`, 14, finalY + 32);
      doc.text(`• Modelos bajo stock: ${resumen.modelosBajoStock}`, 14, finalY + 37);
      doc.text(`• Modelos sin stock: ${resumen.modelosSinStock}`, 14, finalY + 42);

      // Top categorías
      if (resumen.topCategorias.length > 0) {
        doc.text("TOP 5 CATEGORÍAS:", 100, finalY + 10);
        let yCat = finalY + 17;
        resumen.topCategorias.forEach((cat, idx) => {
          doc.text(`${idx + 1}. ${cat.nombre}: ${cat.count} modelos`, 100, yCat);
          yCat += 5;
        });
      }

      // Guardar PDF
      const nombreArchivo = `Reporte_Inventario_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(nombreArchivo);
      
      toast.success("PDF generado exitosamente");
    } catch (error) {
      console.error("Error generando PDF:", error);
      toast.error("Error al generar el PDF");
    }
  };

  // ================== EXPORTAR EXCEL ==================
  const handleExportExcel = () => {
    if (!rows.length) {
      toast.info("No hay datos para exportar");
      return;
    }
    
    // Implementación básica para Excel (CSV)
    const headers = [
      "Ciudad",
      "Sucursal",
      "Almacén",
      "Sección",
      "Modelo",
      "Marca",
      "Categoría",
      "Capacidad/Tamaño",
      "Color",
      "Unidad",
      "Stock Actual",
      "Stock Mínimo",
      "Precio Promedio",
      "Estado"
    ];
    
    const csvData = rows.map(row => {
      const stockActual = Number(row.stockActual ?? 0);
      const stockMinimo = Number(row.stockMinimo ?? 0);
      let estado = "Normal";
      if (stockActual === 0) estado = "Sin Stock";
      else if (stockMinimo > 0 && stockActual < stockMinimo) estado = "Bajo Stock";
      
      return [
        row.ciudadNombre || "",
        row.sucursalNombre || "",
        row.almacenNombre || "",
        row.seccionNombre || "",
        row.modeloNombre || "",
        row.marcaNombre || "",
        row.categoriaNombre || "",
        row.capacidadOTamano || "",
        row.modeloColor || "",
        row.unidadMedida || "",
        stockActual.toFixed(2),
        stockMinimo.toFixed(2),
        Number(row.precioPromedio ?? 0).toFixed(2),
        estado
      ];
    });
    
    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Reporte_Inventario_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("CSV exportado exitosamente");
  };

  // =================================================================
  // ======================== RENDER =================================
  // =================================================================
  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Inventory sx={{ fontSize: 40, color: "primary.main" }} />
          <Box>
            <Typography variant="h4" fontWeight="bold" color="primary">
              Reporte de Inventario
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gestión y control de existencias
            </Typography>
          </Box>
        </Box>
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

      {/* Alertas críticas */}
      {(resumen.modelosBajoStock > 0 || resumen.modelosSinStock > 0) && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
          icon={<Warning />}
        >
          <Typography variant="subtitle2">
            {resumen.modelosBajoStock > 0 && `${resumen.modelosBajoStock} modelos con stock por debajo del mínimo`}
            {resumen.modelosBajoStock > 0 && resumen.modelosSinStock > 0 && ' • '}
            {resumen.modelosSinStock > 0 && `${resumen.modelosSinStock} modelos sin stock disponible`}
          </Typography>
        </Alert>
      )}

      {/* Panel de Filtros */}
      <Paper 
        elevation={2} 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 2,
          background: "linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)"
        }}
      >
        <Typography variant="h6" gutterBottom color="primary" fontWeight="medium">
          Filtros de Búsqueda
        </Typography>
        
        {loadingCatalogos && <LinearProgress sx={{ mb: 2 }} />}
        
        <Grid container spacing={2}>
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

          {/* Ciudad */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              label="Ciudad"
              name="ciudad_id"
              value={filtros.ciudad_id}
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
              <MenuItem value="">-- Todas las ciudades --</MenuItem>
              {(ciudades || []).map((c) => (
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
              label="Sucursal"
              name="sucursal_id"
              value={filtros.sucursal_id}
              onChange={handleFiltroChange}
              size="medium"
              variant="outlined"
              disabled={!filtros.ciudad_id && sucursalesFiltradas.length === 0}
            >
              <MenuItem value="">-- Todas las sucursales --</MenuItem>
              {(sucursalesFiltradas || []).map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.nombre}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Almacén */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              label="Almacén"
              name="almacen_id"
              value={filtros.almacen_id}
              onChange={handleFiltroChange}
              size="medium"
              variant="outlined"
              disabled={!filtros.sucursal_id && almacenesFiltrados.length === 0}
            >
              <MenuItem value="">-- Todos los almacenes --</MenuItem>
              {(almacenesFiltrados || []).map((a) => (
                <MenuItem key={a.id} value={a.id}>
                  {a.nombre}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Sección */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              label="Sección"
              name="seccion_id"
              value={filtros.seccion_id}
              onChange={handleFiltroChange}
              size="medium"
              variant="outlined"
              disabled={!filtros.almacen_id && seccionesFiltradas.length === 0}
            >
              <MenuItem value="">-- Todas las secciones --</MenuItem>
              {(seccionesFiltradas || []).map((s) => (
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

      {/* Resumen con tarjetas */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Modelos
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {resumen.totalModelos}
                  </Typography>
                </Box>
                <Inventory color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Stock Total
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {resumen.sumaStockActual.toFixed(0)}
                  </Typography>
                </Box>
                <Storage color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Bajo Stock
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {resumen.modelosBajoStock}
                  </Typography>
                </Box>
                <Warning color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Valor Inventario
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="info.main">
                    S/. {resumen.valorTotalInventario.toFixed(0)}
                  </Typography>
                </Box>
                <Category color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Análisis de categorías y marcas */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="medium">
              Top 5 Categorías
            </Typography>
            {resumen.topCategorias.length > 0 ? (
              resumen.topCategorias.map((cat, idx) => (
                <Box key={cat.nombre} display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">
                    {idx + 1}. {cat.nombre}
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {cat.count} modelos
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No hay datos de categorías
              </Typography>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="medium">
              Top 5 Marcas
            </Typography>
            {resumen.topMarcas.length > 0 ? (
              resumen.topMarcas.map((marca, idx) => (
                <Box key={marca.nombre} display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">
                    {idx + 1}. {marca.nombre}
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {marca.count} modelos
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No hay datos de marcas
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Tabla de Resultados */}
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
        {loading && <LinearProgress />}
        
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader size="medium">
            <TableHead>
              <TableRow>
                <TableCell sx={{ bgcolor: "primary.main", color: "white", fontWeight: "bold" }}>
                  Ubicación
                </TableCell>
                <TableCell sx={{ bgcolor: "primary.main", color: "white", fontWeight: "bold" }}>
                  Producto
                </TableCell>
                <TableCell sx={{ bgcolor: "primary.main", color: "white", fontWeight: "bold" }}>
                  Especificaciones
                </TableCell>
                <TableCell align="right" sx={{ bgcolor: "primary.main", color: "white", fontWeight: "bold" }}>
                  Stock
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, idx) => {
                const stockActual = Number(row.stockActual ?? 0);
                const stockMinimo = Number(row.stockMinimo ?? 0);
                const bajoStock = stockMinimo > 0 && stockActual < stockMinimo;
                const sinStock = stockActual === 0;

                return (
                  <TableRow
                    key={`${row.modeloId}-${row.seccionId}-${idx}`}
                    hover
                    sx={{
                      '&:last-child td, &:last-child th': { border: 0 },
                      bgcolor: sinStock ? 'rgba(211, 47, 47, 0.1)' : 
                               bajoStock ? 'rgba(255, 152, 0, 0.1)' : 'inherit'
                    }}
                  >
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {row.ciudadNombre}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {row.sucursalNombre} / {row.almacenNombre}
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          Sección: {row.seccionNombre}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {row.modeloNombre}
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          Marca: {row.marcaNombre}
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          Categoría: {row.categoriaNombre}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {row.capacidadOTamano}
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          Color: {row.modeloColor}
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          Unidad: {row.unidadMedida}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box>
                        <Tooltip title={bajoStock ? "Stock por debajo del mínimo" : sinStock ? "Sin stock disponible" : "Stock normal"}>
                          <Chip
                            label={`${stockActual.toFixed(2)} / ${stockMinimo.toFixed(2)}`}
                            size="small"
                            color={
                              sinStock ? "error" : 
                              bajoStock ? "warning" : "success"
                            }
                            variant="outlined"
                          />
                        </Tooltip>
                        <Typography variant="caption" display="block" color="text.secondary" mt={0.5}>
                          {sinStock ? "SIN STOCK" : bajoStock ? "BAJO STOCK" : "NORMAL"}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}

              {rows.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                    <Box py={3}>
                      <Typography variant="h6" color="textSecondary" gutterBottom>
                        No hay datos de inventario
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Aplica filtros y haz clic en "Buscar" para ver el inventario
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Footer con resumen */}
      {rows.length > 0 && (
        <Paper elevation={1} sx={{ mt: 2, p: 2, borderRadius: 2 }}>
          <Grid container spacing={2} justifyContent="space-between">
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="text.secondary">
                Relación stock actual/mínimo:
              </Typography>
              <Typography variant="h6" fontWeight="bold" color={resumen.sumaStockActual < resumen.sumaStockMinimo ? "error" : "success"}>
                {resumen.sumaStockActual.toFixed(0)} / {resumen.sumaStockMinimo.toFixed(0)}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="text.secondary">
                Porcentaje bajo stock:
              </Typography>
              <Typography variant="h6" fontWeight="bold" color={resumen.modelosBajoStock > 0 ? "warning" : "success"}>
                {((resumen.modelosBajoStock / resumen.totalModelos) * 100).toFixed(1)}%
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="text.secondary" textAlign="right">
                Valor total estimado:
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="primary" textAlign="right">
                S/. {resumen.valorTotalInventario.toFixed(2)}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

export default Reporte_Inventario;