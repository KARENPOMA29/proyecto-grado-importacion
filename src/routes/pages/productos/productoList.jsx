import { useState, useEffect, useRef } from "react";
import { 
  Eye, 
  PencilLine,
  Package,
  Tag,
  BarChart3,
  Check,
  AlertCircle,
  Filter,
  Search
} from "lucide-react";
import {
  Box,
  Card,
  Typography,
  Button,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from "@mui/material";
import GridGenerico from "@/components/Grid";
import DetailsDialog from "@/components/details";
import ProductoForm from "./ProductoForm";
import ServiceProducto from "@/services/ServiceProducto";
import ServiceModeloProducto from "@/services/ServiceModeloProducto";
import ServiceCategoria from "@/services/ServiceCategoria";
import ServiceImportacion from "@/services/ServiceImportacion";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import BarcodeListener from "@/components/BarcodeListener";
const ProductList = () => {
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(null);

  const [modelos, setModelos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [importaciones, setImportaciones] = useState([]);
  
  const [filters, setFilters] = useState({
    observado: "",
    categoriaId: "",
    modeloId: "",
    importacionId: "",
    numeroSerie: "",
  });
  const [totalProductos, setTotalProductos] = useState(0);
  const gridRef = useRef(null);
  const [reloadKey, setReloadKey] = useState(0);
  const serieFilterRef = useRef(null);
  // 👇 permisos por rol
  const { user } = useAuth();
  const roleKey = (user?.rol || "").trim().toLowerCase();
  const canCreate = roleKey === "administrador" || roleKey === "almacen";
  const canEdit = roleKey === "administrador" || roleKey === "almacen";
  const canDelete = roleKey === "administrador";

  useEffect(() => {
    (async () => {
      try {
        const data = await ServiceModeloProducto.getAll();
        setModelos(Array.isArray(data) ? data : data?.items || []);
      } catch {
        setModelos([]);
      }

      try {
        const data = await ServiceCategoria.getAll();
        setCategorias(Array.isArray(data) ? data : data?.items || []);
      } catch {
        setCategorias([]);
      }

      try {
        const data = await ServiceImportacion.getAll();
        setImportaciones(Array.isArray(data) ? data : data?.items || []);
      } catch {
        setImportaciones([]);
      }
    })();
  }, []);
  // 🔢 Recalcular total de productos según los filtros actuales
  useEffect(() => {
    (async () => {
      try {
        const data = await serviceWithFilters.getAll();
        setTotalProductos(Array.isArray(data) ? data.length : 0);
      } catch {
        setTotalProductos(0);
      }
    })();
  }, [filters, reloadKey]);

  const getModeloNombre = (id) => {
    const found = modelos.find((x) => x.id === id);
    return found ? found.nombreModelo : `#${id}`;
  };

  const getCategoriaNombre = (id) => {
    const found = categorias.find((x) => x.id === id);
    return found ? found.nombre || found.nombreCategoria : `#${id}`;
  };

  const getImportacionCodigo = (id) => {
    const found = importaciones.find((x) => x.id === id);
    return found ? found.codigo || found.codigoImportacion : `#${id}`;
  };

  // 🟢 abrir formulario para editar
  const handleEdit = async (id) => {
    try {
      const data = await ServiceProducto.getById(id);
      setFormData(data);
      setShowForm(true);
    } catch {
      toast.error("Error al cargar producto para editar");
    }
  };
  const handleBarcodeScanFilter = (code) => {
    setFilters((prev) => ({
      ...prev,
      numeroSerie: code,
    }));
    setReloadKey((prev) => prev + 1); // fuerza recarga del grid

    if (serieFilterRef.current) {
      serieFilterRef.current.focus();
      serieFilterRef.current.select?.();
    }

    toast.success(`Código escaneado: ${code}`);
  };
  // 🟢 cuando el formulario guarda OK
  const handleFormSuccess = () => {
    setShowForm(false);
    setFormData(null);
    setReloadKey((prev) => prev + 1);
  };

  // 🟢 Servicio que pasa filtros al backend (query params)
  const serviceWithFilters = {
    ...ServiceProducto,
    getAll: async (params = {}) => {
      const filterParams = {};

      if (filters.observado) filterParams.observado = filters.observado;
      if (filters.categoriaId) filterParams.categoriaId = filters.categoriaId;
      if (filters.modeloId) filterParams.modeloId = filters.modeloId;
      if (filters.importacionId)
        filterParams.importacionId = filters.importacionId;
      if (filters.numeroSerie?.trim())
        filterParams.numeroSerie = filters.numeroSerie.trim();

      return ServiceProducto.getAll({
        ...params,
        ...filterParams,
      });
    },
  };

  const columns = [
    { 
      name: "N° Serie", 
      selector: (row) => row.numeroSerie, 
      sortable: true,
      width: "140px"
    },
    { 
      name: "Descripción", 
      selector: (row) => row.descripcion, 
      sortable: true,
      wrap: true,
      minWidth: "200px"
    },
    {
      name: "Precio (Bs)",
      selector: (row) => Number(row.precio || 0).toFixed(2),
      sortable: true,
      right: true,
      width: "120px"
    },
    {
      name: "Categoría",
      selector: (row) => getCategoriaNombre(row.categoriaId),
      sortable: true,
      width: "150px"
    },
    {
      name: "Modelo",
      selector: (row) => getModeloNombre(row.modeloId),
      sortable: true,
      width: "150px"
    },
    {
      name: "Importación",
      selector: (row) => getImportacionCodigo(row.importacionId),
      sortable: true,
      width: "120px"
    },
    {
      name: "Observación",
      cell: (row) => {
        const tieneObsDescripcion =
          row.obsDescripcion && row.obsDescripcion.trim() !== "";
        
        if (row.observado === 2 || tieneObsDescripcion) {
          return (
            <Tooltip title={tieneObsDescripcion ? row.obsDescripcion : "Producto observado"}>
              <Chip
                icon={<AlertCircle size={14} />}
                label="Observado"
                size="small"
                sx={{
                  bgcolor: "#FFF3CD",
                  color: "#856404",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  height: "24px",
                  "& .MuiChip-icon": {
                    color: "#856404",
                    marginLeft: "4px"
                  }
                }}
              />
            </Tooltip>
          );
        }

        if (row.observado === 1) {
          return (
            <Chip
              icon={<Check size={14} />}
              label="Normal"
              size="small"
              sx={{
                bgcolor: "#D1E7DD",
                color: "#0F5132",
                fontWeight: 500,
                fontSize: "0.75rem",
                height: "24px",
                "& .MuiChip-icon": {
                  color: "#0F5132",
                  marginLeft: "4px"
                }
              }}
            />
          );
        }

        return (
          <Chip
            label="—"
            size="small"
            sx={{
              bgcolor: "#F8F9FA",
              color: "#6C757D",
              fontSize: "0.75rem",
              height: "24px"
            }}
          />
        );
      },
      center: true,
      width: "130px"
    },
    {
      name: "Estado",
      cell: (row) => {
        const estado = row.estado;
        let color, bgcolor, label;
        
        switch(estado) {
          case 1:
            color = "#0D8C47";
            bgcolor = "#0D8C4720";
            label = "Disponible";
            break;
          case 2:
            color = "#592B2B";
            bgcolor = "#592B2B20";
            label = "Vendido";
            break;
          default:
            color = "#6C757D";
            bgcolor = "#F8F9FA";
            label = "Inactivo";
        }
        
        return (
          <Chip
            label={label}
            size="small"
            sx={{
              bgcolor,
              color,
              fontWeight: 600,
              fontSize: "0.75rem",
              height: "24px"
            }}
          />
        );
      },
      sortable: true,
      width: "120px"
    },
    {
      name: "Acciones",
      cell: (row) => (
        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
          <Tooltip title="Ver detalles">
            <IconButton
              size="small"
              onClick={() => setSelectedId(row.id)}
              sx={{
                color: "#592B2B",
                "&:hover": {
                  bgcolor: "#592B2B10"
                }
              }}
            >
              <Eye size={18} />
            </IconButton>
          </Tooltip>

          {canEdit && (
            <Tooltip title="Editar">
              <IconButton
                size="small"
                onClick={() => handleEdit(row.id)}
                sx={{
                  color: "#0D8C47",
                  "&:hover": {
                    bgcolor: "#0D8C4710"
                  }
                }}
              >
                <PencilLine size={18} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
      width: "100px",
      right: true
    },
  ];

  const detailFields = [
    { key: "numeroSerie", label: "Número de Serie" },
    { key: "descripcion", label: "Descripción" },
    { 
      key: "precio", 
      label: "Precio", 
      format: (v) => `Bs ${Number(v || 0).toFixed(2)}` 
    },
    { 
      key: "precioOrigen", 
      label: "Precio Origen", 
      format: (v) => `Bs ${Number(v || 0).toFixed(2)}` 
    },
    { key: "categoriaId", label: "Categoría", format: getCategoriaNombre },
    { key: "modeloId", label: "Modelo", format: getModeloNombre },
    { key: "importacionId", label: "Importación", format: getImportacionCodigo },
    {
      key: "observado",
      label: "Observado",
      format: (v) => v === 1 ? "No" : v === 2 ? "Sí" : "—"
    },
    {
      key: "obsDescripcion",
      label: "Detalle observación",
      format: (v) => v || "Sin detalles"
    },
    {
      key: "estado",
      label: "Estado",
      format: (v) => v === 1 ? "Disponible" : v === 2 ? "Vendido" : "Inactivo"
    },
    {
      key: "fechaRegistro",
      label: "Fecha de Registro",
      format: (v) => v ? new Date(v).toLocaleString("es-ES") : "—"
    },
  ];

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setReloadKey((prev) => prev + 1);  // fuerza recarga del grid
  };

  const clearFilters = () => {
    setFilters({
      observado: "",
      categoriaId: "",
      modeloId: "",
      importacionId: "",
      numeroSerie: "",
    });
    setReloadKey((prev) => prev + 1);
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
       {/* 🔹 LECTOR DE CÓDIGO DE BARRAS PARA EL FILTRO DE SERIE */}
        <BarcodeListener
          onScan={handleBarcodeScanFilter}
          enabled
          debug
          targetRef={serieFilterRef}
          gapMs={120}
          autoLength={13}
        />
      {/* HEADER */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ 
          display: "flex", 
          flexDirection: { xs: "column", md: "row" }, 
          alignItems: { xs: "flex-start", md: "center" },
          justifyContent: "space-between",
          gap: 2,
          mb: 3
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ 
              width: 48, 
              height: 48, 
              borderRadius: "50%", 
              bgcolor: "#592B2B20", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center" 
            }}>
              <Package size={24} color="#592B2B" />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: "#3A1A1A" }}>
                Gestión de Productos
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Administra el inventario de productos disponibles
              </Typography>
            </Box>
          </Box>

          {canCreate && (
            <Button
              variant="contained"
              onClick={() => {
                setFormData(null);
                setShowForm(true);
              }}
              startIcon={<PencilLine size={18} />}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1,
                fontWeight: 600,
                textTransform: "none",
                background: "linear-gradient(135deg, #592B2B 0%, #3A1A1A 100%)",
                boxShadow: "0 4px 10px rgba(89,43,43,0.25)",
                "&:hover": {
                  background: "linear-gradient(135deg, #3A1A1A 0%, #592B2B 100%)",
                  boxShadow: "0 6px 16px rgba(89,43,43,0.35)",
                },
              }}
            >
              Nuevo Producto
            </Button>
          )}
        </Box>

        {/* FILTROS */}
        <Card 
          variant="outlined" 
          sx={{ 
            p: 2, 
            mb: 3, 
            borderRadius: 3, 
            borderColor: "#f1d2d2", 
            bgcolor: "#fdf5f5" 
          }}
        >
          <Box sx={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 1, 
            mb: 2 
          }}>
            <Filter size={18} color="#592B2B" />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#3A1A1A" }}>
              Filtros
            </Typography>
          </Box>
          
          <Box sx={{ 
            display: "flex", 
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            alignItems: { xs: "stretch", sm: "center" },
            flexWrap: "wrap"
          }}>
            {/* Buscador por serie */}
            <TextField
              size="small"
              label="Buscar por N° de Serie"
              value={filters.numeroSerie}
              inputRef={serieFilterRef}       // 👈 AQUÍ
              onChange={(e) => handleFilterChange("numeroSerie", e.target.value)}
              InputProps={{
                startAdornment: (
                  <Search size={16} style={{ marginRight: 6, color: "#6b7280" }} />
                ),
              }}
              sx={{
                minWidth: 220,
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  bgcolor: "white",
                },
              }}
            />

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Observado</InputLabel>
              <Select
                value={filters.observado}
                label="Observado"
                onChange={(e) => handleFilterChange("observado", e.target.value)}
                sx={{
                  borderRadius: "8px",
                  bgcolor: "white",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#e2e8f0",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#a66",
                  }
                }}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="1">Normal</MenuItem>
                <MenuItem value="2">Observado</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Categoría</InputLabel>
              <Select
                value={filters.categoriaId}
                label="Categoría"
                onChange={(e) => handleFilterChange("categoriaId", e.target.value)}
                sx={{
                  borderRadius: "8px",
                  bgcolor: "white",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#e2e8f0",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#a66",
                  }
                }}
              >
                <MenuItem value="">Todas</MenuItem>
                {categorias.map(cat => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.nombre || cat.nombreCategoria}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Modelo</InputLabel>
              <Select
                value={filters.modeloId}
                label="Modelo"
                onChange={(e) => handleFilterChange("modeloId", e.target.value)}
                sx={{
                  borderRadius: "8px",
                  bgcolor: "white",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#e2e8f0",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#a66",
                  }
                }}
              >
                <MenuItem value="">Todos</MenuItem>
                {modelos.map(mod => (
                  <MenuItem key={mod.id} value={mod.id}>
                    {mod.nombreModelo || mod.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Importación</InputLabel>
              <Select
                value={filters.importacionId}
                label="Importación"
                onChange={(e) =>
                  handleFilterChange("importacionId", e.target.value)
                }
                sx={{
                  borderRadius: "8px",
                  bgcolor: "white",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#e2e8f0",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#a66",
                  }
                }}
              >
                <MenuItem value="">Todas</MenuItem>
                {importaciones.map((imp) => (
                  <MenuItem key={imp.id} value={imp.id}>
                    {imp.codigo || imp.codigoImportacion}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              onClick={clearFilters}
              size="small"
              sx={{
                borderRadius: "8px",
                borderColor: "#592B2B",
                color: "#592B2B",
                textTransform: "none",
                fontWeight: 500,
                "&:hover": {
                  borderColor: "#3A1A1A",
                  bgcolor: "#592B2B08"
                }
              }}
            >
              Limpiar filtros
            </Button>
          </Box>
        </Card>
      </Box>

      {/* RESUMEN ESTADÍSTICO (lo puedes ajustar más adelante si quieres) */}
      <Card 
        variant="outlined" 
        sx={{ 
          mb: 3, 
          p: 2, 
          borderRadius: 3, 
          borderColor: "#f1d2d2",
          bgcolor: "white"
        }}
      >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
        <Box sx={{ 
          width: 40, 
          height: 40, 
          borderRadius: "50%", 
          bgcolor: "#0D8C4720", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center" 
        }}>
          <Package size={20} color="#0D8C47" />
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Total productos (según filtros)
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#0D8C47" }}>
            {totalProductos} encontrados
          </Typography>
        </Box>
      </Box>


      </Card>

      {/* TABLA DE PRODUCTOS */}
      <Card 
        variant="outlined" 
        sx={{ 
          borderRadius: 3, 
          borderColor: "#f1d2d2",
          overflow: "hidden"
        }}
      >
        <Box sx={{ width: "100%", overflowX: "auto" }}>
          <Box sx={{ minWidth: 1000 }}>
            <GridGenerico
              key={reloadKey}
              ref={gridRef}
              title=""
              service={serviceWithFilters}
              enableSearch={false} 
              columns={columns}
              pageSize={10}
              defaultSortField="fechaRegistro"
              defaultSortAsc={false}
            />
          </Box>
        </Box>
      </Card>

      {/* MODALES */}
      {showForm && (
        <ProductoForm
          initialData={formData}
          onClose={() => setShowForm(false)}
          onSuccess={handleFormSuccess}
        />
      )}

      <DetailsDialog
        open={Boolean(selectedId)}
        id={selectedId}
        fields={detailFields}
        fetchData={ServiceProducto.getById}
        onClose={() => setSelectedId(null)}
      />
    </Box>
  );
};

export default ProductList;
