import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  CircularProgress,
  Divider,
  Paper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import HistoryIcon from '@mui/icons-material/History';

export default function EditHistoryModal({ open, onClose, recordType, recordId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && recordType && recordId) {
      fetchLogs();
    }
  }, [open, recordType, recordId]);

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`/api/outward/edit-log/${recordType}/${recordId}`);
      setLogs(res.data);
    } catch (err) {
      setError('Failed to fetch edit history.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action) => {
    switch(action.toLowerCase()) {
      case 'create': return 'success.main';
      case 'edit': return 'primary.main';
      case 'lock': return 'warning.main';
      case 'unlock': return 'info.main';
      case 'dispatch': return 'secondary.main';
      case 'reupload': return 'success.light';
      default: return 'grey.500';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon />
          <Typography variant="h6">Edit History</Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" align="center">{error}</Typography>
        ) : logs.length === 0 ? (
          <Typography align="center" color="text.secondary">No edit history found for this record.</Typography>
        ) : (
          <Box sx={{ p: 2 }}>
            {logs.map((log, index) => (
              <Paper key={index} variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2, borderLeft: `6px solid`, borderLeftColor: getActionColor(log.action) }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ textTransform: 'capitalize', fontWeight: 'bold' }}>
                    {log.action}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(log.edited_at).toLocaleString()}
                  </Typography>
                </Box>
                <Typography variant="body2">
                  By: <strong>{log.edited_by}</strong>
                </Typography>
                {log.changes && Object.keys(log.changes).length > 0 && (
                  <Box sx={{ mt: 1, p: 1, bgcolor: '#f8fafc', borderRadius: 1 }}>
                    <Typography variant="caption" component="pre" sx={{ m: 0, overflowX: 'auto' }}>
                      {JSON.stringify(log.changes, null, 2)}
                    </Typography>
                  </Box>
                )}
              </Paper>
            ))}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
