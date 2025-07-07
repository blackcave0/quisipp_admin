import api from './api';

// Types
export interface ProductImage {
  url: string;
  publicId: string;
  folder: string;
  originalName?: string;
  size?: number;
  format?: string;
}

export interface AdminProduct {
  _id: string;
  productName: string;
  productDescription: string;
  productPrice: number;
  productCategory: string;
  productBrand?: string;
  availableWeights: string[];
  cloudinaryUrls: ProductImage[];
  createdBy: {
    _id: string;
    email: string;
    role: string;
  };
  isActive: boolean;
  adoptionCount: number;
  tags: string[];
  searchKeywords: string[];
  createdAt: string;
  updatedAt: string;
  isAdopted?: boolean;
}

export interface AdoptedProduct {
  _id: string;
  productName: string;
  productDescription: string;
  productPrice: number;
  productCategory: string;
  productBrand?: string;
  productImages: Array<{
    imageUrl: string;
    publicId: string;
  }>;
  cloudinaryUrls: ProductImage[];
  availableWeights: string[];
  selectedWeight: string;
  productQuantity: number;
  stockStatus: 'inStock' | 'outOfStock';
  originalProductId: string;
  businessOwnerPhone?: string;
  businessOwnerEmail?: string;
  businessOwnerAddress?: string;
  productCreatedAt: string;
  productUpdatedAt: string;
}

export interface ProductSearchOptions {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  weights?: string[];
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalProducts: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ProductResponse {
  success: boolean;
  products: AdminProduct[];
  pagination: PaginationInfo;
}

export interface AdoptedProductResponse {
  success: boolean;
  products: AdoptedProduct[];
  pagination: PaginationInfo;
}

export interface Category {
  value: string;
  label: string;
}

export interface WeightOption {
  value: string;
  label: string;
}

// Admin Product Services
export const adminProductService = {
  // Create new product
  createProduct: async (formData: FormData) => {
    const response = await api.post('/admin/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get all admin products
  getProducts: async (options: ProductSearchOptions = {}): Promise<ProductResponse> => {
    const params = new URLSearchParams();
    
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          params.append(key, value.join(','));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    const response = await api.get(`/admin/products?${params.toString()}`);
    return response.data;
  },

  // Get single product
  getProductById: async (id: string) => {
    const response = await api.get(`/admin/products/${id}`);
    return response.data;
  },

  // Update product
  updateProduct: async (id: string, updateData: Partial<AdminProduct>) => {
    const response = await api.put(`/admin/products/${id}`, updateData);
    return response.data;
  },

  // Delete product
  deleteProduct: async (id: string) => {
    const response = await api.delete(`/admin/products/${id}`);
    return response.data;
  },
};

// Business Owner Product Services
export const businessOwnerProductService = {
  // Search available products
  searchProducts: async (options: ProductSearchOptions = {}): Promise<ProductResponse> => {
    const params = new URLSearchParams();
    
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          params.append(key, value.join(','));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    const response = await api.get(`/business-owner/products/search?${params.toString()}`);
    return response.data;
  },

  // Adopt product
  adoptProduct: async (productId: string, adoptionData: {
    selectedWeights: string[];
    stockStatus?: 'inStock' | 'outOfStock';
    productQuantity?: number;
  }) => {
    const response = await api.post(`/business-owner/products/adopt/${productId}`, adoptionData);
    return response.data;
  },

  // Get adopted products
  getAdoptedProducts: async (options: ProductSearchOptions = {}): Promise<AdoptedProductResponse> => {
    const params = new URLSearchParams();
    
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          params.append(key, value.join(','));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    const response = await api.get(`/business-owner/products/adopted?${params.toString()}`);
    return response.data;
  },

  // Update adopted product
  updateAdoptedProduct: async (productId: string, updateData: {
    stockStatus?: 'inStock' | 'outOfStock';
    productQuantity?: number;
    selectedWeight?: string;
  }) => {
    const response = await api.put(`/business-owner/products/adopted/${productId}`, updateData);
    return response.data;
  },

  // Remove adopted product
  removeAdoptedProduct: async (productId: string) => {
    const response = await api.delete(`/business-owner/products/adopted/${productId}`);
    return response.data;
  },
};

// Common Services
export const productCommonService = {
  // Get categories
  getCategories: async (): Promise<{ success: boolean; categories: Category[] }> => {
    const response = await api.get('/categories');
    return response.data;
  },

  // Get weight options
  getWeightOptions: async (): Promise<{ success: boolean; weightOptions: WeightOption[] }> => {
    const response = await api.get('/weight-options');
    return response.data;
  },

  // Health check
  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

// Utility functions
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(price);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const getCategoryLabel = (categories: Category[], value: string): string => {
  const category = categories.find(cat => cat.value === value);
  return category ? category.label : value;
};

export const getWeightLabel = (weightOptions: WeightOption[], value: string): string => {
  const weight = weightOptions.find(w => w.value === value);
  return weight ? weight.label : value;
};
