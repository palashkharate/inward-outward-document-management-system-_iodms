import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import axios from 'axios';

// In production (Docker): Nginx proxies /api to the backend, so no baseURL needed.
// In development: Vite proxy (vite.config.js) handles /api forwarding to localhost:8000.
// So we always use relative URLs like '/api/inward/register' — no hardcoded localhost.

// Global Axios Interceptor for JWT
axios.interceptors.request.use(
  (config) => {
    const userJson = sessionStorage.getItem('iodms_user');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        if (user.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      } catch (e) {
        // Handle invalid JSON
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Button,
  Menu,
  MenuItem,
  Avatar
} from '@mui/material';

// Icons
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CreateIcon from '@mui/icons-material/Create';
import DescriptionIcon from '@mui/icons-material/Description';
import InputIcon from '@mui/icons-material/Input';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';

// Pages
import LoginPage from './pages/LoginPage.jsx';
import AuditorView from './pages/AuditorView.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ComposeOutwardPage from './pages/ComposeOutwardPage.jsx';
import DraftsDispatchPage from './pages/DraftsDispatchPage.jsx';
import LogInwardPage from './pages/LogInwardPage.jsx';
import InwardRegisterPage from './pages/InwardRegisterPage.jsx';
import OutwardRegisterPage from './pages/OutwardRegisterPage.jsx';
import AddressBookPage from './pages/AddressBookPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import MyProfilePage from './pages/MyProfilePage.jsx';

// 1. Theme Definition - "Aviation Cockpit Slate Blue" Theme (visual wow factor)
const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1A73E8', // Google Blue
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#00897B', // Teal Accent
    },
    background: {
      default: '#F8F9FA', // Google Grey 50
      paper: '#FFFFFF',
    },
    text: {
      primary: '#202124', // Google Dark Grey
      secondary: '#5F6368', // Google Med Grey
    },
    divider: '#E8EAED',
  },
  typography: {
    fontFamily: "'Outfit', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    h5: {
      fontWeight: 700,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 20px',
          transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
          '&:active': { transform: 'scale(0.98)' },
        },
        containedPrimary: {
          boxShadow: '0 2px 8px rgba(26,115,232,0.25)',
          '&:hover': { boxShadow: '0 4px 16px rgba(26,115,232,0.35)' },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': { borderWidth: '1.5px', backgroundColor: 'rgba(26,115,232,0.04)' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid #E8EAED',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          transition: 'box-shadow 200ms ease, transform 200ms ease',
          '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: 'box-shadow 200ms ease',
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#1A73E8',
            borderWidth: '1px',
          },
          '&.Mui-focused': {
            boxShadow: '0 0 0 3px rgba(26,115,232,0.12)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6, fontWeight: 500 },
        colorSuccess: { backgroundColor: '#E6F4EA', color: '#188038' },
        colorError: { backgroundColor: '#FCE8E6', color: '#D93025' },
        colorWarning: { backgroundColor: '#FEF7E0', color: '#E37400' },
        colorInfo: { backgroundColor: '#E8F0FE', color: '#1A73E8' },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 16, boxShadow: '0 16px 48px rgba(0,0,0,0.12)' },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: { backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.3)' },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#E8F0FE !important',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          color: '#1A73E8 !important',
          fontWeight: '600 !important',
          textTransform: 'uppercase',
          fontSize: '0.75rem',
          letterSpacing: '0.5px',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 150ms ease',
          '&:hover': { backgroundColor: '#F8F9FA' },
        },
      },
    },
  },
});

const drawerWidth = 260;

// 2. Auth Context Creation
export const AuthContext = createContext(null);

// Custom hook to consume AuthContext
export const useAuth = () => useContext(AuthContext);

function AppContent() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const [anchorEl, setAnchorEl] = useState(null);
  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  // Determine if sidebar/navbar should be visible
  const showNav = user && location.pathname !== '/' && location.pathname !== '/auditor';

  // Navigation Items
  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', roles: ['User', 'Admin'] },
    { text: 'Compose Outward', icon: <CreateIcon />, path: '/compose-outward', roles: ['User', 'Admin'] },
    { text: 'Drafts & Dispatch', icon: <DescriptionIcon />, path: '/drafts', roles: ['User', 'Admin'] },
    { text: 'Outward Register', icon: <FolderSpecialIcon />, path: '/outward-register', roles: ['User', 'Admin'] },
    { text: 'Log Inward', icon: <InputIcon />, path: '/log-inward', roles: ['User', 'Admin'] },
    { text: 'Inward Register', icon: <LibraryBooksIcon />, path: '/inward-register', roles: ['User', 'Admin'] },
    { text: 'Address Book', icon: <ContactPhoneIcon />, path: '/address-book', roles: ['User', 'Admin'] },
    { text: 'Admin Panel', icon: <AdminPanelSettingsIcon />, path: '/admin', roles: ['Admin'] },
    { text: 'My Profile', icon: <AccountCircleIcon />, path: '/profile', roles: ['User', 'Admin'] },
  ];

  const drawerContent = (
    <Box sx={{ height: '100%', bgcolor: '#FFFFFF', color: '#202124', display: 'flex', flexDirection: 'column', borderRight: '1px solid #E8EAED' }}>
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box component="img" src="/images/hal_logo.png" sx={{ width: 40, height: 40, objectFit: 'contain' }} alt="HAL Logo" />
        <Box>
          <Typography variant="subtitle1" fontWeight={700} color="primary.main" lineHeight={1.2}>
            IODMS Portal
          </Typography>
          <Typography variant="caption" color="text.secondary">
            AURDC - DEA, Nashik
          </Typography>
        </Box>
      </Box>
      <Divider />
      <List sx={{ flexGrow: 1, px: 1.5, py: 2 }}>
        {menuItems
          .filter((item) => item.roles.includes(user?.role))
          .map((item) => {
            const active = location.pathname.startsWith(item.path);
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  component={Link}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  sx={{
                    borderRadius: 2,
                    bgcolor: active ? 'rgba(26, 115, 232, 0.08)' : 'transparent',
                    color: active ? 'primary.main' : 'text.secondary',
                    borderLeft: active ? '3px solid #1A73E8' : '3px solid transparent',
                    transition: 'all 200ms ease',
                    '&:hover': {
                      bgcolor: active ? 'rgba(26, 115, 232, 0.12)' : 'rgba(0, 0, 0, 0.04)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: active ? 'primary.main' : 'inherit', minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{ 
                      fontWeight: active ? 600 : 500,
                      fontSize: '0.95rem'
                    }} 
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
      </List>
      <Divider />
      <List sx={{ p: 1.5 }}>
        {/* Logout (FR-014) */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => {
              logout();
              navigate('/');
            }}
            sx={{ 
              borderRadius: 2, 
              color: '#E53935',
              transition: 'all 200ms ease',
              '&:hover': {
                bgcolor: 'rgba(229, 57, 53, 0.06)'
              }
            }}
          >
            <ListItemIcon sx={{ color: '#E53935', minWidth: 40 }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Log Out" primaryTypographyProps={{ fontSize: '0.92rem', fontWeight: 500 }} />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {showNav && (
        <>
          <AppBar
            position="fixed"
            sx={{
              width: { md: `calc(100% - ${drawerWidth}px)` },
              ml: { md: `${drawerWidth}px` },
              bgcolor: '#FFFFFF',
              borderBottom: '1px solid #E8EAED',
              boxShadow: 'none',
              color: '#111827',
            }}
          >
            <Toolbar sx={{ justifyContent: 'space-between' }}>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2, display: { md: 'none' } }}
              >
                <MenuIcon />
              </IconButton>
              <Typography variant="subtitle1" component="div" fontWeight={600} color="text.primary">
                {menuItems.find((item) => location.pathname.startsWith(item.path))?.text || 'Portal'}
              </Typography>

              {/* FR-020: Officer welcome header display */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box textAlign="right" sx={{ display: { xs: 'none', sm: 'block' } }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {user.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Role: {user.role}
                  </Typography>
                </Box>
                <IconButton onClick={handleMenu} sx={{ p: 0 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', fontSize: '0.9rem', width: 36, height: 36 }}>
                    {user.name.charAt(0)}
                  </Avatar>
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  PaperProps={{
                    sx: {
                      mt: 1,
                      minWidth: 150,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                      borderRadius: 2
                    }
                  }}
                >
                  <MenuItem onClick={() => { handleClose(); navigate('/profile'); }}>
                    <ListItemIcon><AccountCircleIcon fontSize="small" /></ListItemIcon>
                    Profile
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={() => { handleClose(); logout(); navigate('/'); }} sx={{ color: '#D93025' }}>
                    <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: '#D93025' }} /></ListItemIcon>
                    Log Out
                  </MenuItem>
                </Menu>
              </Box>
            </Toolbar>
          </AppBar>

          {/* Drawer Sidebar */}
          <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
            <Drawer
              variant="temporary"
              open={mobileOpen}
              onClose={handleDrawerToggle}
              ModalProps={{ keepMounted: true }}
              sx={{
                display: { xs: 'block', md: 'none' },
                '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
              }}
            >
              {drawerContent}
            </Drawer>
            <Drawer
              variant="permanent"
              sx={{
                display: { xs: 'none', md: 'block' },
                '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: 'none' },
              }}
              open
            >
              {drawerContent}
            </Drawer>
          </Box>
        </>
      )}

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: showNav ? { md: `calc(100% - ${drawerWidth}px)` } : '100%',
          mt: showNav ? '64px' : 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: showNav ? 'flex-start' : 'center',
        }}
      >
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/auditor" element={<AuditorView />} />
          <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
          <Route path="/compose-outward" element={<RequireAuth><ComposeOutwardPage /></RequireAuth>} />
          <Route path="/compose-outward/modify/:folder_id/:year/:outward_no" element={<RequireAuth><ComposeOutwardPage /></RequireAuth>} />
          <Route path="/drafts" element={<RequireAuth><DraftsDispatchPage /></RequireAuth>} />
          <Route path="/log-inward" element={<RequireAuth><LogInwardPage /></RequireAuth>} />
          <Route path="/log-inward/modify/:folder_id/:year/:inward_no" element={<RequireAuth><LogInwardPage /></RequireAuth>} />
          <Route path="/inward-register" element={<RequireAuth><InwardRegisterPage /></RequireAuth>} />
          <Route path="/outward-register" element={<RequireAuth><OutwardRegisterPage /></RequireAuth>} />
          <Route path="/address-book" element={<RequireAuth><AddressBookPage /></RequireAuth>} />
          <Route path="/admin" element={<RequireAuth><AdminPage /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><MyProfilePage /></RequireAuth>} />
        </Routes>
      </Box>
    </Box>
  );
}

function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // FR-013: Load cached login to bypass session timeouts
  useEffect(() => {
    const cached = sessionStorage.getItem('iodms_user');
    if (cached) {
      try {
        setUser(JSON.parse(cached));
      } catch (e) {
        sessionStorage.removeItem('iodms_user');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    sessionStorage.setItem('iodms_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('iodms_user');
  };

  if (loading) {
     return null; // or loading screen
  }

  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <AuthContext.Provider value={{ user, login, logout }}>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthContext.Provider>
    </ThemeProvider>
  );
}
