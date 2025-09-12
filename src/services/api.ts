import axios from "axios";

// Define types
interface BusinessOwnerData {
  email?: string;
  phoneNumber?: string;
  businessName?: string;
  address?: string;
  [key: string]: string | number | boolean | undefined;
}

// Define types for DeliveryPerson
interface DeliveryPersonData {
  email?: string;
  phoneNumber?: string;
  name?: string;
  address?: string;
  [key: string]: string | number | boolean | undefined;
}

// Default admin key to use if environment variable is not available
const DEFAULT_ADMIN_KEY = "admin_secret_key";

// Create axios instance with base URL
const api = axios.create({
  baseURL: "https://quisipp-admin-backend.onrender.com/api",
  // baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include token in headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle rate limiting and other errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 429) {
      // Handle rate limiting
      console.warn("Rate limited by server. Please try again later.");
      // You could show a toast notification here
    }
    return Promise.reject(error);
  }
);

// Get admin key from environment or localStorage or use default
const getAdminKey = () => {
  try {
    return (
      import.meta.env.VITE_ADMIN_KEY ||
      localStorage.getItem("adminKey") ||
      DEFAULT_ADMIN_KEY
    );
  } catch {
    // If import.meta.env is not available
    return localStorage.getItem("adminKey") || DEFAULT_ADMIN_KEY;
  }
};

// Auth services
export const authService = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),

  register: (email: string, password: string, adminSecret: string) =>
    api.post("/auth/register", { email, password, adminSecret }),
};

// Business owner services
export const businessOwnerService = {
  getAllBusinessOwners: async () => {
    try {
      const response = await api.get("/auth/all-business-owners", {
        headers: {
          "x-admin-key": getAdminKey(),
        },
      });

      // Ensure the response has the expected structure
      if (!response.data) {
        console.error("Invalid response format: missing data");
        return { data: { businessOwners: [] } };
      }

      // Transform the response to match what the component expects
      if (
        response.data.businessOwners &&
        typeof response.data.businessOwners === "object" &&
        response.data.businessOwners.data &&
        Array.isArray(response.data.businessOwners.data)
      ) {
        // Extract the array directly
        const transformedResponse = {
          ...response,
          data: {
            ...response.data,
            businessOwners: response.data.businessOwners.data,
          },
        };
        return transformedResponse;
      }

      return response;
    } catch (error) {
      console.error("Error in getAllBusinessOwners:", error);
      throw error;
    }
  },

  createBusinessOwner: (businessOwnerData: BusinessOwnerData) =>
    api.post("/auth/create-business-owner", businessOwnerData),

  updateBusinessOwner: (id: string, businessOwnerData: BusinessOwnerData) =>
    api.put(`/auth/update-business-owner/${id}`, businessOwnerData, {
      headers: {
        "x-admin-key": getAdminKey(),
      },
    }),
};

// Delivery person services
export const deliveryPersonService = {
  getAllDeliveryPersons: async () => {
    try {
      const response = await api.get("/auth/all-delivery-persons", {
        headers: {
          "x-admin-key": getAdminKey(),
        },
      });
      return response;
    } catch (error) {
      console.error("Error in getAllDeliveryPersons:", error);
      throw error;
    }
  },

  createDeliveryPerson: (deliveryPersonData: DeliveryPersonData) =>
    api.post("/auth/create-delivery-person", deliveryPersonData),

  updateDeliveryPerson: (id: string, deliveryPersonData: DeliveryPersonData) =>
    api.put(`/auth/update-delivery-person/${id}`, deliveryPersonData, {
      headers: {
        "x-admin-key": getAdminKey(),
      },
    }),
};

export default api;
