// utils/debugUtils.ts
/**
 * Utility functions for debugging environment variables and API keys
 */

/**
 * Check if the Bytez API key is properly configured
 * @returns Object with status and message
 */
export function checkApiKeyConfiguration() {
  // @ts-nocheck
  try {
    // Try multiple methods to access the API key
    const apiKey = import.meta.env?.VITE_BYTEZ_API_KEY || 
                   process.env.VITE_BYTEZ_API_KEY || 
                   process.env.API_KEY;
    
    if (!apiKey) {
      return {
        status: 'error',
        message: 'API key not found in any environment variable'
      };
    }
    
    if (apiKey.length < 20) {
      return {
        status: 'warning',
        message: 'API key found but appears to be too short'
      };
    }
    
    return {
      status: 'success',
      message: `API key found (${apiKey.substring(0, 8)}...)`
    };
  } catch (error) {
    return {
      status: 'error',
      message: `Error checking API key: ${error.message}`
    };
  }
}

/**
 * Log all available environment variables (safely)
 */
export function logEnvironmentVariables() {
  // @ts-nocheck
  console.group('Environment Variables Debug');
  
  try {
    // Log Vite environment variables
    if (import.meta.env) {
      console.log('Vite Environment Variables:');
      Object.keys(import.meta.env).forEach(key => {
        if (key.includes('KEY')) {
          // Mask sensitive keys
          console.log(`  ${key}: ${import.meta.env[key] ? '***MASKED***' : 'Not set'}`);
        } else {
          console.log(`  ${key}: ${import.meta.env[key]}`);
        }
      });
    }
    
    // Log process.env variables
    if (process.env) {
      console.log('Process Environment Variables:');
      Object.keys(process.env).forEach(key => {
        if (key.includes('KEY')) {
          // Mask sensitive keys
          console.log(`  ${key}: ${process.env[key] ? '***MASKED***' : 'Not set'}`);
        } else {
          console.log(`  ${key}: ${process.env[key]}`);
        }
      });
    }
  } catch (error) {
    console.error('Error logging environment variables:', error);
  }
  
  console.groupEnd();
}