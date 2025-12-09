// src/routes/pages/ventas/VentasList.jsx
import { useState, useRef, useEffect, useMemo } from "react";
import {
  Eye,
  PencilLine,
  Trash,
  ArrowLeft,
  Building,
  Store,
  MapPin,
  Check,
  ChevronRight
} from "lucide-react";
import {
  Box,
  Card,
  Typography,
  Button,
  IconButton,
  CircularProgress
} from "@mui/material";

import GridGenerico from "@/components/Grid";
import DetailsDialog from "@/components/details";
import ServiceVentas from "@/services/ServiceVentas";
import ServiceCliente from "@/services/ServiceCliente";
import ServiceSucursal from "@/services/ServiceSucursal";
import ServiceEmpleado from "@/services/ServiceEmpleado";
import ServiceCiudad from "@/services/ServiceCiudad";
import { toast } from "react-toastify";
import VentasForm from "./VentasForm";
import DeleteConfirm from "@/components/deleteConfirm";
import { useAuth } from "@/context/AuthContext";

const STEP_TITLES = ["Seleccionar Ciudad", "Seleccionar Sucursal", "Lista de Ventas"];

const VentasList = () => {
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(null);
  const [idToCancel, setIdToCancel] = useState(null);
  const gridRef = useRef(null);

  // Estados para el wizard (solo admin usa wizard completo)
  const [step, setStep] = useState(0);
  const [ciudades, setCiudades] = useState([]);
  const [selectedCiudad, setSelectedCiudad] = useState(null);
  const [sucursales, setSucursales] = useState([]);
  const [selectedSucursal, setSelectedSucursal] = useState(null);
  const [loadingSucursales, setLoadingSucursales] = useState(false);

  const [clientes, setClientes] = useState([]);
  const [empleados, setEmpleados] = useState([]);

  // 🔐 usuario y permisos
  const { user } = useAuth();
  const rawRoleKey =
    user?.rol ||
    user?.role ||
    user?.perfil?.rol ||
    user?.perfil?.nombre ||
    "";
  const roleKey = rawRoleKey.toString().trim().toLowerCase();

  const isAdmin = roleKey === "administrador";
  const isVentas = roleKey === "ventas";
  const empleadoSucursalId = user?.idSucursal ?? null;

  const canCreate = isAdmin || isVentas;
  const canCancel = isAdmin;

  /* =================== CARGA INICIAL COMÚN =================== */

  useEffect(() => {
    (async () => {
      try {
        const [cliRes, empRes, ciudadRes] = await Promise.all([
          ServiceCliente.getAll(),
          ServiceEmpleado.getAll(),
          ServiceCiudad.getAll(),
        ]);

        const cliData = Array.isArray(cliRes) ? cliRes : cliRes.items ?? [];
        const empData = Array.isArray(empRes) ? empRes : empRes.items ?? [];
        const ciudadData = Array.isArray(ciudadRes)
          ? ciudadRes
          : ciudadRes.items ?? [];

        setClientes(cliData);
        setEmpleados(empData);
        setCiudades(ciudadData);
      } catch (err) {
        console.error(err);
        toast.error(
          "Error al cargar datos base (clientes, empleados, ciudades)"
        );
      }
    })();
  }, []);

  /* ============= CONFIGURACIÓN INICIAL POR ROL ============= */

  useEffect(() => {
    // Si es vendedor, cargar su sucursal y saltar al paso 2
    if (isVentas && empleadoSucursalId) {
      (async () => {
        try {
          const suc = await ServiceSucursal.getById(empleadoSucursalId);
          setSucursales([suc]);
          setSelectedSucursal(suc);
          setStep(2); // Ir directo a lista de ventas
        } catch (err) {
          console.error(err);
          toast.error("No se pudo cargar la sucursal del vendedor");
        }
      })();
    }
    
    // Si es admin, empezar en paso 0
    if (isAdmin) {
      setStep(0);
    }
  }, [isAdmin, isVentas, empleadoSucursalId]);

  /* ============= CARGA SUCURSALES AL SELECCIONAR CIUDAD (ADMIN) ============= */

  const handleSelectCiudad = async (ciudad) => {
    setSelectedCiudad(ciudad);
    setLoadingSucursales(true);

    try {
      const res = await ServiceSucursal.getAll({
        ciudadId: ciudad.id,
      });
      const data = Array.isArray(res) ? res : res.items ?? [];
      setSucursales(data);
      setSelectedSucursal(null);
      setStep(1); // paso sucursal
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar sucursales para la ciudad seleccionada");
    } finally {
      setLoadingSucursales(false);
    }
  };

  const handleSelectSucursal = (sucursal) => {
    setSelectedSucursal(sucursal);
    setStep(2);
  };

  const handleGoBack = () => {
    if (step === 1) {
      setStep(0);
      setSelectedCiudad(null);
      setSelectedSucursal(null);
    } else if (step === 2) {
      // Si es admin, puede volver; si es ventas no muestra botón
      if (isAdmin) {
        setStep(1);
        setSelectedSucursal(null);
      }
    }
  };

  /* ========================= MAPAS PARA MOSTRAR NOMBRES ========================= */

  const clienteMap = useMemo(() => {
    const m = {};
    for (const c of clientes) {
      const posibleNombre =
        c.nombreCompleto ||
        c.nombre ||
        (c.nombre && c.apellido ? `${c.nombre} ${c.apellido}` : null) ||
        c.razonSocial ||
        c.razon_social ||
        c.identificacion ||
        `Cliente #${c.id}`;
      m[c.id] = posibleNombre;
    }
    return m;
  }, [clientes]);

  const sucursalMap = useMemo(() => {
    const m = {};
    for (const s of sucursales)
      m[s.id] = s.nombre || `Sucursal #${s.id}`;
    return m;
  }, [sucursales]);

  const empleadoMap = useMemo(() => {
    const m = {};
    for (const e of empleados)
      m[e.id] =
        e.nombreCompleto ||
        (e.nombre && e.apellido ? `${e.nombre} ${e.apellido}` : null) ||
        e.nombre ||
        e.nombres ||
        e.username ||
        `Empleado #${e.id}`;
    return m;
  }, [empleados]);

  /* ================== SERVICE VENTAS CON FILTROS POR ROL ================== */

  // Base por rol (empleadoId)
  const baseVentasService = useMemo(() => {
    if (isAdmin) return ServiceVentas;

    if (isVentas && user?.id) {
      return {
        ...ServiceVentas,
        getAll: (params = {}) =>
          ServiceVentas.getAll({
            ...params,
            empleadoId: user.id,
          }),
      };
    }

    return ServiceVentas;
  }, [isAdmin, isVentas, user?.id]);

  // Añadir filtro por sucursal
  const serviceVentasFiltrado = useMemo(() => {
    return {
      ...baseVentasService,
      getAll: async (params = {}) => {
        // Si aún no hay sucursal seleccionada, no pedimos nada
        if (!selectedSucursal?.id) {
          return { items: [], total: 0 };
        }
        return baseVentasService.getAll({
          ...params,
          sucursalId: selectedSucursal.id,
        });
      },
    };
  }, [baseVentasService, selectedSucursal]);

  // Refrescar la tabla cuando cambie la sucursal
  useEffect(() => {
    if (step === 2 && gridRef.current?.refetch) {
      gridRef.current.refetch();
    }
  }, [selectedSucursal, step]);

  /* =========================== COLUMNAS Y DETALLES =========================== */

  const columns = [
    {
      name: "Código",
      selector: (r) => r.codigoVenta || "-",
      sortable: true,
      minWidth: "110px",
      wrap: true,
    },
    {
      name: "Cliente",
      selector: (r) => clienteMap[r.clienteId] ?? `ID: ${r.clienteId}`,
      sortable: true,
      grow: 1,
      wrap: true,
      minWidth: "140px",
    },
    {
      name: "Empleado",
      selector: (r) => empleadoMap[r.empleadoId] ?? `ID: ${r.empleadoId}`,
      sortable: true,
      wrap: true,
      minWidth: "140px",
    },
    {
      name: "Sucursal",
      selector: (r) => sucursalMap[r.sucursalId] ?? `ID: ${r.sucursalId}`,
      sortable: true,
      wrap: true,
      minWidth: "140px",
    },
    {
      name: "Total (Bs)",
      selector: (r) => Number(r.total || 0).toFixed(2),
      sortable: true,
      right: true,
      minWidth: "110px",
    },
    {
      name: "Fecha",
      selector: (r) =>
        r.fechaRegistro ? new Date(r.fechaRegistro).toLocaleString() : "",
      sortable: true,
      minWidth: "210px",
      wrap: true,
    },
  ];

  const fields = [
    { label: "Código", key: "codigoVenta" },
    {
      label: "Cliente",
      key: "cliente",
      format: (c, row) => {
        if (!c) {
          const nombreFallback =
            clienteMap[row?.clienteId] ?? `ID: ${row?.clienteId}`;
          return nombreFallback;
        }
        const parts = [];
        if (c.razonSocial) parts.push(c.razonSocial);
        if (c.nit) parts.push(`NIT: ${c.nit}`);
        if (c.telefono) parts.push(`Tel: ${c.telefono}`);
        if (c.correo) parts.push(`Correo: ${c.correo}`);
        return parts.join(" | ");
      },
    },
    {
      label: "Empleado",
      key: "empleadoId",
      format: (v) => empleadoMap[v] ?? `ID: ${v}`,
    },
    {
      label: "Sucursal",
      key: "sucursal",
      format: (s, row) => {
        if (!s) {
          return row?.sucursalId
            ? sucursalMap[row.sucursalId] ?? `ID: ${row.sucursalId}`
            : "—";
        }
        const parts = [];
        if (s.nombre) parts.push(s.nombre);
        if (s.direccion) parts.push(s.direccion);
        if (s.telefono) parts.push(`Tel: ${s.telefono}`);
        if (s.ciudad) parts.push(`Ciudad: ${s.ciudad}`);
        return parts.join(" | ");
      },
    },
    {
      label: "Total",
      key: "total",
      format: (v) => (v ? `Bs ${Number(v).toFixed(2)}` : "—"),
    },
    {
      label: "Fecha de registro",
      key: "fechaRegistro",
      format: (v) => (v ? new Date(v).toLocaleString() : "—"),
    },
    {
      label: "Detalle de productos",
      key: "detalles",
      format: (detalles) => {
        if (!detalles || !Array.isArray(detalles) || !detalles.length)
          return "—";

        return detalles
          .map((d, i) => {
            const p = d.producto || {};
            const modelo = p.modelo || {};
            const marca = modelo.marca || {};

            const linea = [
              `#${i + 1}`,
              p.numeroSerie ? `Serie: ${p.numeroSerie}` : null,
              p.descripcion ? `Desc: ${p.descripcion}` : null,
              marca.nombre ? `Marca: ${marca.nombre}` : null,
              modelo.nombreModelo ? `Modelo: ${modelo.nombreModelo}` : null,
              `Precio: Bs ${p.precio ? Number(p.precio).toFixed(2) : "0.00"}`,
              `Subtotal: Bs ${
                d.subtotal ? Number(d.subtotal).toFixed(2) : "0.00"
              }`,
            ].filter(Boolean);

            return linea.join(" | ");
          })
          .join("\n");
      },
    },
  ];

  /* =========================== HANDLERS =========================== */

  const handleOpenNew = () => {
    if (!selectedSucursal) {
      toast.warning("Debes seleccionar una sucursal primero");
      return;
    }
    setFormData(null);
    setShowForm(true);
  };

  const handleSuccess = () => {
    gridRef.current?.refetch();
    setShowForm(false);
  };

  const handleCancelVenta = async () => {
    if (!idToCancel) return;
    await ServiceVentas.cancel(idToCancel);
    toast.success("Venta cancelada y productos devueltos al stock");
    gridRef.current?.refetch();
    setIdToCancel(null);
  };

  /* ================================ RENDER PASO ================================ */

  const renderStep = () => {
    // Si es vendedor y aún no tiene sucursal cargada
    if (isVentas && !selectedSucursal) {
      return (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <CircularProgress sx={{ color: "#592B2B", mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Cargando datos de tu sucursal...
          </Typography>
        </Box>
      );
    }

    switch (step) {
      case 0: // Seleccionar Ciudad (solo admin)
        return (
          <Box>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Selecciona la ciudad donde deseas ver las sucursales disponibles.
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {ciudades.map((c) => {
                const seleccionada = selectedCiudad?.id === c.id;
                return (
                  <Card
                    key={c.id}
                    variant="outlined"
                    onClick={() => handleSelectCiudad(c)}
                    sx={{
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      '&:hover': {
                        borderColor: "#592B2B",
                        backgroundColor: "#592B2B08",
                        transform: "translateY(-2px)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                      }
                    }}
                  >
                    <Box sx={{ p: 2 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Box sx={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            bgcolor: seleccionada ? "#592B2B" : "#592B2B20",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}>
                            <Building 
                              size={20} 
                              color={seleccionada ? "white" : "#592B2B"} 
                            />
                          </Box>
                          <Box sx={{ textAlign: "left" }}>
                            <Typography fontSize={16} fontWeight={600} color="#3A1A1A">
                              {c.nombre || `Ciudad #${c.id}`}
                            </Typography>
                            {c.departamento && (
                              <Typography fontSize={12} color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                <MapPin size={12} />
                                {c.departamento}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        {seleccionada && (
                          <Box sx={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            bgcolor: "#592B2B",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}>
                            <Check size={14} color="white" />
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Card>
                );
              })}
              {ciudades.length === 0 && (
                <Box sx={{
                  textAlign: "center",
                  py: 4,
                  border: "1px dashed #ccc",
                  borderRadius: 2,
                  bgcolor: "#fafafa"
                }}>
                  <Building size={32} color="#ccc" sx={{ mb: 1 }} />
                  <Typography variant="body2" color="text.disabled">
                    No hay ciudades registradas
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        );

      case 1: // Seleccionar Sucursal (solo admin)
        return (
          <Box>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Selecciona la sucursal de <strong>{selectedCiudad?.nombre}</strong> para ver las ventas.
            </Typography>
            
            {loadingSucursales ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <CircularProgress sx={{ color: "#592B2B", mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Cargando sucursales de {selectedCiudad?.nombre}...
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {sucursales.map((s) => {
                  const seleccionada = selectedSucursal?.id === s.id;
                  return (
                    <Card
                      key={s.id}
                      variant="outlined"
                      onClick={() => handleSelectSucursal(s)}
                      sx={{
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        '&:hover': {
                          borderColor: "#3A1A1A",
                          backgroundColor: "#3A1A1A08",
                          transform: "translateY(-2px)",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                        }
                      }}
                    >
                      <Box sx={{ p: 2 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                            <Box sx={{
                              width: 40,
                              height: 40,
                              borderRadius: "50%",
                              bgcolor: seleccionada ? "#3A1A1A" : "#3A1A1A20",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}>
                              <Store 
                                size={20} 
                                color={seleccionada ? "white" : "#3A1A1A"} 
                              />
                            </Box>
                            <Box sx={{ textAlign: "left" }}>
                              <Typography fontSize={16} fontWeight={600} color="#3A1A1A">
                                {s.nombre}
                              </Typography>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                                <Typography fontSize={12} color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                  <MapPin size={12} />
                                  {s.direccion || "Sin dirección"}
                                </Typography>
                                {s.telefono && (
                                  <Typography fontSize={12} color="text.secondary">
                                    • 📞 {s.telefono}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </Box>
                          {seleccionada && (
                            <Box sx={{
                              width: 24,
                              height: 24,
                              borderRadius: "50%",
                              bgcolor: "#3A1A1A",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}>
                              <Check size={14} color="white" />
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </Card>
                  );
                })}
                {sucursales.length === 0 && (
                  <Box sx={{
                    textAlign: "center",
                    py: 4,
                    border: "1px dashed #ccc",
                    borderRadius: 2,
                    bgcolor: "#fafafa"
                  }}>
                    <Store size={32} color="#ccc" sx={{ mb: 1 }} />
                    <Typography variant="body2" color="text.disabled">
                      No hay sucursales disponibles en {selectedCiudad?.nombre}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        );

      case 2: // Lista de Ventas (ambos roles)
      default:
        return (
          <Box>
            {/* CARD DE SUCURSAL (admin y ventas) */}
            <Card
              variant="outlined"
              sx={{ mb: 3, bgcolor: "#592B2B08", borderColor: "#592B2B20" }}
            >
              <Box
                sx={{
                  p: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
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
                    <Store size={24} color="#592B2B" />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={700} color="#3A1A1A">
                      {selectedSucursal?.nombre || "Sucursal"}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        flexWrap: "wrap",
                      }}
                    >
                      <MapPin size={14} />
                      {selectedSucursal?.direccion || "Sin dirección"}
                      {selectedSucursal?.telefono && (
                        <>
                          <span>•</span>
                          <span>📞 {selectedSucursal.telefono}</span>
                        </>
                      )}
                      {isVentas && (
                        <Typography 
                          component="span"
                          sx={{ 
                            color: "#0D8C47", 
                            bgcolor: "#0D8C4710",
                            px: 1,
                            py: 0.25,
                            borderRadius: 1,
                            fontSize: 11,
                            ml: 1
                          }}
                        >
                          Mi sucursal
                        </Typography>
                      )}
                    </Typography>
                  </Box>
                </Box>

                {canCreate && (
                  <Button
                    variant="contained"
                    onClick={handleOpenNew}
                    startIcon={<PencilLine size={18} />}
                    sx={{
                      borderRadius: 2,
                      px: 3,
                      py: 1,
                      fontWeight: 600,
                      textTransform: "none",
                      background:
                        "linear-gradient(135deg, #592B2B 0%, #3A1A1A 100%)",
                      boxShadow: "0 4px 10px rgba(89,43,43,0.25)",
                      "&:hover": {
                        background:
                          "linear-gradient(135deg, #3A1A1A 0%, #592B2B 100%)",
                        boxShadow: "0 6px 16px rgba(89,43,43,0.35)",
                      },
                    }}
                  >
                    Nueva Venta
                  </Button>
                )}
              </Box>
            </Card>

            {/* TABLA */}
            <Box sx={{ width: "100%", overflowX: "auto" }}>
              <Box sx={{ minWidth: 600 }}>
                <GridGenerico
                  ref={gridRef}
                  service={serviceVentasFiltrado}
                  columns={columns}
                  defaultSortField="fechaRegistro"
                  defaultSortAsc={false}
                  pageSize={10}
                  renderActions={(row) => (
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1,
                        justifyContent: "flex-end",
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() => setSelectedId(row.id)}
                        sx={{ color: "#3A1A1A" }}
                        title="Ver detalles"
                      >
                        <Eye size={16} />
                      </IconButton>

                      {canCancel && (
                        <IconButton
                          size="small"
                          onClick={() => setIdToCancel(row.id)}
                          sx={{ color: "#d32f2f" }}
                          title="Cancelar venta"
                        >
                          <Trash size={16} />
                        </IconButton>
                      )}
                    </Box>
                  )}
                />
              </Box>
            </Box>
          </Box>
        );
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      {/* HEADER */}
      <Box
        sx={{
          mb: 4,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "flex-start", md: "center" },
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, color: "#3A1A1A", mb: 0.5 }}
          >
            Gestión de Ventas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isVentas
              ? `Mis ventas ${
                  selectedSucursal?.nombre
                    ? `en ${selectedSucursal.nombre}`
                    : ""
                }`
              : step === 0
              ? "Selecciona una ciudad para comenzar"
              : step === 1
              ? `Sucursales de ${selectedCiudad?.nombre}`
              : `Ventas de ${selectedSucursal?.nombre}`}
          </Typography>
        </Box>

        {/* Botón Volver (solo admin y solo si no es paso 0) */}
        {!isVentas && step > 0 && (
          <Button
            variant="outlined"
            onClick={handleGoBack}
            startIcon={<ArrowLeft size={18} />}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              fontWeight: 500,
              textTransform: "none",
              borderColor: "#592B2B",
              color: "#592B2B",
              "&:hover": {
                borderColor: "#3A1A1A",
                backgroundColor: "rgba(89,43,43,0.04)",
              },
            }}
          >
            Volver
          </Button>
        )}
      </Box>

      {/* WIZARD PARA ADMIN (vendedores no ven wizard) */}
      {!isVentas && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 4,
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          {STEP_TITLES.map((title, idx) => {
            const active = step === idx;
            const done = step > idx;
            const canNavigate = done;

            return (
              <Box key={title} sx={{ display: "flex", alignItems: "center" }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: canNavigate ? "pointer" : "default",
                    transition: "all 0.2s ease",
                    ...(active
                      ? {
                          bgcolor: "#592B2B",
                          color: "white",
                          boxShadow: "0 0 0 4px #592B2B20",
                        }
                      : done
                      ? {
                          bgcolor: "#0D8C47",
                          color: "white",
                        }
                      : {
                          bgcolor: "#f0f0f0",
                          color: "#999",
                        }),
                  }}
                  onClick={() => canNavigate && setStep(idx)}
                >
                  {done ? <Check size={16} /> : idx + 1}
                </Box>

                <Typography
                  sx={{
                    ml: 1,
                    mr: idx < STEP_TITLES.length - 1 ? 1 : 0,
                    fontSize: 14,
                    fontWeight: active ? 600 : 400,
                    color: active ? "#3A1A1A" : done ? "#0D8C47" : "#999",
                    whiteSpace: "nowrap",
                  }}
                >
                  {title}
                </Typography>

                {idx < STEP_TITLES.length - 1 && (
                  <ChevronRight
                    size={20}
                    color={done || active ? "#592B2B" : "#ccc"}
                    style={{ margin: "0 8px", opacity: 0.7 }}
                  />
                )}
              </Box>
            );
          })}
        </Box>
      )}

      {/* CONTENIDO PRINCIPAL */}
      {renderStep()}

      {/* MODALES */}
      <DetailsDialog
        open={!!selectedId}
        id={selectedId}
        fetchData={ServiceVentas.getById}
        fields={fields}
        onClose={() => setSelectedId(null)}
      />

      {showForm && (
        <VentasForm
          onClose={() => setShowForm(false)}
          onSuccess={handleSuccess}
          sucursalPreseleccionada={selectedSucursal}   // 👈 importante
        />

      )}

      {idToCancel && canCancel && (
        <DeleteConfirm
          title="¿Cancelar venta?"
          message="Se marcará como cancelada y los productos volverán al stock."
          confirmText="Sí, cancelar"
          loadingText="Cancelando..."
          onConfirm={handleCancelVenta}
          onCancel={() => setIdToCancel(null)}
        />
      )}
    </Box>
  );
};

export default VentasList;