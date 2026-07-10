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
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import InputIcon from '@mui/icons-material/Input';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import DescriptionIcon from '@mui/icons-material/Description';
import EditNoteIcon from '@mui/icons-material/EditNote';
import CelebrationIcon from '@mui/icons-material/Celebration';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App.jsx';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const COLORS = ['#1A73E8', '#34A853', '#FBBC04', '#EA4335', '#00897B', '#8E24AA'];

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [birthdays, setBirthdays] = useState([]);
  const [showBirthdayOverlay, setShowBirthdayOverlay] = useState(false);
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [lastLogin, setLastLogin] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const bdRes = await axios.get('/api/auth/birthdays');
        const names = bdRes.data.birthday_names;
        if (names && names.length > 0) {
          setBirthdays(names);
          const shown = sessionStorage.getItem('birthday_shown_session');
          if (!shown) {
            setShowBirthdayOverlay(true);
            sessionStorage.setItem('birthday_shown_session', 'true');
          }
        }

        const [statsRes, chartsRes, loginRes] = await Promise.all([
          axios.get('/api/dashboard/stats'),
          axios.get('/api/dashboard/charts'),
          axios.get(`/api/auth/last-login/${user.user_id}`)
        ]);
        setStats(statsRes.data);
        setCharts(chartsRes.data);
        setLastLogin(loginRes.data);
      } catch (e) {
        console.error('Error fetching dashboard data', e);
      }
    };
    fetchData();
  }, []);

  const StatCard = ({ title, value, color, icon }) => (
    <Card sx={{ height: '100%', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderRadius: 3, position: 'relative', overflow: 'hidden' }}>
      <Box sx={{ position: 'absolute', top: -20, right: -20, opacity: 0.1, transform: 'scale(2)' }}>
        {icon}
      </Box>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="subtitle2" color="text.secondary" fontWeight={600} textTransform="uppercase" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h3" fontWeight={700} sx={{ color }}>
          {value !== undefined ? value : '...'}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mt: 4, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Overview
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back, {user.name} ({user.role})
          </Typography>
          {lastLogin && lastLogin.has_previous && (
            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
              Last login from IP: {lastLogin.ip_address} on {new Date(lastLogin.logged_at).toLocaleString()}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
           {birthdays.length > 0 && (
             <Button 
               variant="text" 
               color="secondary" 
               startIcon={<CelebrationIcon />} 
               onClick={() => setShowBirthdayOverlay(true)} 
               sx={{ borderRadius: 2 }}
             >
               Birthdays Today!
             </Button>
           )}
           <Button variant="contained" startIcon={<InputIcon />} onClick={() => navigate('/log-inward')} sx={{ borderRadius: 2 }}>
             Log Inward
           </Button>
           <Button variant="outlined" startIcon={<EditNoteIcon />} onClick={() => navigate('/compose-outward')} sx={{ borderRadius: 2 }}>
             Compose Outward
           </Button>
        </Box>
      </Box>

      {/* Birthday Overlay */}
      <Dialog
        fullScreen
        open={showBirthdayOverlay}
        onClose={() => setShowBirthdayOverlay(false)}
        PaperProps={{
          sx: {
            background: '#F8FAFC',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative'
          }
        }}
      >
        <IconButton onClick={() => setShowBirthdayOverlay(false)} sx={{ position: 'absolute', top: 20, right: 20, color: '#94a3b8' }}>
          <CloseIcon sx={{ fontSize: 32 }} />
        </IconButton>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', width: '100%', p: 3, background: 'linear-gradient(135deg, #E8F0FE 0%, #FCE8E6 50%, #E6F4EA 100%)' }}>
          <Box sx={{ mb: 3 }}><Typography sx={{ fontSize: 100 }}>🎂</Typography></Box>
          <Typography variant="h5" sx={{ color: '#202124', letterSpacing: 1, fontWeight: 700, textTransform: 'uppercase', mb: 3 }}>
            Wishing a very Happy Birthday to:
          </Typography>
          <Box sx={{ my: 4 }}>
            {birthdays.map((name, idx) => (
              <Typography key={idx} variant="h1" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, background: 'linear-gradient(45deg, #1A73E8, #EA4335, #FBBC04, #34A853)', backgroundSize: '300% 300%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.3, fontSize: { xs: '3rem', sm: '4.5rem', md: '5.5rem' }, animation: 'gradient 5s ease infinite' }}>
                {name}
              </Typography>
            ))}
          </Box>
          <Button variant="contained" size="large" onClick={() => setShowBirthdayOverlay(false)} sx={{ mt: 4, px: 6, py: 1.5, borderRadius: 8, fontWeight: 600, boxShadow: '0 4px 14px rgba(26, 115, 232, 0.3)' }}>
            Thank You
          </Button>
        </DialogContent>
      </Dialog>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Inward This Year" value={stats?.total_inward_this_year} color="#1A73E8" icon={<InputIcon fontSize="large" />} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Outward This Year" value={stats?.total_outward_this_year} color="#34A853" icon={<FolderSpecialIcon fontSize="large" />} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Active Drafts" value={stats?.total_active_drafts} color="#FBBC04" icon={<DescriptionIcon fontSize="large" />} />
        </Grid>
        {user?.role === 'Admin' ? (
           <Grid item xs={12} sm={6} md={3}>
             <StatCard title="Pending Deletions" value={stats?.total_pending_deletions} color="#EA4335" icon={<CloseIcon fontSize="large" />} />
           </Grid>
        ) : (
           <Grid item xs={12} sm={6} md={3}>
             <StatCard title="Total Users" value={stats?.total_users} color="#00897B" icon={<Avatar fontSize="large" />} />
           </Grid>
        )}
      </Grid>

      {/* Charts Grid */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card sx={{ border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', borderRadius: 3, p: 2 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>Monthly Trend</Typography>
            <Box sx={{ width: '100%', height: 350 }}>
              {charts?.monthly_trend ? (
                <ResponsiveContainer>
                  <BarChart data={charts.monthly_trend} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8EAED" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Legend iconType="circle" />
                    <Bar dataKey="inward" name="Inward" fill="#1A73E8" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="outward" name="Outward" fill="#34A853" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Typography color="text.secondary">Loading chart...</Typography>
              )}
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', borderRadius: 3, p: 2, height: '100%' }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>Files by Folder</Typography>
            <Box sx={{ width: '100%', height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {charts?.by_folder ? (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={charts.by_folder} dataKey="inward" nameKey="folder_name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                      {charts.by_folder.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Typography color="text.secondary">Loading chart...</Typography>
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>
      
      {/* Second Row of Charts */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Card sx={{ border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', borderRadius: 3, p: 2 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>Files Created by User</Typography>
            <Box sx={{ width: '100%', height: 350 }}>
              {charts?.by_officer ? (
                <ResponsiveContainer>
                  <BarChart data={charts.by_officer} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8EAED" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Legend iconType="circle" />
                    <Bar dataKey="inward_count" name="Logged Inward" fill="#00897B" radius={[4, 4, 0, 0]} barSize={30} />
                    <Bar dataKey="outward_count" name="Prepared Outward" fill="#8E24AA" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Typography color="text.secondary">Loading chart...</Typography>
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>
      
      {/* Recent Activity */}
      <Card sx={{ border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', borderRadius: 3, p: 2, mb: 8 }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Recent Activity</Typography>
        <List>
          {charts?.recent_activity && charts.recent_activity.length > 0 ? (
            charts.recent_activity.map((activity, idx) => (
              <React.Fragment key={idx}>
                <ListItem sx={{ py: 2 }}>
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: '#E8F0FE', color: '#1A73E8' }}>
                      {activity.by.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body1">
                        <strong>{activity.by}</strong> performed <strong>{activity.action}</strong> on <strong>{activity.record_id}</strong>
                      </Typography>
                    }
                    secondary={new Date(activity.at).toLocaleString()}
                  />
                </ListItem>
                {idx < charts.recent_activity.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
              No recent activity found.
            </Typography>
          )}
        </List>
      </Card>
    </Box>
  );
}
