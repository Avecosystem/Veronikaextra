// utils/envUtils.ts
/**
 * Utility to safely access environment variables in both development and production
 */

export function getBytezApiKey(): string | undefined {
  // In browser environment, Vite exposes env vars on window
  // @ts-nocheck: Ignore TypeScript checks for environment variables
  if (typeof window !== 'undefined') {
    // @ts-ignore
    return import.meta.env?.VITE_BYTEZ_API_KEY || window.process?.env?.VITE_BYTEZ_API_KEY;
  }
  
  // In Node.js environment, use process.env
  if (typeof process !== 'undefined' && process.env) {
    return process.env.VITE_BYTEZ_API_KEY || process.env.API_KEY;
  }
  
  return undefined;
}