import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Card,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Button,
} from "@mui/material";
import {
  AlertCircle,
  Check,
  Filter,
  MapPin,
  Package,
  Search,
  Warehouse,
  X,
} from "lucide-react";

import { toast } from "react-toastify";
import BarcodeListener from "@/components/BarcodeListener";

import ServiceProducto from "@/services/ServiceProducto";
import ServiceCategoria from "@/services/ServiceCategoria";
import ServiceModeloProducto from "@/services/ServiceModeloProducto";
import ServiceImportacion from "@/services/ServiceImportacion";

const ProductList = () => {
  const searchRef = useRef(null);

  const [search, setSearch] = useState("");

  const [filters, setFilters] = useState({
    estado: 1,
    observado: "",
    categoriaId: "",
    modeloId: "",
    importacionId: "",
  });

  const [categorias, setCategorias] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [importaciones, setImportaciones] = useState([]);

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const cargarCombos = async () => {
    try {
      const params = { page: 1, pageSize: 1000 };

      const [catRes, modRes, impRes] = await Promise.allSettled([
        ServiceCategoria.getAll(params),
        ServiceModeloProducto.getAll(params),
        ServiceImportacion.getAll(params),
      ]);

      if (catRes.status === "fulfilled") {
        const data = catRes.value;
        setCategorias(Array.isArray(data) ? data : data?.items || []);
      }

      if (modRes.status === "fulfilled") {
        const data = modRes.value;
        setModelos(Array.isArray(data) ? data : data?.items || []);
      }

      if (impRes.status === "fulfilled") {
        const data = impRes.value;
        setImportaciones(Array.isArray(data) ? data : data?.items || []);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar filtros");
    }
  };

  const buildParams = () => {
    const params = {
      page: page + 1,
      pageSize,
    };

    if (search.trim()) params.search = search.trim();

    if (filters.estado !== "" && filters.estado !== null && filters.estado !== undefined) {
      params.estado = Number(filters.estado);
    }

    if (filters.observado !== "") params.observado = Number(filters.observado);
    if (filters.categoriaId !== "") params.categoriaId = Number(filters.categoriaId);
    if (filters.modeloId !== "") params.modeloId = Number(filters.modeloId);
    if (filters.importacionId !== "") params.importacionId = Number(filters.importacionId);

    return params;
  };

  const cargarProductos = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      const res = await ServiceProducto.buscar(buildParams());

      setRows(res?.items || []);
      setTotal(res?.total || 0);
    } catch (error) {
      console.error(error);
      setRows([]);
      setTotal(0);
      setErrorMsg(error.message || "Error al buscar productos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCombos();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      cargarProductos();
    }, 400);

    return () => clearTimeout(timer);
  }, [search, filters, page, pageSize]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
    setPage(0);
  };

  const clearFilters = () => {
    setSearch("");
    setFilters({
      estado: 1,
      observado: "",
      categoriaId: "",
      modeloId: "",
      importacionId: "",
    });
    setPage(0);
    searchRef.current?.focus();
  };

  const handleBarcodeScan = (code) => {
    setSearch(code);
    setPage(0);
    searchRef.current?.focus();
    searchRef.current?.select?.();
    toast.success(`Código escaneado: ${code}`);
  };

  const estadoChip = (estado) => {
    if (estado === 1) {
      return (
        <Chip
          label="Disponible"
          size="small"
          sx={{
            bgcolor: "#0D8C4720",
            color: "#0D8C47",
            fontWeight: 700,
          }}
        />
      );
    }

    if (estado === 2) {
      return (
        <Chip
          label="Vendido"
          size="small"
          sx={{
            bgcolor: "#592B2B20",
            color: "#592B2B",
            fontWeight: 700,
          }}
        />
      );
    }

    return (
      <Chip
        label="Inactivo"
        size="small"
        sx={{
          bgcolor: "#F1F5F9",
          color: "#64748B",
          fontWeight: 700,
        }}
      />
    );
  };

  const observadoChip = (row) => {
    const tieneObs = row.obsDescripcion && row.obsDescripcion.trim() !== "";

    if (row.observado === 2 || tieneObs) {
      return (
        <Tooltip title={row.obsDescripcion || "Producto observado"}>
          <Chip
            icon={<AlertCircle size={14} />}
            label="Observado"
            size="small"
            sx={{
              bgcolor: "#FFF3CD",
              color: "#856404",
              fontWeight: 700,
              "& .MuiChip-icon": { color: "#856404" },
            }}
          />
        </Tooltip>
      );
    }

    return (
      <Chip
        icon={<Check size={14} />}
        label="Normal"
        size="small"
        sx={{
          bgcolor: "#D1E7DD",
          color: "#0F5132",
          fontWeight: 700,
          "& .MuiChip-icon": { color: "#0F5132" },
        }}
      />
    );
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      <BarcodeListener
        onScan={handleBarcodeScan}
        enabled
        targetRef={searchRef}
        gapMs={120}
        autoLength={13}
      />

      <Box sx={{ mb: 3 }}>
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
            <Package size={24} color="#592B2B" />
          </Box>

          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: "#3A1A1A" }}>
              Buscador de Productos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Busca productos por serie, modelo, categoría, importación, ciudad,
              sucursal, almacén o sección.
            </Typography>
          </Box>
        </Box>
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
            Búsqueda y filtros
          </Typography>
        </Box>

        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              inputRef={searchRef}
              label="Buscar producto"
              placeholder="Serie, modelo, categoría, ciudad, sucursal, almacén..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={18} color="#6b7280" />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  bgcolor: "white",
                },
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
           <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                value={filters.estado}
                label="Estado"
                onChange={(e) => handleFilterChange("estado", e.target.value)}
                sx={{
                  borderRadius: 2,
                  bgcolor: "white",
                  minWidth: 160,
                  "& .MuiSelect-select": {
                    fontWeight: 600,
                  },
                }}
              >
                <MenuItem value="">Todos los estados</MenuItem>
                <MenuItem value={1}>Disponibles</MenuItem>
                <MenuItem value={2}>Vendidos</MenuItem>
                <MenuItem value={0}>Inactivos</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Observación</InputLabel>
              <Select
                value={filters.observado}
                label="Observación"
                onChange={(e) => handleFilterChange("observado", e.target.value)}
                sx={{
                  borderRadius: 2,
                  bgcolor: "white",
                  minWidth: 160,
                  "& .MuiSelect-select": {
                    fontWeight: 600,
                  },
                }}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value={1}>Normal</MenuItem>
                <MenuItem value={2}>Observado</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Categoría</InputLabel>
              <Select
                value={filters.categoriaId}
                label="Categoría"
                onChange={(e) => handleFilterChange("categoriaId", e.target.value)}
                sx={{
                  borderRadius: 2,
                  bgcolor: "white",
                  minWidth: 180,
                  "& .MuiSelect-select": {
                    fontWeight: 600,
                  },
                }}
              >
                <MenuItem value="">Todas las categorías</MenuItem>
                {categorias.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.nombre || cat.nombreCategoria}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Modelo</InputLabel>
              <Select
                value={filters.modeloId}
                label="Modelo"
                onChange={(e) => handleFilterChange("modeloId", e.target.value)}
                sx={{
                  borderRadius: 2,
                  bgcolor: "white",
                  minWidth: 180,
                  "& .MuiSelect-select": {
                    fontWeight: 600,
                  },
                }}
              >
                <MenuItem value="">Todos los modelos</MenuItem>
                {modelos.map((mod) => (
                  <MenuItem key={mod.id} value={mod.id}>
                    {mod.nombreModelo || mod.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          

          <Grid item xs={12} sm={6} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<X size={16} />}
              onClick={clearFilters}
              sx={{
                height: 40,
                borderRadius: 2,
                borderColor: "#592B2B",
                color: "#592B2B",
                textTransform: "none",
                fontWeight: 700,
                bgcolor: "white",
                "&:hover": {
                  borderColor: "#3A1A1A",
                  bgcolor: "#592B2B08",
                },
              }}
            >
              Limpiar filtros
            </Button>
          </Grid>
        </Grid>
      </Card>

      <Card
        variant="outlined"
        sx={{
          mb: 3,
          p: 2,
          borderRadius: 3,
          borderColor: "#f1d2d2",
          bgcolor: "white",
        }}
      >
        
      </Card>

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {errorMsg}
        </Alert>
      )}

      <Card
        variant="outlined"
        sx={{
          borderRadius: 3,
          borderColor: "#f1d2d2",
          overflow: "hidden",
        }}
      >
        <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 640 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>N° Serie</TableCell>
                <TableCell>Producto</TableCell>
                <TableCell>Categoría</TableCell>
                <TableCell>Modelo</TableCell>
                <TableCell>Ubicación</TableCell>
                <TableCell>Observación</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Precio</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={30} />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    No se encontraron productos.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.productoId} hover>
                    <TableCell sx={{ fontWeight: 700 }}>
                      {row.numeroSerie || "—"}
                    </TableCell>

                    <TableCell>
                      <Typography sx={{ fontWeight: 600 }}>
                        {row.descripcion || "Sin descripción"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Importación: {row.importacionCodigo || "—"}
                      </Typography>
                    </TableCell>

                    <TableCell>{row.categoriaNombre || "—"}</TableCell>

                    <TableCell>
                      <Typography sx={{ fontWeight: 600 }}>
                        {row.nombreModelo || "—"}
                      </Typography>
                      
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.4 }}>
                        <Typography
                          variant="body2"
                          sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                        >
                          <MapPin size={14} />
                          {row.ciudadNombre || "Sin ciudad"} /{" "}
                          {row.sucursalNombre || "Sin sucursal"}
                        </Typography>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                        >
                          <Warehouse size={13} />
                          {row.almacenNombre || "Sin almacén"} /{" "}
                          {row.seccionNombre || "Sin sección"}
                        </Typography>
                      </Box>
                    </TableCell>

                    <TableCell>{observadoChip(row)}</TableCell>

                    <TableCell>{estadoChip(row.productoEstado)}</TableCell>

                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      Bs {Number(row.precio || 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={total}
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
        />
      </Card>
    </Box>
  );
};

export default ProductList;