const isProduction = import.meta.env.PROD;

export const API_URL = isProduction
  ? ""
  : import.meta.env.VITE_API_URL || "http://localhost:4000";
