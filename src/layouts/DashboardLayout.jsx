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
  Avatar,
  useMediaQuery,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PersonIcon from "@mui/icons-material/Person";
import CloseIcon from "@mui/icons-material/Close";

import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getMenuByRole } from "@/routes/pages/dashboards/menuConfig";

const DRAWER_WIDTH = 270;
const COLLAPSED_WIDTH = 76;

const BRAND = {
  primary: "#592B2B",
  primarySoft: "rgba(89,43,43,0.10)",
  active: "rgba(89,43,43,0.88)",
  bg: "#f3f4f6",
  white: "#ffffff",
  text: "#1f2329",
  muted: "#6b7280",
  border: "#e5e7eb",
};

const DrawerHeader = styled("div")(({ theme }) => ({
  ...theme.mixins.toolbar,
}));

export default function DashboardLayout({
  title = "Panel de Administrador",
  menuItems,
  children,
}) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("sm"));

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const [openGroups, setOpenGroups] = useState({
    Principal: true,
    Gestión: true,
    Reportes: true,
    Otros: true,
  });

  const resolvedMenu = useMemo(() => {
    if (menuItems && menuItems.length) return menuItems;
    return getMenuByRole(user?.rol || "");
  }, [menuItems, user?.rol]);

  const groupedMenu = useMemo(() => {
    const groups = {};

    resolvedMenu.forEach((item) => {
      const groupName = item.group || "Otros";
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(item);
    });

    const ordered = {};
    ["Principal", "Gestión", "Reportes", "Otros"].forEach((groupName) => {
      if (groups[groupName]) ordered[groupName] = groups[groupName];
    });

    return ordered;
  }, [resolvedMenu]);

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  const handleCollapseToggle = () => {
    setCollapsed((prev) => !prev);
  };

  const toggleGroup = (groupName) => {
    if (collapsed && isDesktop) return;

    setOpenGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const handleLogout = () => {
    logout?.();
    navigate("/login");
  };

  const isItemActive = (itemTo) => {
    const currentPath = location.pathname;

    // Rutas raíz de cada rol: solo deben pintarse si estás exactamente ahí
    const rootRoutes = ["/admin", "/ventas", "/pilotero", "/almacen"];

    if (rootRoutes.includes(itemTo)) {
      return currentPath === itemTo;
    }

    // Las demás rutas sí pueden pintar subrutas
    return currentPath === itemTo || currentPath.startsWith(`${itemTo}/`);
  };
  const closeMobileDrawer = () => {
    if (!isDesktop) setMobileOpen(false);
  };

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: BRAND.white,
      }}
    >
      {/* HEADER DEL MENÚ */}
      <Box
        sx={{
          height: 64,
          px: collapsed && isDesktop ? 1 : 2,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed && isDesktop ? "center" : "space-between",
          gap: 1,
        }}
      >
        {!(collapsed && isDesktop) && (
          <Box sx={{ minWidth: 0 }}>
            <Typography
              noWrap
              sx={{
                fontWeight: 800,
                color: BRAND.primary,
                fontSize: "1rem",
                lineHeight: 1.2,
              }}
            >
              {title}
            </Typography>

            <Typography
              noWrap
              sx={{
                fontSize: "0.74rem",
                color: BRAND.muted,
                mt: 0.2,
              }}
            >
              Menú principal
            </Typography>
          </Box>
        )}

        {isDesktop ? (
          <Tooltip title={collapsed ? "Expandir menú" : "Contraer menú"}>
            <IconButton
              onClick={handleCollapseToggle}
              size="small"
              sx={{
                bgcolor: BRAND.primarySoft,
                color: BRAND.primary,
                "&:hover": {
                  bgcolor: "rgba(89,43,43,0.18)",
                },
              }}
            >
              <ChevronLeftIcon
                sx={{
                  transform: collapsed ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s ease",
                }}
              />
            </IconButton>
          </Tooltip>
        ) : (
          <IconButton onClick={handleDrawerToggle} size="small">
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      <Divider />

      {/* USUARIO */}
      {user && !(collapsed && isDesktop) && (
        <Box
          sx={{
            mx: 2,
            my: 2,
            p: 1.5,
            display: "flex",
            alignItems: "center",
            gap: 1.3,
            borderRadius: 3,
            bgcolor: BRAND.primarySoft,
            border: `1px solid ${BRAND.border}`,
          }}
        >
          <Avatar
            sx={{
              bgcolor: BRAND.primary,
              width: 38,
              height: 38,
              fontWeight: 700,
            }}
          >
            {(user.nombre || user.username || "U").charAt(0).toUpperCase()}
          </Avatar>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              noWrap
              sx={{
                fontWeight: 700,
                color: BRAND.text,
                fontSize: "0.88rem",
              }}
            >
              {user.nombre || user.username}
            </Typography>

            <Typography
              noWrap
              sx={{
                color: BRAND.muted,
                fontSize: "0.76rem",
              }}
            >
              {user.rol}
            </Typography>

            <Typography
              noWrap
              sx={{
                color: BRAND.primary,
                fontSize: "0.72rem",
                fontWeight: 800,
                mt: 0.2,
              }}
            >
              Sucursal: {user?.sucursalNombre || "No asignada"}
            </Typography>
                      </Box>
                    </Box>
                  )}

      {/* LISTA DEL MENÚ */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          px: collapsed && isDesktop ? 0.5 : 1,
          py: 1,
        }}
      >
        {Object.entries(groupedMenu).map(([groupName, items]) => {
          const isOpen = openGroups[groupName] ?? true;

          if (collapsed && isDesktop) {
            return (
              <List key={groupName} dense sx={{ py: 0.3 }}>
                {items.map((item) => {
                  const Icon = item.icon;
                  const active = isItemActive(item.to);

                  return (
                    <Tooltip key={item.to} title={item.label} placement="right">
                      <ListItemButton
                        component={NavLink}
                        to={item.to}
                        onClick={closeMobileDrawer}
                        sx={{
                          mx: 0.7,
                          my: 0.4,
                          minHeight: 44,
                          borderRadius: 2.2,
                          justifyContent: "center",
                          color: active ? BRAND.white : BRAND.primary,
                          bgcolor: active ? BRAND.active : "transparent",
                          "&:hover": {
                            bgcolor: active ? BRAND.active : BRAND.primarySoft,
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 0,
                            color: "inherit",
                            justifyContent: "center",
                          }}
                        >
                          <Icon fontSize="small" />
                        </ListItemIcon>
                      </ListItemButton>
                    </Tooltip>
                  );
                })}
              </List>
            );
          }

          return (
            <List key={groupName} dense sx={{ py: 0.4 }}>
              <ListItemButton
                onClick={() => toggleGroup(groupName)}
                sx={{
                  mx: 1,
                  mb: 0.4,
                  borderRadius: 2,
                  minHeight: 36,
                  color: BRAND.muted,
                  "&:hover": {
                    bgcolor: BRAND.primarySoft,
                    color: BRAND.primary,
                  },
                }}
              >
                <ListItemText
                  primary={groupName.toUpperCase()}
                  primaryTypographyProps={{
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    letterSpacing: 0.5,
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
                      onClick={closeMobileDrawer}
                      sx={{
                        mx: 1,
                        my: 0.35,
                        minHeight: 44,
                        borderRadius: 2.3,
                        color: active ? BRAND.white : BRAND.text,
                        bgcolor: active ? BRAND.active : "transparent",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          bgcolor: active ? BRAND.active : BRAND.primarySoft,
                          transform: "translateX(2px)",
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 36,
                          color: active ? BRAND.white : BRAND.primary,
                        }}
                      >
                        <Icon fontSize="small" />
                      </ListItemIcon>

                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          fontSize: "0.9rem",
                          fontWeight: active ? 700 : 500,
                          noWrap: true,
                        }}
                      />
                    </ListItemButton>
                  );
                })}
              </Collapse>
            </List>
          );
        })}
      </Box>

      <Divider />

      {/* CERRAR SESIÓN */}
      <Box sx={{ p: collapsed && isDesktop ? 1 : 2 }}>
        <Tooltip title={collapsed && isDesktop ? "Cerrar sesión" : ""}>
          <Button
            fullWidth
            onClick={handleLogout}
            startIcon={collapsed && isDesktop ? null : <LogoutIcon />}
            sx={{
              minHeight: 44,
              borderRadius: 2.5,
              justifyContent: collapsed && isDesktop ? "center" : "flex-start",
              color: BRAND.primary,
              fontWeight: 800,
              textTransform: "none",
              bgcolor: BRAND.primarySoft,
              "&:hover": {
                bgcolor: "rgba(89,43,43,0.18)",
              },
            }}
          >
            {collapsed && isDesktop ? <LogoutIcon /> : "Cerrar sesión"}
          </Button>
        </Tooltip>
      </Box>
    </Box>
  );

  const container =
    typeof window !== "undefined" ? () => window.document.body : undefined;

  const currentDrawerWidth = collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH;

  return (
    <Box sx={{ display: "flex", bgcolor: BRAND.bg }}>
      <CssBaseline />

      {/* APPBAR */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: "rgba(89, 43, 43, 0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.15)",
        }}
      >
        <Toolbar
          sx={{
            minHeight: { xs: 58, sm: 64 },
            px: { xs: 1.5, sm: 3 },
          }}
        >
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{
              mr: 1.5,
              display: { xs: "inline-flex", sm: "none" },
            }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            noWrap
            sx={{
              flexGrow: 1,
              fontSize: { xs: "1rem", sm: "1.15rem" },
              fontWeight: 800,
            }}
          >
            {title}
          </Typography>

          {user && (
            <Box
              sx={{
                display: { xs: "none", md: "flex" },
                alignItems: "center",
                gap: 1,
                px: 1.5,
                py: 0.7,
                borderRadius: 999,
                bgcolor: "rgba(255,255,255,0.12)",
              }}
            >
              <PersonIcon fontSize="small" />
              <Typography
                noWrap
                sx={{
                  fontSize: "0.86rem",
                  fontWeight: 600,
                  maxWidth: 260,
                }}
              >
                {user.nombre || user.username} — {user.rol}
                {user?.sucursalNombre ? ` • ${user.sucursalNombre}` : ""}
              </Typography>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* DRAWER */}
      <Box
        component="nav"
        sx={{
          width: { sm: currentDrawerWidth },
          flexShrink: { sm: 0 },
        }}
      >
        {/* MÓVIL */}
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
              width: "86%",
              maxWidth: DRAWER_WIDTH,
              borderRight: "none",
            },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* ESCRITORIO */}
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: currentDrawerWidth,
              overflowX: "hidden",
              borderRight: `1px solid ${BRAND.border}`,
              transition: theme.transitions.create("width", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.shorter,
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
          width: {
            xs: "100%",
            sm: `calc(100% - ${currentDrawerWidth}px)`,
          },
          minHeight: "100vh",
          bgcolor: BRAND.bg,
          transition: theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.shorter,
          }),
        }}
      >
        <DrawerHeader />

        <Box
          sx={{
            p: { xs: 2, sm: 3 },
            maxWidth: "100%",
            overflowX: "hidden",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}