
// services/backendApi.ts
import { User, ApiResponse, PaymentRequest, CryptoPaymentTransaction, CreditPlan, ContactDetail } from '../types';
import { INITIAL_CREDITS, IMAGE_COST, ADMIN_CREDENTIALS, DEFAULT_COUNTRY, CREDIT_PLANS, FIXED_USD_TO_INR_RATE, OXPAY_MERCHANT_ID } from '../constants';
import { generateImages } from './imageGenerationService';

interface MockUser extends User {
  passwordHash: string;
}

interface StoredData {
  users: MockUser[];
  sessions: { [token: string]: number }; // token -> userId
  paymentRequests: PaymentRequest[]; // UPI payment requests
  cryptoPaymentTransactions: CryptoPaymentTransaction[]; // OXPAY crypto payment transactions
  nextUserId: number;
  nextPaymentRequestId: number; // For UPI payment request IDs
  nextCryptoTransactionId: number; // For Crypto transaction IDs
  globalNotice: string;
  creditsPageNotice: string; // New: Notice specifically for the credits page
  creditPlans: CreditPlan[]; // New: Dynamic credit plans managed by admin
  contactDetails: ContactDetail[]; // New: Contact details managed by admin
  termsOfService: string; // New: Terms of Service content
  privacyPolicy: string; // New: Privacy Policy content
  socialMediaLinks: {
    instagram: string;
    twitter: string;
    globe: string;
    chain: string;
  }; // New: Social media links
}

const STORAGE_KEY = 'veronikaextra_mock_db';

// Helper to simulate network latency for DB operations - Reduced for speed
const simulateLatency = (ms: number = 100): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const getStoredData = (): StoredData => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    const parsedData: StoredData = JSON.parse(data);
    // Ensure new fields are initialized if old data format exists
    if (!parsedData.paymentRequests) parsedData.paymentRequests = [];
    if (!parsedData.nextPaymentRequestId) parsedData.nextPaymentRequestId = 1;
    if (!parsedData.cryptoPaymentTransactions) parsedData.cryptoPaymentTransactions = [];
    if (!parsedData.nextCryptoTransactionId) parsedData.nextCryptoTransactionId = 1;
    if (!parsedData.globalNotice) parsedData.globalNotice = ''; // Initialize globalNotice
    if (!parsedData.creditsPageNotice) parsedData.creditsPageNotice = ''; // Initialize creditsPageNotice
    if (!parsedData.creditPlans) parsedData.creditPlans = CREDIT_PLANS; // Initialize with constant plans
    if (!parsedData.contactDetails) parsedData.contactDetails = []; // Initialize contactDetails
    if (!parsedData.termsOfService) parsedData.termsOfService = ''; // Initialize termsOfService
    if (!parsedData.privacyPolicy) parsedData.privacyPolicy = ''; // Initialize privacyPolicy
    if (!parsedData.socialMediaLinks) parsedData.socialMediaLinks = {
      instagram: '',
      twitter: '',
      globe: '',
      chain: ''
    }; // Initialize socialMediaLinks
    parsedData.users = parsedData.users.map(user => ({ // Ensure all users have a country and isAdmin
      ...user,
      country: user.country || DEFAULT_COUNTRY, // Default existing users to 'India' or your chosen default
      isAdmin: user.isAdmin ?? false, // Default isAdmin to false if not present
    }));
    return parsedData;
  }
  return {
    users: [],
    sessions: {},
    paymentRequests: [],
    cryptoPaymentTransactions: [],
    nextUserId: 1,
    nextPaymentRequestId: 1,
    nextCryptoTransactionId: 1,
    globalNotice: '',
    creditsPageNotice: '', // Default empty
    creditPlans: CREDIT_PLANS, // Initialize with constant values
    contactDetails: [], // Initialize with empty array
    termsOfService: '', // Default empty
    privacyPolicy: '', // Default empty
    socialMediaLinks: {
      instagram: '',
      twitter: '',
      globe: '',
      chain: ''
    } // Default empty links
  };
};

const saveStoredData = (data: StoredData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save data to localStorage:", error);
  }
};

const generateToken = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Initialize admin user if not present, or update if credentials changed
const initializeAdminUser = () => {
  const data = getStoredData();
  // Check for an admin with the exact configured email
  let adminUser = data.users.find(user => user.email === ADMIN_CREDENTIALS.email);

  if (!adminUser) {
    // Admin doesn't exist, create new
    const newAdminUser: MockUser = {
      id: data.nextUserId++,
      name: 'Admin',
      email: ADMIN_CREDENTIALS.email,
      passwordHash: ADMIN_CREDENTIALS.password, // In a real app, this would be hashed
      credits: 999999, // Admin has unlimited credits
      createdAt: new Date().toISOString(),
      isAdmin: true,
      country: DEFAULT_COUNTRY, // Default country for admin
    };
    data.users.push(newAdminUser);
    saveStoredData(data);
  } else {
    // Admin exists, ensure password and admin status are up to date
    let updated = false;
    if (adminUser.passwordHash !== ADMIN_CREDENTIALS.password) {
        adminUser.passwordHash = ADMIN_CREDENTIALS.password;
        updated = true;
    }
    if (!adminUser.isAdmin) {
        adminUser.isAdmin = true;
        updated = true;
    }
    if (updated) {
        saveStoredData(data);
    }
  }
};
initializeAdminUser(); // Run on service load

// Helper to check if a user is admin
const isAdminUser = (userId: number): boolean => {
  const data = getStoredData();
  const user = data.users.find(u => u.id === userId);
  return user ? user.isAdmin === true : false;
};


export const backendApi = {
  async register(name: string, email: string, passwordHash: string, country: string): Promise<ApiResponse<User>> {
    await simulateLatency();
    const data = getStoredData();

    if (data.users.some((user) => user.email === email)) {
      return { success: false, message: 'Email already registered.' };
    }

    const newUser: MockUser = {
      id: data.nextUserId++,
      name,
      email,
      passwordHash,
      credits: INITIAL_CREDITS,
      createdAt: new Date().toISOString(),
      isAdmin: false,
      country: country, // Use the provided country
    };
    data.users.push(newUser);
    saveStoredData(data);

    // Auto-login after registration
    const token = generateToken();
    data.sessions[token] = newUser.id;
    saveStoredData(data);

    const userProfile: User = { ...newUser };
    delete (userProfile as MockUser).passwordHash; // Explicitly cast to MockUser for deletion
    
    return { success: true, data: userProfile, token };
  },

  async login(email: string, passwordHash: string): Promise<ApiResponse<User>> {
    await simulateLatency();
    const data = getStoredData();
    const user = data.users.find(
      (u) => u.email === email && u.passwordHash === passwordHash,
    );

    if (!user) {
      return { success: false, message: 'Invalid credentials.' };
    }

    const token = generateToken();
    data.sessions[token] = user.id;
    saveStoredData(data);

    const userProfile: User = { ...user };
    delete (userProfile as MockUser).passwordHash; // Explicitly cast to MockUser for deletion

    return { success: true, data: userProfile, token };
  },

  async getProfile(token: string): Promise<ApiResponse<User>> {
    await simulateLatency();
    const data = getStoredData();
    const userId = data.sessions[token];

    if (!userId) {
      return { success: false, message: 'Unauthorized.' };
    }

    const user = data.users.find((u) => u.id === userId);
    if (!user) {
      return { success: false, message: 'User not found.' };
    }

    const userProfile: User = { ...user };
    delete (userProfile as MockUser).passwordHash; // Explicitly cast to MockUser for deletion
    return { success: true, data: userProfile };
  },

  async generateImage(token: string, prompt: string, numberOfImages: number = 1): Promise<ApiResponse<{ images: string[], newCredits: number }>> {
    const data = getStoredData();
    const userId = data.sessions[token];

    if (!userId) {
      return { success: false, message: 'Unauthorized.' };
    }

    const userIndex = data.users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      return { success: false, message: 'User not found.' };
    }

    const user = data.users[userIndex];
    // We check if they have enough credits for the REQUESTED amount
    const requiredCredits = IMAGE_COST * numberOfImages;

    if (user.credits < requiredCredits) {
      return { success: false, message: 'Insufficient credits.' };
    }

    try {
      // Directly call the image generation service instead of making a fetch request
      const result = await generateImages(prompt, numberOfImages);
      
      // Map the response images to just URLs as expected by the UI.
      // Support both { id, url, prompt } objects and plain string URLs.
      const imageUrls = (result || []).map((img: any) => {
        if (typeof img === "string") {
          return img;
        }
        if (img && typeof img.url === "string") {
          return img.url;
        }
        return "";
      }).filter((url: string) => url);

      // FAIR BILLING: Only charge for images that were successfully generated
      // The backend now returns partial successes if some fail.
      const generatedCount = imageUrls.length;
      const actualCost = IMAGE_COST * generatedCount;

      data.users[userIndex].credits -= actualCost;
      // Prevent negative credits just in case
      if (data.users[userIndex].credits < 0) data.users[userIndex].credits = 0;
      
      saveStoredData(data);

      return { success: true, data: { images: imageUrls, newCredits: data.users[userIndex].credits } };

    } catch (error: any) {
      console.error("Backend generation call failed:", error);
      return { success: false, message: error.message || 'Failed to connect to image generation server.' };
    }
  },

  async addCredits(token: string, userIdToAdd: number, amount: number): Promise<ApiResponse<User>> {
    await simulateLatency();
    const data = getStoredData();
    const adminId = data.sessions[token];

    if (!adminId || !isAdminUser(adminId)) {
      return { success: false, message: 'Forbidden: Admin access required.' };
    }

    const userIndex = data.users.findIndex((u) => u.id === userIdToAdd);
    if (userIndex === -1) {
      return { success: false, message: 'Target user not found.' };
    }

    data.users[userIndex].credits += amount;
    saveStoredData(data);

    const updatedUser: User = { ...data.users[userIndex] };
    delete (updatedUser as MockUser).passwordHash; // Explicitly cast to MockUser for deletion
    return { success: true, data: updatedUser };
  },

  async submitPaymentRequest(token: string, plan: string, credits: number, amount: number, utrCode: string, date: string, note?: string): Promise<ApiResponse<{ message: string }>> {
    await simulateLatency();
    const data = getStoredData();
    const userId = data.sessions[token];

    if (!userId) {
      return { success: false, message: 'Unauthorized.' };
    }

    const user = data.users.find(u => u.id === userId);
    if (!user) {
      return { success: false, message: 'User not found.' };
    }

    const newPaymentRequest: PaymentRequest = {
      id: data.nextPaymentRequestId++,
      userId: userId,
      userName: user.name,
      userEmail: user.email,
      plan: plan,
      credits: credits, // Store explicit credits for robust processing
      amount: amount,
      utrCode: utrCode,
      date: date,
      note: note,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    data.paymentRequests.push(newPaymentRequest);
    saveStoredData(data);

    return { success: true, data: { message: 'Payment request submitted. Awaiting admin approval.' } };
  },

  async submitCryptoPaymentIntent(token: string, orderId: string, credits: number, amount: number, returnUrl: string): Promise<ApiResponse<{ message: string; paymentUrl?: string }>> {
    await simulateLatency();
    const data = getStoredData();
    const userId = data.sessions[token];

    if (!userId) {
      return { success: false, message: 'Unauthorized.' };
    }

    const user = data.users.find(u => u.id === userId);
    if (!user) {
      return { success: false, message: 'User not found.' };
    }

    const newCryptoTransaction: CryptoPaymentTransaction = {
      id: data.nextCryptoTransactionId++,
      userId: userId,
      userName: user.name,
      userEmail: user.email,
      orderId: orderId,
      credits: credits,
      amount: amount,
      currency: 'USD',
      gateway: 'OXPAY',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    data.cryptoPaymentTransactions.push(newCryptoTransaction);
    saveStoredData(data);

    try {
        const formattedAmount = Number(amount.toFixed(2));

        const apiResponse = await fetch('https://api.oxapay.com/merchants/request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                merchant: OXPAY_MERCHANT_ID,
                amount: formattedAmount,
                currency: 'USD',
                lifeTime: 30, // 30 minutes to pay
                feePaidByPayer: 0,
                underPaidCover: 0,
                returnUrl: returnUrl, // Redirects user to this URL after payment
                description: `Purchase ${credits} Credits - ${user.name}`,
                orderId: orderId,
                email: user.email
            }),
        });

        const result = await apiResponse.json();

        if (result.result === 100 && result.payLink) {
             return { 
                 success: true, 
                 data: { 
                     message: 'Crypto payment intent recorded. Redirecting...', 
                     paymentUrl: result.payLink 
                 } 
             };
        } else {
            console.error("Oxapay API Error:", result);
            return { success: false, message: `Payment Gateway Error: ${result.message || 'Unknown error'}` };
        }

    } catch (error) {
        console.error("Oxapay Network Error:", error);
        return { success: false, message: 'Failed to connect to payment gateway. Please try again later.' };
    }
  },

  async verifyOxapayPayment(token: string, orderId: string, oxapayStatus: 'success' | 'failed' | 'cancelled' | 'paid' | 'confirming'): Promise<ApiResponse<{ newCredits: number }>> {
    await simulateLatency(500); // Slightly reduced
    const data = getStoredData();
    const userId = data.sessions[token];

    if (!userId) {
      return { success: false, message: 'Unauthorized.' };
    }

    const transactionIndex = data.cryptoPaymentTransactions.findIndex(t => t.orderId === orderId && t.userId === userId);

    if (transactionIndex === -1) {
      return { success: false, message: 'Crypto payment transaction not found or not initiated by this user.' };
    }

    const transaction = data.cryptoPaymentTransactions[transactionIndex];

    if (transaction.status === 'completed') {
       const user = data.users.find(u => u.id === transaction.userId);
       return { success: true, data: { newCredits: user?.credits || 0 }, message: 'Payment already processed.' };
    }

    if (oxapayStatus === 'success' || oxapayStatus === 'paid' || oxapayStatus === 'confirming') {
      const userIndex = data.users.findIndex(u => u.id === transaction.userId);
      if (userIndex === -1) {
        return { success: false, message: 'User associated with transaction not found.' };
      }

      data.users[userIndex].credits += transaction.credits;
      transaction.status = 'completed';
      transaction.completedAt = new Date().toISOString();
      saveStoredData(data);
      return { success: true, data: { newCredits: data.users[userIndex].credits }, message: 'Credits added successfully!' };
    } else {
      if (oxapayStatus === 'failed' || oxapayStatus === 'cancelled') {
          transaction.status = oxapayStatus;
          transaction.completedAt = new Date().toISOString();
          saveStoredData(data);
      }
      return { success: false, message: `Crypto payment status: ${oxapayStatus}.` };
    }
  },

  async getAllUsers(token: string): Promise<ApiResponse<User[]>> {
    await simulateLatency();
    const data = getStoredData();
    const adminId = data.sessions[token];

    if (!adminId || !isAdminUser(adminId)) {
      return { success: false, message: 'Forbidden: Admin access required.' };
    }

    const users = data.users.map(u => {
      const userProfile: User = { ...u };
      delete (userProfile as MockUser).passwordHash;
      return userProfile;
    });
    return { success: true, data: users };
  },

  async updateUserCreditsAdmin(token: string, targetUserId: number, newCredits: number): Promise<ApiResponse<User>> {
    await simulateLatency();
    const data = getStoredData();
    const adminId = data.sessions[token];

    if (!adminId || !isAdminUser(adminId)) {
      return { success: false, message: 'Forbidden: Admin access required.' };
    }

    const userIndex = data.users.findIndex(u => u.id === targetUserId);
    if (userIndex === -1) {
      return { success: false, message: 'User not found.' };
    }

    data.users[userIndex].credits = newCredits;
    saveStoredData(data);

    const updatedUser: User = { ...data.users[userIndex] };
    delete (updatedUser as MockUser).passwordHash;
    return { success: true, data: updatedUser, message: 'Credits updated successfully.' };
  },

  async deleteUser(token: string, userIdToDelete: number): Promise<ApiResponse<{ message: string }>> {
    await simulateLatency();
    const data = getStoredData();
    const adminId = data.sessions[token];

    if (!adminId || !isAdminUser(adminId)) {
      return { success: false, message: 'Forbidden: Admin access required.' };
    }

    if (userIdToDelete === adminId) {
      return { success: false, message: 'Cannot delete your own admin account.' };
    }

    const userExists = data.users.some(u => u.id === userIdToDelete);
    if (!userExists) {
         return { success: false, message: 'User not found.' };
    }

    data.users = data.users.filter(u => u.id !== userIdToDelete);
    Object.keys(data.sessions).forEach(key => {
      if (data.sessions[key] === userIdToDelete) {
        delete data.sessions[key];
      }
    });
    saveStoredData(data);
    return { success: true, data: { message: 'User deleted successfully.' } };
  },

  async getAllPaymentRequests(token: string): Promise<ApiResponse<PaymentRequest[]>> {
    await simulateLatency();
    const data = getStoredData();
    const adminId = data.sessions[token];

    if (!adminId || !isAdminUser(adminId)) {
      return { success: false, message: 'Forbidden: Admin access required.' };
    }
    return { success: true, data: data.paymentRequests };
  },

  async getAllCryptoPaymentTransactions(token: string): Promise<ApiResponse<CryptoPaymentTransaction[]>> {
    await simulateLatency();
    const data = getStoredData();
    const adminId = data.sessions[token];

    if (!adminId || !isAdminUser(adminId)) {
      return { success: false, message: 'Forbidden: Admin access required.' };
    }
    return { success: true, data: data.cryptoPaymentTransactions };
  },

  async approvePaymentRequest(token: string, requestId: number): Promise<ApiResponse<{ message: string }>> {
    await simulateLatency();
    const data = getStoredData();
    const adminId = data.sessions[token];

    if (!adminId || !isAdminUser(adminId)) {
      return { success: false, message: 'Forbidden: Admin access required.' };
    }

    const requestIndex = data.paymentRequests.findIndex(req => req.id === requestId);
    if (requestIndex === -1) {
      return { success: false, message: 'Payment request not found.' };
    }

    const request = data.paymentRequests[requestIndex];
    if (request.status !== 'pending') {
      return { success: false, message: 'Payment request already processed.' };
    }

    const userIndex = data.users.findIndex(u => u.id === request.userId);
    if (userIndex === -1) {
      return { success: false, message: 'User associated with request not found.' };
    }

    let creditsToAdd = Number(request.credits);
    if (isNaN(creditsToAdd) || creditsToAdd <= 0) {
        const creditsMatch = request.plan.match(/(\d+)\s*Credits/i);
        creditsToAdd = creditsMatch ? parseInt(creditsMatch[1], 10) : 0;
    }

    if (creditsToAdd > 0) {
        data.users[userIndex].credits = (data.users[userIndex].credits || 0) + creditsToAdd;
    }
    
    data.paymentRequests[requestIndex].status = 'approved';
    saveStoredData(data);

    const message = creditsToAdd > 0 
        ? `Payment request approved. ${creditsToAdd} credits added to user.` 
        : 'Payment request approved (No specific credits found to add).';

    return { success: true, data: { message } };
  },

  async rejectPaymentRequest(token: string, requestId: number): Promise<ApiResponse<{ message: string }>> {
    await simulateLatency();
    const data = getStoredData();
    const adminId = data.sessions[token];

    if (!adminId || !isAdminUser(adminId)) {
      return { success: false, message: 'Forbidden: Admin access required.' };
    }

    const requestIndex = data.paymentRequests.findIndex(req => req.id === requestId);
    if (requestIndex === -1) {
      return { success: false, message: 'Payment request not found.' };
    }

    const request = data.paymentRequests[requestIndex];
    if (request.status !== 'pending') {
      return { success: false, message: 'Payment request already processed.' };
    }

    data.paymentRequests[requestIndex].status = 'rejected';
    saveStoredData(data);
    return { success: true, data: { message: 'Payment request rejected.' } };
  },

  async getGlobalNotice(): Promise<ApiResponse<string>> {
    await simulateLatency(50);
    const data = getStoredData();
    return { success: true, data: data.globalNotice };
  },

  async setGlobalNotice(token: string, message: string): Promise<ApiResponse<string>> {
    await simulateLatency();
    const data = getStoredData();
    const adminId = data.sessions[token];

    if (!adminId || !isAdminUser(adminId)) {
      return { success: false, message: 'Forbidden: Admin access required.' };
    }

    data.globalNotice = message;
    saveStoredData(data);
    return { success: true, data: message, message: 'Global notice updated successfully.' };
  },

  async getCreditsPageNotice(): Promise<ApiResponse<string>> {
    await simulateLatency(50);
    const data = getStoredData();
    return { success: true, data: data.creditsPageNotice };
  },

  async setCreditsPageNotice(token: string, message: string): Promise<ApiResponse<string>> {
    await simulateLatency();
    const data = getStoredData();
    const adminId = data.sessions[token];

    if (!adminId || !isAdminUser(adminId)) {
      return { success: false, message: 'Forbidden: Admin access required.' };
    }

    data.creditsPageNotice = message;
    saveStoredData(data);
    return { success: true, data: message, message: 'Credits page notice updated successfully.' };
  },

  async getAvailableCreditPlans(): Promise<ApiResponse<CreditPlan[]>> {
    await simulateLatency(50);
    const data = getStoredData();
    return { success: true, data: data.creditPlans };
  },

  async getAdminCreditPlans(token: string): Promise<ApiResponse<CreditPlan[]>> {
    await simulateLatency();
    const data = getStoredData();
    const adminId = data.sessions[token];

    if (!adminId || !isAdminUser(adminId)) {
      return { success: false, message: 'Forbidden: Admin access required.' };
    }
    return { success: true, data: data.creditPlans };
  },

  async updateAdminCreditPlan(token: string, planId: number, updatedCredits: number, updatedInrPrice: number, updatedUsdPrice: number): Promise<ApiResponse<CreditPlan>> {
    await simulateLatency();
    const data = getStoredData();
    const adminId = data.sessions[token];

    if (!adminId || !isAdminUser(adminId)) {
      return { success: false, message: 'Forbidden: Admin access required.' };
    }

    const planIndex = data.creditPlans.findIndex(p => p.id === planId);
    if (planIndex === -1) {
      return { success: false, message: 'Credit plan not found.' };
    }

    data.creditPlans[planIndex] = {
      ...data.creditPlans[planIndex],
      credits: updatedCredits,
      inrPrice: updatedInrPrice,
      usdPrice: updatedUsdPrice,
    };
    saveStoredData(data);

    return { success: true, data: data.creditPlans[planIndex], message: 'Credit plan updated successfully.' };
  },

  async getUserPaymentRequests(token: string): Promise<ApiResponse<PaymentRequest[]>> {
    await simulateLatency();
    const data = getStoredData();
    const userId = data.sessions[token];

    if (!userId) {
      return { success: false, message: 'Unauthorized.' };
    }

    const userRequests = data.paymentRequests.filter(req => req.userId === userId);
    return { success: true, data: userRequests };
  },

  async getUserCryptoTransactions(token: string): Promise<ApiResponse<CryptoPaymentTransaction[]>> {
    await simulateLatency();
    const data = getStoredData();
    const userId = data.sessions[token];

    if (!userId) {
      return { success: false, message: 'Unauthorized.' };
    }

    const userTransactions = data.cryptoPaymentTransactions.filter(tx => tx.userId === userId);
    return { success: true, data: userTransactions };
  },

  logout(token: string): void {
    const data = getStoredData();
    delete data.sessions[token];
    saveStoredData(data);
  },

  // New methods for contact details management
  async getContactDetails(): Promise<ApiResponse<ContactDetail[]>> {
    await simulateLatency(50);
    const data = getStoredData();
    return { success: true, data: data.contactDetails };
  },

  async saveContactDetails(token: string, contacts: ContactDetail[]): Promise<ApiResponse<ContactDetail[]>> {
    await simulateLatency();
    const data = getStoredData();
    const adminId = data.sessions[token];

    if (!adminId || !isAdminUser(adminId)) {
      return { success: false, message: 'Forbidden: Admin access required.' };
    }

    data.contactDetails = contacts;
    saveStoredData(data);
    return { success: true, data: contacts, message: 'Contact details updated successfully.' };
  },

  // New methods for Terms of Service management
  async getTermsOfService(): Promise<ApiResponse<string>> {
    await simulateLatency(50);
    const data = getStoredData();
    return { success: true, data: data.termsOfService };
  },

  async setTermsOfService(token: string, content: string): Promise<ApiResponse<string>> {
    await simulateLatency();
    const data = getStoredData();
    const adminId = data.sessions[token];

    if (!adminId || !isAdminUser(adminId)) {
      return { success: false, message: 'Forbidden: Admin access required.' };
    }

    data.termsOfService = content;
    saveStoredData(data);
    return { success: true, data: content, message: 'Terms of Service updated successfully.' };
  },

  // New methods for Privacy Policy management
  async getPrivacyPolicy(): Promise<ApiResponse<string>> {
    await simulateLatency(50);
    const data = getStoredData();
    return { success: true, data: data.privacyPolicy };
  },

  async setPrivacyPolicy(token: string, content: string): Promise<ApiResponse<string>> {
    await simulateLatency();
    const data = getStoredData();
    const adminId = data.sessions[token];

    if (!adminId || !isAdminUser(adminId)) {
      return { success: false, message: 'Forbidden: Admin access required.' };
    }

    data.privacyPolicy = content;
    saveStoredData(data);
    return { success: true, data: content, message: 'Privacy Policy updated successfully.' };
  },

  // New methods for Social Media Links management
  async getSocialMediaLinks(): Promise<ApiResponse<{ instagram: string; twitter: string; globe: string; chain: string }>> {
    await simulateLatency(50);
    const data = getStoredData();
    return { success: true, data: data.socialMediaLinks };
  },

  async setSocialMediaLinks(token: string, links: { instagram: string; twitter: string; globe: string; chain: string }): Promise<ApiResponse<{ instagram: string; twitter: string; globe: string; chain: string }>> {
    await simulateLatency();
    const data = getStoredData();
    const adminId = data.sessions[token];

    if (!adminId || !isAdminUser(adminId)) {
      return { success: false, message: 'Forbidden: Admin access required.' };
    }

    data.socialMediaLinks = links;
    saveStoredData(data);
    return { success: true, data: links, message: 'Social media links updated successfully.' };
  },
};
