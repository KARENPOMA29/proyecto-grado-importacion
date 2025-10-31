import React, { useMemo, useState } from "react";
import { styled, useTheme } from "@mui/material/styles";
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button,
  Tooltip,
  Collapse,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PersonIcon from "@mui/icons-material/Person";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
// 👇 tu ruta
import { getMenuByRole } from "@/routes/pages/dashboards/menuConfig";

const DRAWER_WIDTH = 260;
const COLLAPSED_WIDTH = 70;
const ACTIVE_BG = "rgba(89, 43, 43, 0.56)";

const DrawerHeader = styled("div")(({ theme }) => ({
  ...theme.mixins.toolbar,
}));

export default function DashboardLayout({
  title = "Panel de Administrador",
  menuItems,
  children,
}) {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState({
    Principal: true,
    Gestión: true,
    Sistema: true,
  });

  // 1) menú según rol
  const resolvedMenu = useMemo(() => {
    if (menuItems && menuItems.length) return menuItems;
    return getMenuByRole(user?.rol || "");
  }, [menuItems, user?.rol]);

  // 2) agrupar
  const groupedMenu = useMemo(() => {
    const groups = {};
    resolvedMenu.forEach((item) => {
      const g = item.group || "Otros";
      if (!groups[g]) groups[g] = [];
      groups[g].push(item);
    });
    const ordered = {};
    ["Principal", "Gestión", "Sistema", "Otros"].forEach((g) => {
      if (groups[g]) ordered[g] = groups[g];
    });
    return ordered;
  }, [resolvedMenu]);

  const handleDrawerToggle = () => setMobileOpen((p) => !p);
  const handleCollapseToggle = () => setCollapsed((p) => !p);

  const handleLogout = () => {
    logout?.();
    navigate("/login");
  };

  const toggleGroup = (name) =>
    setOpenGroups((prev) => ({ ...prev, [name]: !prev[name] }));

  // 🔥 función para saber si un item está activo
  const isItemActive = (itemTo) => {
    const path = location.pathname;
    // caso especial: /admin debe ser EXACTO
    if (itemTo === "/admin") {
      return path === "/admin";
    }
    return path.startsWith(itemTo);
  };

  // 📦 contenido del drawer
  const drawerContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* barra superior del drawer */}
      <Box
        sx={{
          height: 56,
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 1,
          justifyContent: collapsed ? "center" : "flex-start",
        }}
      >
        <IconButton
          onClick={handleCollapseToggle}
          size="small"
          sx={{
            backgroundColor: "rgba(89,43,43,0.12)",
            "&:hover": { backgroundColor: "rgba(89,43,43,0.2)" },
          }}
        >
          <ChevronLeftIcon
            sx={{
              transform: collapsed ? "rotate(180deg)" : "none",
              transition: "transform .2s",
            }}
          />
        </IconButton>

        {!collapsed && (
          <Typography variant="subtitle1" noWrap sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
        )}
      </Box>

      <Divider />

      {/* lista */}
      <Box sx={{ flex: 1, overflowY: "auto" }}>
        {Object.entries(groupedMenu).map(([groupName, items]) => {
          // 📌 modo colapsado: solo íconos
          if (collapsed) {
            return (
              <List key={groupName} dense sx={{ pt: 0 }}>
                {items.map((item) => {
                  const Icon = item.icon;
                  const active = isItemActive(item.to);
                  const node = (
                    <ListItemButton
                      key={item.to}
                      component={NavLink}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      sx={{
                        justifyContent: "center",
                        mx: 1,
                        my: 0.3,
                        borderRadius: 1.5,
                        minHeight: 42,
                        ...(active && {
                          bgcolor: ACTIVE_BG,
                          color: "#fff",
                          "& .MuiListItemIcon-root": { color: "#fff" },
                        }),
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 0 }}>
                        <Icon fontSize="small" />
                      </ListItemIcon>
                    </ListItemButton>
                  );
                  return (
                    <Tooltip key={item.to} title={item.label} placement="right">
                      {node}
                    </Tooltip>
                  );
                })}
              </List>
            );
          }

          // 📌 modo normal: grupos que se abren/cierran
          const isOpen = openGroups[groupName] ?? true;
          return (
            <List key={groupName} dense sx={{ pt: 0 }}>
              <ListItemButton onClick={() => toggleGroup(groupName)}>
                <ListItemText
                  primary={groupName.toUpperCase()}
                  primaryTypographyProps={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    color: "#6b6b6b",
                    letterSpacing: 0.4,
                  }}
                />
                {isOpen ? (
                  <ExpandLessIcon fontSize="small" />
                ) : (
                  <ExpandMoreIcon fontSize="small" />
                )}
              </ListItemButton>

              <Collapse in={isOpen} timeout="auto" unmountOnExit>
                {items.map((item) => {
                  const Icon = item.icon;
                  const active = isItemActive(item.to);
                  return (
                    <ListItemButton
                      key={item.to}
                      component={NavLink}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      sx={{
                        mx: 1.5,
                        my: 0.25,
                        borderRadius: 1.5,
                        minHeight: 40,
                        ...(active && {
                          bgcolor: ACTIVE_BG,
                          color: "#fff",
                          "& .MuiListItemIcon-root": { color: "#fff" },
                        }),
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Icon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={item.label} />
                    </ListItemButton>
                  );
                })}
              </Collapse>
            </List>
          );
        })}
      </Box>

      <Divider />

      <Box sx={{ p: collapsed ? 1 : 2 }}>
        <Button
          fullWidth={!collapsed}
          startIcon={!collapsed ? <LogoutIcon /> : null}
          onClick={handleLogout}
          sx={{
            justifyContent: collapsed ? "center" : "flex-start",
            color: "#592B2B",
            fontWeight: 600,
          }}
        >
          {collapsed ? <LogoutIcon /> : "Cerrar sesión"}
        </Button>
      </Box>
    </Box>
  );

  // drawer mobile container
  const container =
    typeof window !== "undefined" ? () => window.document.body : undefined;

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />

      {/* APPBAR */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: "rgba(89, 43, 43, 0.56)",
          backdropFilter: "blur(12px)",
        }}
      >
        <Toolbar>
          {/* menú móvil */}
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            {title}
          </Typography>

          {user && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <PersonIcon fontSize="small" />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {user.nombre || user.username} — {user.rol}
              </Typography>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* DRAWER */}
      <Box
        component="nav"
        sx={{
          width: { sm: collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH },
          flexShrink: { sm: 0 },
        }}
      >
        {/* móvil */}
        <Drawer
          container={container}
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* desktop */}
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH,
              transition: theme.transitions.create("width", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* CONTENIDO */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: {
            xs: "100%",
            sm: `calc(100% - ${collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH}px)`,
          },
          bgcolor: (theme) =>
            theme.palette.mode === "light" ? "#f3f4f6" : "background.default",
          minHeight: "100vh",
        }}
      >
        <DrawerHeader />
        {children}
      </Box>
    </Box>
  );
}
