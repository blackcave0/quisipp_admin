# Quisipp Admin Dashboard

This is the admin dashboard for the Quisipp product management system. It allows administrators to manage business owners and their products.

## Features

- Admin authentication (login/register)
- Dashboard with overview statistics
- Business owner management
- Product management

## Tech Stack

- React 18
- TypeScript
- Vite
- React Router v6
- Material UI
- Chart.js
- Axios

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the project directory:
   ```
   cd quisipp_admin
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Create a `.env` file in the root directory with the following content:
   ```
   VITE_API_URL=http://localhost:5000/api
   VITE_ADMIN_KEY=your_admin_key_here
   ```
   Replace `your_admin_key_here` with the actual admin key.

### Development

To start the development server:

```
npm run dev
```

The app will be available at `http://localhost:5173`.

### Building for Production

To build the app for production:

```
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Project Structure

- `src/components/` - Reusable UI components
- `src/pages/` - Page components
- `src/context/` - React context providers
- `src/hooks/` - Custom React hooks
- `src/services/` - API services
- `src/utils/` - Utility functions

## Backend API

The dashboard connects to a Node.js/Express backend API running at `http://localhost:5000/api`. Make sure the backend server is running before using the dashboard.

## License

This project is licensed under the ISC License.
