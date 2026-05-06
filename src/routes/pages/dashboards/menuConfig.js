// src/routes/menuConfig.js
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SettingsIcon from "@mui/icons-material/Settings";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import GroupIcon from "@mui/icons-material/Group";
import InventoryIcon from "@mui/icons-material/Inventory";
import StoreIcon from "@mui/icons-material/Store";

export const adminMenu = [
  // PRINCIPAL
  { label: "Alertas", icon: DashboardIcon, to: "/admin", group: "Principal" },
  { label: "Ventas", icon: ShoppingCartIcon, to: "/admin/ventas", group: "Principal" },
  { label: "Importaciones", icon: LocalShippingIcon, to: "/admin/importaciones", group: "Principal" },
  { label: "Entradas", icon: InventoryIcon, to: "/admin/inventario", group: "Principal" },
  { label: "Productos", icon: InventoryIcon, to: "/admin/productos", group: "Principal" },

  // GESTIÓN
  { label: "Clientes", icon: GroupIcon, to: "/admin/clientes", group: "Gestión" },
  { label: "Proveedores", icon: LocalShippingIcon, to: "/admin/proveedores", group: "Gestión" },
  { label: "Empleados", icon: PeopleIcon, to: "/admin/empleados", group: "Gestión" },
  { label: "Modelos de Producto", icon: InventoryIcon, to: "/admin/modelos", group: "Gestión" },
  { label: "Sucursales", icon: StoreIcon, to: "/admin/sucursales", group: "Gestión" },
  { label: "Categorías", icon: AssessmentIcon, to: "/admin/categorias", group: "Gestión" },
  { label: "Almacenes", icon: InventoryIcon, to: "/admin/almacenes", group: "Gestión" },
  { label: "Secciones", icon: AssessmentIcon, to: "/admin/secciones", group: "Gestión" },

  // SISTEMA
  { label: "Reporte de Importaciones", icon: AssessmentIcon, to: "/admin/reportes", group: "Sistema" },

  { label: "Reporte de Ventas", icon: AssessmentIcon, to: "/admin/reportes/ventas", group: "Sistema" },
  { label: "Reporte de Inventario", icon: AssessmentIcon, to: "/admin/reportes/inventario", group: "Sistema" },

  { label: "Configuración", icon: SettingsIcon, to: "/admin/configuracion", group: "Sistema" },
  ];
// --- VENTAS ---
export const ventasMenu = [
  // PRINCIPAL
  { label: "Resumen", icon: DashboardIcon, to: "/ventas", group: "Principal" },
  { label: "Ventas", icon: ShoppingCartIcon, to: "/ventas/ventas", group: "Principal" },

  // GESTIÓN
  { label: "Clientes", icon: GroupIcon, to: "/ventas/clientes", group: "Gestión" },

  // SISTEMA
  { label: "Reportes", icon: AssessmentIcon, to: "/ventas/reportes", group: "Sistema" },
];

// --- PILOTERO ---
export const pilotoMenu = [
  // PRINCIPAL

  { label: "Importaciones", icon: LocalShippingIcon, to: "/pilotero/importaciones", group: "Principal" },
  { label: "Proveedores", icon: GroupIcon, to: "/pilotero/proveedores", group: "Principal" },
];


// src/routes/menuConfig.js

export const almacenMenu = [
  // PRINCIPAL
  { label: "Resumen", icon: DashboardIcon, to: "/almacen", group: "Principal" },
  { label: "Entradas", icon: InventoryIcon, to: "/almacen/inventario", group: "Principal" },
  { label: "Importaciones", icon: LocalShippingIcon, to: "/almacen/importaciones", group: "Principal" },

  // GESTIÓN
  { label: "Modelos de Producto", icon: InventoryIcon, to: "/almacen/modelos", group: "Gestión" },
  { label: "Sucursales", icon: StoreIcon, to: "/almacen/sucursales", group: "Gestión" },
  { label: "Categorías", icon: AssessmentIcon, to: "/almacen/categorias", group: "Gestión" },
  { label: "Almacenes", icon: InventoryIcon, to: "/almacen/almacenes", group: "Gestión" },
  { label: "Secciones", icon: AssessmentIcon, to: "/almacen/secciones", group: "Gestión" },
];


export const getMenuByRole = (role = "") => {
  switch (role) {
    case "Administrador":
      return adminMenu;
    case "Ventas":
      return ventasMenu;
    case "Almacen":
      return almacenMenu;
    case "Pilotero":
      return pilotoMenu;
    default:
      // si te llega algo raro, lo mandamos al admin o vacío
      return adminMenu;
  }
};
