import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Grid,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  FormControlLabel,
  Checkbox,
  FormGroup,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import {
  adminProductService,
  productCommonService,
  type AdminProduct,
  type Category,
  type WeightOption,
} from '../services/productService';

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
  isActive: boolean;
}

const ProductEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [weightOptions, setWeightOptions] = useState<WeightOption[]>([]);
  const [customWeightUnits, setCustomWeightUnits] = useState<CustomWeightUnit[]>([]);
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
    isActive: true,
  });

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesRes, weightsRes, customUnitsRes, productRes] = await Promise.all([
          productCommonService.getCategories(),
          productCommonService.getWeightOptions(),
          productCommonService.getCustomWeightUnits(),
          adminProductService.getProductById(id!),
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

        if (productRes.success) {
          const product: AdminProduct = productRes.product;
          
          // Check if product has custom weights and add "custom" to availableWeights for UI
          const displayWeights = [...product.availableWeights];
          if (product.customWeights && product.customWeights.length > 0) {
            displayWeights.push('custom');
          }

          setFormData({
            productName: product.productName,
            productDescription: product.productDescription,
            productPrice: product.productPrice.toString(),
            productCategory: product.productCategory,
            productBrand: product.productBrand || '',
            availableWeights: displayWeights,
            customWeights: product.customWeights?.map(cw => ({
              value: cw.value.toString(),
              unit: cw.unit,
              description: cw.description || '',
            })) || [],
            discountType: product.discountType || 'none',
            discountValue: product.discountValue?.toString() || '',
            discountStartDate: product.discountStartDate ? 
              new Date(product.discountStartDate).toISOString().slice(0, 16) : '',
            discountEndDate: product.discountEndDate ? 
              new Date(product.discountEndDate).toISOString().slice(0, 16) : '',
            tags: product.tags || [],
            isActive: product.isActive,
          });
        } else {
          setError('Failed to load product data');
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load form data');
      } finally {
        setInitialLoading(false);
      }
    };

    if (id) {
      loadData();
    }
  }, [id]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
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
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Prepare update data
      const updateData: Partial<AdminProduct> = {
        productName: formData.productName.trim(),
        productDescription: formData.productDescription.trim(),
        productPrice: parseFloat(formData.productPrice),
        productCategory: formData.productCategory,
        productBrand: formData.productBrand.trim() || undefined,
        availableWeights: formData.availableWeights.filter(w => w !== 'custom'), // Remove "custom" before sending
        customWeights: formData.customWeights.length > 0 ? formData.customWeights : undefined,
        discountType: formData.discountType,
        discountValue: formData.discountValue ? parseFloat(formData.discountValue) : 0,
        discountStartDate: formData.discountStartDate || undefined,
        discountEndDate: formData.discountEndDate || undefined,
        tags: formData.tags,
        isActive: formData.isActive,
      };

      const response = await adminProductService.updateProduct(id!, updateData);

      if (response.success) {
        setSuccess('Product updated successfully!');
        
        // Navigate back to products list after a short delay
        setTimeout(() => {
          navigate('/admin/products');
        }, 2000);
      } else {
        setError(response.message || 'Failed to update product');
      }
    } catch (error: any) {
      console.error('Error updating product:', error);
      setError(error.response?.data?.message || 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h4" component="h1">
            Edit Product
          </Typography>
          <Button
            variant="outlined"
            startIcon={<CancelIcon />}
            onClick={() => navigate('/admin/products')}
          >
            Cancel
          </Button>
        </Box>

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
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
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

            <Grid item xs={12} md={6}>
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

            <Grid item xs={12} md={6}>
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

            <Grid item xs={12} md={6}>
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
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Discount Settings (Optional)
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
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
                <Grid item xs={12} md={4}>
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

                <Grid item xs={12} md={4}>
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

                <Grid item xs={12} md={4}>
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
                  <Grid item xs={12}>
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

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Product Description"
                name="productDescription"
                value={formData.productDescription}
                onChange={handleInputChange}
                required
                disabled={loading}
                multiline
                rows={4}
              />
            </Grid>

            {/* Weight Options */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Available Weight/Volume Options
              </Typography>
              <FormGroup row>
                {weightOptions.map((option) => (
                  <FormControlLabel
                    key={option.value}
                    control={
                      <Checkbox
                        checked={formData.availableWeights.includes(option.value)}
                        onChange={(e) => handleWeightChange(option.value, e.target.checked)}
                        disabled={loading}
                      />
                    }
                    label={option.label}
                  />
                ))}
              </FormGroup>
            </Grid>

            {/* Custom Weight Options */}
            {formData.availableWeights.includes('custom') && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Custom Weight/Volume Options
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Define custom weight/volume options for this product
                </Typography>

                {formData.customWeights.map((customWeight, index) => (
                  <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'grey.300', borderRadius: 1 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={3}>
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
                      <Grid item xs={12} sm={3}>
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
                      <Grid item xs={12} sm={5}>
                        <TextField
                          fullWidth
                          label="Description (Optional)"
                          value={customWeight.description}
                          onChange={(e) => handleCustomWeightChange(index, 'description', e.target.value)}
                          placeholder="e.g., Perfect for small families"
                          disabled={loading}
                        />
                      </Grid>
                      <Grid item xs={12} sm={1}>
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
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Tags (Optional)
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {formData.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    disabled={loading}
                  />
                ))}
              </Box>

              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
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
                <Button
                  variant="outlined"
                  onClick={handleAddTag}
                  disabled={loading || !newTag.trim()}
                >
                  Add
                </Button>
              </Box>
            </Grid>

            {/* Product Status */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    disabled={loading}
                  />
                }
                label="Product is active"
              />
            </Grid>

            {/* Submit Button */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/admin/products')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Product'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};

export default ProductEdit;
