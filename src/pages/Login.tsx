import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Paper,
  Alert,
} from "@mui/material";
import useAuth from "../hooks/useAuth";
import axios from "axios";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message || "Login failed. Please try again."
        );
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
          }}
        >
          <Typography component="h1" variant="h5">
            Quisipp Admin Login
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: "100%", mt: 2 }}>
              {error}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ mt: 1, width: "100%" }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
              // className="bg-black"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;

// import { useState } from "react";
// import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";

// const Login = () => {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [focusedField, setFocusedField] = useState("");

//   // Simulated auth functions - replace with your actual implementations
//   const login = async (email, password) => {
//     // Replace with your actual login logic
//     console.log("Login attempt:", email, password);
//     // Simulate API call
//     await new Promise((resolve) => setTimeout(resolve, 1000));
//     if (email === "test@example.com" && password === "password") {
//       return Promise.resolve();
//     }
//     throw new Error("Invalid credentials");
//   };

//   const navigate = (path) => {
//     // Replace with your actual navigation logic
//     console.log("Navigate to:", path);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");

//     if (!email || !password) {
//       setError("Please enter both email and password");
//       return;
//     }

//     try {
//       setLoading(true);
//       await login(email, password);
//       navigate("/dashboard");
//     } catch (err) {
//       setError(err.message || "Login failed. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
//       {/* Main Container */}
//       <div className="relative w-full max-w-md">
//         {/* Login Card */}
//         <div className="bg-white backdrop-blur-xl border border-gray-100 rounded-3xl shadow-2xl shadow-black/5 p-8 relative overflow-hidden">
//           {/* Subtle gradient overlay */}
//           <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-gray-50/50 pointer-events-none"></div>

//           {/* Content */}
//           <div className="relative z-10">
//             {/* Header */}
//             <div className="text-center mb-8">
//               <div className="inline-flex items-center justify-center w-16 h-16 bg-black rounded-2xl mb-6 shadow-lg shadow-black/20">
//                 <Lock className="w-8 h-8 text-white" />
//               </div>
//               <h1 className="text-2xl font-bold text-gray-900 mb-2">
//                 Welcome Back
//               </h1>
//               <p className="text-gray-600 text-sm">Quisipp Admin Portal</p>
//             </div>

//             {/* Error Alert */}
//             {error && (
//               <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm flex items-center">
//                 <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2 animate-pulse"></div>
//                 {error}
//               </div>
//             )}

//             {/* Form */}
//             <div className="space-y-6">
//               {/* Email Field */}
//               <div className="space-y-2">
//                 <label className="block text-sm font-medium text-gray-700">
//                   Email Address
//                 </label>
//                 <div className="relative">
//                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
//                     <Mail
//                       className={`h-5 w-5 transition-colors duration-200 ${
//                         focusedField === "email"
//                           ? "text-black"
//                           : "text-gray-400"
//                       }`}
//                     />
//                   </div>
//                   <input
//                     type="email"
//                     id="email"
//                     name="email"
//                     autoComplete="email"
//                     autoFocus
//                     required
//                     value={email}
//                     onChange={(e) => setEmail(e.target.value)}
//                     onFocus={() => setFocusedField("email")}
//                     onBlur={() => setFocusedField("")}
//                     className={`w-full pl-12 pr-4 py-3 border rounded-xl transition-all duration-200 bg-gray-50/50 backdrop-blur-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black focus:bg-white ${
//                       focusedField === "email"
//                         ? "border-black shadow-lg shadow-black/5"
//                         : "border-gray-200"
//                     }`}
//                     placeholder="Enter your email"
//                   />
//                 </div>
//               </div>

//               {/* Password Field */}
//               <div className="space-y-2">
//                 <label className="block text-sm font-medium text-gray-700">
//                   Password
//                 </label>
//                 <div className="relative">
//                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
//                     <Lock
//                       className={`h-5 w-5 transition-colors duration-200 ${
//                         focusedField === "password"
//                           ? "text-black"
//                           : "text-gray-400"
//                       }`}
//                     />
//                   </div>
//                   <input
//                     type={showPassword ? "text" : "password"}
//                     id="password"
//                     name="password"
//                     autoComplete="current-password"
//                     required
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     onFocus={() => setFocusedField("password")}
//                     onBlur={() => setFocusedField("")}
//                     className={`w-full pl-12 pr-12 py-3 border rounded-xl transition-all duration-200 bg-gray-50/50 backdrop-blur-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black focus:bg-white ${
//                       focusedField === "password"
//                         ? "border-black shadow-lg shadow-black/5"
//                         : "border-gray-200"
//                     }`}
//                     placeholder="Enter your password"
//                   />
//                   <button
//                     type="button"
//                     className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-black transition-colors duration-200"
//                     onClick={() => setShowPassword(!showPassword)}
//                   >
//                     {showPassword ? (
//                       <EyeOff className="h-5 w-5" />
//                     ) : (
//                       <Eye className="h-5 w-5" />
//                     )}
//                   </button>
//                 </div>
//               </div>

//               {/* Submit Button */}
//               <button
//                 type="submit"
//                 disabled={loading}
//                 className={`w-full bg-black text-white py-3 px-6 rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/20 ${
//                   loading
//                     ? "opacity-75 cursor-not-allowed"
//                     : "hover:bg-gray-900 transform hover:-translate-y-0.5 active:translate-y-0"
//                 }`}
//               >
//                 {loading ? (
//                   <>
//                     <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
//                     <span>Signing in...</span>
//                   </>
//                 ) : (
//                   <>
//                     <span>Sign In</span>
//                     <ArrowRight className="w-5 h-5" />
//                   </>
//                 )}
//               </button>
//             </div>

//             {/* Footer */}
//             <div className="mt-8 pt-6 border-t border-gray-100">
//               <p className="text-center text-xs text-gray-500">
//                 Secure login powered by advanced encryption
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Login;
