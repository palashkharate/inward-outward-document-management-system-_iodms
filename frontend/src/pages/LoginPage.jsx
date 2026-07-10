import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Avatar
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useAuth } from '../App.jsx';

// No hardcoded baseURL needed — Nginx proxies /api to backend in production,
// and Vite proxy handles it in development.

export default function LoginPage() {
  const { user, login } = useAuth();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // FR-011: Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!userId || !password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      // FR-010, FR-012: Call login API
      const response = await axios.post('/api/auth/login', {
        user_id: userId,
        password: password,
      });

      if (response.data.success) {
        login(response.data);
        navigate('/dashboard');
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Connection failed. Please check if the backend is running.');
      }
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, rgba(15,23,42,0.85), rgba(26,115,232,0.6)), url("/images/su30mki.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <Box
        className="page-enter-active"
        sx={{
          width: '100%',
          maxWidth: 420,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Visual Header (wow factor) */}
        <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <Box 
            component="img" 
            src="/images/hal_logo.png" 
            sx={{ 
              width: 90, 
              height: 90, 
              objectFit: 'contain', 
              mb: 2,
              filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.2))'
            }} 
            alt="HAL Logo" 
          />
          <Typography variant="h4" fontWeight={800} letterSpacing={-0.5} color="white">
            HAL IODMS
          </Typography>
          <Typography variant="body2" color="rgba(255,255,255,0.7)" sx={{ mt: 0.5 }}>
            Inward/Outward Document Management System
          </Typography>
        </Box>

      {/* Main Login Card - Glassmorphism */}
      <Card 
        sx={{ 
          width: '100%', 
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.4)', 
          boxShadow: '0 16px 48px rgba(0,0,0,0.2)', 
          borderRadius: 4 
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              size="medium"
              id="userId"
              label="User ID"
              name="userId"
              autoComplete="username"
              autoFocus
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              size="medium"
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 4 }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{
                py: 1.5,
                borderRadius: '100px',
                background: 'linear-gradient(135deg, #1A73E8, #1557B0)',
                fontWeight: 600,
                fontSize: '1rem',
                textTransform: 'uppercase',
                letterSpacing: 1,
                boxShadow: '0 4px 14px rgba(26, 115, 232, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1557B0, #1A73E8)',
                  boxShadow: '0 6px 20px rgba(26, 115, 232, 0.5)',
                },
              }}
            >
              Sign In
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* FR-000: Auditor View Button */}
      <Button
        variant="outlined"
        color="inherit"
        onClick={() => navigate('/auditor')}
        sx={{
          mt: 4,
          fontWeight: 600,
          fontSize: '0.85rem',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.9)',
          borderColor: 'rgba(255,255,255,0.3)',
          borderRadius: 2,
          '&:hover': {
            borderColor: 'rgba(255,255,255,0.8)',
            background: 'rgba(255,255,255,0.1)',
          },
        }}
      >
        View Registers (Auditor)
      </Button>

      <Typography variant="caption" sx={{ mt: 4, textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
        HAL AURDC, Nashik. DEA Office Air-Gapped Environment.<br />
        Protected under the Official Secrets Act, 1923.
      </Typography>
      </Box>
    </Box>
  );
}
