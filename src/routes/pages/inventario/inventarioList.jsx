// src/pages/movimientos/MovimientoList.jsx
import { useEffect, useRef, useState, useMemo } from "react";
import {
  Eye,
  Trash,
  ArrowLeft,
  Building,
  Store,
  MapPin,
  Check,
  Boxes,
  ChevronRight,
  Plus,
} from "lucide-react";

import {
  Box,
  Card,
  Typography,
  Button,
  IconButton,
  CircularProgress,
} from "@mui/material";

import GridGenerico from "@/components/Grid";
import Details from "@/components/details";
import DeleteConfirm from "@/components/deleteConfirm";

import ServiceMovimiento from "@/services/ServiceMovimiento";
import ServiceProducto from "@/services/ServiceProducto";
import ServiceCiudad from "@/services/ServiceCiudad";
import ServiceSucursal from "@/services/ServiceSucursal";
import ServiceAlmacen from "@/services/ServiceAlmacen";

import InventarioFlow from "./InventarioFlow";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";

const STEP_TITLES = [
  "Seleccionar Ciudad",
  "Seleccionar Sucursal",
  "Seleccionar Almacén",
  "Lista de Movimientos",
];

const MovimientoList = () => {
  const [selectedId, setSelectedId] = useState(null);
  const [idToDelete, setIdToDelete] = useState(null);
  const [showInventarioFlow, setShowInventarioFlow] = useState(false);
  const gridRef = useRef(null);

  // Wizard
  const [step, setStep] = useState(0);
  const [ciudades, setCiudades] = useState([]);
  const [selectedCiudad, setSelectedCiudad] = useState(null);

  const [sucursales, setSucursales] = useState([]);
  const [selectedSucursal, setSelectedSucursal] = useState(null);

  const [almacenes, setAlmacenes] = useState([]);
  const [selectedAlmacen, setSelectedAlmacen] = useState(null);

  const [loadingSucursales, setLoadingSucursales] = useState(false);
  const [loadingAlmacenes, setLoadingAlmacenes] = useState(false);

  // Cache productos para mostrar serie en la tabla/detalle
  const [productos, setProductos] = useState([]);

  // Auth y roles
  const { user } = useAuth();
  const rawRoleKey =
    user?.rol ||
    user?.role ||
    user?.perfil?.rol ||
    user?.perfil?.nombre ||
    "";
  const roleKey = rawRoleKey.toString().trim().toLowerCase();

  const isAdmin = roleKey === "administrador";
  const isAlmacen = roleKey === "almacen";

  const empleadoSucursalId =
    user?.idSucursal ?? user?.sucursalId ?? user?.empleado?.sucursalId ?? null;
  const usuarioIdLogueado =
    user?.empleadoId ?? user?.idEmpleado ?? user?.id ?? null;

  const canCreate = isAdmin || isAlmacen;
  const canDelete = isAdmin;

  /* ========= CARGA INICIAL: productos + ciudades ========= */

  useEffect(() => {
    (async () => {
      try {
        const [prodRes, ciudadRes] = await Promise.all([
          ServiceProducto.getAll?.(),
          ServiceCiudad.getAll?.(),
        ]);

        const prodList = Array.isArray(prodRes)
          ? prodRes
          : prodRes?.items ?? [];
        const ciudadList = Array.isArray(ciudadRes)
          ? ciudadRes
          : ciudadRes?.items ?? [];

        setProductos(prodList);
        setCiudades(ciudadList);
      } catch (err) {
        console.error(err);
        toast.error("Error al cargar datos base (productos, ciudades)");
      }
    })();
  }, []);

  /* ========= CONFIGURACIÓN POR ROL ========= */

  useEffect(() => {
    // ADMIN: arranca en paso 0 (ciudad)
    if (isAdmin) {
      setStep(0);
      return;
    }

    // ALMACEN: cargar su sucursal y luego almacenes de esa sucursal
    if (isAlmacen && empleadoSucursalId) {
      (async () => {
        try {
          // 1) cargar sucursal del empleado
          const suc = await ServiceSucursal.getById(empleadoSucursalId);
          setSelectedSucursal(suc);

          // 2) cargar almacenes de esa sucursal
          setLoadingAlmacenes(true);
          const resAlm = await ServiceAlmacen.getAll({
            sucursalId: suc.id,
          });
          const almList = Array.isArray(resAlm)
            ? resAlm
            : resAlm.items ?? [];
          setAlmacenes(almList);

          // 3) ir al paso 2 (selección de almacén)
          setStep(2);
        } catch (err) {
          console.error(err);
          toast.error(
            "No se pudo cargar la sucursal o almacenes asignados al usuario de almacén"
          );
        } finally {
          setLoadingAlmacenes(false);
        }
      })();
    }
  }, [isAdmin, isAlmacen, empleadoSucursalId]);

  /* ========= CARGAR SUCURSALES AL SELECCIONAR CIUDAD (ADMIN) ========= */

  const handleSelectCiudad = async (ciudad) => {
    setSelectedCiudad(ciudad);
    setSelectedSucursal(null);
    setSelectedAlmacen(null);
    setSucursales([]);
    setAlmacenes([]);
    setLoadingSucursales(true);

    try {
      const res = await ServiceSucursal.getAll({
        ciudadId: ciudad.id,
      });
      const data = Array.isArray(res) ? res : res.items ?? [];
      setSucursales(data);
      setStep(1);
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar sucursales para la ciudad seleccionada");
    } finally {
      setLoadingSucursales(false);
    }
  };

  /* ========= CARGAR ALMACENES AL SELECCIONAR SUCURSAL ========= */

  const handleSelectSucursal = async (sucursal) => {
    setSelectedSucursal(sucursal);
    setSelectedAlmacen(null);
    setAlmacenes([]);
    setLoadingAlmacenes(true);

    try {
      const res = await ServiceAlmacen.getAll({
        sucursalId: sucursal.id,
      });
      const data = Array.isArray(res) ? res : res.items ?? [];
      setAlmacenes(data);
      setStep(2);
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar almacenes para la sucursal seleccionada");
    } finally {
      setLoadingAlmacenes(false);
    }
  };

  const handleSelectAlmacen = (almacen) => {
    setSelectedAlmacen(almacen);
    setStep(3);
  };

  /* ========= MAPA PRODUCTOS (por si lo quieres usar luego) ========= */

  const getProductoIdFromRow = (rowOrId) => {
    if (!rowOrId) return null;
    if (typeof rowOrId === "number") return rowOrId;
    return (
      rowOrId.productoId ||
      rowOrId.producto_id ||
      rowOrId.producto?.id ||
      null
    );
  };

  const getProductoFromCache = (id) => {
    if (!id) return null;
    return productos.find((x) => x.id === id) || null;
  };

  const getTextoProducto = (row) => {
    if (row.productoSerie) return row.productoSerie;
    if (row.producto?.numeroSerie) return row.producto.numeroSerie;

    const prodId = getProductoIdFromRow(row);
    if (!prodId) return "—";
    const p = getProductoFromCache(prodId);
    if (!p) return `Producto #${prodId}`;
    return (
      p.numeroSerie || p.descripcion || p.serie || p.codigo || `Producto #${prodId}`
    );
  };

  /* ========= COLUMNAS Y DETALLES ========= */

  const columns = [
    {
      name: "Producto (serie)",
      selector: (r) => getTextoProducto(r),
      sortable: true,
      minWidth: "170px",
    },
    {
      name: "Almacén",
      selector: (r) =>
        r.almacen?.nombre || r.almacenNombre || r.almacenId || "—",
      sortable: true,
      minWidth: "140px",
    },
    {
      name: "Tipo",
      selector: (r) => r.tipoMovimiento ?? "—",
      sortable: true,
      minWidth: "110px",
    },
    {
      name: "Fecha",
      selector: (r) =>
        r.fecha
          ? new Date(r.fecha).toLocaleString()
          : r.fechaRegistro
          ? new Date(r.fechaRegistro).toLocaleString()
          : "—",
      sortable: true,
      minWidth: "160px",
    },
  ];

  const detailsFields = [
    {
      label: "Producto (serie)",
      key: "productoSerie",
      format: (v, row) => v ?? row?.producto?.numeroSerie ?? "—",
    },
    {
      label: "Producto (descripción)",
      key: "productoDescripcion",
      format: (v, row) =>
        v ?? row?.productoDescripcion ?? row?.producto?.descripcion ?? "—",
    },
    {
      label: "Observado",
      key: "productoObservado",
      format: (v) =>
        v === 1 ? "No" : v === 2 ? "Sí" : v == null ? "—" : String(v),
    },
    {
      label: "Detalle observación",
      key: "productoObsDescripcion",
    },
    { label: "Tipo de movimiento", key: "tipoMovimiento" },
    {
      label: "Almacén",
      key: "almacen",
      format: (a, row) => a?.nombre ?? row?.almacenNombre ?? "—",
    },
    {
      label: "Fecha",
      key: "fecha",
      format: (v) => (v ? new Date(v).toLocaleString() : "—"),
    },
    {
      label: "Precio",
      key: "producto",
      format: (p) => (p?.precio != null ? `${p.precio} Bs` : "—"),
    },
    {
      label: "Categoría",
      key: "categoria",
      format: (c) => c?.nombre ?? "—",
    },
    {
      label: "Modelo",
      key: "modeloProducto",
      format: (m) => m?.nombreModelo ?? m?.nombre ?? "—",
    },
    {
      label: "Importación",
      key: "importacion",
      format: (i) => i?.codigo ?? "—",
    },
  ];


  const baseMovimientoService = useMemo(() => {
    if (isAdmin) return ServiceMovimiento;

    if (isAlmacen && usuarioIdLogueado) {
      return {
        ...ServiceMovimiento,
        getAll: (params = {}) =>
          ServiceMovimiento.getAll({
            ...params,
            usuarioId: usuarioIdLogueado,
          }),
      };
    }

    return ServiceMovimiento;
  }, [isAdmin, isAlmacen, usuarioIdLogueado]);

  const serviceMovimientoFiltrado = useMemo(() => {
    return {
      ...baseMovimientoService,
      getAll: async (params = {}) => {
        if (!selectedAlmacen?.id) {
          return { items: [], total: 0 };
        }
        return baseMovimientoService.getAll({
          ...params,
          almacenId: selectedAlmacen.id,
        });
      },
    };
  }, [baseMovimientoService, selectedAlmacen]);

  useEffect(() => {
    if (step === 3 && gridRef.current?.refetch) {
      gridRef.current.refetch();
    }
  }, [selectedAlmacen, step]);

  /* ========= HANDLERS ========= */

  const handleOpenDetails = (id) => {
    setSelectedId(id);
  };

  const handleDelete = async () => {
    if (!idToDelete) return;
    try {
      await ServiceMovimiento.remove(idToDelete);
      toast.success("Movimiento eliminado");
      setIdToDelete(null);
      gridRef.current?.refetch();
    } catch (e) {
      console.error(e);
      toast.error(e.message || "No se pudo eliminar el movimiento");
    }
  };

  const handleOpenNewMovimiento = () => {
    if (!selectedAlmacen) {
      toast.warning("Debes seleccionar un almacén primero");
      return;
    }
    setShowInventarioFlow(true);
  };

  const handleGoBack = () => {
    // ADMIN navega por el wizard completo
    if (isAdmin) {
      if (step === 1) {
        setStep(0);
        setSelectedCiudad(null);
        setSelectedSucursal(null);
        setSelectedAlmacen(null);
        setSucursales([]);
        setAlmacenes([]);
      } else if (step === 2) {
        setStep(1);
        setSelectedSucursal(null);
        setSelectedAlmacen(null);
        setAlmacenes([]);
      } else if (step === 3) {
        setStep(2);
        setSelectedAlmacen(null);
      }
      return;
    }

    // ALMACEN: solo puede volver de lista a selección de almacén
    if (isAlmacen && step === 3) {
      setStep(2);
      setSelectedAlmacen(null);
    }
  };

  /* ========= RENDER DE CADA PASO ========= */

  const renderStep = () => {
    // Si es rol almacén y aún no se cargó sucursal/almacenes
    if (isAlmacen && !selectedSucursal) {
      return (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <CircularProgress sx={{ color: "#592B2B", mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Cargando datos de tu sucursal y almacenes...
          </Typography>
        </Box>
      );
    }

    switch (step) {
      case 0: // Seleccionar Ciudad (solo admin)
        return (
          <Box>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Selecciona la ciudad donde deseas ver los almacenes y movimientos.
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
                      "&:hover": {
                        borderColor: "#592B2B",
                        backgroundColor: "#592B2B08",
                        transform: "translateY(-2px)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      },
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
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                          }}
                        >
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: "50%",
                              bgcolor: seleccionada ? "#592B2B" : "#592B2B20",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Building
                              size={20}
                              color={seleccionada ? "white" : "#592B2B"}
                            />
                          </Box>
                          <Box sx={{ textAlign: "left" }}>
                            <Typography
                              fontSize={16}
                              fontWeight={600}
                              color="#3A1A1A"
                            >
                              {c.nombre || `Ciudad #${c.id}`}
                            </Typography>
                            {c.departamento && (
                              <Typography
                                fontSize={12}
                                color="text.secondary"
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.5,
                                }}
                              >
                                <MapPin size={12} />
                                {c.departamento}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        {seleccionada && (
                          <Box
                            sx={{
                              width: 24,
                              height: 24,
                              borderRadius: "50%",
                              bgcolor: "#592B2B",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Check size={14} color="white" />
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Card>
                );
              })}

              {ciudades.length === 0 && (
                <Box
                  sx={{
                    textAlign: "center",
                    py: 4,
                    border: "1px dashed #ccc",
                    borderRadius: 2,
                    bgcolor: "#fafafa",
                  }}
                >
                  <Building size={32} color="#ccc" />
                  <Typography variant="body2" color="text.disabled" mt={1}>
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
              Selecciona la sucursal de{" "}
              <strong>{selectedCiudad?.nombre}</strong> para ver sus almacenes.
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
                        "&:hover": {
                          borderColor: "#3A1A1A",
                          backgroundColor: "#3A1A1A08",
                          transform: "translateY(-2px)",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        },
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
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: "50%",
                                bgcolor: seleccionada
                                  ? "#3A1A1A"
                                  : "#3A1A1A20",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Store
                                size={20}
                                color={seleccionada ? "white" : "#3A1A1A"}
                              />
                            </Box>
                            <Box sx={{ textAlign: "left" }}>
                              <Typography
                                fontSize={16}
                                fontWeight={600}
                                color="#3A1A1A"
                              >
                                {s.nombre}
                              </Typography>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                  flexWrap: "wrap",
                                }}
                              >
                                <Typography
                                  fontSize={12}
                                  color="text.secondary"
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                  }}
                                >
                                  <MapPin size={12} />
                                  {s.direccion || "Sin dirección"}
                                </Typography>
                                {s.telefono && (
                                  <Typography
                                    fontSize={12}
                                    color="text.secondary"
                                  >
                                    • 📞 {s.telefono}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </Box>
                          {seleccionada && (
                            <Box
                              sx={{
                                width: 24,
                                height: 24,
                                borderRadius: "50%",
                                bgcolor: "#3A1A1A",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Check size={14} color="white" />
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </Card>
                  );
                })}

                {sucursales.length === 0 && (
                  <Box
                    sx={{
                      textAlign: "center",
                      py: 4,
                      border: "1px dashed #ccc",
                      borderRadius: 2,
                      bgcolor: "#fafafa",
                    }}
                  >
                    <Store size={32} color="#ccc" />
                    <Typography variant="body2" color="text.disabled" mt={1}>
                      No hay sucursales disponibles en {selectedCiudad?.nombre}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        );

      case 2: // Seleccionar Almacén (admin y almacén)
        return (
          <Box>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Sucursal:{" "}
              <strong>{selectedSucursal?.nombre || "Sin sucursal"}</strong>.
              Selecciona un almacén para ver sus movimientos.
            </Typography>

            {loadingAlmacenes ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <CircularProgress sx={{ color: "#592B2B", mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Cargando almacenes...
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {almacenes.map((a) => {
                  const seleccionada = selectedAlmacen?.id === a.id;
                  return (
                    <Card
                      key={a.id}
                      variant="outlined"
                      onClick={() => handleSelectAlmacen(a)}
                      sx={{
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          borderColor: "#592B2B",
                          backgroundColor: "#592B2B08",
                          transform: "translateY(-2px)",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        },
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
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: "50%",
                                bgcolor: seleccionada
                                  ? "#592B2B"
                                  : "#592B2B20",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Boxes
                                size={20}
                                color={seleccionada ? "white" : "#592B2B"}
                              />
                            </Box>
                            <Box sx={{ textAlign: "left" }}>
                              <Typography
                                fontSize={16}
                                fontWeight={600}
                                color="#3A1A1A"
                              >
                                {a.nombre}
                              </Typography>
                              <Typography
                                fontSize={12}
                                color="text.secondary"
                              >
                                dirección: {a.direccion ?? "—"}
                              </Typography>
                            </Box>
                          </Box>
                          {seleccionada && (
                            <Box
                              sx={{
                                width: 24,
                                height: 24,
                                borderRadius: "50%",
                                bgcolor: "#592B2B",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Check size={14} color="white" />
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </Card>
                  );
                })}

                {almacenes.length === 0 && (
                  <Box
                    sx={{
                      textAlign: "center",
                      py: 4,
                      border: "1px dashed #ccc",
                      borderRadius: 2,
                      bgcolor: "#fafafa",
                    }}
                  >
                    <Boxes size={32} color="#ccc" />
                    <Typography variant="body2" color="text.disabled" mt={1}>
                      No hay almacenes disponibles en esta sucursal
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        );

      case 3: // Lista de movimientos (admin y almacén)
      default:
        return (
          <Box>
            {/* Card de Almacén */}
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
                    <Boxes size={24} color="#592B2B" />
                  </Box>
                  <Box>
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      color="#3A1A1A"
                    >
                      {selectedAlmacen?.nombre || "Almacén"}
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
                      {selectedSucursal?.nombre && (
                        <>
                          <Store size={14} />
                          <span>{selectedSucursal.nombre}</span>
                        </>
                      )}
                      {selectedAlmacen?.direccion && (
                        <>
                          <span>•</span>
                          <span>Dirección: {selectedAlmacen.direccion}</span>
                        </>
                      )}
                      {isAlmacen && (
                        <Typography
                          component="span"
                          sx={{
                            color: "#0D8C47",
                            bgcolor: "#0D8C4710",
                            px: 1,
                            py: 0.25,
                            borderRadius: 1,
                            fontSize: 11,
                            ml: 1,
                          }}
                        >
                          Mi almacén
                        </Typography>
                      )}
                    </Typography>
                  </Box>
                </Box>

                {canCreate && (
                  <Button
                    variant="contained"
                    onClick={handleOpenNewMovimiento}
                    startIcon={<Plus size={18} />}
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
                    Nuevo movimiento
                  </Button>
                )}
              </Box>
            </Card>

            {/* Tabla de movimientos */}
            <Box sx={{ width: "100%", overflowX: "auto" }}>
              <Box sx={{ minWidth: 600 }}>
                <GridGenerico
                  ref={gridRef}
                  service={serviceMovimientoFiltrado}
                  columns={columns}
                  defaultSortField="fecha"
                  defaultSortAsc={false}
                  pageSize={10}
                  title="Movimientos"
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
                        onClick={() => handleOpenDetails(row.id)}
                        sx={{ color: "#592B2B" }}
                        title="Ver detalles"
                      >
                        <Eye size={16} />
                      </IconButton>

                      {canDelete && (
                        <IconButton
                          size="small"
                          onClick={() => setIdToDelete(row.id)}
                          sx={{ color: "#d32f2f" }}
                          title="Eliminar movimiento"
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

  /* ========= HEADER Y WIZARD SUPERIOR ========= */
  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      {/* Header */}
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
            Movimientos de Inventario
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isAlmacen
              ? selectedSucursal && selectedAlmacen
                ? `Movimientos en ${selectedAlmacen.nombre}`
                : `Selecciona tu almacén para ver los movimientos`
              : step === 0
              ? "Selecciona una ciudad para comenzar"
              : step === 1
              ? `Sucursales de ${selectedCiudad?.nombre}`
              : step === 2
              ? `Almacenes de ${selectedSucursal?.nombre}`
              : `Movimientos del almacén ${selectedAlmacen?.nombre}`}
          </Typography>
        </Box>

        {/* Botón Volver */}
        {(isAdmin && step > 0) || (isAlmacen && step === 3) ? (
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
        ) : null}
      </Box>

      {/* Wizard (solo admin) */}
      {!isAlmacen && (
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

      {/* ============ CONTENIDO PRINCIPAL ============ */}

      {/* Loader solo para rol almacén mientras no tiene sucursal cargada */}
      {isAlmacen && !selectedSucursal ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <CircularProgress sx={{ color: "#592B2B", mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Cargando datos de tu sucursal y almacenes...
          </Typography>
        </Box>
      ) : (
        <>
          {/* Paso 0: Seleccionar Ciudad (solo admin) */}
          <Box
            sx={{
              display: !isAlmacen && step === 0 ? "block" : "none",
            }}
          >
            <Typography variant="body2" color="text.secondary" mb={2}>
              Selecciona la ciudad donde deseas ver los almacenes y movimientos.
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
                      "&:hover": {
                        borderColor: "#592B2B",
                        backgroundColor: "#592B2B08",
                        transform: "translateY(-2px)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      },
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
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                          }}
                        >
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: "50%",
                              bgcolor: seleccionada ? "#592B2B" : "#592B2B20",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Building
                              size={20}
                              color={seleccionada ? "white" : "#592B2B"}
                            />
                          </Box>
                          <Box sx={{ textAlign: "left" }}>
                            <Typography
                              fontSize={16}
                              fontWeight={600}
                              color="#3A1A1A"
                            >
                              {c.nombre || `Ciudad #${c.id}`}
                            </Typography>
                            {c.departamento && (
                              <Typography
                                fontSize={12}
                                color="text.secondary"
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.5,
                                }}
                              >
                                <MapPin size={12} />
                                {c.departamento}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        {seleccionada && (
                          <Box
                            sx={{
                              width: 24,
                              height: 24,
                              borderRadius: "50%",
                              bgcolor: "#592B2B",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Check size={14} color="white" />
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Card>
                );
              })}

              {ciudades.length === 0 && (
                <Box
                  sx={{
                    textAlign: "center",
                    py: 4,
                    border: "1px dashed #ccc",
                    borderRadius: 2,
                    bgcolor: "#fafafa",
                  }}
                >
                  <Building size={32} color="#ccc" />
                  <Typography variant="body2" color="text.disabled" mt={1}>
                    No hay ciudades registradas
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Paso 1: Seleccionar Sucursal (solo admin) */}
          <Box
            sx={{
              display: !isAlmacen && step === 1 ? "block" : "none",
            }}
          >
            <Typography variant="body2" color="text.secondary" mb={2}>
              Selecciona la sucursal de{" "}
              <strong>{selectedCiudad?.nombre}</strong> para ver sus almacenes.
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
                        "&:hover": {
                          borderColor: "#3A1A1A",
                          backgroundColor: "#3A1A1A08",
                          transform: "translateY(-2px)",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        },
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
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: "50%",
                                bgcolor: seleccionada
                                  ? "#3A1A1A"
                                  : "#3A1A1A20",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Store
                                size={20}
                                color={seleccionada ? "white" : "#3A1A1A"}
                              />
                            </Box>
                            <Box sx={{ textAlign: "left" }}>
                              <Typography
                                fontSize={16}
                                fontWeight={600}
                                color="#3A1A1A"
                              >
                                {s.nombre}
                              </Typography>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                  flexWrap: "wrap",
                                }}
                              >
                                <Typography
                                  fontSize={12}
                                  color="text.secondary"
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                  }}
                                >
                                  <MapPin size={12} />
                                  {s.direccion || "Sin dirección"}
                                </Typography>
                                {s.telefono && (
                                  <Typography
                                    fontSize={12}
                                    color="text.secondary"
                                  >
                                    • 📞 {s.telefono}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </Box>
                          {seleccionada && (
                            <Box
                              sx={{
                                width: 24,
                                height: 24,
                                borderRadius: "50%",
                                bgcolor: "#3A1A1A",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Check size={14} color="white" />
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </Card>
                  );
                })}

                {sucursales.length === 0 && (
                  <Box
                    sx={{
                      textAlign: "center",
                      py: 4,
                      border: "1px dashed #ccc",
                      borderRadius: 2,
                      bgcolor: "#fafafa",
                    }}
                  >
                    <Store size={32} color="#ccc" />
                    <Typography variant="body2" color="text.disabled" mt={1}>
                      No hay sucursales disponibles en {selectedCiudad?.nombre}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>

          {/* Paso 2: Seleccionar Almacén (admin y almacén) */}
          <Box
            sx={{
              display: step === 2 ? "block" : "none",
            }}
          >
            <Typography variant="body2" color="text.secondary" mb={2}>
              Sucursal:{" "}
              <strong>{selectedSucursal?.nombre || "Sin sucursal"}</strong>.
              Selecciona un almacén para ver sus movimientos.
            </Typography>

            {loadingAlmacenes ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <CircularProgress sx={{ color: "#592B2B", mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Cargando almacenes...
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {almacenes.map((a) => {
                  const seleccionada = selectedAlmacen?.id === a.id;
                  return (
                    <Card
                      key={a.id}
                      variant="outlined"
                      onClick={() => handleSelectAlmacen(a)}
                      sx={{
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          borderColor: "#592B2B",
                          backgroundColor: "#592B2B08",
                          transform: "translateY(-2px)",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        },
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
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: "50%",
                                bgcolor: seleccionada
                                  ? "#592B2B"
                                  : "#592B2B20",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Boxes
                                size={20}
                                color={seleccionada ? "white" : "#592B2B"}
                              />
                            </Box>
                            <Box sx={{ textAlign: "left" }}>
                              <Typography
                                fontSize={16}
                                fontWeight={600}
                                color="#3A1A1A"
                              >
                                {a.nombre}
                              </Typography>
                              <Typography
                                fontSize={12}
                                color="text.secondary"
                              >
                                dirección: {a.direccion ?? "—"}
                              </Typography>
                            </Box>
                          </Box>
                          {seleccionada && (
                            <Box
                              sx={{
                                width: 24,
                                height: 24,
                                borderRadius: "50%",
                                bgcolor: "#592B2B",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Check size={14} color="white" />
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </Card>
                  );
                })}

                {almacenes.length === 0 && (
                  <Box
                    sx={{
                      textAlign: "center",
                      py: 4,
                      border: "1px dashed #ccc",
                      borderRadius: 2,
                      bgcolor: "#fafafa",
                    }}
                  >
                    <Boxes size={32} color="#ccc" />
                    <Typography variant="body2" color="text.disabled" mt={1}>
                      No hay almacenes disponibles en esta sucursal
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>

          {/* Paso 3: Lista de movimientos */}
          <Box
            sx={{
              display: step === 3 ? "block" : "none",
            }}
          >
            {/* Card de Almacén */}
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
                    <Boxes size={24} color="#592B2B" />
                  </Box>
                  <Box>
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      color="#3A1A1A"
                    >
                      {selectedAlmacen?.nombre || "Almacén"}
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
                      {selectedSucursal?.nombre && (
                        <>
                          <Store size={14} />
                          <span>{selectedSucursal.nombre}</span>
                        </>
                      )}
                      {selectedAlmacen?.direccion && (
                        <>
                          <span>•</span>
                          <span>Dirección: {selectedAlmacen.direccion}</span>
                        </>
                      )}
                      {isAlmacen && (
                        <Typography
                          component="span"
                          sx={{
                            color: "#0D8C47",
                            bgcolor: "#0D8C4710",
                            px: 1,
                            py: 0.25,
                            borderRadius: 1,
                            fontSize: 11,
                            ml: 1,
                          }}
                        >
                          Mi almacén
                        </Typography>
                      )}
                    </Typography>
                  </Box>
                </Box>

                {canCreate && (
                  <Button
                    variant="contained"
                    onClick={handleOpenNewMovimiento}
                    startIcon={<Plus size={18} />}
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
                    Nuevo movimiento
                  </Button>
                )}
              </Box>
            </Card>

            {/* Tabla de movimientos */}
            <Box sx={{ width: "100%", overflowX: "auto" }}>
              <Box sx={{ minWidth: 600 }}>
                <GridGenerico
                  ref={gridRef}
                  service={serviceMovimientoFiltrado}
                  columns={columns}
                  defaultSortField="fecha"
                  defaultSortAsc={false}
                  pageSize={10}
                  title="Movimientos"
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
                        onClick={() => handleOpenDetails(row.id)}
                        sx={{ color: "#592B2B" }}
                        title="Ver detalles"
                      >
                        <Eye size={16} />
                      </IconButton>

                      {canDelete && (
                        <IconButton
                          size="small"
                          onClick={() => setIdToDelete(row.id)}
                          sx={{ color: "#d32f2f" }}
                          title="Eliminar movimiento"
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
        </>
      )}

      {/* Modales */}
      <Details
        open={!!selectedId}
        id={selectedId}
        fetchData={ServiceMovimiento.getById}
        fields={detailsFields}
        onClose={() => setSelectedId(null)}
      />

      {idToDelete && (
        <DeleteConfirm
          title="¿Eliminar movimiento?"
          message="Esta acción marcará el movimiento como inactivo."
          onConfirm={handleDelete}
          onCancel={() => setIdToDelete(null)}
        />
      )}

      {showInventarioFlow && (
        <InventarioFlow
          isOpen={showInventarioFlow}
          onClose={() => {
            setShowInventarioFlow(false);
            gridRef.current?.refetch();
          }}
          usuarioId={usuarioIdLogueado}
        />
      )}
    </Box>
  );

};

export default MovimientoList;