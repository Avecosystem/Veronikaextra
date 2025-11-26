// Simple test to verify environment variables are loaded
console.log('Testing environment variables...');

// Test Vite environment variables
try {
  console.log('import.meta.env.VITE_BYTEZ_API_KEY:', import.meta.env?.VITE_BYTEZ_API_KEY ? 
    `${import.meta.env.VITE_BYTEZ_API_KEY.substring(0, 8)}...` : 'Not set');
} catch (error) {
  console.log('import.meta.env.VITE_BYTEZ_API_KEY: Not accessible');
}

// Test process.env
console.log('process.env.VITE_BYTEZ_API_KEY:', process.env.VITE_BYTEZ_API_KEY ? 
  `${process.env.VITE_BYTEZ_API_KEY.substring(0, 8)}...` : 'Not set');
console.log('process.env.API_KEY:', process.env.API_KEY ? 
  `${process.env.API_KEY.substring(0, 8)}...` : 'Not set');

// Test window.process.env (if available)
if (typeof window !== 'undefined' && window.process && window.process.env) {
  console.log('window.process.env.VITE_BYTEZ_API_KEY:', window.process.env.VITE_BYTEZ_API_KEY ? 
    `${window.process.env.VITE_BYTEZ_API_KEY.substring(0, 8)}...` : 'Not set');
}

console.log('Environment test completed.');