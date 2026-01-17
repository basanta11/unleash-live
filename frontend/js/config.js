/**
 * Configuration file for API endpoints
 * 
 * To change the API URL for local development:
 * 1. Edit this file directly and change API_BASE_URL to 'http://localhost:3000/dev'
 * 2. Or set window.API_BASE_URL before this script loads
 * 3. Or use config.local.js (copy from config.local.js.example) and load it instead
 */

// Default API base URL (production)
// Change this to 'http://localhost:3000/dev' for local backend development
const API_BASE_URL = window.API_BASE_URL || 
  'https://aj6m5tp44h.execute-api.ap-southeast-2.amazonaws.com/dev';

// Export for use in api.js
window.API_CONFIG = {
  API_BASE_URL: API_BASE_URL
};

console.log('API Base URL configured:', API_BASE_URL);
