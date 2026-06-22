// Production API configuration (optional direct backend URL)
export const PRODUCTION_API_URL =
  import.meta.env.VITE_API_URL ||
  "https://personal-finance-expense-app.onrender.com";

// Development API configuration
export const DEVELOPMENT_API_URL = "http://localhost:5000";

// Determine API URL based on environment
export const API_BASE_URL =
  import.meta.env.MODE === "production"
    ? PRODUCTION_API_URL
    : import.meta.env.VITE_API_URL || DEVELOPMENT_API_URL;
