import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogContent,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CakeIcon from '@mui/icons-material/Cake';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App.jsx';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [birthdays, setBirthdays] = useState([]);
  const [showBirthdayOverlay, setShowBirthdayOverlay] = useState(false);

  useEffect(() => {
    // FR-021, FR-022: Fetch birthdays from backend
    const checkBirthdays = async () => {
      try {
        const response = await axios.get('/api/auth/birthdays');
        const names = response.data.birthday_names;
        
        if (names && names.length > 0) {
          setBirthdays(names);
          
          // Show overlay only once per login session
          const shown = sessionStorage.getItem('birthday_shown_session');
          if (!shown) {
            setShowBirthdayOverlay(true);
            sessionStorage.setItem('birthday_shown_session', 'true');
          }
        }
      } catch (e) {
        console.error('Error fetching birthdays', e);
      }
    };
    checkBirthdays();
  }, []);

  return (
    <Box sx={{ width: '100%', maxWidth: 1000, mt: 4 }}>
      {/* Welcome Card (FR-020) */}
      <Card
        sx={{
          mb: 4,
          border: '1px solid #D1D5DB',
          borderTop: '4px solid #1E5AA8',
          boxShadow: 2,
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Welcome, {user?.name}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            You are logged into the HAL AURDC Inward/Outward Document Management System with <strong>{user?.role}</strong> privileges. Use the left sidebar to navigate the modules.
          </Typography>
        </CardContent>
      </Card>

      {/* Birthday Overlay dialog (FR-021, FR-022) */}
      <Dialog
        fullScreen
        open={showBirthdayOverlay}
        onClose={() => setShowBirthdayOverlay(false)}
        PaperProps={{
          sx: {
            // Elegant background for birthday overlay
            background: '#F8FAFC',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative'
          }
        }}
      >
        {/* Close Button */}
        <IconButton
          onClick={() => setShowBirthdayOverlay(false)}
          sx={{ position: 'absolute', top: 20, right: 20, color: '#94a3b8' }}
        >
          <CloseIcon sx={{ fontSize: 32 }} />
        </IconButton>

        <DialogContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            width: '100%',
            p: 3
          }}
        >
          {/* Animated Birthday Icon */}
          <Box sx={{ mb: 4 }}>
            <CakeIcon sx={{ fontSize: 80, color: '#1E5AA8' }} />
          </Box>

          <Typography
            variant="h5"
            sx={{
              color: '#0B2545',
              letterSpacing: 2,
              fontWeight: 600,
              textTransform: 'uppercase',
              mb: 3
            }}
          >
            Wishing a very Happy Birthday to:
          </Typography>

          {/* FR-021, FR-022: Display user names stacked, centered, in Times New Roman */}
          <Box sx={{ my: 4 }}>
            {birthdays.map((name, idx) => (
              <Typography
                key={idx}
                variant="h1"
                sx={{
                  fontFamily: "'Times New Roman', Times, serif",
                  fontWeight: 'bold',
                  color: '#1E5AA8',
                  lineHeight: 1.3,
                  fontSize: { xs: '3rem', sm: '4.5rem', md: '6rem' },
                  textShadow: '0 2px 10px rgba(30, 90, 168, 0.2)'
                }}
              >
                {name}
              </Typography>
            ))}
          </Box>

          <Button
            variant="contained"
            color="secondary"
            size="large"
            onClick={() => setShowBirthdayOverlay(false)}
            sx={{
              mt: 4,
              px: 4,
              py: 1.5,
              borderRadius: 3,
              fontWeight: 'bold',
              boxShadow: '0 4px 14px rgba(30, 90, 168, 0.3)'
            }}
          >
            Thank You
          </Button>
        </DialogContent>
      </Dialog>

      {/* Main Operations Cards Grid */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%', border: '1px solid #D1D5DB', borderTop: '4px solid #0B2545' }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Compose Outward
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1, mb: 3 }}>
                Draft a new outward correspondence, pre-fill template markers, and save to LAN drafts.
              </Typography>
              <Button
                variant="outlined"
                endIcon={<ChevronRightIcon />}
                onClick={() => navigate('/compose-outward')}
              >
                Open Form
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%', border: '1px solid #D1D5DB', borderTop: '4px solid #0F766E' }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Drafts & Dispatch
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1, mb: 3 }}>
                Review active drafts, edit documents in MS Word, lock files, and dispatch to assign official numbers.
              </Typography>
              <Button
                variant="outlined"
                endIcon={<ChevronRightIcon />}
                onClick={() => navigate('/drafts')}
              >
                Open Drafts
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%', border: '1px solid #D1D5DB', borderTop: '4px solid #0284C7' }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Log Inward
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1, mb: 3 }}>
                Register newly received letters, assign to officers, drop scanned attachments, and save to registry.
              </Typography>
              <Button
                variant="outlined"
                endIcon={<ChevronRightIcon />}
                onClick={() => navigate('/log-inward')}
              >
                Open Form
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
