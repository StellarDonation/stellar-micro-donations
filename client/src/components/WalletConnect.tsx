import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import { AccountBalanceWallet } from '@mui/icons-material';
import stellarService from '../services/stellarService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface WalletConnectProps {
  open: boolean;
  onClose: () => void;
  onConnect: (publicKey: string, secretKey: string) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`wallet-tabpanel-${index}`}
      aria-labelledby={`wallet-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const WalletConnect: React.FC<WalletConnectProps> = ({ open, onClose, onConnect }) => {
  const [tabValue, setTabValue] = useState(0);
  const [secretKey, setSecretKey] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newAccount, setNewAccount] = useState<{ publicKey: string; secretKey: string } | null>(null);

  const { user } = useAuth();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError('');
  };

  const handleImportWallet = async () => {
    if (!secretKey.trim()) {
      setError('Secret key is required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Validate secret key and derive public key
      const keypair = StellarSdk.Keypair.fromSecret(secretKey);
      const derivedPublicKey = keypair.publicKey();

      // Check if account exists on network
      await stellarService.getAccountBalance(derivedPublicKey);

      setPublicKey(derivedPublicKey);
      onConnect(derivedPublicKey, secretKey);
      toast.success('Wallet connected successfully!');
      onClose();
    } catch (error: any) {
      setError('Invalid secret key or account not found on network');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWallet = async () => {
    try {
      setLoading(true);
      setError('');

      const account = stellarService.createAccount();
      setNewAccount(account);

      // Fund testnet account if on testnet
      if (process.env.REACT_APP_STELLAR_NETWORK === 'testnet') {
        await stellarService.fundTestnetAccount(account.publicKey);
        toast.success('Testnet account funded successfully!');
      }

      onConnect(account.publicKey, account.secretKey);
      onClose();
    } catch (error: any) {
      setError('Failed to create wallet: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSecretKey('');
    setPublicKey('');
    setNewAccount(null);
    setError('');
    setTabValue(0);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <AccountBalanceWallet sx={{ mr: 2 }} />
          Connect Stellar Wallet
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Import Existing Wallet" />
            <Tab label="Create New Wallet" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="body2" color="text.secondary" paragraph>
            Enter your Stellar secret key to connect your existing wallet.
          </Typography>
          
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <TextField
            fullWidth
            label="Secret Key"
            type="password"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            margin="normal"
            helperText="Your secret key starts with 'S'"
          />

          {publicKey && (
            <Paper sx={{ p: 2, mt: 2, bgcolor: 'grey.100' }}>
              <Typography variant="body2" color="text.secondary">
                Public Key:
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {publicKey}
              </Typography>
            </Paper>
          )}

          <Alert severity="warning" sx={{ mt: 2 }}>
            Never share your secret key with anyone! Store it securely.
          </Alert>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="body2" color="text.secondary" paragraph>
            Create a new Stellar wallet. Your secret key will be generated automatically.
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {newAccount && (
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                New Wallet Created!
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Public Key:
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', mb: 2 }}>
                {newAccount.publicKey}
              </Typography>
              
              <Alert severity="error">
                <Typography variant="body2" fontWeight="bold">
                  IMPORTANT: Save your secret key securely!
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', mt: 1 }}>
                  {newAccount.secretKey}
                </Typography>
              </Alert>
            </Paper>
          )}

          <Alert severity="info">
            A new wallet will be created on the {process.env.REACT_APP_STELLAR_NETWORK || 'testnet'} network.
            {process.env.REACT_APP_STELLAR_NETWORK === 'testnet' && ' It will be automatically funded with test XLM.'}
          </Alert>
        </TabPanel>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        {tabValue === 0 ? (
          <Button
            onClick={handleImportWallet}
            variant="contained"
            disabled={loading || !secretKey.trim()}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Connecting...' : 'Connect Wallet'}
          </Button>
        ) : (
          <Button
            onClick={handleCreateWallet}
            variant="contained"
            disabled={loading || !!newAccount}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Creating...' : 'Create Wallet'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default WalletConnect;
