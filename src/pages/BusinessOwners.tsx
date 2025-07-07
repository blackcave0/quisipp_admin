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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Divider,
  Link,
} from '@mui/material';
import {
  Edit as EditIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  Verified as VerifiedIcon,
  VerifiedUser as VerifiedUserIcon,
  Store as StoreIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationOnIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { businessOwnerService } from '../services/api';
import AdminKeyDialog from '../components/auth/AdminKeyDialog';

interface BusinessOwnerDocument {
  number?: string;
  imageUrl?: string;
  publicId?: string;
  verified?: boolean;
  url?: string;
}

interface BusinessOwnerDocuments {
  aadhar?: BusinessOwnerDocument;
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
  businessOwnerDetails?: Record<string, unknown>;
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

interface FormData {
  email: string;
  businessName: string;
  phoneNumber: string;
  address: string;
  [key: string]: string | number | boolean | undefined;
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

  const fetchBusinessOwners = async () => {
    try {
      setLoading(true);
      const response = await businessOwnerService.getAllBusinessOwners();

      // Debug the full response
      console.log('Full response:', response);

      // Extract the business owners data from the nested structure
      let ownersArray: BusinessOwner[] = [];

      if (response.data && response.data.businessOwners) {
        const ownersData = response.data.businessOwners;

        // Debug the businessOwners data
        console.log('Business owners data:', ownersData);

        if (Array.isArray(ownersData)) {
          // If it's already an array, use it directly
          ownersArray = ownersData;
        } else if (ownersData && typeof ownersData === 'object') {
          // If it's an object with a data property that is an array
          if (ownersData.data && Array.isArray(ownersData.data)) {
            console.log('Found array in ownersData.data:', ownersData.data);
            ownersArray = ownersData.data;
          } else {
            // Try to extract values
            const values = Object.values(ownersData);
            console.log('Extracted values:', values);

            // Look for an array in the values
            for (const value of values) {
              if (Array.isArray(value)) {
                ownersArray = value;
                break;
              }
            }
          }
        }
      }

      console.log('Final owners array:', ownersArray);
      setBusinessOwners(ownersArray);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching business owners:', error);
      setLoading(false);
      setSnackbar({
        open: true,
        message: 'Failed to load business owners. Admin key may be required.',
        severity: 'error',
      });
      // Show admin key dialog if there's an error
      setAdminKeyDialogOpen(true);

      // Set empty array to prevent map errors
      setBusinessOwners([]);
    }
  };

  useEffect(() => {
    fetchBusinessOwners();
  }, []);

  // Handle admin key save
  const handleAdminKeySave = (adminKey: string) => {
    // After saving the admin key, retry fetching business owners
    console.log(`Admin key saved: ${adminKey.substring(0, 3)}***`);
    fetchBusinessOwners();
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Open dialog for adding new business owner
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

  // Open dialog for editing business owner
  const handleEdit = (owner: BusinessOwner) => {
    // Check if owner has _id
    if (!owner._id) {
      setSnackbar({
        open: true,
        message: 'Cannot edit this business owner - missing ID',
        severity: 'error',
      });
      return;
    }

    setEditingOwner(owner);
    setFormData({
      email: owner.email || '',
      businessName: owner.businessName || '',
      phoneNumber: owner.phoneNumber || '',
      address: owner.businessAddress || owner.address || '',
    });
    setOpenDialog(true);
  };

  // Open details dialog
  const handleViewDetails = (owner: BusinessOwner) => {
    setSelectedOwner(owner);
    setDetailsDialogOpen(true);
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      if (editingOwner) {
        // Update existing business owner
        await businessOwnerService.updateBusinessOwner(editingOwner._id, formData);

        // Update local state
        setBusinessOwners(businessOwners.map(owner =>
          owner._id === editingOwner._id ? { ...owner, ...formData } : owner
        ));

        setSnackbar({
          open: true,
          message: 'Business owner updated successfully',
          severity: 'success',
        });
      } else {
        // Create new business owner
        const response = await businessOwnerService.createBusinessOwner(formData);

        // Update local state with new business owner
        setBusinessOwners([...businessOwners, response.data.businessOwner]);

        setSnackbar({
          open: true,
          message: 'Business owner created successfully',
          severity: 'success',
        });
      }

      // Close dialog
      setOpenDialog(false);
    } catch (error) {
      console.error('Error saving business owner:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save business owner',
        severity: 'error',
      });
    }
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Business Owners</Typography>
        <Box>
          <Button
            variant="outlined"
            onClick={fetchBusinessOwners}
            sx={{ mr: 2 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddNew}
          >
            Add New
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Business Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Business Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {businessOwners.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No business owners found
                </TableCell>
              </TableRow>
            ) : (
              businessOwners.map((owner, index) => (
                <TableRow key={owner._id || `owner-${index}`}>
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
                        icon={<VerifiedIcon />}
                        label="Verified"
                        color="success"
                        size="small"
                      />
                    ) : (
                      <Chip
                        label="Pending"
                        color="warning"
                        size="small"
                      />
                    )}
                  </TableCell>
                  <TableCell>{formatDate(owner.createdAt)}</TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={() => handleViewDetails(owner)}
                      sx={{ mr: 1 }}
                    >
                      <StoreIcon />
                    </IconButton>
                    <IconButton color="primary" onClick={() => handleEdit(owner)}>
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingOwner ? 'Edit Business Owner' : 'Add New Business Owner'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              fullWidth
              required
            />
            <TextField
              label="Business Name"
              name="businessName"
              value={formData.businessName}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              label="Phone Number"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              label="Address"
              name="address"
              value={formData.busin}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedOwner && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6">
                  {selectedOwner.businessName || 'Business Owner Details'}
                </Typography>
                {selectedOwner.isVerified && (
                  <Chip
                    icon={<VerifiedUserIcon />}
                    label="Verified"
                    color="success"
                    size="small"
                  />
                )}
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                {/* Basic Information */}
                <Grid size={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Basic Information</Typography>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <EmailIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="body1">{selectedOwner.email}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <PhoneIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="body1">{selectedOwner.phoneNumber || 'N/A'}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <LocationOnIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="body1">
                              {(selectedOwner.businessOwnerDetails?.businessAddress as string) || selectedOwner.address || 'N/A'}
                              {selectedOwner.businessOwnerDetails?.pincode ? ` - ${selectedOwner.businessOwnerDetails.pincode}` : ''}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <StoreIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="body1">
                              Type: {selectedOwner.businessType || 'N/A'}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <CategoryIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="body1">
                              Categories: {selectedOwner.businessOwnerDetails?.categories &&
                                Array.isArray(selectedOwner.businessOwnerDetails.categories) ?
                                (selectedOwner.businessOwnerDetails.categories as string[]).join(', ') : 'N/A'}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body2">
                              GSTIN: {(selectedOwner.businessOwnerDetails?.gstin as string) || 'N/A'}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="body2">
                        Created: {formatDate(selectedOwner.createdAt)}
                      </Typography>
                      <Typography variant="body2">
                        Last Updated: {formatDate(selectedOwner.updatedAt)}
                      </Typography>
                      {selectedOwner.auth0Id && (
                        <Typography variant="body2">
                          Auth0 ID: {selectedOwner.auth0Id}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Business Images */}
                {selectedOwner.businessImages && selectedOwner.businessImages.length > 0 && (
                  <Grid size={12}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>Business Images</Typography>
                        <Grid container spacing={2}>
                          {selectedOwner.businessImages.map((image, idx) => (
                            <Grid size={{ xs: 6, md: 4 }} key={idx}>
                              <Card>
                                <CardMedia
                                  component="img"
                                  height="140"
                                  image={image.url}
                                  alt={`Business image ${idx + 1}`}
                                  sx={{ objectFit: 'cover' }}
                                />
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {/* Business Video */}
                {selectedOwner.businessVideo && selectedOwner.businessVideo.url && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>Business Video</Typography>
                        <Box sx={{ mt: 2 }}>
                          <Link href={selectedOwner.businessVideo.url} target="_blank" rel="noopener">
                            View Business Video
                          </Link>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {/* Documents */}
                {selectedOwner.documents && (
                  <Grid size={12}>
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>Identity Documents</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={2}>
                          {/* Aadhar */}
                          {selectedOwner.documents.aadhar && (
                            <Grid size={{ xs: 12, md: 6 }}>
                              <Card>
                                <CardContent>
                                  <Typography variant="subtitle1">Aadhar</Typography>
                                  {selectedOwner.documents.aadhar.number && (
                                    <Typography variant="body2">
                                      Number: {selectedOwner.documents.aadhar.number}
                                    </Typography>
                                  )}
                                  {selectedOwner.documents.aadhar.imageUrl && (
                                    <Box sx={{ mt: 1 }}>
                                      <Link href={selectedOwner.documents.aadhar.imageUrl} target="_blank" rel="noopener">
                                        View Aadhar Image
                                      </Link>
                                    </Box>
                                  )}
                                  <Box sx={{ mt: 1 }}>
                                    <Chip
                                      label={selectedOwner.documents.aadhar.verified ? "Verified" : "Not Verified"}
                                      color={selectedOwner.documents.aadhar.verified ? "success" : "warning"}
                                      size="small"
                                    />
                                  </Box>
                                </CardContent>
                              </Card>
                            </Grid>
                          )}

                          {/* PAN */}
                          {selectedOwner.documents.pan && (
                            <Grid size={{ xs: 12, md: 6 }}>
                              <Card>
                                <CardContent>
                                  <Typography variant="subtitle1">PAN</Typography>
                                  {selectedOwner.documents.pan.number && (
                                    <Typography variant="body2">
                                      Number: {selectedOwner.documents.pan.number}
                                    </Typography>
                                  )}
                                  {selectedOwner.documents.pan.imageUrl && (
                                    <Box sx={{ mt: 1 }}>
                                      <Link href={selectedOwner.documents.pan.imageUrl} target="_blank" rel="noopener">
                                        View PAN Image
                                      </Link>
                                    </Box>
                                  )}
                                  <Box sx={{ mt: 1 }}>
                                    <Chip
                                      label={selectedOwner.documents.pan.verified ? "Verified" : "Not Verified"}
                                      color={selectedOwner.documents.pan.verified ? "success" : "warning"}
                                      size="small"
                                    />
                                  </Box>
                                </CardContent>
                              </Card>
                            </Grid>
                          )}

                          {/* Selfie */}
                          {selectedOwner.documents.selfie && (
                            <Grid size={{ xs: 12, md: 6 }}>
                              <Card>
                                <CardContent>
                                  <Typography variant="subtitle1">Selfie</Typography>
                                  {selectedOwner.documents.selfie.imageUrl && (
                                    <Box sx={{ mt: 1 }}>
                                      <Link href={selectedOwner.documents.selfie.imageUrl} target="_blank" rel="noopener">
                                        View Selfie
                                      </Link>
                                    </Box>
                                  )}
                                  <Box sx={{ mt: 1 }}>
                                    <Chip
                                      label={selectedOwner.documents.selfie.verified ? "Verified" : "Not Verified"}
                                      color={selectedOwner.documents.selfie.verified ? "success" : "warning"}
                                      size="small"
                                    />
                                  </Box>
                                </CardContent>
                              </Card>
                            </Grid>
                          )}

                          {/* Video */}
                          {selectedOwner.documents.video && (
                            <Grid size={{ xs: 12, md: 6 }}>
                              <Card>
                                <CardContent>
                                  <Typography variant="subtitle1">Video Verification</Typography>
                                  {selectedOwner.documents.video.url && (
                                    <Box sx={{ mt: 1 }}>
                                      <Link href={selectedOwner.documents.video.url} target="_blank" rel="noopener">
                                        View Verification Video
                                      </Link>
                                    </Box>
                                  )}
                                  <Box sx={{ mt: 1 }}>
                                    <Chip
                                      label={selectedOwner.documents.video.verified ? "Verified" : "Not Verified"}
                                      color={selectedOwner.documents.video.verified ? "success" : "warning"}
                                      size="small"
                                    />
                                  </Box>
                                </CardContent>
                              </Card>
                            </Grid>
                          )}
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
              <Button onClick={() => {
                setDetailsDialogOpen(false);
                handleEdit(selectedOwner);
              }} color="primary">
                Edit
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
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <AdminKeyDialog
        open={adminKeyDialogOpen}
        onClose={() => setAdminKeyDialogOpen(false)}
        onSave={handleAdminKeySave}
      />
    </Box>
  );
};

export default BusinessOwners; 