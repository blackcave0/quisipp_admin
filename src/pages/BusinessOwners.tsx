import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  CircularProgress,
  Snackbar,
  Alert,
  Chip,
  Grid,
  Card,
  CardContent,
  Divider,
  Link,
  Container,
  Stack,
  Tooltip,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles'; // Import alpha for custom color shades
// import {Grid} from '@mui/material/Grid'; // legacy Grid (supports item/container)


import {
  Edit as EditIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  VpnKey as VpnKeyIcon,
  Verified as VerifiedIcon,
  VerifiedUser as VerifiedUserIcon,
  Store as StoreIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationOnIcon,
  Category as CategoryIcon,
  Business as BusinessIcon,
  Description as DocumentIcon,
  CameraAlt as SelfieIcon,
  InsertDriveFile as PanIcon,
  Badge as AadharIcon,
  VideoCameraFront as VideoIcon,
  Collections as CollectionsIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { businessOwnerService } from '../services/api'; // Assuming this import path is correct
import AdminKeyDialog from '../components/auth/AdminKeyDialog'; // Assuming this import path is correct

interface BusinessOwnerDocument {
  number?: string;
  imageUrl?: string;
  publicId?: string;
  verified?: boolean;
  url?: string;
}

interface BusinessOwnerDocuments {
  aadhar?: BusinessOwnerDocument;
  license?: BusinessOwnerDocument;
  pan?: BusinessOwnerDocument;
  selfie?: BusinessOwnerDocument;
  video?: BusinessOwnerDocument;
}

interface BusinessImage {
  url: string;
  publicId: string;
}

interface BusinessOwner {
  _id: string;
  auth0Id?: string;
  email: string;
  businessName?: string;
  phoneNumber?: string;
  address?: string;
  lastActive?: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
  isVerified?: boolean;
  rating?: number;
  documents?: BusinessOwnerDocuments;
  businessOwnerDetails?: BusinessOwnerDetails;
  deliveryPartnerDetails?: Record<string, unknown>;
  businessLocation?: Record<string, unknown>;
  categories?: string[];
  businessAddress?: string;
  pincode?: string;
  businessType?: string;
  gstin?: string;
  businessImages?: BusinessImage[];
  businessVideo?: BusinessOwnerDocument;
  [key: string]: unknown;
}

interface BusinessOwnerDetails {
  businessName?: string;
  businessAddress?: string;
  pincode?: string;
  gstin?: string;
  categories?: string[];
  businessImages?: BusinessImage[];
  businessVideo?: BusinessOwnerDocument;
}

// Ensure FormData matches the expected payload for create/update operations
interface FormData {
  email: string;
  businessName: string;
  phoneNumber: string;
  address: string;
  [key: string]: string | number | boolean | undefined; // Keep index signature for flexibility
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
}

const BusinessOwners = () => {
  const [businessOwners, setBusinessOwners] = useState<BusinessOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingOwner, setEditingOwner] = useState<BusinessOwner | null>(null);
  const [selectedOwner, setSelectedOwner] = useState<BusinessOwner | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    businessName: '',
    phoneNumber: '',
    address: '',
  });
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [adminKeyDialogOpen, setAdminKeyDialogOpen] = useState(false);

  // ---- PASSWORD STATE -------
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const theme = useTheme();

  const fetchBusinessOwners = async () => {
    try {
      setLoading(true);
      const response = await businessOwnerService.getAllBusinessOwners();

      console.log(response);
      let ownersArray: BusinessOwner[] = [];

      if (response.data && response.data.businessOwners) {
        const ownersData = response.data.businessOwners;

        if (Array.isArray(ownersData)) {
          ownersArray = ownersData;
        } else if (ownersData && typeof ownersData === 'object') {
          if (ownersData.data && Array.isArray(ownersData.data)) {
            ownersArray = ownersData.data;
          } else {
            const values = Object.values(ownersData);
            for (const value of values) {
              if (Array.isArray(value)) {
                ownersArray = value;
                break;
              }
            }
          }
        }
      }

      setBusinessOwners(ownersArray);
      setLoading(false);
    } catch (error: unknown) {
      console.error('Error fetching business owners:', error);
      setLoading(false);

      let errorMessage = 'Failed to load business owners.';
      let showAdminKeyDialog = true;

      const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
      if (axiosError.response?.status === 429) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
        showAdminKeyDialog = false;
      } else if (axiosError.response?.status === 401) {
        errorMessage = 'Admin key may be required or invalid.';
      } else if (axiosError.response?.data?.message) {
        errorMessage = axiosError.response.data.message;
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });

      if (showAdminKeyDialog) {
        setAdminKeyDialogOpen(true);
      }

      setBusinessOwners([]);
    }
  };

  useEffect(() => {
    fetchBusinessOwners();
  }, []);

  const handleAdminKeySave = () => {
    fetchBusinessOwners();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleAddNew = () => {
    setEditingOwner(null);
    setFormData({
      email: '',
      businessName: '',
      phoneNumber: '',
      address: '',
    });
    setOpenDialog(true);
  };

  const handleEdit = (owner: BusinessOwner) => {
    if (!owner._id) {
      setSnackbar({
        open: true,
        message: 'Cannot edit this business owner - missing ID',
        severity: 'error',
      });
      return;
    }

    // The backend expects top-level fields, so flatten from businessOwnerDetails as fallback
    setEditingOwner(owner);
    setFormData({
      email: owner.email || '',
      businessName: owner.businessOwnerDetails?.businessName || owner.businessName || '',
      phoneNumber: owner.phoneNumber || '',
      address: owner.businessOwnerDetails?.businessAddress || owner.businessAddress || owner.address || '',
    });
    setOpenDialog(true);
  };

  const handleViewDetails = (owner: BusinessOwner) => {
    setSelectedOwner(owner);
    setDetailsDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingOwner) {
        console.log('Updating business owner:', editingOwner._id, formData);

        const response = await businessOwnerService.updateBusinessOwner(editingOwner._id, formData);

        console.log('Update response:', response);

        // Update the local state with the updated business owner
        setBusinessOwners(businessOwners.map(owner =>
          owner._id === editingOwner._id
            ? {
              ...owner,
              ...formData, // Update top-level fields
              // Also update nested businessOwnerDetails if they mirror formData
              businessOwnerDetails: {
                ...owner.businessOwnerDetails,
                businessName: formData.businessName,
                businessAddress: formData.address,
              }
            }
            : owner
        ));

        setSnackbar({
          open: true,
          message: 'Business owner updated successfully',
          severity: 'success',
        });
      } else {
        console.log('Creating business owner:', formData);

        const response = await businessOwnerService.createBusinessOwner(formData);

        console.log('Create response:', response);

        // Add the new business owner to the list
        if (response.data && response.data.businessOwner) {
          setBusinessOwners([...businessOwners, response.data.businessOwner]);
        }

        setSnackbar({
          open: true,
          message: 'Business owner created successfully',
          severity: 'success',
        });
      }

      setOpenDialog(false);
      setEditingOwner(null);
      setFormData({
        email: '',
        businessName: '',
        phoneNumber: '',
        address: '',
      });
    } catch (error) {
      console.error('Error saving business owner:', error);

      // Extract error message from response if available
      let errorMessage = 'Failed to save business owner';
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    }
  };


  // -- PASSWORD DIALOG ---
  const handleOpenpasswordDialog = (owner: BusinessOwner) => {
    if (!owner._id) {
      setSnackbar({
        open: true,
        message: 'Cannot change password for this business owner - missing ID',
        severity: 'error',
      })
      return;
    }

    setEditingOwner(owner);
    setPassword('') // clear previous password
    setConfirmPassword('')
    setPasswordDialogOpen(true);
  }

  // --- ADD THIS NEW FUNCTION TO HANDLE THE SUBMISSION ---
  const handlePasswordSubmit = async () => {
    if (!editingOwner) {
      setSnackbar({ open: true, message: 'No owner selected.', severity: 'error' });
      return;
    }

    if (!password || password.length < 6) {
      setSnackbar({ open: true, message: 'Password must be at least 6 characters long.', severity: 'error' });
      return;
    }

    if (password !== confirmPassword) {
      setSnackbar({ open: true, message: 'Passwords do not match.', severity: 'error' });
      return;
    }

    try {
      // Call the API service function we created earlier
      await businessOwnerService.setPasswordForBusinessOwner(editingOwner._id, password);

      setSnackbar({
        open: true,
        message: 'Password set successfully!',
        severity: 'success',
      });

      setPasswordDialogOpen(false); // Close the dialog on success
      setEditingOwner(null);       // Clear the selected owner

    } catch (error) {
      console.error('Error setting password:', error);
      let errorMessage = 'Failed to set password.';
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      }
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    }
  };

  const handleToggleStatus = async (owner: BusinessOwner) => {
    if (!owner._id) {
      setSnackbar({
        open: true,
        message: 'Cannot update status - missing ID',
        severity: 'error',
      });
      return;
    }

    try {
      await businessOwnerService.updateBusinessOwnerVerification(owner._id, !owner.isVerified);

      // Update local state
      setBusinessOwners(prev => 
        prev.map(o => 
          o._id === owner._id 
            ? { ...o, isVerified: !o.isVerified } 
            : o
        )
      );

      setSnackbar({
        open: true,
        message: `Status updated to ${!owner.isVerified ? 'Verified' : 'Pending'}`,
        severity: 'success',
      });
    } catch (error) {
      console.error('Error updating status:', error);
      let errorMessage = 'Failed to update status.';
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      }
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress size={60} color="primary" />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1" fontWeight="bold" color="text.primary">
          Business Owners Management
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            onClick={fetchBusinessOwners}
            startIcon={<RefreshIcon />}
            sx={{
              borderColor: theme.palette.grey[400],
              color: theme.palette.grey[700],
              '&:hover': {
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
              },
            }}
          >
            Refresh Data
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddNew}
            sx={{
              bgcolor: theme.palette.primary.main,
              '&:hover': {
                bgcolor: theme.palette.primary.dark,
              },
              boxShadow: theme.shadows[3],
            }}
          >
            Add New Owner
          </Button>
        </Stack>
      </Stack>

      <Divider sx={{ mb: 4 }} />

      <TableContainer component={Paper} elevation={4} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Table sx={{ minWidth: 650 }} aria-label="business owners table">
          <TableHead sx={{ bgcolor: theme.palette.primary.main }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.common.white }}>Business Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.common.white }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.common.white }}>Phone</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.common.white }}>Business Type</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.common.white }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.common.white }}>Created On</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.common.white }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {businessOwners.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4, color: theme.palette.text.secondary }}>
                  <Typography variant="subtitle1">
                    No business owners found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              businessOwners.map((owner, index) => (
                <TableRow key={owner._id || `owner-${index}`} hover>
                  <TableCell>
                    {owner.businessOwnerDetails && typeof owner.businessOwnerDetails.businessName === 'string' && owner.businessOwnerDetails.businessName.trim() !== ''
                      ? owner.businessOwnerDetails.businessName
                      : 'N/A'}
                  </TableCell>
                  <TableCell>{owner.email}</TableCell>
                  <TableCell>{owner.phoneNumber || 'N/A'}</TableCell>
                  <TableCell>{owner.businessType || 'N/A'}</TableCell>
                  <TableCell>
                    {owner.isVerified ? (
                      <Chip
                        icon={<VerifiedIcon fontSize="small" />}
                        label="Verified"
                        color="success"
                        size="small"
                        variant="outlined"
                        sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.dark, borderColor: theme.palette.success.light }}
                      />
                    ) : (
                      <Chip
                        label="Pending"
                        color="warning"
                        size="small"
                        variant="outlined"
                        sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), color: theme.palette.warning.dark, borderColor: theme.palette.warning.light }}
                      />
                    )}
                  </TableCell>
                  <TableCell>{formatDate(owner.createdAt)}</TableCell>
                  <TableCell>
                    <IconButton
                      color="info"
                      onClick={() => handleViewDetails(owner)}
                      size="small"
                      aria-label="view details"
                      sx={{ '&:hover': { color: theme.palette.info.dark } }}
                    >
                      <StoreIcon />
                    </IconButton>
                    <IconButton
                      color="primary"
                      onClick={() => handleEdit(owner)}
                      size="small"
                      aria-label="edit owner"
                      sx={{ ml: 1, '&:hover': { color: theme.palette.primary.dark } }}
                    >
                      <EditIcon />
                    </IconButton>

                    {/* --- ADD THE NEW "SET PASSWORD" BUTTON HERE --- */}
                    <IconButton
                      color="secondary"
                      onClick={() => handleOpenpasswordDialog(owner)}
                      size="small"
                      aria-label="set password"
                      sx={{ ml: 1, '&:hover': { color: theme.palette.secondary.dark } }}
                    >
                      <VpnKeyIcon />
                    </IconButton>
                    {/* --- END OF NEW BUTTON --- */}

                    <Tooltip title={owner.isVerified ? 'Mark as Pending' : 'Verify Business Owner'} arrow>
                      <IconButton
                        color={owner.isVerified ? 'error' : 'success'}
                        onClick={() => handleToggleStatus(owner)}
                        size="small"
                        aria-label={owner.isVerified ? 'mark pending' : 'verify'}
                        sx={{ ml: 1 }}
                      >
                        {owner.isVerified ? <CloseIcon /> : <CheckIcon />}
                      </IconButton>
                    </Tooltip>

                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: theme.palette.primary.main, color: theme.palette.common.white, py: 2, px: 3 }}>
          <Typography variant="h6" component="span" fontWeight="bold">
            {editingOwner ? 'Edit Business Owner' : 'Add New Business Owner'}
          </Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              fullWidth
              required
              variant="outlined"
              size="medium"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Business Name"
              name="businessName"
              value={formData.businessName}
              onChange={handleInputChange}
              fullWidth
              variant="outlined"
              size="medium"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Phone Number"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              fullWidth
              variant="outlined"
              size="medium"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              size="medium"
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
          <Button onClick={() => setOpenDialog(false)} variant="outlined" color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained" color="primary" sx={{ px: 4 }}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- ADD THE NEW "SET PASSWORD" DIALOG JSX HERE --- */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ bgcolor: theme.palette.secondary.main, color: theme.palette.common.white, py: 2, px: 3 }}>
          <Typography variant="h6" component="span" fontWeight="bold">
            Set Password for {editingOwner?.businessOwnerDetails?.businessName || editingOwner?.email}
          </Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="New Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
              variant="outlined"
              autoFocus
            />
            <TextField
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              fullWidth
              required
              variant="outlined"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
          <Button onClick={() => setPasswordDialogOpen(false)} variant="outlined" color="inherit">
            Cancel
          </Button>
          <Button onClick={handlePasswordSubmit} variant="contained" color="secondary" sx={{ px: 4 }}>
            Set Password
          </Button>
        </DialogActions>
      </Dialog>
      {/* --- END OF NEW DIALOG --- */}

      {/* Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedOwner && (
          <>
            <DialogTitle sx={{ bgcolor: theme.palette.primary.dark, color: theme.palette.common.white, py: 2, px: 3 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="h6" component="span" fontWeight="bold">
                  {selectedOwner.businessOwnerDetails?.businessName || selectedOwner.businessName || 'Business Owner Details'}
                </Typography>
                {selectedOwner.isVerified && (
                  <Chip
                    icon={<VerifiedUserIcon fontSize="small" />}
                    label="Verified"
                    color="success"
                    size="small"
                    sx={{ bgcolor: theme.palette.success.main, color: theme.palette.common.white }}
                  />
                )}
              </Stack>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 4 }}>
              <Grid container spacing={4}>
                {/* Basic Information */}
                <Grid size={{ xs: 12 }}> {/* Corrected: Grid  */}
                  <Card variant="outlined" sx={{ borderRadius: 2, p: 2, bgcolor: theme.palette.background.default }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary.main" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                        <BusinessIcon sx={{ verticalAlign: 'middle', mr: 1, fontSize: 28 }} /> Basic Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}> {/* Corrected: Grid  */}
                          <Stack spacing={1.5}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <EmailIcon color="action" sx={{ mr: 1, fontSize: 20 }} />
                              <Typography variant="body1" color="text.secondary">{selectedOwner.email}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <PhoneIcon color="action" sx={{ mr: 1, fontSize: 20 }} />
                              <Typography variant="body1" color="text.secondary">{selectedOwner.phoneNumber || 'N/A'}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                              <LocationOnIcon color="action" sx={{ mr: 1, mt: 0.5, fontSize: 20 }} />
                              <Typography variant="body1" color="text.secondary">
                                {(selectedOwner.businessOwnerDetails?.businessAddress as string) || selectedOwner.businessAddress || selectedOwner.address || 'N/A'}
                                {selectedOwner.businessOwnerDetails?.pincode ? ` - ${selectedOwner.businessOwnerDetails.pincode}` : ''}
                              </Typography>
                            </Box>
                          </Stack>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}> {/* Corrected: Grid item */}
                          <Stack spacing={1.5}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <StoreIcon color="action" sx={{ mr: 1, fontSize: 20 }} />
                              <Typography variant="body1" color="text.secondary">
                                Type: {selectedOwner.businessType || 'N/A'}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <CategoryIcon color="action" sx={{ mr: 1, fontSize: 20 }} />
                              <Typography variant="body1" color="text.secondary">
                                Categories: {selectedOwner.businessOwnerDetails?.categories &&
                                  Array.isArray(selectedOwner.businessOwnerDetails.categories) ?
                                  (selectedOwner.businessOwnerDetails.categories as string[]).join(', ') : 'N/A'}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="body1" color="text.secondary" sx={{ ml: 3 }}>
                                GSTIN: {(selectedOwner.businessOwnerDetails?.gstin as string) || 'N/A'}
                              </Typography>
                            </Box>
                          </Stack>
                        </Grid>
                      </Grid>
                      <Divider sx={{ my: 3 }} />
                      <Stack spacing={0.5} sx={{ color: theme.palette.text.disabled }}>
                        <Typography variant="caption">
                          Created: {formatDate(selectedOwner.createdAt)}
                        </Typography>
                        <Typography variant="caption">
                          Last Updated: {formatDate(selectedOwner.updatedAt)}
                        </Typography>
                        {selectedOwner.auth0Id && (
                          <Typography variant="caption">
                            Auth0 ID: {selectedOwner.auth0Id}
                          </Typography>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Documents Section */}
                {selectedOwner.documents && (
                  <Grid size={{ xs: 12 }}> {/* Corrected: Grid item */}
                    <Typography variant="h6" gutterBottom color="primary.main" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                      <DocumentIcon sx={{ verticalAlign: 'middle', mr: 1, fontSize: 28 }} /> Verification Documents
                    </Typography>
                    <Grid container spacing={3}>
                      {selectedOwner.documents.aadhar?.imageUrl && (
                        <Grid size={{ xs: 12, md: 4, sm: 6 }}> {/* Corrected: Grid item */}
                          <Card variant="outlined" sx={{ borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
                              <AadharIcon sx={{ fontSize: 48, color: theme.palette.info.main, mb: 1.5 }} />
                              <Typography variant="h6" gutterBottom align="center" fontWeight="medium">Aadhar Card</Typography>
                              <Box sx={{ mt: 1, p: 1, border: `1px solid ${theme.palette.grey[300]}`, borderRadius: 1, mb: 1.5, width: '100%', maxWidth: 200, display: 'flex', justifyContent: 'center' }}>
                                <img
                                  src={selectedOwner.documents.aadhar.imageUrl}
                                  alt="Aadhar Card"
                                  style={{ maxWidth: '100%', maxHeight: 120, borderRadius: 4, objectFit: 'contain' }}
                                />
                              </Box>
                              {selectedOwner.documents.aadhar.number && (
                                <Typography variant="body2" color="text.secondary" align="center">
                                  Number: {selectedOwner.documents.aadhar.number}
                                </Typography>
                              )}
                              <Link href={selectedOwner.documents.aadhar.imageUrl} target="_blank" rel="noopener" mt={1.5} sx={{ fontWeight: 'medium' }}>
                                View Full Image
                              </Link>
                            </CardContent>
                          </Card>
                        </Grid>
                      )}

                      {selectedOwner.documents.license?.imageUrl && (
                        <Grid size={{ xs: 12, md: 4, sm: 6 }}> {/* Corrected: Grid item */}
                          <Card variant="outlined" sx={{ borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
                              <DocumentIcon sx={{ fontSize: 48, color: theme.palette.warning.main, mb: 1.5 }} />
                              <Typography variant="h6" gutterBottom align="center" fontWeight="medium">Shop License</Typography>
                              <Box sx={{ mt: 1, p: 1, border: `1px solid ${theme.palette.grey[300]}`, borderRadius: 1, mb: 1.5, width: '100%', maxWidth: 200, display: 'flex', justifyContent: 'center' }}>
                                <img
                                  src={selectedOwner.documents.license.imageUrl}
                                  alt="Shop License"
                                  style={{ maxWidth: '100%', maxHeight: 120, borderRadius: 4, objectFit: 'contain' }}
                                />
                              </Box>
                              {selectedOwner.documents.license.number && (
                                <Typography variant="body2" color="text.secondary" align="center">
                                  Number: {selectedOwner.documents.license.number}
                                </Typography>
                              )}
                              <Link href={selectedOwner.documents.license.imageUrl} target="_blank" rel="noopener" mt={1.5} sx={{ fontWeight: 'medium' }}>
                                View Full Image
                              </Link>
                            </CardContent>
                          </Card>
                        </Grid>
                      )}

                      {selectedOwner.documents.pan?.imageUrl && (
                        <Grid size={{ xs: 12, md: 4, sm: 6 }}> {/* Corrected: Grid item */}
                          <Card variant="outlined" sx={{ borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
                              <PanIcon sx={{ fontSize: 48, color: theme.palette.error.main, mb: 1.5 }} />
                              <Typography variant="h6" gutterBottom align="center" fontWeight="medium">PAN Card</Typography>
                              <Box sx={{ mt: 1, p: 1, border: `1px solid ${theme.palette.grey[300]}`, borderRadius: 1, mb: 1.5, width: '100%', maxWidth: 200, display: 'flex', justifyContent: 'center' }}>
                                <img
                                  src={selectedOwner.documents.pan.imageUrl}
                                  alt="PAN Card"
                                  style={{ maxWidth: '100%', maxHeight: 120, borderRadius: 4, objectFit: 'contain' }}
                                />
                              </Box>
                              {selectedOwner.documents.pan.number && (
                                <Typography variant="body2" color="text.secondary" align="center">
                                  Number: {selectedOwner.documents.pan.number}
                                </Typography>
                              )}
                              <Link href={selectedOwner.documents.pan.imageUrl} target="_blank" rel="noopener" mt={1.5} sx={{ fontWeight: 'medium' }}>
                                View Full Image
                              </Link>
                            </CardContent>
                          </Card>
                        </Grid>
                      )}

                      {selectedOwner.documents.selfie?.imageUrl && (
                        <Grid size={{ xs: 12, md: 4, sm: 6 }}> {/* Corrected: Grid item */}
                          <Card variant="outlined" sx={{ borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
                              <SelfieIcon sx={{ fontSize: 48, color: theme.palette.success.main, mb: 1.5 }} />
                              <Typography variant="h6" gutterBottom align="center" fontWeight="medium">Owner Photo</Typography>
                              <Box sx={{ mt: 1, p: 1, border: `1px solid ${theme.palette.grey[300]}`, borderRadius: 1, mb: 1.5, width: '100%', maxWidth: 200, display: 'flex', justifyContent: 'center' }}>
                                <img
                                  src={selectedOwner.documents.selfie.imageUrl}
                                  alt="Owner Selfie"
                                  style={{ maxWidth: '100%', maxHeight: 120, borderRadius: 4, objectFit: 'contain' }}
                                />
                              </Box>
                              <Link href={selectedOwner.documents.selfie.imageUrl} target="_blank" rel="noopener" mt={1.5} sx={{ fontWeight: 'medium' }}>
                                View Full Image
                              </Link>
                            </CardContent>
                          </Card>
                        </Grid>
                      )}
                    </Grid>
                  </Grid>
                )}

                {/* Business Images */}
                {Array.isArray(selectedOwner.businessOwnerDetails?.businessImages) && selectedOwner.businessOwnerDetails.businessImages.length > 0 && (
                  <Grid size={{ xs: 12 }}> {/* Corrected: Grid item */}
                    <Typography variant="h6" gutterBottom color="primary.main" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                      <CollectionsIcon sx={{ verticalAlign: 'middle', mr: 1, fontSize: 28 }} /> Business Images
                    </Typography>
                    <Grid container spacing={3}>
                      {(selectedOwner.businessOwnerDetails.businessImages as BusinessImage[]).map((image, idx) => (
                        <Grid size={{ xs: 12, md: 4, sm: 6 }} key={idx}> {/* Corrected: Grid item */}
                          <Card variant="outlined" sx={{ borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
                              <Box sx={{ p: 1, border: `1px solid ${theme.palette.grey[300]}`, borderRadius: 1, mb: 1.5, width: '100%', maxWidth: 220, display: 'flex', justifyContent: 'center' }}>
                                <img
                                  src={image.url}
                                  alt={`Business Image ${idx + 1}`}
                                  style={{ maxWidth: '100%', maxHeight: 150, borderRadius: 4, objectFit: 'contain' }}
                                />
                              </Box>
                              <Link href={image.url} target="_blank" rel="noopener" mt={1} sx={{ fontWeight: 'medium' }}>
                                View Image {idx + 1}
                              </Link>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Grid>
                )}

                {/* Business Video */}
                {selectedOwner.businessOwnerDetails?.businessVideo?.url && (
                  <Grid size={{ xs: 12 }}> {/* Corrected: Grid item */}
                    <Typography variant="h6" gutterBottom color="primary.main" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                      <VideoIcon sx={{ verticalAlign: 'middle', mr: 1, fontSize: 28 }} /> Business Video
                    </Typography>
                    <Card variant="outlined" sx={{ borderRadius: 2, p: 3, bgcolor: alpha(theme.palette.primary.main, 0.08) }}>
                      <CardContent sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Link
                          href={selectedOwner.businessOwnerDetails.businessVideo.url}
                          target="_blank"
                          rel="noopener"
                          sx={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            p: 3, border: `2px dashed ${theme.palette.primary.light}`, borderRadius: 2,
                            textDecoration: 'none', color: theme.palette.primary.dark,
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                            '&:hover': { borderColor: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.15) },
                            transition: 'all 0.3s ease-in-out',
                            width: '100%', maxWidth: 400
                          }}
                        >
                          <VideoIcon sx={{ mr: 1.5, fontSize: 32 }} />
                          <Typography variant="subtitle1" fontWeight="medium">Click to View Business Video</Typography>
                        </Link>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
              <Button onClick={() => setDetailsDialogOpen(false)} variant="outlined" color="inherit">
                Close
              </Button>
              <Button onClick={() => {
                setDetailsDialogOpen(false);
                handleEdit(selectedOwner);
              }} color="primary" variant="contained" sx={{ px: 4 }}>
                Edit Owner
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%', boxShadow: theme.shadows[6], borderRadius: 1 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <AdminKeyDialog
        open={adminKeyDialogOpen}
        onClose={() => setAdminKeyDialogOpen(false)}
        onSave={handleAdminKeySave}
      />
    </Container>
  );
};

export default BusinessOwners;
