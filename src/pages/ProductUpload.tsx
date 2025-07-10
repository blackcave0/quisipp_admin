import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  // Box,
  // FormGroup,
  FormControlLabel,
  Checkbox,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Card,
  CardMedia,
  CardActions,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { adminProductService, productCommonService } from '../services/productService';
import type { Category, WeightOption } from '../services/productService';

interface FormData {
  productName: string;
  productDescription: string;
  productPrice: string;
  productCategory: string;
  productBrand: string;
  availableWeights: string[];
  tags: string[];
}

interface ImagePreview {
  file: File;
  preview: string;
}

const ProductUpload = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [weightOptions, setWeightOptions] = useState<WeightOption[]>([]);
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [newTag, setNewTag] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<FormData>({
    productName: '',
    productDescription: '',
    productPrice: '',
    productCategory: '',
    productBrand: '',
    availableWeights: [],
    tags: [],
  });

  // Load categories and weight options
  useEffect(() => {
    const loadData = async () => {
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
        console.error('Error loading form data:', error);
        setError('Failed to load form data');
      }
    };

    loadData();
  }, []);

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    maxFiles: 20,
    maxSize: 5 * 1024 * 1024, // 5MB
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        setError('Some files were rejected. Please check file type and size limits.');
        return;
      }

      const newImages = acceptedFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file),
      }));

      setImages(prev => {
        const combined = [...prev, ...newImages];
        if (combined.length > 20) {
          setError('Maximum 20 images allowed');
          return prev;
        }
        return combined;
      });
    },
  });

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle weight checkbox changes
  const handleWeightChange = (weight: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      availableWeights: checked
        ? [...prev.availableWeights, weight]
        : prev.availableWeights.filter(w => w !== weight),
    }));
  };

  // Add tag
  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  // Remove tag
  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  // Remove image
  const handleRemoveImage = (index: number) => {
    setImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!formData.productName.trim()) {
      setError('Product name is required');
      return false;
    }

    if (!formData.productDescription.trim()) {
      setError('Product description is required');
      return false;
    }

    if (!formData.productPrice || isNaN(Number(formData.productPrice)) || Number(formData.productPrice) <= 0) {
      setError('Valid product price is required');
      return false;
    }

    if (!formData.productCategory) {
      setError('Product category is required');
      return false;
    }

    if (formData.availableWeights.length === 0) {
      setError('At least one weight option must be selected');
      return false;
    }

    if (images.length < 3) {
      setError('Minimum 3 product images are required');
      return false;
    }

    if (images.length > 20) {
      setError('Maximum 20 product images are allowed');
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Create FormData for file upload
      const uploadData = new FormData();

      // Add form fields
      uploadData.append('productName', formData.productName.trim());
      uploadData.append('productDescription', formData.productDescription.trim());
      uploadData.append('productPrice', formData.productPrice);
      uploadData.append('productCategory', formData.productCategory);

      if (formData.productBrand.trim()) {
        uploadData.append('productBrand', formData.productBrand.trim());
      }

      // Add available weights
      formData.availableWeights.forEach(weight => {
        uploadData.append('availableWeights', weight);
      });

      // Add tags
      if (formData.tags.length > 0) {
        uploadData.append('tags', formData.tags.join(','));
      }

      // Add images
      images.forEach(image => {
        uploadData.append('productImages', image.file);
      });

      const response = await adminProductService.createProduct(uploadData);

      if (response.success) {
        setSuccess('Product created successfully!');

        // Reset form after successful submission
        setTimeout(() => {
          navigate('/admin/products');
        }, 2000);
      } else {
        setError(response.message || 'Failed to create product');
      }

    } catch (error) {
      if (error instanceof Error) {
        // Try to extract error message from possible Axios error structure
        // @ts-expect-error: error may have response property if it's an AxiosError
        const apiMessage = error?.response?.data?.message;
        setError(apiMessage || error.message || 'Failed to create product');
        console.error('Error creating product:', error);
      } else {
        setError('Failed to create product');
        console.error('Unknown error creating product:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Cleanup image previews on unmount
  useEffect(() => {
    return () => {
      images.forEach(image => URL.revokeObjectURL(image.preview));
    };
  }, [images]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Upload New Product
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid size={12}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Product Name"
                name="productName"
                value={formData.productName}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Product Price (₹)"
                name="productPrice"
                type="number"
                value={formData.productPrice}
                onChange={handleInputChange}
                required
                disabled={loading}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.productCategory}
                  label="Category"
                  onChange={(e) => handleSelectChange('productCategory', e.target.value)}
                  disabled={loading}
                >
                  {categories.map((category) => (
                    <MenuItem key={category.value} value={category.value}>
                      {category.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Brand (Optional)"
                name="productBrand"
                value={formData.productBrand}
                onChange={handleInputChange}
                disabled={loading}
              />
            </Grid>

            <Grid size={12}>
              <TextField
                fullWidth
                label="Product Description"
                name="productDescription"
                value={formData.productDescription}
                onChange={handleInputChange}
                required
                multiline
                rows={4}
                disabled={loading}
              />
            </Grid>

            {/* Weight Options */}
            <Grid size={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Available Weight Options
              </Typography>
              {(() => {
                // Group weight options by unit
                const unitOrder = ['gm', 'kg', 'ml', 'ltr', 'custom'];
                const grouped: { [unit: string]: typeof weightOptions } = {};
                weightOptions.forEach((weight) => {
                  // Try to extract unit from label (e.g., "500 gm" or "1 kg")
                  const match = weight.label.match(/\b(gm|kg|ml|ltr|custom)\b/i);
                  const unit = match ? match[1].toLowerCase() : 'custom';
                  if (!grouped[unit]) grouped[unit] = [];
                  grouped[unit].push(weight);
                });

                return (
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-around',
                      gap: 2,
                      alignItems: 'center',
                      alignContent: 'center',
                      mt: 1,
                    }}
                  >
                    {unitOrder.map((unit) =>
                      grouped[unit] && grouped[unit].length > 0 ? (
                        <Box key={unit}>
                          <Typography variant="subtitle1" sx={{ mb: 1, textTransform: 'uppercase', mr: 1 }}>
                            {unit}
                          </Typography>
                          {grouped[unit].map((weight) => (
                            <FormControlLabel
                              key={weight.value}
                              control={
                                <Checkbox
                                  checked={formData.availableWeights.includes(weight.value)}
                                  onChange={(e) => handleWeightChange(weight.value, e.target.checked)}
                                  disabled={loading}
                                />
                              }
                              label={weight.label}
                            />
                          ))}
                        </Box>
                      ) : null
                    )}
                  </Box>
                );
              })()}
            </Grid>

            {/* Tags */}
            <Grid size={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Tags (Optional)
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
                <TextField
                  label="Add Tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  disabled={loading}
                  size="small"
                />
                <IconButton onClick={handleAddTag} disabled={loading || !newTag.trim()}>
                  <AddIcon />
                </IconButton>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    disabled={loading}
                  />
                ))}
              </Box>
            </Grid>

            {/* Image Upload */}
            <Grid size={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Product Images (Min: 3, Max: 20)
              </Typography>

              <Paper
                {...getRootProps()}
                sx={{
                  p: 3,
                  border: '2px dashed',
                  borderColor: isDragActive ? 'primary.main' : 'grey.300',
                  backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
                  cursor: 'pointer',
                  textAlign: 'center',
                  mb: 2,
                }}
              >
                <input {...getInputProps()} />
                <UploadIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  {isDragActive ? 'Drop images here' : 'Drag & drop images here, or click to select'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Supported formats: JPEG, PNG, WebP (Max 5MB each)
                </Typography>
              </Paper>

              {/* Image Previews */}
              {images.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Selected Images ({images.length}/20)
                  </Typography>
                  <Grid container spacing={2}>
                    {images.map((image, index) => (
                      <Grid size={{ xs: 6, sm: 4, md: 3 }} key={index}>
                        <Card>
                          <CardMedia
                            component="img"
                            height="140"
                            image={image.preview}
                            alt={`Preview ${index + 1}`}
                            sx={{ objectFit: 'cover' }}
                          />
                          <CardActions>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveImage(index)}
                              disabled={loading}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </CardActions>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </Grid>

            {/* Submit Button */}
            <Grid size={12}>
              <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <UploadIcon />}
                >
                  {loading ? 'Uploading...' : 'Upload Product'}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/admin/products')}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};

export default ProductUpload;
