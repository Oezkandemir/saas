// Define CORS headers to be used across all edge functions
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Authorization, X-Client-Info, Content-Type, X-Requested-With, apikey, X-API-Key",
};
