import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper
} from '@mui/material';
import { AccountBalanceWallet, Send, Receive, TrendingUp } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { authAPI, donationAPI } from '../services/api';
import { useQuery } from 'react-query';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const { data: balance } = useQuery(
    'balance',
    authAPI.getBalance,
    { enabled: !!user }
  );

  const { data: donations } = useQuery(
    'user-donations',
    () => donationAPI.getUserDonations(user!.id, 'received'),
    { enabled: !!user }
  );

  const { data: transactions } = useQuery(
    'transactions',
    () => authAPI.getTransactions(5),
    { enabled: !!user }
  );

  if (!user) return null;

  const xlmBalance = balance?.data?.balances?.find((b: any) => b.asset_code === 'XLM')?.balance || '0';

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AccountBalanceWallet color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    XLM Balance
                  </Typography>
                  <Typography variant="h6">
                    {parseFloat(xlmBalance).toFixed(7)} XLM
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Receive color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Received
                  </Typography>
                  <Typography variant="h6">
                    {user.statistics?.totalReceived.toFixed(7) || '0'} XLM
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Send color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Donated
                  </Typography>
                  <Typography variant="h6">
                    {user.statistics?.totalDonated.toFixed(7) || '0'} XLM
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUp color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Donations Count
                  </Typography>
                  <Typography variant="h6">
                    {user.statistics?.donationCount || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        {/* Recent Donations */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Donations Received
            </Typography>
            <List>
              {donations?.data?.donations?.length > 0 ? (
                donations.data.donations.slice(0, 5).map((donation: any, index: number) => (
                  <React.Fragment key={donation._id}>
                    <ListItem>
                      <ListItemText
                        primary={`${donation.amount.toFixed(7)} XLM`}
                        secondary={
                          donation.message 
                            ? `${donation.message} - ${new Date(donation.createdAt).toLocaleDateString()}`
                            : new Date(donation.createdAt).toLocaleDateString()
                        }
                      />
                    </ListItem>
                    {index < 4 && <Divider />}
                  </React.Fragment>
                ))
              ) : (
                <ListItem>
                  <ListItemText
                    primary="No donations received yet"
                    secondary="Share your profile to start receiving donations!"
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Recent Transactions */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Transactions
            </Typography>
            <List>
              {transactions?.data?.transactions?.length > 0 ? (
                transactions.data.transactions.map((tx: any, index: number) => (
                  <React.Fragment key={tx.id}>
                    <ListItem>
                      <ListItemText
                        primary={tx.id}
                        secondary={`${new Date(tx.created_at).toLocaleDateString()} - ${tx.successful ? 'Success' : 'Failed'}`}
                      />
                    </ListItem>
                    {index < 4 && <Divider />}
                  </React.Fragment>
                ))
              ) : (
                <ListItem>
                  <ListItemText
                    primary="No transactions yet"
                    secondary="Your transaction history will appear here"
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Account Info */}
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Account Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              Stellar Public Key
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {user.stellarPublicKey}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              Account Type
            </Typography>
            <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
              {user.role}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default Dashboard;
