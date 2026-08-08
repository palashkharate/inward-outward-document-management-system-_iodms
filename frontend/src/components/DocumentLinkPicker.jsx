import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Autocomplete,
  Box,
  Chip,
  Grid,
  MenuItem,
  TextField,
  Typography
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LinkIcon from '@mui/icons-material/Link';

const currentYear = new Date().getFullYear();

// FR-171: Linked Documents picker wrapped in a soft, collapsible accordion.
// Collapsed by default to save screen space on both Inward and Outward forms.
// Shows a count badge so users know at a glance how many documents are linked.
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

  // FR-171: Debounced search — waits 250ms after user stops typing,
  // then fetches matching documents from the backend search API
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

  // FR-171: Map selected document IDs back to their full objects for display
  const selectedDocs = useMemo(
    () => value.map(id => documents.find(d => d.id === id) || id),
    [documents, value]
  );

  // FR-171: Helper to update a single filter key without losing other filter values
  const setFilter = (key, nextValue) => {
    setFilters(prev => ({ ...prev, [key]: nextValue }));
  };

  // FR-171: Get a human-readable label for each option in the autocomplete dropdown
  const optionLabel = (option) => {
    if (typeof option === 'string') {
      const doc = documents.find(d => d.id === option);
      return doc ? doc.label : option;
    }
    return option.label || option.id;
  };

  return (
    <Accordion
      disableGutters
      elevation={0}
      sx={{
        border: '1px solid #E8EAED',
        borderRadius: '8px !important',
        '&::before': { display: 'none' },
        transition: 'box-shadow 200ms ease',
        '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }
      }}
    >
      {/* FR-171: Accordion header — shows link icon, title, and count badge */}
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          minHeight: 48,
          px: 2,
          '& .MuiAccordionSummary-content': {
            alignItems: 'center',
            gap: 1
          }
        }}
      >
        <LinkIcon sx={{ color: 'primary.main', fontSize: 20 }} />
        <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
          Linked Documents
        </Typography>
        <Chip
          label={value.length}
          size="small"
          color={value.length > 0 ? 'primary' : 'default'}
          sx={{ ml: 0.5, height: 22, fontSize: '0.75rem', fontWeight: 700 }}
        />
      </AccordionSummary>

      {/* FR-171: Expanded content — filter fields and autocomplete picker */}
      <AccordionDetails sx={{ px: 2, pb: 2, pt: 0 }}>
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
              placeholder="Search and select documents to link"
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
      </AccordionDetails>
    </Accordion>
  );
}
