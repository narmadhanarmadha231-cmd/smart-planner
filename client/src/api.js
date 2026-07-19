// Dynamic API URL depending on Environment
// In local development, it falls back to empty string so the Vite proxy works.
// In production, it uses the VITE_API_BASE_URL environment variable from Vercel.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
