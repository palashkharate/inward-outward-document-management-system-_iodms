import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Autocomplete,
  Box,
  Grid,
  MenuItem,
  TextField,
  Typography
} from '@mui/material';

const currentYear = new Date().getFullYear();

export default function DocumentLinkPicker({
  value,
  onChange,
  folders = [],
  excludeId = ''
}) {
  const [documents, setDocuments] = useState([]);
  const [filters, setFilters] = useState({
    docType: 'all',
    year: currentYear,
    number: '',
    folderId: '',
    party: '',
    subject: '',
    query: ''
  });

  useEffect(() => {
    const timeout = setTimeout(async () => {
      const params = {
        query: filters.query || undefined,
        doc_type: filters.docType,
        year: filters.year || undefined,
        number: filters.number || undefined,
        folder_id: filters.folderId || undefined,
        party: filters.party || undefined,
        subject: filters.subject || undefined,
        exclude_id: excludeId || undefined,
        limit: 50
      };
      const res = await axios.get('/api/dashboard/search-documents', { params });
      setDocuments(res.data);
    }, 250);

    return () => clearTimeout(timeout);
  }, [filters, excludeId]);

  const selectedDocs = useMemo(
    () => value.map(id => documents.find(d => d.id === id) || id),
    [documents, value]
  );

  const setFilter = (key, nextValue) => {
    setFilters(prev => ({ ...prev, [key]: nextValue }));
  };

  const optionLabel = (option) => {
    if (typeof option === 'string') {
      const doc = documents.find(d => d.id === option);
      return doc ? doc.label : option;
    }
    return option.label || option.id;
  };

  return (
    <Box sx={{ border: '1px solid #E8EAED', borderRadius: 2, p: 2 }}>
      <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
        <Grid item xs={12} sm={2}>
          <TextField
            select
            fullWidth
            size="small"
            label="Type"
            value={filters.docType}
            onChange={(e) => setFilter('docType', e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="inward">Inward</MenuItem>
            <MenuItem value="outward">Outward</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={6} sm={2}>
          <TextField
            fullWidth
            size="small"
            type="number"
            label="Year"
            value={filters.year}
            onChange={(e) => setFilter('year', e.target.value)}
          />
        </Grid>
        <Grid item xs={6} sm={2}>
          <TextField
            fullWidth
            size="small"
            label="Number"
            value={filters.number}
            onChange={(e) => setFilter('number', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            select
            fullWidth
            size="small"
            label="Folder"
            value={filters.folderId}
            onChange={(e) => setFilter('folderId', e.target.value)}
          >
            <MenuItem value="">All folders</MenuItem>
            {folders.map(folder => (
              <MenuItem key={folder.folder_id} value={folder.folder_id}>
                {folder.folder_id}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            size="small"
            label="Party Name"
            value={filters.party}
            onChange={(e) => setFilter('party', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            size="small"
            label="Subject"
            value={filters.subject}
            onChange={(e) => setFilter('subject', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            size="small"
            label="Quick Search"
            value={filters.query}
            onChange={(e) => setFilter('query', e.target.value)}
          />
        </Grid>
      </Grid>

      <Autocomplete
        multiple
        options={documents}
        getOptionLabel={optionLabel}
        value={selectedDocs}
        onChange={(event, newValue) => {
          onChange(newValue.map(v => typeof v === 'string' ? v : v.id));
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            label="Link to existing documents"
            placeholder="Filter by year, number, folder, party, or subject"
          />
        )}
        renderOption={(props, option) => (
          <li {...props}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography variant="body2" fontWeight={700}>
                {option.label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {option.date}
              </Typography>
            </Box>
          </li>
        )}
      />
    </Box>
  );
}
