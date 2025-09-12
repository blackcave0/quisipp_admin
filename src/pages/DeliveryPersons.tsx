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
} from '@mui/material';
import {
  Edit as EditIcon,
  Add as AddIcon,
  Verified as VerifiedIcon,
  VerifiedUser as VerifiedUserIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationOnIcon,
  TwoWheeler as VehicleIcon, // Changed from StoreIcon
} from '@mui/icons-material';
import { deliveryPersonService } from '../services/api'; // Assuming this service exists
import AdminKeyDialog from '../components/auth/AdminKeyDialog';

// Simplified interfaces for DeliveryPerson, adapt as needed
interface DeliveryPersonDocument {
  number?: string;
  imageUrl?: string;
  publicId?: string;
  verified?: boolean;
  url?: string;
}

interface DeliveryPersonDocuments {
  aadhar?: DeliveryPersonDocument;
  pan?: DeliveryPersonDocument;
  license?: DeliveryPersonDocument;
  selfie?: DeliveryPersonDocument;
  video?: DeliveryPersonDocument;
}

interface DeliveryPerson {
  _id: string;
  auth0Id?: string;
  email: string;
  name?: string;
  phoneNumber?: string;
  address?: string;
  lastActive?: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
  isVerified?: boolean;
  rating?: number;
  documents?: DeliveryPersonDocuments;
  vehicleType?: string;
  vehicleNumber?: string;
  [key: string]: unknown;
}

interface FormData {
  email: string;
  name: string;
  phoneNumber: string;
  address: string;
  [key: string]: string | number | boolean | undefined;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
}

const DeliveryPersons = () => {
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPerson, setEditingPerson] = useState<DeliveryPerson | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<DeliveryPerson | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    name: '',
    phoneNumber: '',
    address: '',
  });
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [adminKeyDialogOpen, setAdminKeyDialogOpen] = useState(false);

  const fetchDeliveryPersons = async () => {
    try {
      setLoading(true);
      // Assuming a similar service structure
      const response = await deliveryPersonService.getAllDeliveryPersons();

      console.log(response);
      let personsArray: DeliveryPerson[] = [];
      if (response.data && response.data.deliveryPersons) {
        const personsData = response.data.deliveryPersons;
        if (Array.isArray(personsData)) {
          personsArray = personsData;
        } else if (personsData && typeof personsData === 'object' && personsData.data && Array.isArray(personsData.data)) {
          personsArray = personsData.data;
        }
      }

      setDeliveryPersons(personsArray);
      setLoading(false);
    } catch (error: unknown) {
      console.error('Error fetching delivery persons:', error);
      setLoading(false);

      let errorMessage = 'Failed to load delivery persons.';
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

      setDeliveryPersons([]);
    }
  };

  useEffect(() => {
    fetchDeliveryPersons();
  }, []);

  const handleAdminKeySave = () => {
    fetchDeliveryPersons();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleAddNew = () => {
    setEditingPerson(null);
    setFormData({
      email: '',
      name: '',
      phoneNumber: '',
      address: '',
    });
    setOpenDialog(true);
  };

  const handleEdit = (person: DeliveryPerson) => {
    if (!person._id) {
      setSnackbar({
        open: true,
        message: 'Cannot edit this delivery person - missing ID',
        severity: 'error',
      });
      return;
    }

    setEditingPerson(person);
    setFormData({
      email: person.email || '',
      name: person.name || '',
      phoneNumber: person.phoneNumber || '',
      address: person.address || '',
    });
    setOpenDialog(true);
  };

  const handleViewDetails = (person: DeliveryPerson) => {
    setSelectedPerson(person);
    setDetailsDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingPerson) {
        await deliveryPersonService.updateDeliveryPerson(editingPerson._id, formData);
        setDeliveryPersons(deliveryPersons.map(p =>
          p._id === editingPerson._id ? { ...p, ...formData } : p
        ));
        setSnackbar({
          open: true,
          message: 'Delivery person updated successfully',
          severity: 'success',
        });
      } else {
        const response = await deliveryPersonService.createDeliveryPerson(formData);
        setDeliveryPersons([...deliveryPersons, response.data.deliveryPerson]);
        setSnackbar({
          open: true,
          message: 'Delivery person created successfully',
          severity: 'success',
        });
      }
      setOpenDialog(false);
    } catch (error) {
      console.error('Error saving delivery person:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save delivery person',
        severity: 'error',
      });
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

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
        <Typography variant="h4">Delivery Persons</Typography>
        <Box>
          <Button
            variant="outlined"
            onClick={fetchDeliveryPersons}
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
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Vehicle Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {deliveryPersons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No delivery persons found
                </TableCell>
              </TableRow>
            ) : (
              deliveryPersons.map((person, index) => (
                <TableRow key={person._id || `person-${index}`}>
                  <TableCell>{person.name || 'N/A'}</TableCell>
                  <TableCell>{person.email}</TableCell>
                  <TableCell>{person.phoneNumber || 'N/A'}</TableCell>
                  <TableCell>{person.vehicleType || 'N/A'}</TableCell>
                  <TableCell>
                    {person.isVerified ? (
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
                  <TableCell>{formatDate(person.createdAt)}</TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={() => handleViewDetails(person)}
                      sx={{ mr: 1 }}
                    >
                      <VehicleIcon />
                    </IconButton>
                    <IconButton color="primary" onClick={() => handleEdit(person)}>
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
          {editingPerson ? 'Edit Delivery Person' : 'Add New Delivery Person'}
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
              label="Name"
              name="name"
              value={formData.name}
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
              value={formData.address}
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
        {selectedPerson && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6">
                  {selectedPerson.name || 'Delivery Person Details'}
                </Typography>
                {selectedPerson.isVerified && (
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
                            <Typography variant="body1">{selectedPerson.email}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <PhoneIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="body1">{selectedPerson.phoneNumber || 'N/A'}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <LocationOnIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="body1">{selectedPerson.address || 'N/A'}</Typography>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <VehicleIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="body1">
                              Vehicle: {selectedPerson.vehicleType || 'N/A'} ({selectedPerson.vehicleNumber || 'N/A'})
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="body2">
                        Created: {formatDate(selectedPerson.createdAt)}
                      </Typography>
                      <Typography variant="body2">
                        Last Updated: {formatDate(selectedPerson.updatedAt)}
                      </Typography>
                      {selectedPerson.auth0Id && (
                        <Typography variant="body2">
                          Auth0 ID: {selectedPerson.auth0Id}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Documents */}
                {selectedPerson.documents && Object.entries(selectedPerson.documents).map(([key, doc]) => (
                  doc && doc.url && (
                    <Grid size={{ xs: 12, md: 6 }} key={key}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                          </Typography>
                          <Box sx={{ mt: 2 }}>
                            <Link href={doc.url} target="_blank" rel="noopener">
                              View Document
                            </Link>
                            {doc.verified && <Chip icon={<VerifiedIcon />} label="Verified" color="success" size="small" sx={{ ml: 2 }} />}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  )
                ))}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
              <Button onClick={() => {
                setDetailsDialogOpen(false);
                handleEdit(selectedPerson);
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

export default DeliveryPersons;
