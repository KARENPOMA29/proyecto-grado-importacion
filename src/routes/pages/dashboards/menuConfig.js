import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SettingsIcon from "@mui/icons-material/Settings";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import HistoryIcon from "@mui/icons-material/History";
import GroupIcon from "@mui/icons-material/Group";
import InventoryIcon from "@mui/icons-material/Inventory";
import AddBoxIcon from "@mui/icons-material/AddBox";
import OutboxIcon from "@mui/icons-material/Outbox";
import WarningIcon from "@mui/icons-material/Warning";
import MapIcon from "@mui/icons-material/Map";
import StoreIcon from "@mui/icons-material/Store";

export const adminMenu = [
  { label: "Resumen", icon: DashboardIcon, to: "/admin" },
  { label: "Empleados", icon: PeopleIcon, to: "/admin/empleados" },
  { label: "Reportes", icon: AssessmentIcon, to: "/admin/reportes" },
  { label: "Configuración", icon: SettingsIcon, to: "/admin/configuracion" },
  { label: "Importaciones", icon: LocalShippingIcon, to: "/admin/importaciones" },
  { label: "Inventario", icon: LocalShippingIcon, to: "/admin/inventario" },
  { label: "Clientes", icon: GroupIcon, to: "/admin/clientes" },
  { label: "Proveedores", icon: LocalShippingIcon, to: "/admin/proveedores" },
  { label: "Modelos de Producto", icon: InventoryIcon, to: "/admin/modelos" },
  { label: "Sucursales", icon: StoreIcon, to: "/admin/sucursales" },
  { label: "Categorías", icon: AssessmentIcon, to: "/admin/categorias" },
  { label: "Almacenes", icon: InventoryIcon, to: "/admin/almacenes" },
  { label: "Secciones", icon: AssessmentIcon, to: "/admin/secciones" },
];

export const ventasMenu = [
  { label: "Resumen", icon: DashboardIcon, to: "/ventas" },
  { label: "Nueva Venta", icon: ShoppingCartIcon, to: "/ventas/nueva-venta" },
  { label: "Historial", icon: HistoryIcon, to: "/ventas/historial" },
  { label: "Clientes", icon: GroupIcon, to: "/ventas/clientes" },
  { label: "Reportes", icon: AssessmentIcon, to: "/ventas/reportes" },
];

export const almacenMenu = [
  { label: "Resumen", icon: DashboardIcon, to: "/almacen" },
  { label: "Inventario", icon: InventoryIcon, to: "/almacen/inventario" },
  { label: "Ingresos", icon: AddBoxIcon, to: "/almacen/ingresos" },
  { label: "Salidas", icon: OutboxIcon, to: "/almacen/salidas" },
  { label: "Alertas", icon: WarningIcon, to: "/almacen/alertas" },
];

export const pilotoMenu = [
  { label: "Resumen", icon: DashboardIcon, to: "/pilotero" },
  { label: "Envíos", icon: InventoryIcon, to: "/pilotero/envios" },
  { label: "Estado Entregas", icon: LocalShippingIcon, to: "/pilotero/estado" },
  { label: "Rutas del Día", icon: MapIcon, to: "/pilotero/rutas" },
  { label: "Historial", icon: HistoryIcon, to: "/pilotero/historial" },
];
