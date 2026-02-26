// ============================================
// MISTY FRONTEND CONFIGURATION
// ============================================
// 
// Change the BACKEND_URL to point to your server
// 
// DEVELOPMENT:
//   const BACKEND_URL = "http://127.0.0.1:8000";
// 
// PRODUCTION (example):
//   const BACKEND_URL = "https://api.yourdomain.com";
//   const BACKEND_URL = "https://misty-server.example.com";
//
// ============================================

const BACKEND_URL = "http://127.0.0.1:8000";

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BACKEND_URL };
}
