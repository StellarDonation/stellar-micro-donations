import React from 'react';
import {
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Container
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      title: 'Cross-Border Donations',
      description: 'Send micro-donations instantly across borders using Stellar blockchain technology.',
      icon: '🌍'
    },
    {
      title: 'Low Fees',
      description: 'Enjoy minimal transaction fees compared to traditional payment systems.',
      icon: '💰'
    },
    {
      title: 'Real-Time Updates',
      description: 'Get instant notifications when donations are received and processed.',
      icon: '⚡'
    },
    {
      title: 'Secure & Transparent',
      description: 'All transactions are recorded on the Stellar blockchain for full transparency.',
      icon: '🔒'
    }
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 8 }}>
        {/* Hero Section */}
        <Box textAlign="center" mb={8}>
          <Typography variant="h2" component="h1" gutterBottom>
            🌟 Stellar Micro-Donations
          </Typography>
          <Typography variant="h5" color="text.secondary" paragraph>
            Empowering creators with instant, cross-border micro-donations
          </Typography>
          
          {!user && (
            <Box mt={4}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/register')}
                sx={{ mr: 2 }}
              >
                Get Started
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/login')}
              >
                Login
              </Button>
            </Box>
          )}

          {user && (
            <Box mt={4}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard
              </Button>
            </Box>
          )}
        </Box>

        {/* Features Section */}
        <Typography variant="h4" component="h2" textAlign="center" mb={6}>
          Why Choose Stellar Donations?
        </Typography>
        
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box textAlign="center" mb={2}>
                    <Typography variant="h3">{feature.icon}</Typography>
                  </Box>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* CTA Section */}
        <Box textAlign="center" mt={8} p={4} sx={{ backgroundColor: 'grey.100', borderRadius: 2 }}>
          <Typography variant="h4" component="h2" gutterBottom>
            Ready to Start Your Journey?
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Join thousands of creators and donors already using Stellar for instant micro-donations.
          </Typography>
          {!user && (
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/register')}
            >
              Create Your Account
            </Button>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default Home;
