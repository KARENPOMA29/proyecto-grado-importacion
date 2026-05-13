// src/pages/movimientos/MovimientoList.jsx
import { useEffect, useMemo, useRef, useState } from "react";
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
  Pencil,
} from "lucide-react";

import {
  Box,
  Card,
  Typography,
  Button,
  IconButton,
  CircularProgress,
  Chip,
} from "@mui/material";

import GridGenerico from "@/components/Grid";
import DeleteConfirm from "@/components/deleteConfirm";
import ErrorDialog from "@/components/ErrorDialog";

import MovimientoDetalleDialog from "./MovimientoDetalleDialog";
import MovimientoEditDialog from "./MovimientoEditDialog";
import InventarioFlow from "./InventarioFlow";

import ServiceMovimiento from "@/services/ServiceMovimiento";
import ServiceCiudad from "@/services/ServiceCiudad";
import ServiceSucursal from "@/services/ServiceSucursal";
import ServiceAlmacen from "@/services/ServiceAlmacen";

import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";

const STEP_TITLES = [
  "Seleccionar Ciudad",
  "Seleccionar Sucursal",
  "Seleccionar Almacén",
  "Lista de Movimientos",
];

const MovimientoList = () => {
  const gridRef = useRef(null);

  const [step, setStep] = useState(0);

  const [ciudades, setCiudades] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);

  const [selectedCiudad, setSelectedCiudad] = useState(null);
  const [selectedSucursal, setSelectedSucursal] = useState(null);
  const [selectedAlmacen, setSelectedAlmacen] = useState(null);

  const [loadingSucursales, setLoadingSucursales] = useState(false);
  const [loadingAlmacenes, setLoadingAlmacenes] = useState(false);

  const [selectedId, setSelectedId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [idToDelete, setIdToDelete] = useState(null);
  const [showInventarioFlow, setShowInventarioFlow] = useState(false);

  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { user } = useAuth();

  const roleKey = (
    user?.rol ||
    user?.role ||
    user?.perfil?.rol ||
    user?.perfil?.nombre ||
    ""
  )
    .toString()
    .trim()
    .toLowerCase();

  const isAdmin = roleKey === "administrador";
  const isAlmacen = roleKey === "almacen";

  const empleadoSucursalId =
    user?.idSucursal ?? user?.sucursalId ?? user?.empleado?.sucursalId ?? null;

  const usuarioIdLogueado =
    user?.empleadoId ?? user?.idEmpleado ?? user?.id ?? null;

  const canCreate = isAdmin || isAlmacen;
  const canDelete = isAdmin;

  useEffect(() => {
    const cargarCiudades = async () => {
      try {
        const res = await ServiceCiudad.getAll?.();
        setCiudades(Array.isArray(res) ? res : res?.items ?? []);
      } catch (error) {
        console.error(error);
        toast.error("Error al cargar ciudades");
      }
    };

    cargarCiudades();
  }, []);

  useEffect(() => {
    if (!isAlmacen || !empleadoSucursalId) return;

    const cargarDatosAlmacen = async () => {
      try {
        const sucursal = await ServiceSucursal.getById(empleadoSucursalId);
        setSelectedSucursal(sucursal);

        setLoadingAlmacenes(true);

        const res = await ServiceAlmacen.getAll({
          sucursalId: sucursal.id,
        });

        setAlmacenes(Array.isArray(res) ? res : res.items ?? []);
        setStep(2);
      } catch (error) {
        console.error(error);
        toast.error("No se pudo cargar la sucursal o almacenes asignados");
      } finally {
        setLoadingAlmacenes(false);
      }
    };

    cargarDatosAlmacen();
  }, [isAlmacen, empleadoSucursalId]);

  const handleSelectCiudad = async (ciudad) => {
    // Limpiar estados anteriores de forma segura
    setSelectedCiudad(ciudad);
    setSelectedSucursal(null);
    setSelectedAlmacen(null);
    setSucursales([]);
    setAlmacenes([]);

    try {
      setLoadingSucursales(true);

      const res = await ServiceSucursal.getAll({
        ciudadId: ciudad.id,
      });

      setSucursales(Array.isArray(res) ? res : res.items ?? []);
      setStep(1);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar sucursales");
      setSucursales([]); // Asegurar que quede un array vacío en caso de error
    } finally {
      setLoadingSucursales(false);
    }
  };

  const handleSelectSucursal = async (sucursal) => {
    // Limpiar estados anteriores de forma segura
    setSelectedSucursal(sucursal);
    setSelectedAlmacen(null);
    setAlmacenes([]);

    try {
      setLoadingAlmacenes(true);

      const res = await ServiceAlmacen.getAll({
        sucursalId: sucursal.id,
      });

      setAlmacenes(Array.isArray(res) ? res : res.items ?? []);
      setStep(2);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar almacenes");
      setAlmacenes([]); // Asegurar que quede un array vacío en caso de error
    } finally {
      setLoadingAlmacenes(false);
    }
  };

  const handleSelectAlmacen = (almacen) => {
    setSelectedAlmacen(almacen);
    setStep(3);
  };

  const handleGoBack = () => {
    if (isAdmin) {
      if (step === 1) {
        // Regresar de sucursales a ciudades
        setStep(0);
        setSelectedCiudad(null);
        setSelectedSucursal(null);
        setSelectedAlmacen(null);
        setSucursales([]);
        setAlmacenes([]);
        return;
      }

      if (step === 2) {
        // Regresar de almacenes a sucursales
        setStep(1);
        setSelectedSucursal(null);
        setSelectedAlmacen(null);
        setAlmacenes([]);
        return;
      }

      if (step === 3) {
        // Regresar de movimientos a almacenes
        setStep(2);
        setSelectedAlmacen(null);
        return;
      }
    }

    if (isAlmacen && step === 3) {
      setStep(2);
      setSelectedAlmacen(null);
    }
  };

  const getTotalSecciones = (almacen) => {
    if (!almacen) return 0;
    
    if (almacen?.totalSecciones !== undefined) return almacen.totalSecciones;

    if (Array.isArray(almacen?.secciones)) {
      return almacen.secciones.filter((s) => Number(s.estado) === 1).length;
    }

    return 0;
  };

  const formatFecha = (value) => {
    if (!value) return "—";

    const fecha = String(value).split("T")[0];
    const [yyyy, mm, dd] = fecha.split("-");

    if (!yyyy || !mm || !dd) return "—";

    return `${dd}/${mm}/${yyyy}`;
  };

  const getTextoProducto = (row) => {
    if (!row) return "—";
    
    return (
      row.productoSerie ||
      row.producto?.numeroSerie ||
      row.producto?.descripcion ||
      `Producto #${row.productoId || row.producto?.id || "—"}`
    );
  };

  const columns = [
    {
      name: "Producto (serie)",
      selector: (row) => getTextoProducto(row),
      sortable: true,
      minWidth: "170px",
    },
    {
      name: "Categoría",
      selector: (row) => row?.categoria?.nombre || "—",
      sortable: true,
      minWidth: "150px",
    },
    {
      name: "Modelo",
      selector: (row) =>
        row?.modeloProducto?.nombreModelo || row?.modeloProducto?.nombre || "—",
      sortable: true,
      minWidth: "170px",
    },
    {
      name: "Importación",
      selector: (row) => row?.importacion?.codigo || "—",
      sortable: true,
      minWidth: "150px",
    },
    {
      name: "Observado",
      selector: (row) => row?.productoObservado ?? "",
      sortable: true,
      minWidth: "130px",
      cell: (row) => {
        const observado = Number(row?.productoObservado);

        const label =
          observado === 2 ? "Sí" : observado === 1 ? "No" : "—";

        const sx =
          observado === 2
            ? { bgcolor: "#FEF3C7", color: "#92400E" }
            : observado === 1
            ? { bgcolor: "#E8F5E9", color: "#1B5E20" }
            : { bgcolor: "#F3F4F6", color: "#374151" };

        return (
          <Chip
            size="small"
            label={label}
            sx={{
              fontWeight: 800,
              borderRadius: "10px",
              ...sx,
            }}
          />
        );
      },
    },
    {
      name: "Estado producto",
      selector: (row) => row?.productoEstado ?? "",
      sortable: true,
      minWidth: "150px",
      cell: (row) => {
        const estado = Number(row?.productoEstado);

        const label =
          estado === 1
            ? "Disponible"
            : estado === 2
            ? "Vendido"
            : estado === 0
            ? "Inactivo"
            : "—";

        const sx =
          estado === 1
            ? { bgcolor: "#E8F5E9", color: "#1B5E20" }
            : estado === 2
            ? { bgcolor: "#FEE2E2", color: "#991B1B" }
            : { bgcolor: "#F3F4F6", color: "#374151" };

        return (
          <Chip
            size="small"
            label={label}
            sx={{
              fontWeight: 800,
              borderRadius: "10px",
              ...sx,
            }}
          />
        );
      },
    },
    {
      name: "Fecha",
      selector: (row) => row?.fecha || row?.fechaRegistro || "",
      sortable: true,
      minWidth: "120px",
      cell: (row) => formatFecha(row?.fecha || row?.fechaRegistro),
    },
  ];

  const baseMovimientoService = useMemo(() => {
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
  }, [isAlmacen, usuarioIdLogueado]);

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
    if (step === 3 && gridRef.current) {
      gridRef.current.refetch?.();
    }
  }, [selectedAlmacen, step]);

  const handleDelete = async () => {
    if (!idToDelete) return;

    try {
      await ServiceMovimiento.remove(idToDelete);

      toast.success("Movimiento eliminado correctamente");
      setIdToDelete(null);
      if (gridRef.current) {
        gridRef.current.refetch?.();
      }
    } catch (error) {
      const message = error?.message || "No se pudo eliminar el movimiento";

      setErrorMessage(message);
      setShowError(true);
      setIdToDelete(null);

      setTimeout(() => {
        setShowError(false);
      }, 3000);
    }
  };

  const handleOpenNewMovimiento = () => {
    if (!selectedAlmacen) {
      toast.warning("Debes seleccionar un almacén primero");
      return;
    }

    setShowInventarioFlow(true);
  };

  const renderCiudadStep = () => (
    <Box>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Selecciona la ciudad donde deseas ver los almacenes y movimientos.
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {ciudades.map((ciudad) => {
          const seleccionada = selectedCiudad?.id === ciudad.id;

          return (
            <Card
              key={ciudad.id}
              variant="outlined"
              onClick={() => handleSelectCiudad(ciudad)}
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
                    gap: 2,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
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

                    <Box>
                      <Typography fontSize={16} fontWeight={700} color="#3A1A1A">
                        {ciudad.nombre || `Ciudad #${ciudad.id}`}
                      </Typography>

                      {ciudad.departamento && (
                        <Typography
                          fontSize={12}
                          color="text.secondary"
                          sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                        >
                          <MapPin size={12} />
                          {ciudad.departamento}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  <Chip
                    size="small"
                    label={`${ciudad.totalSucursales ?? 0} sucursales`}
                    sx={{
                      bgcolor: "#592B2B10",
                      color: "#592B2B",
                      fontWeight: 700,
                      borderRadius: "10px",
                    }}
                  />
                </Box>
              </Box>
            </Card>
          );
        })}

        {ciudades.length === 0 && (
          <EmptyState icon={<Building size={32} />} text="No hay ciudades registradas" />
        )}
      </Box>
    </Box>
  );

  const renderSucursalStep = () => (
    <Box>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Selecciona la sucursal de <strong>{selectedCiudad?.nombre || "la ciudad seleccionada"}</strong>.
      </Typography>

      {loadingSucursales ? (
        <LoadingState text={`Cargando sucursales de ${selectedCiudad?.nombre || "la ciudad"}...`} />
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {sucursales.map((sucursal) => {
            const seleccionada = selectedSucursal?.id === sucursal.id;

            return (
              <Card
                key={sucursal.id}
                variant="outlined"
                onClick={() => handleSelectSucursal(sucursal)}
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
                      gap: 2,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          bgcolor: seleccionada ? "#3A1A1A" : "#3A1A1A20",
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

                      <Box>
                        <Typography fontSize={16} fontWeight={700} color="#3A1A1A">
                          {sucursal.nombre}
                        </Typography>

                        <Typography
                          fontSize={12}
                          color="text.secondary"
                          sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                        >
                          <MapPin size={12} />
                          {sucursal.direccion || "Sin dirección"}
                        </Typography>
                      </Box>
                    </Box>

                    <Chip
                      size="small"
                      label={`${sucursal.totalAlmacenes ?? 0} almacenes`}
                    />
                  </Box>
                </Box>
              </Card>
            );
          })}

          {sucursales.length === 0 && !loadingSucursales && (
            <EmptyState
              icon={<Store size={32} />}
              text={`No hay sucursales disponibles en ${selectedCiudad?.nombre || "esta ciudad"}`}
            />
          )}
        </Box>
      )}
    </Box>
  );

  const renderAlmacenStep = () => (
    <Box>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Sucursal: <strong>{selectedSucursal?.nombre || "Sin sucursal"}</strong>.
        Selecciona un almacén para ver sus movimientos.
      </Typography>

      {loadingAlmacenes ? (
        <LoadingState text="Cargando almacenes..." />
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {almacenes.map((almacen) => {
            const seleccionada = selectedAlmacen?.id === almacen.id;

            return (
              <Card
                key={almacen.id}
                variant="outlined"
                onClick={() => handleSelectAlmacen(almacen)}
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
                      gap: 2,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
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
                        <Boxes
                          size={20}
                          color={seleccionada ? "white" : "#592B2B"}
                        />
                      </Box>

                      <Box>
                        <Typography fontSize={16} fontWeight={700} color="#3A1A1A">
                          {almacen.nombre}
                        </Typography>

                        <Typography fontSize={12} color="text.secondary">
                          Dirección: {almacen.direccion ?? "—"}
                        </Typography>
                      </Box>
                    </Box>

                    <Chip
                      size="small"
                      label={`${getTotalSecciones(almacen)} secciones`}
                    />
                  </Box>
                </Box>
              </Card>
            );
          })}

          {almacenes.length === 0 && !loadingAlmacenes && (
            <EmptyState
              icon={<Boxes size={32} />}
              text="No hay almacenes disponibles en esta sucursal"
            />
          )}
        </Box>
      )}
    </Box>
  );

  const renderMovimientosStep = () => (
    <Box>
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
            gap: 2,
            flexWrap: "wrap",
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
              <Typography variant="h6" fontWeight={700} color="#3A1A1A">
                {selectedAlmacen?.nombre || "Almacén"}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}
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
                fontWeight: 700,
                textTransform: "none",
                background: "linear-gradient(135deg, #592B2B 0%, #3A1A1A 100%)",
              }}
            >
              Nuevo movimiento
            </Button>
          )}
        </Box>
      </Card>

      <Box sx={{ width: "100%", overflowX: "auto" }}>
        <Box sx={{ minWidth: 700 }}>
          <GridGenerico
            ref={gridRef}
            service={serviceMovimientoFiltrado}
            columns={columns}
            defaultSortField="fecha"
            defaultSortAsc={false}
            pageSize={10}
            title="Movimientos"
            renderActions={(row) => {
              if (!row) return null;
              
              const vendido = Number(row.productoEstado) === 2;

              return (
                <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                  <IconButton
                    size="small"
                    onClick={() => setSelectedId(row.id)}
                    sx={{ color: "#592B2B" }}
                    title="Ver detalles"
                  >
                    <Eye size={16} />
                  </IconButton>

                  {!vendido && (
                    <IconButton
                      size="small"
                      onClick={() => setEditId(row.id)}
                      sx={{ color: "#2563EB" }}
                      title="Editar movimiento"
                    >
                      <Pencil size={16} />
                    </IconButton>
                  )}

                  {canDelete && !vendido && (
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
              );
            }}
          />
        </Box>
      </Box>
    </Box>
  );

  const renderContent = () => {
    // Para usuarios almacén
    if (isAlmacen && !selectedSucursal) {
      return <LoadingState text="Cargando datos de tu sucursal y almacenes..." />;
    }

    // Para administradores según el paso
    if (step === 0) return renderCiudadStep();
    if (step === 1) return renderSucursalStep();
    if (step === 2) return renderAlmacenStep();
    if (step === 3) return renderMovimientosStep();

    // Fallback seguro
    return renderCiudadStep();
  };

  // Validación segura para evitar errores de renderizado
  const isStepValid = () => {
    if (step === 0) return true;
    if (step === 1) return selectedCiudad !== null;
    if (step === 2) return selectedSucursal !== null;
    if (step === 3) return selectedAlmacen !== null;
    return true;
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
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
          <Typography variant="h4" sx={{ fontWeight: 700, color: "#3A1A1A", mb: 0.5 }}>
            Movimientos de Inventario
          </Typography>

          <Typography variant="body2" color="text.secondary">
            {isAlmacen
              ? selectedSucursal && selectedAlmacen
                ? `Movimientos en ${selectedAlmacen.nombre}`
                : "Selecciona tu almacén para ver los movimientos"
              : step === 0
              ? "Selecciona una ciudad para comenzar"
              : step === 1
              ? `Sucursales de ${selectedCiudad?.nombre || "la ciudad seleccionada"}`
              : step === 2
              ? `Almacenes de ${selectedSucursal?.nombre || "la sucursal seleccionada"}`
              : `Movimientos del almacén ${selectedAlmacen?.nombre || "seleccionado"}`}
          </Typography>
        </Box>

        {((isAdmin && step > 0) || (isAlmacen && step === 3)) && (
          <Button
            variant="outlined"
            onClick={handleGoBack}
            startIcon={<ArrowLeft size={18} />}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              fontWeight: 600,
              textTransform: "none",
              borderColor: "#592B2B",
              color: "#592B2B",
            }}
          >
            Volver
          </Button>
        )}
      </Box>

      {!isAlmacen && (
        <WizardSteps step={step} />
      )}

      {isStepValid() ? renderContent() : <LoadingState text="Cargando..." />}

      <MovimientoDetalleDialog
        open={!!selectedId}
        id={selectedId}
        onClose={() => setSelectedId(null)}
      />

      <MovimientoEditDialog
        open={!!editId}
        id={editId}
        onClose={() => setEditId(null)}
        onSuccess={() => {
          setEditId(null);
          if (gridRef.current) {
            gridRef.current.refetch?.();
          }
        }}
      />

      {idToDelete && (
        <DeleteConfirm
          title="¿Eliminar movimiento?"
          message="Esta acción marcará el movimiento como inactivo."
          onConfirm={handleDelete}
          onCancel={() => setIdToDelete(null)}
        />
      )}

      <ErrorDialog open={showError} message={errorMessage} />

      {showInventarioFlow && (
        <InventarioFlow
          isOpen={showInventarioFlow}
          onClose={() => {
            setShowInventarioFlow(false);
            if (gridRef.current) {
              gridRef.current.refetch?.();
            }
          }}
          usuarioId={usuarioIdLogueado}
          sucursalSeleccionada={selectedSucursal}
          almacenSeleccionado={selectedAlmacen}
        />
      )}
    </Box>
  );
};

const LoadingState = ({ text }) => (
  <Box sx={{ textAlign: "center", py: 4 }}>
    <CircularProgress sx={{ color: "#592B2B", mb: 2 }} />
    <Typography variant="body2" color="text.secondary">
      {text}
    </Typography>
  </Box>
);

const EmptyState = ({ icon, text }) => (
  <Box
    sx={{
      textAlign: "center",
      py: 4,
      border: "1px dashed #ccc",
      borderRadius: 2,
      bgcolor: "#fafafa",
      color: "#999",
    }}
  >
    {icon}
    <Typography variant="body2" color="text.disabled" mt={1}>
      {text}
    </Typography>
  </Box>
);

const WizardSteps = ({ step }) => (
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
    {STEP_TITLES.map((title, index) => {
      const active = step === index;
      const done = step > index;

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
              fontWeight: 700,
              fontSize: 14,
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
          >
            {done ? <Check size={16} /> : index + 1}
          </Box>

          <Typography
            sx={{
              ml: 1,
              mr: index < STEP_TITLES.length - 1 ? 1 : 0,
              fontSize: 14,
              fontWeight: active ? 700 : 400,
              color: active ? "#3A1A1A" : done ? "#0D8C47" : "#999",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </Typography>

          {index < STEP_TITLES.length - 1 && (
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
);

export default MovimientoList;