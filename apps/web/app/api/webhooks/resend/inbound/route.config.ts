// Route configuration to prevent redirects
export const config = {
  api: {
    bodyParser: false, // Disable body parsing to get raw body
    responseLimit: false,
  },
};
