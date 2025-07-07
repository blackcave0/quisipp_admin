import { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import {
  adminProductService,
  productCommonService,
  formatPrice,
  formatDate,
  getCategoryLabel,
} from '../services/productService';
import type { AdminProduct, Category, ProductSearchOptions } from '../services/productService';

const AdminProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<AdminProduct | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

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
  const loadProducts = async (options: ProductSearchOptions = searchOptions) => {
    try {
      setLoading(true);
      const response = await adminProductService.getProducts(options);

      if (response.success) {
        setProducts(response.products);
        setPagination(response.pagination);
      } else {
        setError('Failed to load products');
      }
    } catch (error: any) {
      console.error('Error loading products:', error);
      setError(error.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadProducts();
  }, []);

  // Handle search
  const handleSearch = () => {
    const newOptions = { ...searchOptions, page: 1 };
    setSearchOptions(newOptions);
    loadProducts(newOptions);
  };

  // Handle filter change
  const handleFilterChange = (field: string, value: any) => {
    const newOptions = { ...searchOptions, [field]: value, page: 1 };
    setSearchOptions(newOptions);
    loadProducts(newOptions);
  };

  // Handle page change
  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
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
    } catch (error: any) {
      console.error('Error deleting product:', error);
      setError(error.response?.data?.message || 'Failed to delete product');
    }
  };

  // Handle view product details
  const handleViewProduct = (product: AdminProduct) => {
    setSelectedProduct(product);
    setViewDialogOpen(true);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Admin Products</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/admin/products/upload')}
        >
          Upload Product
        </Button>
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
          <Grid container spacing={3}>
            {products.map((product) => (
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
                    {selectedProduct.availableWeights.map((weight) => (
                      <Chip key={weight} label={weight} size="small" />
                    ))}
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
    </Box>
  );
};

export default AdminProducts;
