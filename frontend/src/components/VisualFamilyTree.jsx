import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, Box, Typography, CircularProgress, Paper, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import axios from 'axios';

// Recursive Tree Node Component
const TreeNode = ({ nodeId, nodes, edges, visited = new Set(), depth = 0 }) => {
  if (visited.has(nodeId)) return null; // Prevent cycles in display
  visited.add(nodeId);

  const nodeData = nodes.find(n => n.id === nodeId);
  if (!nodeData) return null;

  // Find all children (outgoing edges)
  const childrenIds = edges.filter(e => e.source === nodeId).map(e => e.target);

  return (
    <Box sx={{ ml: depth === 0 ? 0 : 4, mt: 1, position: 'relative' }}>
      {/* Visual connector line for children */}
      {depth > 0 && (
        <Box sx={{
          position: 'absolute',
          left: -20,
          top: 24,
          width: 20,
          height: 2,
          bgcolor: '#1A73E8',
          opacity: 0.5
        }} />
      )}
      {depth > 0 && (
        <Box sx={{
          position: 'absolute',
          left: -20,
          top: -16,
          width: 2,
          height: 40,
          bgcolor: '#1A73E8',
          opacity: 0.5
        }} />
      )}

      <Paper 
        elevation={nodeData.isRoot ? 4 : 1} 
        sx={{ 
          p: 1.5, 
          display: 'inline-block',
          borderLeft: nodeData.isRoot ? '4px solid #EA4335' : '4px solid #1A73E8',
          bgcolor: nodeData.isRoot ? '#FFF8F6' : '#F8FAFF',
          minWidth: 200,
          maxWidth: 300,
          mb: childrenIds.length > 0 ? 1 : 0
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#202124' }}>
          {nodeData.label}
        </Typography>
        <Typography variant="body2" sx={{ color: '#5F6368', fontSize: '0.75rem', mt: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {nodeData.title}
        </Typography>
        <Typography variant="caption" sx={{ color: '#1A73E8', display: 'block', mt: 0.5 }}>
          {nodeData.sender}
        </Typography>
      </Paper>

      {/* Render Children */}
      {childrenIds.length > 0 && (
        <Box sx={{ borderLeft: '2px solid rgba(26, 115, 232, 0.2)', ml: 2.5, mt: 0.5 }}>
          {childrenIds.map(childId => (
            <TreeNode 
              key={childId} 
              nodeId={childId} 
              nodes={nodes} 
              edges={edges} 
              visited={new Set(visited)} 
              depth={depth + 1} 
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default function VisualFamilyTree({ open, onClose, docId }) {
  const [loading, setLoading] = useState(true);
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && docId) {
      setLoading(true);
      const urlDocId = docId.replace(/:/g, '/'); // Convert inward:Su-30:2026:001 to inward/Su-30/2026/001
      axios.get(`/api/dashboard/network-graph/${urlDocId}`)
        .then(res => {
          // Process graph to filter out reverse edges for cleaner tree view
          // Since it's bidirectional, A->B and B->A exist. We only want to show it as a tree originating from root.
          const processedEdges = [];
          const seenPairs = new Set();
          
          res.data.edges.forEach(e => {
            const pair1 = `${e.source}->${e.target}`;
            const pair2 = `${e.target}->${e.source}`;
            if (!seenPairs.has(pair2)) {
               processedEdges.push(e);
               seenPairs.add(pair1);
            }
          });

          setGraphData({ nodes: res.data.nodes, edges: processedEdges });
          setLoading(false);
        })
        .catch(err => {
          setError('Failed to load connection graph.');
          setLoading(false);
        });
    }
  }, [open, docId]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E0E0E0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccountTreeIcon sx={{ color: '#1A73E8' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Document Connections Network</Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ minHeight: 400, bgcolor: '#F8F9FA', p: 4, overflowX: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" align="center">{error}</Typography>
        ) : (
          <Box sx={{ p: 2 }}>
            <TreeNode 
              nodeId={docId} 
              nodes={graphData.nodes} 
              edges={graphData.edges} 
            />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
