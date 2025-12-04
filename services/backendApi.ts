// services/backendApi.ts - Migrated to use server-side APIs
import { User, ApiResponse, PaymentRequest, CryptoPaymentTransaction, UpiPaymentTransaction, CreditPlan, ContactDetail, CreditHistory } from '../types';
import { IMAGE_COST } from '../constants';
import { generateImages } from './imageGenerationService';
import { buildApiUrl } from '../utils/apiUtils';

export const backendApi = {
  async register(name: string, email: string, passwordHash: string, country: string, deviceId?: string): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(buildApiUrl('/auth-register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password: passwordHash, country })
      });

      const result = await response.json();
      return result;
    } catch (error: any) {
      return { success: false, message: error.message || 'Registration failed' };
    }
  },

  async login(email: string, passwordHash: string): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(buildApiUrl('/auth-login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: passwordHash })
      });

      const result = await response.json();
      return result;
    } catch (error: any) {
      return { success: false, message: error.message || 'Login failed' };
    }
  },

  async getProfile(token: string): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(buildApiUrl('/user-profile'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      return result;
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to fetch profile' };
    }
  },

  async generateImage(token: string, prompt: string, numberOfImages: number = 1): Promise<ApiResponse<{ images: string[], newCredits: number }>> {
    // Get current user to check credits
    const profileResponse = await this.getProfile(token);
    if (!profileResponse.success || !profileResponse.data) {
      return { success: false, message: 'Unauthorized.' };
    }

    const user = profileResponse.data;
    const validImageCount = Math.max(1, Math.min(6, numberOfImages));
    const requiredCredits = IMAGE_COST * validImageCount;

    if (user.credits < requiredCredits) {
      return { success: false, message: 'Insufficient credits.' };
    }

    try {
      const requests = Array.from({ length: validImageCount }, () =>
        generateImages(prompt, 1)
      );

      const results = await Promise.allSettled(requests);
      const imageObjects: any[] = [];

      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          const imgs = result.value;
          if (Array.isArray(imgs)) {
            imgs.forEach((img: any) => {
              if (img && (typeof img.url === "string" || typeof img.b64_json === "string")) {
                imageObjects.push(img);
              }
            });
          }
        }
      });

      const generatedCount = imageObjects.length;

      if (generatedCount === 0) {
        const firstError = results.find(r => r.status === 'rejected') as PromiseRejectedResult;
        if (firstError) {
          return { success: false, message: firstError.reason.message || 'Failed to generate images.' };
        }
        return { success: false, message: 'Failed to generate images. No valid data returned from server.' };
      }

      const actualCost = IMAGE_COST * generatedCount;
      const newCredits = user.credits - actualCost;

      // TODO: Update credits on server via API
      // For now, return the calculated value
      const imageUrls = imageObjects.map(img => img.url || img.b64_json);

      return {
        success: true,
        data: {
          images: imageUrls,
          newCredits: newCredits
        }
      };
    } catch (error: any) {
      console.error("Image Generation Error:", error);
      return { success: false, message: error.message || 'Failed to generate images. Please try again.' };
    }
  },

  async submitUpiPaymentIntent(token: string, orderId: string, credits: number, amountInInr: number, returnUrl: string): Promise<ApiResponse<{ message: string; paymentUrl?: string }>> {
    try {
      const profile = await this.getProfile(token);
      if (!profile.success || !profile.data) {
        return { success: false, message: 'Unauthorized.' };
      }

      const user = profile.data;

      const apiResponse = await fetch(buildApiUrl('/upi-intent'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          amount: amountInInr,
          returnUrl,
          email: user.email,
          name: user.name,
          userId: user.id,
          credits
        })
      });

      const result = await apiResponse.json();
      if (apiResponse.ok && result.payLink) {
        return { success: true, data: { message: 'UPI payment intent created. Redirecting...', paymentUrl: result.payLink } };
      }
      return { success: false, message: result.message || 'Payment Gateway Error' };
    } catch (error) {
      console.error('UPI Intent Error:', error);
      return { success: false, message: 'Failed to connect to UPI gateway. Please try again later.' };
    }
  },

  async submitCryptoPaymentIntent(token: string, orderId: string, credits: number, amount: number, returnUrl: string): Promise<ApiResponse<{ message: string; paymentUrl?: string }>> {
    try {
      const profile = await this.getProfile(token);
      if (!profile.success || !profile.data) {
        return { success: false, message: 'Unauthorized.' };
      }

      const user = profile.data;

      const apiResponse = await fetch(buildApiUrl('/oxapay-intent'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          credits,
          amount,
          returnUrl,
          email: user.email,
          name: user.name,
          userId: user.id
        })
      });

      const result = await apiResponse.json();

      if (apiResponse.ok && result.payLink) {
        return {
          success: true,
          data: { message: 'Crypto payment intent recorded. Redirecting...', paymentUrl: result.payLink }
        };
      }
      return { success: false, message: result.message || 'Payment Gateway Error' };

    } catch (error) {
      console.error('Oxapay Intent Error:', error);
      return { success: false, message: 'Failed to connect to payment gateway. Please try again later.' };
    }
  },

  // Global Settings - These now fetch from the database
  async getGlobalNotice(): Promise<string> {
    try {
      const response = await fetch(buildApiUrl('/global-settings?key=globalNotice'));
      const result = await response.json();
      return result.success ? result.data : '';
    } catch {
      return '';
    }
  },

  async getCreditsPageNotice(): Promise<string> {
    try {
      const response = await fetch(buildApiUrl('/global-settings?key=creditsPageNotice'));
      const result = await response.json();
      return result.success ? result.data : '';
    } catch {
      return '';
    }
  },

  async getCreditPlans(): Promise<CreditPlan[]> {
    try {
      const response = await fetch(buildApiUrl('/global-settings?key=creditPlans'));
      const result = await response.json();
      return result.success && Array.isArray(result.data) ? result.data : [];
    } catch {
      return [];
    }
  },

  async getTermsOfService(): Promise<string> {
    try {
      const response = await fetch(buildApiUrl('/global-settings?key=termsOfService'));
      const result = await response.json();
      return result.success ? result.data : '';
    } catch {
      return '';
    }
  },

  async getPrivacyPolicy(): Promise<string> {
    try {
      const response = await fetch(buildApiUrl('/global-settings?key=privacyPolicy'));
      const result = await response.json();
      return result.success ? result.data : '';
    } catch {
      return '';
    }
  },

  async getSocialMediaLinks(): Promise<{ instagram: string; twitter: string; globe: string; chain: string }> {
    try {
      const response = await fetch(buildApiUrl('/global-settings?key=socialMediaLinks'));
      const result = await response.json();
      return result.success ? result.data : { instagram: '', twitter: '', globe: '', chain: '' };
    } catch {
      return { instagram: '', twitter: '', globe: '', chain: '' };
    }
  },

  async updateGlobalSetting(key: string, value: any): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(buildApiUrl('/global-settings'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });

      const result = await response.json();
      return result;
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to update setting' };
    }
  },

  // Stub implementations for admin features (to be implemented)
  async addCredits(token: string, userIdToAdd: number, amount: number): Promise<ApiResponse<User>> {
    return { success: false, message: 'Not implemented - use admin API' };
  },

  async getAllUsers(token: string): Promise<ApiResponse<User[]>> {
    return { success: false, message: 'Not implemented - use admin API' };
  },

  async updateUserCreditsAdmin(token: string, targetUserId: number, newCredits: number): Promise<ApiResponse<User>> {
    return { success: false, message: 'Not implemented - use admin API' };
  },

  async deleteUser(token: string, userIdToDelete: number): Promise<ApiResponse<{ message: string }>> {
    return { success: false, message: 'Not implemented - use admin API' };
  },

  async getAllPaymentRequests(token: string): Promise<ApiResponse<PaymentRequest[]>> {
    return { success: false, message: 'Not implemented - use admin API' };
  },

  async getAllCryptoPaymentTransactions(token: string): Promise<ApiResponse<CryptoPaymentTransaction[]>> {
    return { success: false, message: 'Not implemented - use admin API' };
  },

  async getAllUpiPaymentTransactions(token: string): Promise<ApiResponse<UpiPaymentTransaction[]>> {
    return { success: false, message: 'Not implemented - use admin API' };
  },

  async submitPaymentRequest(token: string, plan: string, credits: number, amount: number, utrCode: string, date: string, note?: string): Promise<ApiResponse<{ message: string }>> {
    return { success: false, message: 'Not implemented - use manual payment API' };
  },

  async approvePaymentRequest(token: string, requestId: number): Promise<ApiResponse<{ message: string }>> {
    return { success: false, message: 'Not implemented - use admin API' };
  },

  async rejectPaymentRequest(token: string, requestId: number): Promise<ApiResponse<{ message: string }>> {
    return { success: false, message: 'Not implemented - use admin API' };
  },

  async verifyUpiPayment(token: string, orderId: string, status: 'success' | 'PAID' | 'SUCCESS' | 'failed' | 'cancelled'): Promise<ApiResponse<{ newCredits: number }>> {
    // Payment verification happens server-side via webhook
    // Just refresh user profile to get updated credits
    const profile = await this.getProfile(token);
    if (profile.success && profile.data) {
      return { success: true, data: { newCredits: profile.data.credits }, message: 'Payment processed' };
    }
    return { success: false, message: 'Failed to verify payment' };
  },

  async verifyOxapayPayment(token: string, orderId: string, oxapayStatus: 'success' | 'failed' | 'cancelled' | 'paid' | 'confirming'): Promise<ApiResponse<{ newCredits: number }>> {
    // Payment verification happens server-side via webhook
    // Just refresh user profile to get updated credits
    const profile = await this.getProfile(token);
    if (profile.success && profile.data) {
      return { success: true, data: { newCredits: profile.data.credits }, message: 'Payment processed' };
    }
    return { success: false, message: 'Failed to verify payment' };
  },
};
