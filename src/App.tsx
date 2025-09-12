import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import useAuth from './hooks/useAuth';

// Layouts
import Layout from './components/layout/Layout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import BusinessOwners from './pages/BusinessOwners';
import DeliveryPersons from './pages/DeliveryPersons';
import AdminProducts from './pages/AdminProducts';
import ProductUpload from './pages/ProductUpload';
import ProductEdit from './pages/ProductEdit';
import BulkProductUpload from './components/BulkProductUpload';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
  },
});

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Auth wrapper component to handle context properly
const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  return <AuthProvider>{children}</AuthProvider>;
};

// Main App component
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthWrapper>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="business-owners" element={<BusinessOwners />} />
              <Route path="delivery-persons" element={<DeliveryPersons />} />
              <Route path="admin/products" element={<AdminProducts />} />
              <Route path="admin/products/upload" element={<ProductUpload />} />
              <Route path="admin/products/edit/:id" element={<ProductEdit />} />
              <Route path="admin/products/bulk-upload" element={<BulkProductUpload />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </AuthWrapper>
      </Router>
    </ThemeProvider>
  );
}

export default App;
