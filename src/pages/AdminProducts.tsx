import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
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
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
  CircularProgress,
  Alert,
  InputAdornment,
  Checkbox,
  // Toolbar,
  // Menu,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  Upload as UploadIcon,
  DeleteSweep as DeleteSweepIcon,
} from '@mui/icons-material';
import {
  adminProductService,
  productCommonService,
  formatPrice,
  formatDate,
  getCategoryLabel,
} from '../services/productService';
import type { AdminProduct, Category, ProductSearchOptions } from '../services/productService';

// Define error type for better type safety
interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

const AdminProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<AdminProduct | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Bulk selection state
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  // Search and filter state
  const [searchOptions, setSearchOptions] = useState<ProductSearchOptions>({
    search: '',
    category: '',
    page: 1,
    limit: 12,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await productCommonService.getCategories();
        if (response.success) {
          setCategories(response.categories);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };

    loadCategories();
  }, []);

  // Load products
  const loadProducts = useCallback(async (options: ProductSearchOptions = searchOptions) => {
    try {
      setLoading(true);
      const response = await adminProductService.getProducts(options);

      if (response.success) {
        setProducts(response.products);
        setPagination(response.pagination);
      } else {
        setError('Failed to load products');
      }
    } catch (error: unknown) {
      console.error('Error loading products:', error);
      const apiError = error as ApiError;
      setError(apiError.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [searchOptions]);

  // Initial load
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Handle search
  const handleSearch = () => {
    const newOptions = { ...searchOptions, page: 1 };
    setSearchOptions(newOptions);
    loadProducts(newOptions);
  };

  // Handle filter change
  const handleFilterChange = (field: string, value: string | number) => {
    const newOptions = { ...searchOptions, [field]: value, page: 1 };
    setSearchOptions(newOptions);
    loadProducts(newOptions);
  };

  // Handle page change
  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    const newOptions = { ...searchOptions, page };
    setSearchOptions(newOptions);
    loadProducts(newOptions);
  };

  // Handle delete product
  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;

    try {
      const response = await adminProductService.deleteProduct(selectedProduct._id);

      if (response.success) {
        setDeleteDialogOpen(false);
        setSelectedProduct(null);
        loadProducts(); // Reload products
      } else {
        setError(response.message || 'Failed to delete product');
      }
    } catch (error: unknown) {
      console.error('Error deleting product:', error);
      const apiError = error as ApiError;
      setError(apiError.response?.data?.message || 'Failed to delete product');
    }
  };

  // Handle view product details
  const handleViewProduct = (product: AdminProduct) => {
    setSelectedProduct(product);
    setViewDialogOpen(true);
  };

  // Handle bulk selection
  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p._id));
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;

    try {
      setBulkDeleteLoading(true);
      const response = await adminProductService.deleteMultipleProducts(selectedProducts);

      if (response.success) {
        setBulkDeleteDialogOpen(false);
        setSelectedProducts([]);
        loadProducts(); // Reload products

        // Show success message with details
        if (response.results.failed.length > 0) {
          setError(`${response.results.successful.length} products deleted successfully, ${response.results.failed.length} failed.`);
        } else {
          setError(''); // Clear any existing errors
        }
      } else {
        setError(response.message || 'Failed to delete products');
      }
    } catch (error: unknown) {
      console.error('Error deleting products:', error);
      const apiError = error as ApiError;
      setError(apiError.response?.data?.message || 'Failed to delete products');
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4">Admin Products</Typography>
          {selectedProducts.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              {selectedProducts.length} product{selectedProducts.length > 1 ? 's' : ''} selected
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {selectedProducts.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteSweepIcon />}
              onClick={() => setBulkDeleteDialogOpen(true)}
            >
              Delete Selected ({selectedProducts.length})
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => navigate('/admin/products/bulk-upload')}
          >
            Bulk Upload
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/admin/products/upload')}
          >
            Upload Product
          </Button>
        </Box>
      </Box>

      {/* Search and Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              placeholder="Search products..."
              value={searchOptions.search || ''}
              onChange={(e) => setSearchOptions(prev => ({ ...prev, search: e.target.value }))}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
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
                onChange={(e) => handleFilterChange('category', e.target.value)}
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
              <InputLabel>Sort By</InputLabel>
              <Select
                value={searchOptions.sortBy || 'createdAt'}
                label="Sort By"
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              >
                <MenuItem value="createdAt">Date Created</MenuItem>
                <MenuItem value="productName">Name</MenuItem>
                <MenuItem value="productPrice">Price</MenuItem>
                <MenuItem value="adoptionCount">Adoption Count</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={handleSearch}
            >
              Search
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Products Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : products.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No products found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {searchOptions.search || searchOptions.category
              ? 'Try adjusting your search criteria'
              : 'Upload your first product to get started'}
          </Typography>
        </Paper>
      ) : (
        <>
          {/* Bulk Selection Header */}
          {products.length > 0 && (
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Checkbox
                checked={selectedProducts.length === products.length && products.length > 0}
                indeterminate={selectedProducts.length > 0 && selectedProducts.length < products.length}
                onChange={handleSelectAll}
              />
              <Typography variant="body2">
                Select All ({products.length} products)
              </Typography>
            </Box>
          )}

          <Grid container spacing={3}>
            {products.map((product) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={product._id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    border: selectedProducts.includes(product._id) ? '2px solid' : '1px solid',
                    borderColor: selectedProducts.includes(product._id) ? 'primary.main' : 'divider',
                  }}
                >
                  <Box sx={{ position: 'relative' }}>
                    <Checkbox
                      checked={selectedProducts.includes(product._id)}
                      onChange={() => handleSelectProduct(product._id)}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        zIndex: 1,
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        borderRadius: '4px',
                      }}
                    />
                    <CardMedia
                      component="img"
                      height="200"
                      image={product.cloudinaryUrls[0]?.url || '/placeholder-image.jpg'}
                      alt={product.productName}
                      sx={{ objectFit: 'cover' }}
                    />
                  </Box>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h2" gutterBottom noWrap>
                      {product.productName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {getCategoryLabel(categories, product.productCategory)}
                    </Typography>
                    <Typography variant="h5" color="primary" gutterBottom>
                      {formatPrice(product.productPrice)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      <span style={{ textDecoration: 'line-through' }}>
                        {formatPrice(product.productPrice)}
                      </span>
                      {formatPrice(product.discountedPrice)}
                    </Typography>
                    {product.productBrand && (
                      <Chip label={product.productBrand} size="small" sx={{ mb: 1 }} />
                    )}
                    <Typography variant="body2" color="text.secondary">
                      Adopted: {product.adoptionCount} times
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Created: {formatDate(product.createdAt)}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <IconButton
                      size="small"
                      onClick={() => handleViewProduct(product)}
                      title="View Details"
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/admin/products/edit/${product._id}`)}
                      title="Edit Product"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => {
                        setSelectedProduct(product);
                        setDeleteDialogOpen(true);
                      }}
                      title="Delete Product"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={pagination.totalPages}
                page={pagination.currentPage}
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Product</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedProduct?.productName}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteProduct} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Product Details Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedProduct && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">{selectedProduct.productName}</Typography>
                <Chip
                  label={getCategoryLabel(categories, selectedProduct.productCategory)}
                  color="primary"
                  size="small"
                />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                {/* Product Images */}
                <Grid size={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Product Images ({selectedProduct.cloudinaryUrls.length})
                  </Typography>
                  <Grid container spacing={2}>
                    {selectedProduct.cloudinaryUrls.slice(0, 6).map((image, index) => (
                      <Grid size={{ xs: 6, sm: 4 }} key={index}>
                        <Card>
                          <CardMedia
                            component="img"
                            height="120"
                            image={image.url}
                            alt={`Product image ${index + 1}`}
                            sx={{ objectFit: 'cover' }}
                          />
                        </Card>
                      </Grid>
                    ))}
                    {selectedProduct.cloudinaryUrls.length > 6 && (
                      <Grid size={{ xs: 6, sm: 4 }}>
                        <Card sx={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            +{selectedProduct.cloudinaryUrls.length - 6} more
                          </Typography>
                        </Card>
                      </Grid>
                    )}
                  </Grid>
                </Grid>

                {/* Product Details */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle1" gutterBottom>Product Details</Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Price:</strong> {formatPrice(selectedProduct.productPrice)}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Discounted Price:</strong> {formatPrice(selectedProduct.discountedPrice)}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Brand:</strong> {selectedProduct.productBrand || 'N/A'}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Created:</strong> {formatDate(selectedProduct.createdAt)}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Adoption Count:</strong> {selectedProduct.adoptionCount}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle1" gutterBottom>Available Weights</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {/* {selectedProduct.availableWeights.map((weight) => (
                      <Chip key={weight} label={weight} size="small" />
                    ))} */}

                    {
                      [
                        ...selectedProduct.availableWeights.map((weight) => (
                          <Chip key={`available-${weight}`} label={weight} size="small" />
                        )),
                        ...selectedProduct.customWeights.map((weight: { value: string | number; unit: string }) => (
                          <Chip key={`custom-${weight.value}-${weight.unit}`} label={`${weight.value} ${weight.unit}`} size="small" />
                        ))
                      ]
                    }
                  </Box>

                  {selectedProduct.tags.length > 0 && (
                    <>
                      <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>Tags</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {selectedProduct.tags.map((tag) => (
                          <Chip key={tag} label={tag} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </>
                  )}
                </Grid>

                <Grid size={12}>
                  <Typography variant="subtitle1" gutterBottom>Description</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedProduct.productDescription}
                  </Typography>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
              <Button
                onClick={() => {
                  setViewDialogOpen(false);
                  navigate(`/admin/products/edit/${selectedProduct._id}`);
                }}
                variant="contained"
              >
                Edit Product
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onClose={() => setBulkDeleteDialogOpen(false)}>
        <DialogTitle>Delete Multiple Products</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selectedProducts.length} selected product{selectedProducts.length > 1 ? 's' : ''}?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDeleteDialogOpen(false)} disabled={bulkDeleteLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleBulkDelete}
            color="error"
            variant="contained"
            disabled={bulkDeleteLoading}
            startIcon={bulkDeleteLoading ? <CircularProgress size={20} /> : <DeleteSweepIcon />}
          >
            {bulkDeleteLoading ? 'Deleting...' : `Delete ${selectedProducts.length} Products`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminProducts;
