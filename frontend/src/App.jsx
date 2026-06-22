import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import axios from 'axios';

// Configure global Axios base URL for development backend
axios.defaults.baseURL = 'http://localhost:8000';

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
      main: '#0B2545', // HAL Defence Navy
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#1E5AA8', // Technical Blue
    },
    background: {
      default: '#F8FAFC', // Workspace Grey
      paper: '#FFFFFF', // Operations White
    },
    text: {
      primary: '#111827', // Charcoal
      secondary: '#6B7280', // Muted Slate
    },
    divider: '#D1D5DB', // Aircraft Silver
  },
  typography: {
    fontFamily: "'Outfit', sans-serif",
    h5: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
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
    <Box sx={{ height: '100%', bgcolor: '#0B2545', color: '#FFFFFF', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ bgcolor: 'secondary.main', width: 40, height: 40 }}>HAL</Avatar>
        <Box>
          <Typography variant="subtitle1" fontWeight={700} color="#FFFFFF" lineHeight={1.2}>
            IODMS Portal
          </Typography>
          <Typography variant="caption" color="rgba(255, 255, 255, 0.7)">
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
                    bgcolor: active ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                    color: active ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)',
                    '&:hover': {
                      bgcolor: active ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: active ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)', minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.92rem', fontWeight: active ? 600 : 400 }} />
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
            sx={{ borderRadius: 2, color: '#E53935' }}
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
              borderBottom: '1px solid #D1D5DB',
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
              <Typography variant="h6" component="div" fontWeight={600} color="text.primary">
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
                <Avatar sx={{ bgcolor: 'primary.main', fontSize: '0.9rem', width: 36, height: 36 }}>
                  {user.name.charAt(0)}
                </Avatar>
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
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/compose-outward" element={<ComposeOutwardPage />} />
          <Route path="/compose-outward/modify/:folder_id/:year/:outward_no" element={<ComposeOutwardPage />} />
          <Route path="/drafts" element={<DraftsDispatchPage />} />
          <Route path="/log-inward" element={<LogInwardPage />} />
          <Route path="/log-inward/modify/:folder_id/:year/:inward_no" element={<LogInwardPage />} />
          <Route path="/inward-register" element={<InwardRegisterPage />} />
          <Route path="/outward-register" element={<OutwardRegisterPage />} />
          <Route path="/address-book" element={<AddressBookPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/profile" element={<MyProfilePage />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // FR-013: Load cached login to bypass session timeouts
  useEffect(() => {
    const cached = localStorage.getItem('iodms_user');
    if (cached) {
      try {
        setUser(JSON.parse(cached));
      } catch (e) {
        localStorage.removeItem('iodms_user');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('iodms_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('iodms_user');
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
