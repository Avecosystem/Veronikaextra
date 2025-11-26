// constants.ts
import { CreditPlan } from "./types";

export const API_BASE_URL: string = '/api'; // Mock API base URL

export const IMAGE_COST: number = 5; // Credits per image generation
export const INITIAL_CREDITS: number = 25; // Credits new users receive

export const CONTACT_EMAIL: string = 'infobabe09@gmail.com';
export const BRAND_NAME: string = 'VERONIKAextra';
export const APP_TAGLINE: string = 'Generate stunning AI visuals in seconds — powered by VERONIKAextra Images (Babe AI ). By Av ecosystem';
export const COPYRIGHT_YEAR: string = '2025';

export const UPI_ID: string = 'ankanbayen@oksbi';
export const UPI_QR_CODE_PATH: string = '/assets/upi.png'; // Path to static QR code image

export const FIXED_USD_TO_INR_RATE: number = 83; // Example fixed rate for conversion

export const CREDIT_PLANS: CreditPlan[] = [
  { id: 1, credits: 50, inrPrice: 149, usdPrice: parseFloat((149 / FIXED_USD_TO_INR_RATE).toFixed(2)) },
  { id: 2, credits: 100, inrPrice: 229, usdPrice: parseFloat((229 / FIXED_USD_TO_INR_RATE).toFixed(2)) },
  { id: 3, credits: 200, inrPrice: 299, usdPrice: parseFloat((299 / FIXED_USD_TO_INR_RATE).toFixed(2)) },
  { id: 4, credits: 500, inrPrice: 349, usdPrice: parseFloat((349 / FIXED_USD_TO_INR_RATE).toFixed(2)) },
  { id: 5, credits: 1000, inrPrice: 499, usdPrice: parseFloat((499 / FIXED_USD_TO_INR_RATE).toFixed(2)) },
];

export const ADMIN_CREDENTIALS = {
  email: 'ankanbayen@gmail.com',
  password: 'Ankan@6295'
};

// OXPAY Crypto Payment Gateway Details
export const OXPAY_MERCHANT_ID: string = 'QB5WB5-GAS15X-IBUGYW-SNGIRG';
export const OXPAY_API_ID: string = 'CRFD0F-PVW7PH-4UOBPR-NQQXHB';
export const OXPAY_PUBLIC_MERCHANT_ID: string = '12000457'; // From the example link: https://pay.oxapay.com/12000457
export const OXPAY_PAYMENT_URL_BASE: string = `https://pay.oxapay.com/${OXPAY_PUBLIC_MERCHANT_ID}`;

// Country options for signup
export const COUNTRIES = [
  { value: 'India', label: 'India' },
  { value: 'USA', label: 'United States' },
  { value: 'Canada', label: 'Canada' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'Australia', label: 'Australia' },
  { value: 'Germany', label: 'Germany' },
  { value: 'France', label: 'France' },
  { value: 'Japan', label: 'Japan' },
  { value: 'Brazil', label: 'Brazil' },
  { value: 'Mexico', label: 'Mexico' },
  { value: 'South Africa', label: 'South Africa' },
  { value: 'Nigeria', label: 'Nigeria' },
{ value: 'Egypt', label: 'Egypt' },
  { value: 'Kenya', label: 'Kenya' },
  { value: 'Argentina', label: 'Argentina' },
  { value: 'Colombia', label: 'Colombia' },
  { value: 'Chile', label: 'Chile' },
  { value: 'UAE', label: 'United Arab Emirates' },
  { value: 'Saudi Arabia', label: 'Saudi Arabia' },
  { value: 'Singapore', label: 'Singapore' },
  { value: 'Malaysia', label: 'Malaysia' },
  { value: 'Indonesia', label: 'Indonesia' },
  { value: 'Philippines', label: 'Philippines' },
  { value: 'Vietnam', label: 'Vietnam' },
  { value: 'Thailand', label: 'Thailand' },
  { value: 'New Zealand', label: 'New Zealand' },
  { value: 'Netherlands', label: 'Netherlands' },
  { value: 'Spain', label: 'Spain' },
  { value: 'Italy', label: 'Italy' },
  { value: 'Sweden', label: 'Sweden' },
  { value: 'Norway', label: 'Norway' },
  { value: 'Denmark', label: 'Denmark' },
  { value: 'Finland', label: 'Finland' },
  { value: 'Switzerland', label: 'Switzerland' },
  { value: 'Belgium', label: 'Belgium' },
  { value: 'Austria', label: 'Austria' },
  { value: 'Portugal', label: 'Portugal' },
  { value: 'Ireland', label: 'Ireland' },
  { value: 'Greece', label: 'Greece' },
  { value: 'Poland', label: 'Poland' },
  { value: 'Turkey', label: 'Turkey' },
  { value: 'Russia', label: 'Russia' },
  { value: 'China', label: 'China' },
  { value: 'South Korea', label: 'South Korea' },
  { value: 'Other', label: 'Other' },
];

export const DEFAULT_COUNTRY = 'India';


// Placeholder image URLs for the demo gallery
export const DEMO_IMAGES = [
  { src: 'https://picsum.photos/id/1018/1024/1024', alt: 'A futuristic cyberpunk city in rain' },
  { src: 'https://picsum.photos/id/1043/1024/1024', alt: 'A serene mountain landscape with a lake' },
  { src: 'https://picsum.photos/id/1025/1024/1024', alt: 'A cute robot serving coffee' },
  { src: 'https://picsum.photos/id/1050/1024/1024', alt: 'Abstract geometric patterns in neon colors' },
  { src: 'https://picsum.photos/id/1054/1024/1024', alt: 'A majestic dragon flying over a medieval castle' },
  { src: 'https://picsum.photos/id/1069/1024/1024', alt: 'Underwater scene with vibrant coral and fish' },
];