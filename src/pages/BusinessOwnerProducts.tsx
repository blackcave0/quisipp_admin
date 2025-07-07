import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Switch,
  Pagination,
  CircularProgress,
  Alert,
  InputAdornment,
  Tabs,
  Tab,
  Badge,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Inventory as InventoryIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import {
  businessOwnerProductService,
  productCommonService,
  formatPrice,
  formatDate,
  getCategoryLabel,
  getWeightLabel,
} from '../services/productService';
import type { AdminProduct, AdoptedProduct, Category, WeightOption, ProductSearchOptions } from '../services/productService';

// Define error type for better type safety
interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

// Extended search options for adopted products
interface AdoptedProductSearchOptions extends ProductSearchOptions {
  stockStatus?: string;
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
      id={`product-tabpanel-${index}`}
      aria-labelledby={`product-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const BusinessOwnerProducts = () => {
  const [tabValue, setTabValue] = useState(0);
  const [availableProducts, setAvailableProducts] = useState<AdminProduct[]>([]);
  const [adoptedProducts, setAdoptedProducts] = useState<AdoptedProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [weightOptions, setWeightOptions] = useState<WeightOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dialog states
  const [adoptDialogOpen, setAdoptDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<AdminProduct | null>(null);
  const [selectedWeights, setSelectedWeights] = useState<string[]>([]);
  const [stockStatus, setStockStatus] = useState<'inStock' | 'outOfStock'>('inStock');
  const [productQuantity, setProductQuantity] = useState(0);

  // Search states
  const [searchOptions, setSearchOptions] = useState<ProductSearchOptions>({
    search: '',
    category: '',
    page: 1,
    limit: 12,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const [adoptedSearchOptions, setAdoptedSearchOptions] = useState<AdoptedProductSearchOptions>({
    search: '',
    category: '',
    stockStatus: '',
    page: 1,
    limit: 12,
    sortBy: 'productCreatedAt',
    sortOrder: 'desc',
  });

  // Pagination states
  const [availablePagination, setAvailablePagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [adoptedPagination, setAdoptedPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [categoriesRes, weightsRes] = await Promise.all([
          productCommonService.getCategories(),
          productCommonService.getWeightOptions(),
        ]);

        if (categoriesRes.success) {
          setCategories(categoriesRes.categories);
        }

        if (weightsRes.success) {
          setWeightOptions(weightsRes.weightOptions);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
        setError('Failed to load initial data');
      }
    };

    loadInitialData();
  }, []);

  // Load available products
  const loadAvailableProducts = useCallback(async (options: ProductSearchOptions = searchOptions) => {
    try {
      setLoading(true);
      const response = await businessOwnerProductService.searchProducts(options);

      if (response.success) {
        setAvailableProducts(response.products);
        setAvailablePagination(response.pagination);
      } else {
        setError('Failed to load available products');
      }
    } catch (error: unknown) {
      console.error('Error loading available products:', error);
      const apiError = error as ApiError;
      setError(apiError.response?.data?.message || 'Failed to load available products');
    } finally {
      setLoading(false);
    }
  }, [searchOptions]);

  // Load adopted products
  const loadAdoptedProducts = useCallback(async (options: AdoptedProductSearchOptions = adoptedSearchOptions) => {
    try {
      setLoading(true);
      const response = await businessOwnerProductService.getAdoptedProducts(options);

      if (response.success) {
        setAdoptedProducts(response.products);
        setAdoptedPagination(response.pagination);
      } else {
        setError('Failed to load adopted products');
      }
    } catch (error: unknown) {
      console.error('Error loading adopted products:', error);
      const apiError = error as ApiError;
      setError(apiError.response?.data?.message || 'Failed to load adopted products');
    } finally {
      setLoading(false);
    }
  }, [adoptedSearchOptions]);

  // Initial load based on active tab
  useEffect(() => {
    if (tabValue === 0) {
      loadAvailableProducts();
    } else {
      loadAdoptedProducts();
    }
  }, [tabValue, loadAvailableProducts, loadAdoptedProducts]);

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError('');
    setSuccess('');
  };

  // Handle adopt product
  const handleAdoptProduct = (product: AdminProduct) => {
    setSelectedProduct(product);
    setSelectedWeights([]);
    setStockStatus('inStock');
    setProductQuantity(0);
    setAdoptDialogOpen(true);
  };

  // Handle weight selection
  const handleWeightChange = (weight: string, checked: boolean) => {
    setSelectedWeights(prev =>
      checked
        ? [...prev, weight]
        : prev.filter(w => w !== weight)
    );
  };

  // Submit adoption
  const handleSubmitAdoption = async () => {
    if (!selectedProduct || selectedWeights.length === 0) {
      setError('Please select at least one weight option');
      return;
    }

    try {
      const response = await businessOwnerProductService.adoptProduct(selectedProduct._id, {
        selectedWeights,
        stockStatus,
        productQuantity,
      });

      if (response.success) {
        setSuccess(`Product adopted successfully with ${selectedWeights.length} weight option(s)!`);
        setAdoptDialogOpen(false);
        setSelectedProduct(null);

        // Refresh available products to update adoption status
        loadAvailableProducts();

        // If on adopted products tab, refresh that too
        if (tabValue === 1) {
          loadAdoptedProducts();
        }
      } else {
        setError(response.message || 'Failed to adopt product');
      }
    } catch (error: unknown) {
      console.error('Error adopting product:', error);
      const apiError = error as ApiError;
      setError(apiError.response?.data?.message || 'Failed to adopt product');
    }
  };

  // Handle search for available products
  const handleAvailableSearch = () => {
    const newOptions = { ...searchOptions, page: 1 };
    setSearchOptions(newOptions);
    loadAvailableProducts(newOptions);
  };

  // Handle search for adopted products
  const handleAdoptedSearch = () => {
    const newOptions = { ...adoptedSearchOptions, page: 1 };
    setAdoptedSearchOptions(newOptions);
    loadAdoptedProducts(newOptions);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Product Management
      </Typography>

      {/* Error and Success Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="product tabs">
          <Tab
            label={
              <Badge badgeContent={availablePagination.totalProducts} color="primary">
                Available Products
              </Badge>
            }
          />
          <Tab
            label={
              <Badge badgeContent={adoptedPagination.totalProducts} color="secondary">
                My Products
              </Badge>
            }
          />
        </Tabs>
      </Paper>

      {/* Available Products Tab */}
      <TabPanel value={tabValue} index={0}>
        {/* Search and Filters for Available Products */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                placeholder="Search available products..."
                value={searchOptions.search || ''}
                onChange={(e) => setSearchOptions(prev => ({ ...prev, search: e.target.value }))}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAvailableSearch();
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={searchOptions.category || ''}
                  label="Category"
                  onChange={(e) => setSearchOptions(prev => ({ ...prev, category: e.target.value }))}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.value} value={category.value}>
                      {category.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<SearchIcon />}
                onClick={handleAvailableSearch}
              >
                Search
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Available Products Grid */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : availableProducts.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              No products found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Try adjusting your search criteria
            </Typography>
          </Paper>
        ) : (
          <>
            <Grid container spacing={3}>
              {availableProducts.map((product) => (
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={product._id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardMedia
                      component="img"
                      height="200"
                      image={product.cloudinaryUrls[0]?.url || '/placeholder-image.jpg'}
                      alt={product.productName}
                      sx={{ objectFit: 'cover' }}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="h2" gutterBottom noWrap>
                        {product.productName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {getCategoryLabel(categories, product.productCategory)}
                      </Typography>
                      <Typography variant="h6" color="primary" gutterBottom>
                        {formatPrice(product.productPrice)}
                      </Typography>
                      {product.productBrand && (
                        <Chip label={product.productBrand} size="small" sx={{ mb: 1 }} />
                      )}
                      <Typography variant="body2" color="text.secondary">
                        Available weights: {product.availableWeights.length}
                      </Typography>
                      {product.isAdopted && (
                        <Chip
                          icon={<CheckCircleIcon />}
                          label="Already Adopted"
                          color="success"
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      )}
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleAdoptProduct(product)}
                        disabled={product.isAdopted}
                        fullWidth
                      >
                        {product.isAdopted ? 'Adopted' : 'Adopt Product'}
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Pagination for Available Products */}
            {availablePagination.totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={availablePagination.totalPages}
                  page={availablePagination.currentPage}
                  onChange={(_event, page) => {
                    const newOptions = { ...searchOptions, page };
                    setSearchOptions(newOptions);
                    loadAvailableProducts(newOptions);
                  }}
                  color="primary"
                  size="large"
                />
              </Box>
            )}
          </>
        )}
      </TabPanel>

      {/* Adopted Products Tab */}
      <TabPanel value={tabValue} index={1}>
        {/* Search and Filters for Adopted Products */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                placeholder="Search my products..."
                value={adoptedSearchOptions.search || ''}
                onChange={(e) => setAdoptedSearchOptions(prev => ({ ...prev, search: e.target.value }))}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAdoptedSearch();
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={adoptedSearchOptions.category || ''}
                  label="Category"
                  onChange={(e) => setAdoptedSearchOptions(prev => ({ ...prev, category: e.target.value }))}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.value} value={category.value}>
                      {category.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Stock Status</InputLabel>
                <Select
                  value={adoptedSearchOptions.stockStatus || ''}
                  label="Stock Status"
                  onChange={(e) => setAdoptedSearchOptions(prev => ({ ...prev, stockStatus: e.target.value }))}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="inStock">In Stock</MenuItem>
                  <MenuItem value="outOfStock">Out of Stock</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<SearchIcon />}
                onClick={handleAdoptedSearch}
              >
                Search
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Adopted Products Grid */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : adoptedProducts.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <InventoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No adopted products found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {adoptedSearchOptions.search || adoptedSearchOptions.category || adoptedSearchOptions.stockStatus
                ? 'Try adjusting your search criteria'
                : 'Start by adopting products from the Available Products tab'}
            </Typography>
          </Paper>
        ) : (
          <>
            <Grid container spacing={3}>
              {adoptedProducts.map((product) => (
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={product._id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardMedia
                      component="img"
                      height="200"
                      image={product.cloudinaryUrls[0]?.url || '/placeholder-image.jpg'}
                      alt={product.productName}
                      sx={{ objectFit: 'cover' }}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="h2" gutterBottom noWrap>
                        {product.productName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {getCategoryLabel(categories, product.productCategory)}
                      </Typography>
                      <Typography variant="h6" color="primary" gutterBottom>
                        {formatPrice(product.productPrice)}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                        <Chip
                          label={getWeightLabel(weightOptions, product.selectedWeight)}
                          size="small"
                        />
                        <Chip
                          label={product.stockStatus === 'inStock' ? 'In Stock' : 'Out of Stock'}
                          color={product.stockStatus === 'inStock' ? 'success' : 'error'}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Quantity: {product.productQuantity}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Adopted: {formatDate(product.productCreatedAt)}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button size="small" variant="outlined" fullWidth>
                        Manage
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Pagination for Adopted Products */}
            {adoptedPagination.totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={adoptedPagination.totalPages}
                  page={adoptedPagination.currentPage}
                  onChange={(_event, page) => {
                    const newOptions = { ...adoptedSearchOptions, page };
                    setAdoptedSearchOptions(newOptions);
                    loadAdoptedProducts(newOptions);
                  }}
                  color="primary"
                  size="large"
                />
              </Box>
            )}
          </>
        )}
      </TabPanel>

      {/* Product Adoption Dialog */}
      <Dialog
        open={adoptDialogOpen}
        onClose={() => setAdoptDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedProduct && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Adopt Product</Typography>
                <Chip
                  label={getCategoryLabel(categories, selectedProduct.productCategory)}
                  color="primary"
                  size="small"
                />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                {/* Product Info */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card>
                    <CardMedia
                      component="img"
                      height="200"
                      image={selectedProduct.cloudinaryUrls[0]?.url || '/placeholder-image.jpg'}
                      alt={selectedProduct.productName}
                      sx={{ objectFit: 'cover' }}
                    />
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {selectedProduct.productName}
                      </Typography>
                      <Typography variant="h5" color="primary" gutterBottom>
                        {formatPrice(selectedProduct.productPrice)}
                      </Typography>
                      {selectedProduct.productBrand && (
                        <Chip label={selectedProduct.productBrand} size="small" sx={{ mb: 1 }} />
                      )}
                      <Typography variant="body2" color="text.secondary">
                        {selectedProduct.productDescription}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Adoption Settings */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="h6" gutterBottom>
                    Select Weight Options *
                  </Typography>
                  <FormGroup>
                    {selectedProduct.availableWeights.map((weight) => (
                      <FormControlLabel
                        key={weight}
                        control={
                          <Checkbox
                            checked={selectedWeights.includes(weight)}
                            onChange={(e) => handleWeightChange(weight, e.target.checked)}
                          />
                        }
                        label={getWeightLabel(weightOptions, weight)}
                      />
                    ))}
                  </FormGroup>

                  <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                    Initial Settings
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body1" sx={{ mr: 2 }}>
                      Stock Status:
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={stockStatus === 'inStock'}
                          onChange={(e) => setStockStatus(e.target.checked ? 'inStock' : 'outOfStock')}
                        />
                      }
                      label={stockStatus === 'inStock' ? 'In Stock' : 'Out of Stock'}
                    />
                  </Box>

                  <TextField
                    fullWidth
                    label="Initial Quantity"
                    type="number"
                    value={productQuantity}
                    onChange={(e) => setProductQuantity(parseInt(e.target.value) || 0)}
                    inputProps={{ min: 0 }}
                    sx={{ mb: 2 }}
                  />

                  <Alert severity="info" sx={{ mt: 2 }}>
                    You can modify stock status and quantity after adopting the product.
                  </Alert>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setAdoptDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmitAdoption}
                variant="contained"
                disabled={selectedWeights.length === 0}
              >
                Adopt Product ({selectedWeights.length} weight{selectedWeights.length !== 1 ? 's' : ''})
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default BusinessOwnerProducts;
