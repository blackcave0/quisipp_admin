import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tabs,
  Tab,
  MenuItem,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { adminProductService, type BulkProductData } from '../services/productService';

interface BulkUploadResult {
  successful: Array<{
    index: number;
    productId: string;
    productName: string;
    productCategory: string;
  }>;
  failed: Array<{
    index: number;
    productName: string;
    error: string;
  }>;
  totalProcessed: number;
}

const BulkProductUpload = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<BulkProductData[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);

  // CSV file handling
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type === 'text/csv') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csv = e.target?.result as string;
        parseCSV(csv);
      };
      reader.readAsText(file);
    } else {
      setError('Please upload a valid CSV file');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
  });

  const parseCSV = (csv: string) => {
    try {
      const lines = csv.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        setError('CSV file must contain at least a header row and one data row');
        return;
      }

      // Parse CSV with better handling of quoted values
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];

          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase().replace(/"/g, ''));
      const requiredHeaders = ['productname', 'productdescription', 'productprice', 'productcategory'];

      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        setError(`Missing required headers: ${missingHeaders.join(', ')}`);
        return;
      }

      const validCategories = [
        'vegetables & fruits', 'atta, rice & dal', 'oil & ghee', 'spices & herbs',
        'dairy, bread & eggs', 'bakery & biscuits', 'dry fruits & cereals',
        'chicken , meat & fish', 'beverages & soft drinks', 'household & cleaning',
        'personal care', 'baby care & diapers', 'pet care', 'other'
      ];

      const parsedProducts: BulkProductData[] = [];
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]).map(v => v.trim().replace(/"/g, ''));
        if (values.length !== headers.length) {
          errors.push(`Row ${i + 1}: Column count mismatch`);
          continue;
        }

        const product: BulkProductData = {
          productName: '',
          productDescription: '',
          productPrice: '',
          productCategory: '',
        };

        headers.forEach((header, index) => {
          const value = values[index];
          switch (header) {
            case 'productname':
              product.productName = value;
              break;
            case 'productdescription':
              product.productDescription = value;
              break;
            case 'productprice':
              product.productPrice = value;
              break;
            case 'productcategory':
              product.productCategory = value;
              break;
            case 'productbrand':
              product.productBrand = value;
              break;
            case 'availableweights':
              product.availableWeights = value ? value.split(';').map(w => w.trim()).filter(w => w) : [];
              break;
            case 'tags':
              product.tags = value ? value.split(';').map(t => t.trim()).filter(t => t) : [];
              break;
          }
        });

        // Validate required fields
        if (!product.productName) {
          errors.push(`Row ${i + 1}: Product name is required`);
          continue;
        }
        if (!product.productDescription) {
          errors.push(`Row ${i + 1}: Product description is required`);
          continue;
        }
        if (!product.productPrice) {
          errors.push(`Row ${i + 1}: Product price is required`);
          continue;
        }
        if (!product.productCategory) {
          errors.push(`Row ${i + 1}: Product category is required`);
          continue;
        }

        // Validate price
        const price = parseFloat(product.productPrice);
        if (isNaN(price) || price < 0) {
          errors.push(`Row ${i + 1}: Invalid price "${product.productPrice}"`);
          continue;
        }

        // Validate category
        if (!validCategories.includes(product.productCategory.toLowerCase())) {
          errors.push(`Row ${i + 1}: Invalid category "${product.productCategory}"`);
          continue;
        }

        parsedProducts.push(product);
      }

      if (errors.length > 0) {
        setError(`CSV validation errors:\n${errors.slice(0, 10).join('\n')}${errors.length > 10 ? `\n... and ${errors.length - 10} more errors` : ''}`);
        return;
      }

      if (parsedProducts.length === 0) {
        setError('No valid products found in CSV file');
        return;
      }

      setProducts(parsedProducts);
      setError('');
      setSuccess(`Successfully parsed ${parsedProducts.length} products from CSV`);
    } catch (err) {
      console.error('CSV parsing error:', err);
      setError('Error parsing CSV file. Please check the format and try again.');
    }
  };

  const downloadTemplate = () => {
    const headers = [
      'productName',
      'productDescription',
      'productPrice',
      'productCategory',
      'productBrand',
      'availableWeights',
      'tags'
    ];

    const sampleData = [
      'Sample Product',
      'This is a sample product description',
      '99.99',
      'vegetables & fruits',
      'Sample Brand',
      '250gm;500gm;1kg',
      'organic;fresh;healthy'
    ];

    const csvContent = [
      headers.join(','),
      sampleData.join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_products_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const addManualProduct = () => {
    setProducts(prev => [...prev, {
      productName: '',
      productDescription: '',
      productPrice: '',
      productCategory: '',
      productBrand: '',
      availableWeights: [],
      tags: [],
      discountType: 'none',
      discountValue: '',
      discountStartDate: '',
      discountEndDate: '',
    }]);
  };

  const updateProduct = (index: number, field: keyof BulkProductData, value: string | string[]) => {
    setProducts(prev => prev.map((product, i) =>
      i === index ? { ...product, [field]: value } : product
    ));
  };

  const removeProduct = (index: number) => {
    setProducts(prev => prev.filter((_, i) => i !== index));
  };

  const validateProducts = (): string[] => {
    const errors: string[] = [];
    const validCategories = [
      'vegetables & fruits', 'atta, rice & dal', 'oil & ghee', 'spices & herbs',
      'dairy, bread & eggs', 'bakery & biscuits', 'dry fruits & cereals',
      'chicken , meat & fish', 'beverages & soft drinks', 'household & cleaning',
      'personal care', 'baby care & diapers', 'pet care', 'other'
    ];

    products.forEach((product, index) => {
      const rowNum = index + 1;

      // Required field validation
      if (!product.productName?.trim()) {
        errors.push(`Product ${rowNum}: Name is required`);
      }
      if (!product.productDescription?.trim()) {
        errors.push(`Product ${rowNum}: Description is required`);
      }
      if (!product.productPrice?.trim()) {
        errors.push(`Product ${rowNum}: Price is required`);
      }
      if (!product.productCategory?.trim()) {
        errors.push(`Product ${rowNum}: Category is required`);
      }

      // Price validation
      if (product.productPrice?.trim()) {
        const price = parseFloat(product.productPrice);
        if (isNaN(price) || price < 0) {
          errors.push(`Product ${rowNum}: Invalid price "${product.productPrice}"`);
        }
      }

      // Category validation
      if (product.productCategory?.trim() && !validCategories.includes(product.productCategory.toLowerCase())) {
        errors.push(`Product ${rowNum}: Invalid category "${product.productCategory}"`);
      }

      // Name length validation
      if (product.productName?.trim() && product.productName.trim().length > 100) {
        errors.push(`Product ${rowNum}: Name too long (max 100 characters)`);
      }

      // Description length validation
      if (product.productDescription?.trim() && product.productDescription.trim().length > 1000) {
        errors.push(`Product ${rowNum}: Description too long (max 1000 characters)`);
      }
    });

    return errors;
  };

  const handleBulkUpload = async () => {
    if (products.length === 0) {
      setError('No products to upload');
      return;
    }

    if (products.length > 50) {
      setError('Maximum 50 products can be uploaded at once');
      return;
    }

    // Validate products before upload
    const validationErrors = validateProducts();
    if (validationErrors.length > 0) {
      setError(`Validation errors:\n${validationErrors.slice(0, 10).join('\n')}${validationErrors.length > 10 ? `\n... and ${validationErrors.length - 10} more errors` : ''}`);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await adminProductService.createMultipleProducts(products);

      if (response.success) {
        setUploadResult(response.results);
        setResultDialogOpen(true);
        setSuccess(`Bulk upload completed! ${response.results.successful.length} products created successfully.`);

        if (response.results.failed.length === 0) {
          // If all products were successful, clear the form after a delay
          setTimeout(() => {
            setProducts([]);
            navigate('/admin/products');
          }, 3000);
        }
      } else {
        setError(response.message || 'Failed to upload products');
      }
    } catch (err: unknown) {
      console.error('Error uploading products:', err);
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage = error.response?.data?.message || error.message || 'Failed to upload products';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Bulk Product Upload</Typography>
        <Button
          variant="outlined"
          onClick={() => navigate('/admin/products')}
        >
          Back to Products
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="CSV Upload" />
          <Tab label="Manual Entry" />
        </Tabs>
      </Paper>

      {/* Error and Success Messages */}
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

      {tabValue === 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            CSV Upload
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={downloadTemplate}
              sx={{ mb: 2 }}
            >
              Download CSV Template
            </Button>
          </Box>

          <Paper
            {...getRootProps()}
            sx={{
              p: 4,
              border: '2px dashed',
              borderColor: isDragActive ? 'primary.main' : 'grey.300',
              backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
              cursor: 'pointer',
              textAlign: 'center',
              mb: 3,
            }}
          >
            <input {...getInputProps()} />
            <CloudUploadIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {isDragActive ? 'Drop CSV file here' : 'Drag & drop CSV file here, or click to select'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Upload a CSV file with product data
            </Typography>
          </Paper>
        </Paper>
      )}

      {tabValue === 1 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Manual Product Entry
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addManualProduct}
            >
              Add Product
            </Button>
          </Box>

          {products.map((product, index) => (
            <Paper key={index} sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'grey.300' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1">Product {index + 1}</Typography>
                <IconButton
                  color="error"
                  onClick={() => removeProduct(index)}
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Product Name *"
                    value={product.productName}
                    onChange={(e) => updateProduct(index, 'productName', e.target.value)}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Product Price *"
                    type="number"
                    value={product.productPrice}
                    onChange={(e) => updateProduct(index, 'productPrice', e.target.value)}
                    required
                  />
                </Grid>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    label="Product Description *"
                    multiline
                    rows={3}
                    value={product.productDescription}
                    onChange={(e) => updateProduct(index, 'productDescription', e.target.value)}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Product Category *"
                    value={product.productCategory}
                    onChange={(e) => updateProduct(index, 'productCategory', e.target.value)}
                    required
                    placeholder="e.g., vegetables & fruits"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Product Brand"
                    value={product.productBrand || ''}
                    onChange={(e) => updateProduct(index, 'productBrand', e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Available Weights"
                    value={product.availableWeights?.join(', ') || ''}
                    onChange={(e) => updateProduct(index, 'availableWeights', e.target.value.split(',').map(w => w.trim()))}
                    placeholder="e.g., 250gm, 500gm, 1kg"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Tags"
                    value={product.tags?.join(', ') || ''}
                    onChange={(e) => updateProduct(index, 'tags', e.target.value.split(',').map(t => t.trim()))}
                    placeholder="e.g., organic, fresh, healthy"
                  />
                </Grid>

                {/* Discount Fields */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    select
                    label="Discount Type"
                    value={product.discountType || 'none'}
                    onChange={(e) => updateProduct(index, 'discountType', e.target.value)}
                  >
                    <MenuItem value="none">No Discount</MenuItem>
                    <MenuItem value="percentage">Percentage (%)</MenuItem>
                    <MenuItem value="fixed">Fixed Amount</MenuItem>
                  </TextField>
                </Grid>

                {product.discountType && product.discountType !== 'none' && (
                  <>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label={`Discount Value ${product.discountType === 'percentage' ? '(%)' : '(₹)'}`}
                        type="number"
                        value={product.discountValue || ''}
                        onChange={(e) => updateProduct(index, 'discountValue', e.target.value)}
                        inputProps={{
                          min: 0,
                          step: product.discountType === 'percentage' ? 1 : 0.01,
                          max: product.discountType === 'percentage' ? 100 : undefined
                        }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label="Discount Start Date"
                        type="datetime-local"
                        value={product.discountStartDate || ''}
                        onChange={(e) => updateProduct(index, 'discountStartDate', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label="Discount End Date"
                        type="datetime-local"
                        value={product.discountEndDate || ''}
                        onChange={(e) => updateProduct(index, 'discountEndDate', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>

                    {/* Show calculated discounted price */}
                    {product.productPrice && product.discountValue && (
                      <Grid size={12}>
                        <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 1, mt: 1 }}>
                          <Typography variant="body2" color="success.dark">
                            <strong>Discounted Price: ₹{
                              product.discountType === 'percentage'
                                ? (Number(product.productPrice) - (Number(product.productPrice) * Number(product.discountValue) / 100)).toFixed(2)
                                : (Number(product.productPrice) - Number(product.discountValue)).toFixed(2)
                            }</strong>
                            {' '}(Original: ₹{Number(product.productPrice).toFixed(2)})
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                  </>
                )}
              </Grid>
            </Paper>
          ))}
        </Paper>
      )}

      {/* Products Preview Table */}
      {products.length > 0 && (
        <Paper sx={{ mb: 3 }}>
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6">
              Products to Upload ({products.length})
            </Typography>
          </Box>

          <TableContainer sx={{ maxHeight: 400 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Brand</TableCell>
                  <TableCell>Weights</TableCell>
                  <TableCell>Tags</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((product, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{product.productName}</TableCell>
                    <TableCell>₹{product.productPrice}</TableCell>
                    <TableCell>{product.productCategory}</TableCell>
                    <TableCell>{product.productBrand || '-'}</TableCell>
                    <TableCell>
                      {product.availableWeights?.map((weight: string, i: number) => (
                        <Chip key={i} label={weight} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                      ))}
                    </TableCell>
                    <TableCell>
                      {product.tags?.map((tag: string, i: number) => (
                        <Chip key={i} label={tag} size="small" variant="outlined" sx={{ mr: 0.5, mb: 0.5 }} />
                      ))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Upload Button */}
      {products.length > 0 && (
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={loading ? <CircularProgress size={20} /> : <UploadIcon />}
            onClick={handleBulkUpload}
            disabled={loading}
          >
            {loading ? 'Uploading...' : `Upload ${products.length} Products`}
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => setProducts([])}
            disabled={loading}
          >
            Clear All
          </Button>
        </Box>
      )}

      {/* Upload Results Dialog */}
      <Dialog
        open={resultDialogOpen}
        onClose={() => setResultDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Bulk Upload Results
        </DialogTitle>
        <DialogContent>
          {uploadResult && (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" color="success.main">
                  ✓ {uploadResult.successful.length} products created successfully
                </Typography>
                {uploadResult.failed.length > 0 && (
                  <Typography variant="h6" color="error.main">
                    ✗ {uploadResult.failed.length} products failed
                  </Typography>
                )}
              </Box>

              {uploadResult.failed.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Failed Products:
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Row</TableCell>
                          <TableCell>Product Name</TableCell>
                          <TableCell>Error</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {uploadResult.failed.map((failed, index) => (
                          <TableRow key={index}>
                            <TableCell>{failed.index}</TableCell>
                            <TableCell>{failed.productName}</TableCell>
                            <TableCell>
                              <Typography variant="body2" color="error">
                                {failed.error}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {uploadResult.successful.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Successfully Created Products:
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Row</TableCell>
                          <TableCell>Product Name</TableCell>
                          <TableCell>Category</TableCell>
                          <TableCell>Product ID</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {uploadResult.successful.map((success, index) => (
                          <TableRow key={index}>
                            <TableCell>{success.index}</TableCell>
                            <TableCell>{success.productName}</TableCell>
                            <TableCell>{success.productCategory}</TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                {success.productId}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResultDialogOpen(false)}>
            Close
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setResultDialogOpen(false);
              navigate('/admin/products');
            }}
          >
            View Products
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BulkProductUpload;
