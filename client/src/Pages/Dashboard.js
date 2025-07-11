import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Avatar,
  Grid,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  IconButton,
  TextField,
  Tabs,
  Tab,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Snackbar,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Divider,
  Stack,
  Badge,
  LinearProgress
} from '@mui/material';
import {
  ExitToApp,
  Person,
  Security,
  CheckCircle,
  Link as LinkIcon,
  ContentCopy,
  Launch,
  Delete,
  Add,
  BarChart,
  Visibility,
  TrendingUp,
  Schedule,
  OpenInNew
} from '@mui/icons-material';
import { useAuth } from '../Contexts/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  
  // URL Shortener State
  const [originalUrl, setOriginalUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [urls, setUrls] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, shortCode: '', url: null });
  const [connectionStatus, setConnectionStatus] = useState('checking'); // checking, connected, failed

  const URL_API_BASE = 'http://localhost:8083/api';

  // Memoized functions to prevent unnecessary re-renders
  const showSnackbar = useCallback((message, severity) => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const getHeaders = useCallback(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      showSnackbar('Authentication required. Please login again.', 'warning');
      logout();
      navigate('/login');
      return {};
    }
    
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }, [showSnackbar, logout, navigate]);

  const checkServiceConnection = useCallback(async () => {
    try {
      const response = await fetch(`${URL_API_BASE}/health`);
      if (response.ok) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('failed');
        showSnackbar('URL service is not responding properly', 'warning');
      }
    } catch (error) {
      setConnectionStatus('failed');
      showSnackbar('Cannot connect to URL service. Please ensure it\'s running on port 8083.', 'error');
    }
  }, [URL_API_BASE, showSnackbar]);

  const fetchUrls = useCallback(async () => {
    try {
      const response = await fetch(`${URL_API_BASE}/urls?page=0&size=20&sortBy=createdAt&sortDirection=desc`, {
        headers: getHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setUrls(data.content || []);
      } else if (response.status === 401) {
        showSnackbar('Session expired. Please login again.', 'warning');
        logout();
        navigate('/login');
      } else {
        showSnackbar('Failed to load URLs', 'error');
      }
    } catch (error) {
      console.error('Error fetching URLs:', error);
      showSnackbar('Network error while loading URLs', 'error');
    }
  }, [URL_API_BASE, getHeaders, showSnackbar, logout, navigate]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${URL_API_BASE}/stats`, {
        headers: getHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else if (response.status === 401) {
        showSnackbar('Session expired. Please login again.', 'warning');
        logout();
        navigate('/login');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [URL_API_BASE, getHeaders, showSnackbar, logout, navigate]);

  const loadUrlData = useCallback(async () => {
    if (connectionStatus === 'failed') return;
    
    setDataLoading(true);
    await Promise.all([fetchUrls(), fetchStats()]);
    setDataLoading(false);
  }, [connectionStatus, fetchUrls, fetchStats]);

  // Fixed useEffect with proper dependencies
  useEffect(() => {
    if (activeTab === 1) { // URL Shortener tab
      checkServiceConnection();
      loadUrlData();
    }
  }, [activeTab, checkServiceConnection, loadUrlData]);

  const createShortUrl = async (e) => {
    e.preventDefault();
    if (!originalUrl.trim()) {
      showSnackbar('Please enter a valid URL', 'warning');
      return;
    }

    // URL validation
    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(originalUrl.trim())) {
      showSnackbar('URL must start with http:// or https://', 'warning');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        originalUrl: originalUrl.trim(),
        customAlias: customAlias.trim() || null
      };

      const response = await fetch(`${URL_API_BASE}/urls`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const newUrl = await response.json();
        setUrls(prevUrls => [newUrl, ...prevUrls]);
        setOriginalUrl('');
        setCustomAlias('');
        showSnackbar(`Short URL created: ${newUrl.shortCode}`, 'success');
        fetchStats(); // Refresh stats
      } else if (response.status === 401) {
        showSnackbar('Session expired. Please login again.', 'warning');
        logout();
        navigate('/login');
      } else {
        const errorData = await response.json();
        showSnackbar(errorData.message || 'Failed to create short URL', 'error');
      }
    } catch (error) {
      console.error('Error creating URL:', error);
      showSnackbar('Network error occurred', 'error');
    }
    setLoading(false);
  };

  const deleteUrl = async (shortCode) => {
    try {
      const response = await fetch(`${URL_API_BASE}/urls/${shortCode}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      if (response.ok) {
        setUrls(prevUrls => prevUrls.filter(url => url.shortCode !== shortCode));
        showSnackbar('URL deleted successfully', 'success');
        fetchStats(); // Refresh stats
      } else if (response.status === 401) {
        showSnackbar('Session expired. Please login again.', 'warning');
        logout();
        navigate('/login');
      } else {
        showSnackbar('Failed to delete URL', 'error');
      }
    } catch (error) {
      console.error('Error deleting URL:', error);
      showSnackbar('Network error occurred', 'error');
    }
    setDeleteDialog({ open: false, shortCode: '', url: null });
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showSnackbar('Copied to clipboard!', 'success');
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showSnackbar('Copied to clipboard!', 'success');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getClickRateColor = (clickCount) => {
    if (clickCount === 0) return 'default';
    if (clickCount < 10) return 'primary';
    if (clickCount < 100) return 'secondary';
    return 'success';
  };

  const isUrlExpiringSoon = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  };

  const isUrlExpired = (expiresAt) => {
    return new Date(expiresAt) < new Date();
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <LinkIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            LinkOps Dashboard
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
            <Typography variant="body1" sx={{ mr: 1 }}>
              {user?.username}
            </Typography>
            {connectionStatus === 'connected' && (
              <Badge color="success" variant="dot">
                <CheckCircle fontSize="small" />
              </Badge>
            )}
            {connectionStatus === 'failed' && (
              <Badge color="error" variant="dot">
                <Security fontSize="small" />
              </Badge>
            )}
          </Box>
          <IconButton color="inherit" onClick={handleLogout}>
            <ExitToApp />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Navigation Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
            <Tab 
              label="Dashboard" 
              icon={<Person />}
              sx={{ minHeight: 72 }}
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  URL Shortener
                  {stats && stats.totalUrls > 0 && (
                    <Chip 
                      label={stats.totalUrls} 
                      size="small" 
                      color="primary" 
                    />
                  )}
                </Box>
              }
              icon={<LinkIcon />}
              sx={{ minHeight: 72 }}
            />
          </Tabs>
        </Paper>

        {dataLoading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Dashboard Tab */}
        {activeTab === 0 && (
          <Grid container spacing={3}>
            {/* Welcome Section */}
            <Grid item xs={12}>
              <Paper
                sx={{
                  p: 3,
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                  color: 'white'
                }}
              >
                <Avatar sx={{ m: 1, bgcolor: 'white', color: 'primary.main', width: 56, height: 56 }}>
                  <Person fontSize="large" />
                </Avatar>
                <Box sx={{ ml: 2 }}>
                  <Typography variant="h4" gutterBottom>
                    Welcome back, {user?.username}!
                  </Typography>
                  <Typography variant="body1">
                    {user?.email}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                    Last login: {new Date().toLocaleString()}
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            {/* URL Stats Cards */}
            {stats && (
              <>
                <Grid item xs={12} md={3}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <LinkIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6">Total URLs</Typography>
                      </Box>
                      <Typography variant="h3" color="primary.main">
                        {stats.totalUrls || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        URLs created
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Visibility color="success" sx={{ mr: 1 }} />
                        <Typography variant="h6">Total Clicks</Typography>
                      </Box>
                      <Typography variant="h3" color="success.main">
                        {stats.totalClicks || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total redirects
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <CheckCircle color="success" sx={{ mr: 1 }} />
                        <Typography variant="h6">Active URLs</Typography>
                      </Box>
                      <Typography variant="h3" color="success.main">
                        {stats.activeUrls || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Currently active
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <TrendingUp color="warning" sx={{ mr: 1 }} />
                        <Typography variant="h6">Avg. Clicks</Typography>
                      </Box>
                      <Typography variant="h3" color="warning.main">
                        {stats.totalUrls > 0 ? Math.round((stats.totalClicks || 0) / stats.totalUrls) : 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Per URL
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </>
            )}

            {/* Status Cards */}
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CheckCircle color="success" sx={{ mr: 1 }} />
                    <Typography variant="h6">Authentication Status</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    You are successfully authenticated and can access all protected resources.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Security color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Security Features</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Your session is protected with JWT tokens and automatic refresh capabilities.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <LinkIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">URL Service</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Service Status: {connectionStatus === 'connected' ? '✅ Connected' : connectionStatus === 'failed' ? '❌ Disconnected' : '🔄 Checking...'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Action Buttons */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button variant="contained" color="primary">
                    Update Profile
                  </Button>
                  <Button variant="outlined" color="primary">
                    Change Password
                  </Button>
                  <Button 
                    variant="contained" 
                    color="secondary" 
                    onClick={() => setActiveTab(1)}
                    startIcon={<LinkIcon />}
                  >
                    Create Short URL
                  </Button>
                  <Button variant="outlined" color="error" onClick={handleLogout}>
                    Logout
                  </Button>
                </Box>
              </Paper>
            </Grid>

            {/* Session Info */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Session Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Login Time:
                    </Typography>
                    <Typography variant="body1">
                      {new Date().toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Session Type:
                    </Typography>
                    <Typography variant="body1">
                      JWT Token Based
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Service Status:
                    </Typography>
                    <Typography variant="body1">
                      {connectionStatus === 'connected' ? 'All Services Online' : 'Service Issues'}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* URL Shortener Tab */}
        {activeTab === 1 && (
          <Grid container spacing={3}>
            {/* Service Status Banner */}
            {connectionStatus === 'failed' && (
              <Grid item xs={12}>
                <Alert 
                  severity="warning" 
                  action={
                    <Button color="inherit" size="small" onClick={checkServiceConnection}>
                      Retry
                    </Button>
                  }
                >
                  URL Shortener service is not available. Please ensure it's running on port 8083.
                </Alert>
              </Grid>
            )}

            {/* Create URL Form */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  <Add sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Create Short URL
                </Typography>
                <Box component="form" onSubmit={createShortUrl} sx={{ mt: 2 }}>
                  <TextField
                    fullWidth
                    label="Enter your long URL"
                    placeholder="https://example.com/very-long-url"
                    value={originalUrl}
                    onChange={(e) => setOriginalUrl(e.target.value)}
                    required
                    sx={{ mb: 2 }}
                    type="url"
                    disabled={connectionStatus === 'failed'}
                    error={originalUrl && !originalUrl.match(/^https?:\/\/.+/)}
                    helperText={originalUrl && !originalUrl.match(/^https?:\/\/.+/) ? "URL must start with http:// or https://" : ""}
                  />
                  <TextField
                    fullWidth
                    label="Custom alias (optional)"
                    placeholder="my-custom-link"
                    value={customAlias}
                    onChange={(e) => setCustomAlias(e.target.value)}
                    helperText="Leave empty for random short code. Only letters, numbers, hyphens and underscores allowed."
                    sx={{ mb: 3 }}
                    disabled={connectionStatus === 'failed'}
                    inputProps={{
                      pattern: "^[a-zA-Z0-9-_]*$",
                      maxLength: 20
                    }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading || connectionStatus === 'failed'}
                    startIcon={loading ? <CircularProgress size={20} /> : <LinkIcon />}
                    fullWidth
                  >
                    {loading ? 'Creating...' : 'Shorten URL'}
                  </Button>
                </Box>
              </Paper>
            </Grid>

            {/* Stats Panel */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  <BarChart sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Your Stats
                </Typography>
                {stats ? (
                  <Stack spacing={2}>
                    <Box textAlign="center">
                      <Typography variant="h3" color="primary.main">
                        {stats.totalUrls || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total URLs
                      </Typography>
                    </Box>
                    <Box textAlign="center">
                      <Typography variant="h3" color="success.main">
                        {stats.totalClicks || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Clicks
                      </Typography>
                    </Box>
                    <Divider />
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      Active URLs: {stats.activeUrls || 0}
                    </Typography>
                    {stats.totalUrls > 0 && (
                      <Typography variant="body2" color="text.secondary" textAlign="center">
                        Avg: {Math.round((stats.totalClicks || 0) / stats.totalUrls)} clicks/URL
                      </Typography>
                    )}
                  </Stack>
                ) : (
                  <Box textAlign="center" py={2}>
                    <CircularProgress size={24} />
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* URL List */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Your URLs ({urls.length})
                </Typography>
                {urls.length === 0 ? (
                  <Box textAlign="center" py={4}>
                    <LinkIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography color="text.secondary" variant="h6">
                      No URLs created yet
                    </Typography>
                    <Typography color="text.secondary">
                      Create your first short URL above to get started!
                    </Typography>
                  </Box>
                ) : (
                  <List>
                    {urls.map((url) => (
                      <React.Fragment key={url.id}>
                        <ListItem sx={{ py: 2 }}>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Typography variant="h6" component="span" color="primary.main">
                                  {url.shortUrl}
                                </Typography>
                                <Chip
                                  icon={<Visibility />}
                                  label={`${url.clickCount || 0} clicks`}
                                  size="small"
                                  color={getClickRateColor(url.clickCount)}
                                  variant="outlined"
                                />
                                {isUrlExpiringSoon(url.expiresAt) && (
                                  <Chip
                                    icon={<Schedule />}
                                    label="Expiring Soon"
                                    size="small"
                                    color="warning"
                                  />
                                )}
                                {isUrlExpired(url.expiresAt) && (
                                  <Chip
                                    label="Expired"
                                    size="small"
                                    color="error"
                                  />
                                )}
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ 
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    maxWidth: '100%',
                                    mb: 1
                                  }}
                                >
                                  → {url.originalUrl}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                                  <Typography variant="caption" color="text.secondary">
                                    <Schedule sx={{ fontSize: 12, mr: 0.5 }} />
                                    Created: {formatDate(url.createdAt)}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Expires: {formatDate(url.expiresAt)}
                                  </Typography>
                                  {url.customAlias && (
                                    <Chip label="Custom" size="small" variant="outlined" />
                                  )}
                                </Box>
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="Copy Short URL">
                                <IconButton
                                  onClick={() => copyToClipboard(url.shortUrl)}
                                  color="primary"
                                  size="small"
                                >
                                  <ContentCopy />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Open Original URL">
                                <IconButton
                                  onClick={() => window.open(url.originalUrl, '_blank')}
                                  color="secondary"
                                  size="small"
                                >
                                  <Launch />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Test Short URL">
                                <IconButton
                                  onClick={() => window.open(url.shortUrl, '_blank')}
                                  color="info"
                                  size="small"
                                >
                                  <OpenInNew />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete URL">
                                <IconButton
                                  onClick={() => setDeleteDialog({ 
                                    open: true, 
                                    shortCode: url.shortCode, 
                                    url: url 
                                  })}
                                  color="error"
                                  size="small"
                                >
                                  <Delete />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </ListItemSecondaryAction>
                        </ListItem>
                        <Divider />
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </Paper>
            </Grid>
          </Grid>
        )}
      </Container>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, shortCode: '', url: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Short URL</DialogTitle>
        <DialogContent>
          {deleteDialog.url && (
            <Box>
              <Typography gutterBottom>
                Are you sure you want to delete this short URL?
              </Typography>
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="body2" color="primary">
                  <strong>{deleteDialog.url.shortUrl}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  → {deleteDialog.url.originalUrl}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {deleteDialog.url.clickCount || 0} clicks • Created {formatDate(deleteDialog.url.createdAt)}
                </Typography>
              </Box>
              <Alert severity="warning" sx={{ mt: 2 }}>
                This action cannot be undone. All click statistics will be lost.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, shortCode: '', url: null })}>
            Cancel
          </Button>
          <Button
            onClick={() => deleteUrl(deleteDialog.shortCode)}
            color="error"
            variant="contained"
          >
            Delete URL
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard;