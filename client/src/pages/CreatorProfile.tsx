import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Avatar,
  IconButton
} from '@mui/material';
import { Share, Favorite, Message } from '@mui/icons-material';
import { useQuery } from 'react-query';
import { userAPI, donationAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { io, Socket } from 'socket.io-client';

const CreatorProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [socket, setSocket] = useState<Socket | null>(null);

  const { data: creator, isLoading: creatorLoading } = useQuery(
    ['creator', id],
    () => userAPI.getCreator(id!),
    { enabled: !!id }
  );

  const { data: donations } = useQuery(
    ['creator-donations', id],
    () => donationAPI.getDonations(id!),
    { enabled: !!id }
  );

  useEffect(() => {
    if (id && user) {
      const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:3001');
      setSocket(newSocket);

      newSocket.emit('join-creator-room', id);

      newSocket.on('new-donation', (donation) => {
        toast.success(`New donation received: ${donation.amount} XLM!`);
      });

      return () => {
        newSocket.emit('leave-creator-room', id);
        newSocket.disconnect();
      };
    }
  }, [id, user]);

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Profile link copied to clipboard!');
  };

  const handleDonate = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/donate/${id}`);
  };

  if (creatorLoading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography>Loading profile...</Typography>
        </Box>
      </Container>
    );
  }

  if (!creator) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6">Creator not found</Typography>
        </Box>
      </Container>
    );
  }

  const creatorData = creator.data;

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4 }}>
        {/* Profile Header */}
        <Paper sx={{ p: 4, mb: 4 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Avatar
                sx={{ width: 80, height: 80, bgcolor: 'primary.main' }}
                src={creatorData.profile?.avatar}
              >
                {creatorData.profile?.displayName?.[0] || creatorData.username[0].toUpperCase()}
              </Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant="h4" gutterBottom>
                {creatorData.profile?.displayName || creatorData.username}
              </Typography>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                @{creatorData.username}
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Chip
                  label={creatorData.role}
                  color="primary"
                  size="small"
                  sx={{ mr: 1 }}
                />
                {creatorData.isVerified && (
                  <Chip label="Verified" color="success" size="small" />
                )}
              </Box>
              {creatorData.profile?.bio && (
                <Typography variant="body1" paragraph>
                  {creatorData.profile.bio}
                </Typography>
              )}
              
              {/* Social Links */}
              {creatorData.profile?.socialLinks && (
                <Box sx={{ mt: 2 }}>
                  {Object.entries(creatorData.profile.socialLinks).map(([platform, link]) => (
                    link && (
                      <Button
                        key={platform}
                        size="small"
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ mr: 1, mb: 1 }}
                      >
                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </Button>
                    )
                  ))}
                </Box>
              )}
            </Grid>
            <Grid item>
              <Box sx={{ textAlign: 'center' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleDonate}
                  sx={{ mb: 2 }}
                >
                  Donate Now
                </Button>
                <Box>
                  <IconButton onClick={handleShare}>
                    <Share />
                  </IconButton>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Statistics */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Total Received
                </Typography>
                <Typography variant="h4">
                  {creatorData.statistics?.totalReceived.toFixed(7) || '0'} XLM
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Donations
                </Typography>
                <Typography variant="h4">
                  {creatorData.statistics?.donationCount || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Donors
                </Typography>
                <Typography variant="h4">
                  {creatorData.statistics?.donorCount || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Recent Donations */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Recent Donations
          </Typography>
          <List>
            {donations?.data?.donations?.length > 0 ? (
              donations.data.donations.map((donation: any, index: number) => (
                <React.Fragment key={donation._id}>
                  <ListItem alignItems="flex-start">
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="h6">
                            {donation.isAnonymous ? 'Anonymous' : donation.donorId?.username}
                          </Typography>
                          <Typography variant="h6" color="primary">
                            {donation.amount.toFixed(7)} XLM
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box>
                          {donation.message && (
                            <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                              "{donation.message}"
                            </Typography>
                          )}
                          <Typography variant="caption" color="text.secondary">
                            {new Date(donation.createdAt).toLocaleDateString()} at {new Date(donation.createdAt).toLocaleTimeString()}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < donations.data.donations.length - 1 && <Divider />}
                </React.Fragment>
              ))
            ) : (
              <ListItem>
                <ListItemText
                  primary="No donations yet"
                  secondary="Be the first to support this creator!"
                />
              </ListItem>
            )}
          </List>
        </Paper>
      </Box>
    </Container>
  );
};

export default CreatorProfile;
