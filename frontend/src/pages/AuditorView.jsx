import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Button,
  AppBar,
  Toolbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  MenuItem,
  Pagination,
  Grid,
  Chip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function AuditorView() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [year, setYear] = useState(new Date().getFullYear());
  
  // Available years from 2006 (legacy migration) to current year + 1
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2006 + 2 }, (_, i) => 2006 + i).reverse();

  // Inward State
  const [inwardData, setInwardData] = useState([]);
  const [inwardTotal, setInwardTotal] = useState(0);
  const [inwardPage, setInwardPage] = useState(1);
  const [searchInwardAssign, setSearchInwardAssign] = useState('');
  const [searchInwardFrom, setSearchInwardFrom] = useState('');
  const [searchInwardSubject, setSearchInwardSubject] = useState('');

  // Outward State
  const [outwardData, setOutwardData] = useState([]);
  const [outwardTotal, setOutwardTotal] = useState(0);
  const [outwardPage, setOutwardPage] = useState(1);
  const [searchOutwardFolder, setSearchOutwardFolder] = useState('');
  const [searchOutwardPrep, setSearchOutwardPrep] = useState('');
  const [searchOutwardTo, setSearchOutwardTo] = useState('');
  const [searchOutwardSubject, setSearchOutwardSubject] = useState('');

  // FR-006: Suppress Right-Click Context Menu
  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();
    };
    document.addEventListener('contextmenu', handleContextMenu);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  // Fetch Inward Data
  const fetchInward = async () => {
    try {
      const response = await axios.get('/api/auditor/inward', {
        params: {
          year,
          page: inwardPage,
          limit: 10,
          search_assign_to: searchInwardAssign || undefined,
          search_received_from: searchInwardFrom || undefined,
          search_subject: searchInwardSubject || undefined
        }
      });
      setInwardData(response.data.results);
      setInwardTotal(response.data.total);
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Outward Data
  const fetchOutward = async () => {
    try {
      const response = await axios.get('/api/auditor/outward', {
        params: {
          year,
          page: outwardPage,
          limit: 10,
          search_folder_id: searchOutwardFolder || undefined,
          search_prepared_by: searchOutwardPrep || undefined,
          search_address_to: searchOutwardTo || undefined,
          search_subject: searchOutwardSubject || undefined
        }
      });
      setOutwardData(response.data.results);
      setOutwardTotal(response.data.total);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeTab === 0) {
      fetchInward();
    } else {
      fetchOutward();
    }
  }, [activeTab, year, inwardPage, outwardPage]);

  // Handle Search Trigger
  const triggerSearch = () => {
    setInwardPage(1);
    setOutwardPage(1);
    if (activeTab === 0) {
      fetchInward();
    } else {
      fetchOutward();
    }
  };

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' }} className="auditor-no-select">
      {/* FR-005: Diagonal Watermark */}
      <div className="auditor-watermark">
        <div className="auditor-watermark-text">CONFIDENTIAL – VIEW ONLY</div>
      </div>

      {/* Header AppBar */}
      <AppBar position="static" sx={{ bgcolor: '#B91C1C', color: '#FFFFFF', borderBottom: '1px solid #D1D5DB', boxShadow: 'none' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* FR-007: Back to Login Button */}
            <Button
              variant="outlined"
              color="primary"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/')}
              sx={{ borderRadius: 2, color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.1)' } }}
            >
              Back to Login
            </Button>
            <Typography variant="h6" fontWeight={700} sx={{ display: { xs: 'none', sm: 'block' } }}>
              AUDITOR PORTAL
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="body2" color="rgba(255,255,255,0.8)">
              Filter Year:
            </Typography>
            <TextField
              select
              size="small"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              sx={{ width: 110, bgcolor: '#FFFFFF', borderRadius: 1 }}
            >
              {years.map((y) => (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Tabs Menu (FR-001) */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 2, display: 'flex', justifyContent: 'center' }}>
        <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)} textColor="primary" indicatorColor="primary">
          <Tab label="Inward Register" sx={{ fontWeight: 600, fontSize: '0.95rem', px: 4 }} />
          <Tab label="Outward Register" sx={{ fontWeight: 600, fontSize: '0.95rem', px: 4 }} />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <Box sx={{ p: 3, flexGrow: 1 }}>
        {activeTab === 0 ? (
          // Inward Register Tab (FR-001, FR-002)
          <Box>
            {/* Inward Search panel */}
            <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Assign To"
                  value={searchInwardAssign}
                  onChange={(e) => setSearchInwardAssign(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Received From"
                  value={searchInwardFrom}
                  onChange={(e) => setSearchInwardFrom(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Subject"
                  value={searchInwardSubject}
                  onChange={(e) => setSearchInwardSubject(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <Button fullWidth variant="contained" onClick={triggerSearch} sx={{ borderRadius: 2 }}>
                  Search
                </Button>
              </Grid>
            </Grid>

            {/* Inward Table */}
            <TableContainer component={Paper} sx={{ border: '1px solid #D1D5DB' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Inward No.</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Date of Receipt</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Letter Ref No.</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Letter Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Folder ID</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Received From</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Originated By</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Assign To</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inwardData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                        No inward records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    inwardData.map((row) => (
                      <TableRow key={row.inward_no} sx={{ opacity: row.is_pending_deletion ? 0.4 : 1 }}>
                        <TableCell fontWeight={600}>{row.inward_no}</TableCell>
                        <TableCell>{row.receiving_date}</TableCell>
                        <TableCell>{row.inward_letter_no || '-'}</TableCell>
                        <TableCell>{row.inward_date || '-'}</TableCell>
                        <TableCell>{row.folder_id}</TableCell>
                        <TableCell>{row.received_from || '-'}</TableCell>
                        <TableCell>{row.originated_by || '-'}</TableCell>
                        <TableCell>{row.subject}</TableCell>
                        <TableCell>
                          {row.assign_to.map((u) => (
                            <Chip key={u} label={u} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                          ))}
                        </TableCell>
                        <TableCell>{row.document_type}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <Pagination
                count={Math.ceil(inwardTotal / 10)}
                page={inwardPage}
                onChange={(e, val) => setInwardPage(val)}
                color="primary"
              />
            </Box>
          </Box>
        ) : (
          // Outward Register Tab (FR-001, FR-002)
          <Box>
            {/* Outward Search panel */}
            <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
              <Grid item xs={12} sm={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Folder ID"
                  value={searchOutwardFolder}
                  onChange={(e) => setSearchOutwardFolder(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Prepared By"
                  value={searchOutwardPrep}
                  onChange={(e) => setSearchOutwardPrep(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Address To"
                  value={searchOutwardTo}
                  onChange={(e) => setSearchOutwardTo(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Subject"
                  value={searchOutwardSubject}
                  onChange={(e) => setSearchOutwardSubject(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <Button fullWidth variant="contained" onClick={triggerSearch} sx={{ borderRadius: 2 }}>
                  Search
                </Button>
              </Grid>
            </Grid>

            {/* Outward Table */}
            <TableContainer component={Paper} sx={{ border: '1px solid #D1D5DB' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Outward No.</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Folder ID</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Folder Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Issuing Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Prepared By</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Address To</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>CC To</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {outwardData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                        No outward records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    outwardData.map((row) => (
                      <TableRow key={row.outward_no} sx={{ opacity: row.is_pending_deletion ? 0.4 : 1 }}>
                        <TableCell fontWeight={600}>{row.outward_no}</TableCell>
                        <TableCell>{row.folder_id}</TableCell>
                        <TableCell>{row.folder_name}</TableCell>
                        <TableCell>{row.issuing_date}</TableCell>
                        <TableCell>{row.prepared_by}</TableCell>
                        <TableCell>{row.address_to_names.join(', ')}</TableCell>
                        <TableCell>{row.cc_to_names.join(', ')}</TableCell>
                        <TableCell>{row.subject}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <Pagination
                count={Math.ceil(outwardTotal / 10)}
                page={outwardPage}
                onChange={(e, val) => setOutwardPage(val)}
                color="primary"
              />
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}
