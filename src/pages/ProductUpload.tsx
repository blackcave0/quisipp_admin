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

interface CustomWeight {
  value: string;
  unit: string;
  description: string;
}

interface CustomWeightUnit {
  value: string;
  label: string;
}

interface FormData {
  productName: string;
  productDescription: string;
  productPrice: string;
  productCategory: string;
  productBrand: string;
  availableWeights: string[];
  customWeights: CustomWeight[];
  discountType: string;
  discountValue: string;
  discountStartDate: string;
  discountEndDate: string;
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
  const [customWeightUnits, setCustomWeightUnits] = useState<CustomWeightUnit[]>([]);
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
    customWeights: [],
    discountType: 'none',
    discountValue: '',
    discountStartDate: '',
    discountEndDate: '',
    tags: [],
  });

  // Load categories, weight options, and custom weight units
  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesRes, weightsRes, customUnitsRes] = await Promise.all([
          productCommonService.getCategories(),
          productCommonService.getWeightOptions(),
          productCommonService.getCustomWeightUnits(),
        ]);

        if (categoriesRes.success) {
          setCategories(categoriesRes.categories);
        }

        if (weightsRes.success) {
          setWeightOptions(weightsRes.weightOptions);
        }

        if (customUnitsRes.success) {
          setCustomWeightUnits(customUnitsRes.customWeightUnits);
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
    setFormData(prev => {
      const newAvailableWeights = checked
        ? [...prev.availableWeights, weight]
        : prev.availableWeights.filter(w => w !== weight);

      // If "custom" is being selected and there are no custom weights, add one
      if (weight === 'custom' && checked && prev.customWeights.length === 0) {
        return {
          ...prev,
          availableWeights: newAvailableWeights,
          customWeights: [{ value: '', unit: 'gm', description: '' }],
        };
      }

      // If "custom" is being deselected, clear custom weights
      if (weight === 'custom' && !checked) {
        return {
          ...prev,
          availableWeights: newAvailableWeights,
          customWeights: [],
        };
      }

      return {
        ...prev,
        availableWeights: newAvailableWeights,
      };
    });
  };

  // Add custom weight
  const handleAddCustomWeight = () => {
    setFormData(prev => ({
      ...prev,
      customWeights: [...prev.customWeights, { value: '', unit: 'gm', description: '' }],
    }));
  };

  // Update custom weight
  const handleCustomWeightChange = (index: number, field: keyof CustomWeight, value: string) => {
    setFormData(prev => ({
      ...prev,
      customWeights: prev.customWeights.map((weight, i) =>
        i === index ? { ...weight, [field]: value } : weight
      ),
    }));
  };

  // Remove custom weight
  const handleRemoveCustomWeight = (index: number) => {
    setFormData(prev => ({
      ...prev,
      customWeights: prev.customWeights.filter((_, i) => i !== index),
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

    // Validate custom weights if "custom" is selected
    if (formData.availableWeights.includes('custom')) {
      if (formData.customWeights.length === 0) {
        setError('Custom weight details are required when custom weight is selected');
        return false;
      }

      for (const customWeight of formData.customWeights) {
        if (!customWeight.value.trim() || !customWeight.unit) {
          setError('All custom weight entries must have value and unit');
          return false;
        }
      }
    }

    if (images.length < 3) {
      setError('Minimum 3 product images are required');
      return false;
    }

    if (images.length > 20) {
      setError('Maximum 20 product images are allowed');
      return false;
    }

    // Validate discount fields
    if (formData.discountType !== 'none') {
      if (!formData.discountValue || isNaN(Number(formData.discountValue)) || Number(formData.discountValue) <= 0) {
        setError('Valid discount value is required when discount is enabled');
        return false;
      }

      if (formData.discountType === 'percentage' && Number(formData.discountValue) > 100) {
        setError('Percentage discount cannot exceed 100%');
        return false;
      }

      if (formData.discountType === 'fixed' && Number(formData.discountValue) >= Number(formData.productPrice)) {
        setError('Fixed discount cannot be greater than or equal to product price');
        return false;
      }

      if (formData.discountStartDate && formData.discountEndDate) {
        if (new Date(formData.discountStartDate) >= new Date(formData.discountEndDate)) {
          setError('Discount start date must be before end date');
          return false;
        }
      }
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

      // Add custom weights if "custom" is selected
      if (formData.availableWeights.includes('custom')) {
        uploadData.append('customWeights', JSON.stringify(formData.customWeights));
      }

      // Add discount fields
      uploadData.append('discountType', formData.discountType);
      if (formData.discountValue) {
        uploadData.append('discountValue', formData.discountValue);
      }
      if (formData.discountStartDate) {
        uploadData.append('discountStartDate', formData.discountStartDate);
      }
      if (formData.discountEndDate) {
        uploadData.append('discountEndDate', formData.discountEndDate);
      }

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

            {/* Discount Section */}
            <Grid size={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Discount Settings (Optional)
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Discount Type</InputLabel>
                <Select
                  value={formData.discountType}
                  label="Discount Type"
                  onChange={(e) => handleSelectChange('discountType', e.target.value)}
                  disabled={loading}
                >
                  <MenuItem value="none">No Discount</MenuItem>
                  <MenuItem value="percentage">Percentage (%)</MenuItem>
                  <MenuItem value="fixed">Fixed Amount</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {formData.discountType !== 'none' && (
              <>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label={`Discount Value ${formData.discountType === 'percentage' ? '(%)' : '(₹)'}`}
                    name="discountValue"
                    type="number"
                    value={formData.discountValue}
                    onChange={handleInputChange}
                    disabled={loading}
                    inputProps={{
                      min: 0,
                      step: formData.discountType === 'percentage' ? 1 : 0.01,
                      max: formData.discountType === 'percentage' ? 100 : undefined
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Discount Start Date (Optional)"
                    name="discountStartDate"
                    type="datetime-local"
                    value={formData.discountStartDate}
                    onChange={handleInputChange}
                    disabled={loading}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Discount End Date (Optional)"
                    name="discountEndDate"
                    type="datetime-local"
                    value={formData.discountEndDate}
                    onChange={handleInputChange}
                    disabled={loading}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                {/* Show calculated discounted price */}
                {formData.productPrice && formData.discountValue && (
                  <Grid size={12}>
                    <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 1, mt: 1 }}>
                      <Typography variant="body2" color="success.dark">
                        <strong>Discounted Price: ₹{
                          formData.discountType === 'percentage'
                            ? (Number(formData.productPrice) - (Number(formData.productPrice) * Number(formData.discountValue) / 100)).toFixed(2)
                            : (Number(formData.productPrice) - Number(formData.discountValue)).toFixed(2)
                        }</strong>
                        {' '}(Original: ₹{Number(formData.productPrice).toFixed(2)})
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </>
            )}

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

            {/* Custom Weight Options */}
            {formData.availableWeights.includes('custom') && (
              <Grid size={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Custom Weight/Volume Options
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Define custom weight/volume options for this product
                </Typography>

                {formData.customWeights.map((customWeight, index) => (
                  <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'grey.300', borderRadius: 1 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid size={{ xs: 12, sm: 3 }}>
                        <TextField
                          fullWidth
                          label="Value"
                          value={customWeight.value}
                          onChange={(e) => handleCustomWeightChange(index, 'value', e.target.value)}
                          placeholder="e.g., 750, 2.5"
                          required
                          disabled={loading}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 3 }}>
                        <FormControl fullWidth required>
                          <InputLabel>Unit</InputLabel>
                          <Select
                            value={customWeight.unit}
                            label="Unit"
                            onChange={(e) => handleCustomWeightChange(index, 'unit', e.target.value)}
                            disabled={loading}
                          >
                            {customWeightUnits.map((unit) => (
                              <MenuItem key={unit.value} value={unit.value}>
                                {unit.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 5 }}>
                        <TextField
                          fullWidth
                          label="Description (Optional)"
                          value={customWeight.description}
                          onChange={(e) => handleCustomWeightChange(index, 'description', e.target.value)}
                          placeholder="e.g., Perfect for small families"
                          disabled={loading}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 1 }}>
                        <IconButton
                          color="error"
                          onClick={() => handleRemoveCustomWeight(index)}
                          disabled={loading}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Box>
                ))}

                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddCustomWeight}
                  disabled={loading}
                  sx={{ mt: 1 }}
                >
                  Add Custom Weight Option
                </Button>
              </Grid>
            )}

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
