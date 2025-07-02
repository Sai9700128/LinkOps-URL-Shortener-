import React from 'react';
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
  IconButton
} from '@mui/material';
import { ExitToApp, Person, Security, CheckCircle } from '@mui/icons-material';
import { useAuth } from '../Contexts/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Authentication Dashboard
          </Typography>
          <IconButton color="inherit" onClick={handleLogout}>
            <ExitToApp />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
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
                  Welcome, {user?.username}!
                </Typography>
                <Typography variant="body1">
                  {user?.email}
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Status Cards */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CheckCircle color="success" sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Authentication Status
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  You are successfully authenticated and can access protected resources.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Security color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Security Features
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Your session is protected with JWT tokens and automatic refresh.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Person color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    User Profile
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Manage your account settings and preferences.
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
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button variant="contained" color="primary">
                  Update Profile
                </Button>
                <Button variant="outlined" color="primary">
                  Change Password
                </Button>
                <Button variant="outlined" color="secondary" onClick={handleLogout}>
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
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Login Time:
                  </Typography>
                  <Typography variant="body1">
                    {new Date().toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Session Type:
                  </Typography>
                  <Typography variant="body1">
                    JWT Token Based
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Dashboard;