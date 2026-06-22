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

// Configure axios base URL
axios.defaults.baseURL = 'http://localhost:8000';

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
        maxWidth: 420,
        mt: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Visual Header (wow factor) */}
      <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <Avatar sx={{ m: 1, bgcolor: 'primary.main', width: 56, height: 56 }}>
          <LockOutlinedIcon sx={{ fontSize: 30 }} />
        </Avatar>
        <Typography variant="h4" fontWeight={800} letterSpacing={-0.5} sx={{ mt: 1 }}>
          HAL IODMS
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Inward/Outward Document Management System
        </Typography>
      </Box>

      {/* Main Login Card */}
      <Card sx={{ width: '100%', border: '1px solid #D1D5DB', boxShadow: 3 }}>
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
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{
                py: 1.5,
                borderRadius: 2.5,
                fontWeight: 600,
                fontSize: '1rem',
                boxShadow: '0 4px 14px rgba(11, 37, 69, 0.3)',
                '&:hover': {
                  boxShadow: '0 6px 20px rgba(11, 37, 69, 0.5)',
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
        variant="text"
        color="secondary"
        onClick={() => navigate('/auditor')}
        sx={{
          mt: 4,
          fontWeight: 600,
          fontSize: '0.85rem',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          color: '#E53935',
          '&:hover': {
            bgcolor: 'rgba(229, 57, 53, 0.08)',
          },
        }}
      >
        View Registers (Auditor)
      </Button>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
        HAL AURDC, Nashik. DEA Office Air-Gapped Environment.<br />
        Protected under the Official Secrets Act, 1923.
      </Typography>
    </Box>
  );
}
