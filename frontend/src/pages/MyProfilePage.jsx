import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  Chip,
  Divider
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import KeyIcon from '@mui/icons-material/Key';
import PendingIcon from '@mui/icons-material/Pending';
import { useAuth } from '../App.jsx';

export default function MyProfilePage() {
  const { user } = useAuth();
  
  // Profile Fields
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  
  // Password Fields (FR-154)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`/api/auth/profile/${user.user_id}`);
      setProfile(res.data);
      setName(res.data.name);
      setDob(res.data.dob);
    } catch (e) {
      setErrorMsg('Failed to load profile details.');
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    try {
      // FR-151: Request profile edits (sent to pending_profile_edits table)
      await axios.put(`/api/auth/profile/${user.user_id}`, {
        name,
        dob
      });
      setSuccessMsg('Profile updates submitted. Awaiting Admin approval.');
      fetchProfile(); // reload to get pending changes badge
    } catch (err) {
      setErrorMsg('Failed to submit profile update.');
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirmation do not match.');
      return;
    }

    try {
      // FR-154: Update password directly
      await axios.put(`/api/auth/profile/${user.user_id}/password`, {
        current_password: currentPassword,
        new_password: newPassword
      });
      setSuccessMsg('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to change password. Make sure current password is correct.');
    }
  };

  if (!profile) return null;

  return (
    <Box sx={{ width: '100%', maxWidth: 900, mt: 2 }}>
      <Typography variant="h5" fontWeight={800} sx={{ mb: 3 }}>
        My Officer Profile
      </Typography>

      {successMsg && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{successMsg}</Alert>}
      {errorMsg && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{errorMsg}</Alert>}

      <Grid container spacing={4}>
        {/* Left Side: General Profile Form (FR-150, FR-151) */}
        <Grid item xs={12} md={6}>
          <Card sx={{ border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                Personnel Details
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
                Edits to Name and Date of Birth require Admin approval before taking effect.
              </Typography>

              {/* FR-152: Pending changes indicator badge */}
              {profile.pending_changes && (
                <Alert
                  icon={<PendingIcon />}
                  severity="info"
                  sx={{ mb: 3, borderRadius: 2, '& .MuiAlert-message': { width: '100%' } }}
                >
                  <Typography variant="body2" fontWeight={600}>
                    Change Pending Approval:
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Proposed Name: "{profile.pending_changes.name}"<br />
                    Proposed DOB: {profile.pending_changes.dob}
                  </Typography>
                </Alert>
              )}

              <Box component="form" onSubmit={handleUpdateProfile}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="User ID"
                      value={profile.user_id}
                      disabled
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Personnel Book (PB) No."
                      value={profile.pb_no}
                      disabled
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      required
                      fullWidth
                      label="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      required
                      fullWidth
                      type="date"
                      label="Date of Birth"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Security Role"
                      value={profile.role}
                      disabled
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sx={{ mt: 1 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<SaveIcon />}
                      fullWidth
                    >
                      Request Profile Update
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Side: Change Password Form (FR-154) */}
        <Grid item xs={12} md={6}>
          <Card sx={{ border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                Update Password
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
                Change your security credentials. Takes effect immediately.
              </Typography>

              <Box component="form" onSubmit={handleUpdatePassword}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      required
                      fullWidth
                      type="password"
                      label="Current Password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      required
                      fullWidth
                      type="password"
                      label="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      required
                      fullWidth
                      type="password"
                      label="Confirm New Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sx={{ mt: 3 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="secondary"
                      startIcon={<KeyIcon />}
                      fullWidth
                    >
                      Change Password
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
