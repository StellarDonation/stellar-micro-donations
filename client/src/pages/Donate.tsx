import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useQuery } from 'react-query';
import { userAPI, donationAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface DonateFormData {
  amount: string;
  message: string;
  isAnonymous: boolean;
}

const Donate: React.FC = () => {
  const { creatorId } = useParams<{ creatorId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');

  const { control, handleSubmit, formState: { errors } } = useForm<DonateFormData>();

  const { data: creator, isLoading: creatorLoading } = useQuery(
    ['creator', creatorId],
    () => userAPI.getCreator(creatorId!),
    { enabled: !!creatorId }
  );

  const { data: balance } = useQuery(
    'balance',
    () => authAPI.getBalance(),
    { enabled: !!user }
  );

  const onSubmit = async (data: DonateFormData) => {
    if (!creator || !user) return;

    try {
      setIsProcessing(true);
      setError('');

      const donationData = {
        creatorId: creatorId,
        amount: parseFloat(data.amount),
        message: data.message,
        isAnonymous: data.isAnonymous,
        currency: 'XLM'
      };

      const response = await donationAPI.createDonation(donationData);
      
      toast.success('Donation sent successfully!');
      navigate(`/creator/${creatorId}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Donation failed');
      toast.error('Donation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (creatorLoading) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 8, textAlign: 'center' }}>
          <CircularProgress />
          <Typography>Loading creator information...</Typography>
        </Box>
      </Container>
    );
  }

  if (!creator) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 8 }}>
          <Alert severity="error">Creator not found</Alert>
        </Box>
      </Container>
    );
  }

  const xlmBalance = balance?.data?.balances?.find((b: any) => b.asset_code === 'XLM')?.balance || '0';

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4 }}>
        <Grid container spacing={4}>
          {/* Creator Info */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Creator Information
              </Typography>
              <Box textAlign="center" mb={2}>
                <Typography variant="h5">
                  {creator.data.profile?.displayName || creator.data.username}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  @{creator.data.username}
                </Typography>
              </Box>
              
              {creator.data.profile?.bio && (
                <Typography variant="body2" paragraph>
                  {creator.data.profile.bio}
                </Typography>
              )}

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" color="text.secondary" gutterBottom>
                Statistics
              </Typography>
              <Typography variant="body2">
                Total Received: {creator.data.statistics?.totalReceived.toFixed(7) || '0'} XLM
              </Typography>
              <Typography variant="body2">
                Donations: {creator.data.statistics?.donationCount || 0}
              </Typography>
              <Typography variant="body2">
                Donors: {creator.data.statistics?.donorCount || 0}
              </Typography>
            </Paper>
          </Grid>

          {/* Donation Form */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Make a Donation
              </Typography>

              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Your Balance: {parseFloat(xlmBalance).toFixed(7)} XLM
                </Typography>
              </Box>

              <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                <Controller
                  name="amount"
                  control={control}
                  defaultValue=""
                  rules={{
                    required: 'Amount is required',
                    pattern: {
                      value: /^[0-9]*\.?[0-9]+$/,
                      message: 'Please enter a valid amount'
                    },
                    validate: value => {
                      const amount = parseFloat(value);
                      return amount > 0 || 'Amount must be greater than 0';
                    }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Amount (XLM)"
                      type="number"
                      inputProps={{ step: '0.0000001', min: '0.0000001' }}
                      error={!!errors.amount}
                      helperText={errors.amount?.message}
                      sx={{ mb: 2 }}
                    />
                  )}
                />

                <Controller
                  name="message"
                  control={control}
                  defaultValue=""
                  rules={{
                    maxLength: {
                      value: 500,
                      message: 'Message must be less than 500 characters'
                    }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Message (Optional)"
                      multiline
                      rows={3}
                      error={!!errors.message}
                      helperText={errors.message?.message || `${field.value?.length || 0}/500 characters`}
                      sx={{ mb: 2 }}
                    />
                  )}
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Network fees will be deducted from the amount
                  </Typography>
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isProcessing}
                  startIcon={isProcessing ? <CircularProgress size={20} /> : null}
                >
                  {isProcessing ? 'Processing...' : 'Send Donation'}
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Donate;
