import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  PeopleOutline as PeopleIcon,
  Inventory2 as ProductsIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import { businessOwnerService } from '../services/api';
import { adminProductService } from '../services/productService';
import useAuth from '../hooks/useAuth';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement);

// Define types
interface BusinessOwner {
  _id: string;
  email: string;
  businessName?: string;
  products?: unknown[];
  lastActive?: string;
  [key: string]: unknown;
}

interface StatsData {
  totalBusinessOwners: number;
  totalProducts: number;
  activeBusinessOwners: number;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  color: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsData>({
    totalBusinessOwners: 0,
    totalProducts: 0,
    activeBusinessOwners: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch business owners and admin products in parallel
        const [businessOwnersResponse, productsResponse] = await Promise.all([
          businessOwnerService.getAllBusinessOwners(),
          adminProductService.getProducts({ limit: 1 }) // Just get pagination info, minimal data
        ]);

        const owners: BusinessOwner[] = businessOwnersResponse.data.businessOwners || [];
        const activeOwners = owners.filter((owner: BusinessOwner) =>
          owner.lastActive && new Date(owner.lastActive) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        ).length;

        // Get total products from admin products API
        const totalProducts = productsResponse.pagination.totalProducts;

        setStats({
          totalBusinessOwners: owners.length,
          totalProducts,
          activeBusinessOwners: activeOwners,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Dummy data for charts
  const doughnutData = {
    labels: ['Grocery', 'Electronics', 'Clothing', 'Home', 'Other'],
    datasets: [
      {
        data: [35, 25, 20, 15, 5],
        backgroundColor: [
          '#4CAF50',
          '#2196F3',
          '#FF9800',
          '#9C27B0',
          '#F44336',
        ],
        borderWidth: 1,
      },
    ],
  };

  const lineData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Business Owners',
        data: [5, 8, 12, 15, 20, stats.totalBusinessOwners],
        borderColor: '#2196F3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Products',
        data: [10, 20, 35, 50, 70, stats.totalProducts],
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const StatCard = ({ title, value, icon, color }: StatCardProps) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4">{value}</Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: `${color}20`,
              borderRadius: '50%',
              width: 60,
              height: 60,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        Welcome back, {user?.email}! Here's an overview of your business.
      </Typography>

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Total Business Owners"
            value={stats.totalBusinessOwners}
            icon={<PeopleIcon sx={{ fontSize: 30, color: '#2196F3' }} />}
            color="#2196F3"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Total Products"
            value={stats.totalProducts}
            icon={<ProductsIcon sx={{ fontSize: 30, color: '#4CAF50' }} />}
            color="#4CAF50"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Active Business Owners"
            value={stats.activeBusinessOwners}
            icon={<TrendingUpIcon sx={{ fontSize: 30, color: '#FF9800' }} />}
            color="#FF9800"
          />
        </Grid>

        {/* Charts */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Growth Overview
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ height: 300 }}>
              <Line
                data={lineData}
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top' as const,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Product Categories
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Doughnut
                data={doughnutData}
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom' as const,
                    },
                  },
                }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 