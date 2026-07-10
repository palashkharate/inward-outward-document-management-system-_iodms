import React from 'react';
import { Card, CardContent, Grid, TextField, MenuItem, Box } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

export default function UnifiedSearchBar({ 
  searchField, 
  setSearchField, 
  searchQuery, 
  setSearchQuery, 
  fieldOptions = [],
  dropdownOptions = null
}) {
  const selectedField = fieldOptions.find(o => o.value === searchField);
  const selectedLabel = selectedField?.label || 'Search';

  return (
    <Card sx={{ mb: 3, border: '1px solid #E8EAED', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
      <CardContent sx={{ p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Choose Search Field"
              value={searchField}
              onChange={(e) => {
                setSearchField(e.target.value);
                setSearchQuery('');
              }}
            >
              {fieldOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          
          <Grid item xs={12} sm={8} md={9}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {dropdownOptions && dropdownOptions[searchField] ? (
                <TextField
                  select
                  fullWidth
                  size="small"
                  label={`Search by ${selectedLabel}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                >
                  <MenuItem value="">-- All --</MenuItem>
                  {dropdownOptions[searchField].map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </TextField>
              ) : (
                <TextField
                  fullWidth
                  size="small"
                  label={`Search by ${selectedLabel}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
                  }}
                />
              )}
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
