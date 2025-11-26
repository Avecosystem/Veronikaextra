// components/admin/AdminDashboardPage.tsx
import React, { useEffect, useState } from 'react';
import AdminDashboardLayout from './AdminDashboardLayout';
import GlassCard from '../ui/GlassCard';
import Loader from '../ui/Loader';
import { useAuth } from '../../hooks/useAuth';
import { backendApi } from '../../services/backendApi';
import { User, ApiResponse, PaymentRequest, ContactDetail } from '../../types';
import Input from '../ui/Input';
import Button from '../ui/Button';
import RichTextEditor from './RichTextEditor';

const AdminDashboardPage: React.FC = () => {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [pendingPayments, setPendingPayments] = useState<number>(0);
  const [totalCreditsDistributed, setTotalCreditsDistributed] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Existing state for global notices
  const [globalNotice, setGlobalNotice] = useState<string>(''); // Existing global notice
  const [globalNoticeLoading, setGlobalNoticeLoading] = useState<boolean>(false);
  const [globalNoticeError, setGlobalNoticeError] = useState<string | null>(null);
  const [globalNoticeSuccess, setGlobalNoticeSuccess] = useState<string | null>(null);
  const [creditsPageNotice, setCreditsPageNotice] = useState<string>(''); // New credits page notice
  const [creditsNoticeLoading, setCreditsNoticeLoading] = useState<boolean>(false);
  const [creditsNoticeError, setCreditsNoticeError] = useState<string | null>(null);
  const [creditsNoticeSuccess, setCreditsNoticeSuccess] = useState<string | null>(null);

  // New state for Terms of Service and Privacy Policy
  const [termsOfService, setTermsOfService] = useState<string>(''); // Terms of Service content
  const [termsLoading, setTermsLoading] = useState<boolean>(false);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [termsSuccess, setTermsSuccess] = useState<string | null>(null);
  const [privacyPolicy, setPrivacyPolicy] = useState<string>(''); // Privacy Policy content
  const [privacyLoading, setPrivacyLoading] = useState<boolean>(false);
  const [privacyError, setPrivacyError] = useState<string | null>(null);
  const [privacySuccess, setPrivacySuccess] = useState<string | null>(null);
  
  // New state for Social Media Links
  const [socialMediaLinks, setSocialMediaLinks] = useState<{
    instagram: string;
    twitter: string;
    globe: string;
    chain: string;
  }>({ instagram: '', twitter: '', globe: '', chain: '' });
  const [socialLinksLoading, setSocialLinksLoading] = useState<boolean>(false);
  const [socialLinksError, setSocialLinksError] = useState<string | null>(null);
  const [socialLinksSuccess, setSocialLinksSuccess] = useState<string | null>(null);
  
  // New state for Contact Details
  const [contactDetails, setContactDetails] = useState<ContactDetail[]>([]);
  const [contactsLoading, setContactsLoading] = useState<boolean>(false);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [contactsSuccess, setContactsSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || !user?.isAdmin) {
        setLoading(false);
        setError('Unauthorized access.');
        return;
      }

      setLoading(true);
      setError(null);
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        setError('Authentication token not found.');
        setLoading(false);
        return;
      }

      try {
        // Fetch users
        const usersResponse: ApiResponse<User[]> = await backendApi.getAllUsers(token);
        if (usersResponse.success) {
          setTotalUsers(usersResponse.data.length);
        } else {
          setError(usersResponse.message);
        }

        // Fetch payments
        const paymentsResponse: ApiResponse<PaymentRequest[]> = await backendApi.getAllPaymentRequests(token);
        if (paymentsResponse.success) {
          const pending = paymentsResponse.data.filter(p => p.status === 'pending').length;
          setPendingPayments(pending);
          
          // Calculate total credits distributed
          const totalCredits = paymentsResponse.data
            .filter(p => p.status === 'approved')
            .reduce((sum, p) => {
              const creditsMatch = p.plan.match(/(\d+)\s*Credits/i);
              return sum + (creditsMatch ? parseInt(creditsMatch[1], 10) : 0);
            }, 0);
          setTotalCreditsDistributed(totalCredits);
        } else {
          setError(paymentsResponse.message);
        }

        // Fetch global notice
        const globalNoticeResponse: ApiResponse<string> = await backendApi.getGlobalNotice();
        if (globalNoticeResponse.success) {
          setGlobalNotice(globalNoticeResponse.data);
        }

        // Fetch credits page notice
        const creditsNoticeResponse: ApiResponse<string> = await backendApi.getCreditsPageNotice();
        if (creditsNoticeResponse.success) {
          setCreditsPageNotice(creditsNoticeResponse.data);
        }
        
        // Fetch Terms of Service
        const termsResponse: ApiResponse<string> = await backendApi.getTermsOfService();
        if (termsResponse.success) {
          setTermsOfService(termsResponse.data);
        }
        
        // Fetch Privacy Policy
        const privacyResponse: ApiResponse<string> = await backendApi.getPrivacyPolicy();
        if (privacyResponse.success) {
          setPrivacyPolicy(privacyResponse.data);
        }
        
        // Fetch Social Media Links
        const socialLinksResponse: ApiResponse<{ instagram: string; twitter: string; globe: string; chain: string }> = await backendApi.getSocialMediaLinks();
        if (socialLinksResponse.success) {
          setSocialMediaLinks(socialLinksResponse.data);
        }
        
        // Fetch Contact Details
        const contactsResponse: ApiResponse<ContactDetail[]> = await backendApi.getContactDetails();
        if (contactsResponse.success) {
          setContactDetails(contactsResponse.data);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('An unexpected error occurred while loading dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, user]);

  const handleSaveGlobalNotice = async () => {
    setGlobalNoticeLoading(true);
    setGlobalNoticeError(null);
    setGlobalNoticeSuccess(null);

    const token = localStorage.getItem('jwt_token');
    if (!token) {
      setGlobalNoticeError('Authentication token not found.');
      setGlobalNoticeLoading(false);
      return;
    }

    try {
      const response: ApiResponse<string> = await backendApi.setGlobalNotice(token, globalNotice);
      if (response.success) {
        setGlobalNoticeSuccess(response.message);
      } else {
        setGlobalNoticeError(response.message || 'Failed to save global notice.');
      }
    } catch (err) {
      console.error('Error saving global notice:', err);
      setGlobalNoticeError('An unexpected error occurred while saving global notice.');
    } finally {
      setGlobalNoticeLoading(false);
    }
  };

  const handleSaveCreditsPageNotice = async () => {
    setCreditsNoticeLoading(true);
    setCreditsNoticeError(null);
    setCreditsNoticeSuccess(null);
    
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      setCreditsNoticeError('Authentication token not found.');
      setCreditsNoticeLoading(false);
      return;
    }

    try {
      const response: ApiResponse<string> = await backendApi.setCreditsPageNotice(token, creditsPageNotice);
      if (response.success) {
        setCreditsNoticeSuccess(response.message);
      } else {
        setCreditsNoticeError(response.message || 'Failed to save credits page notice.');
      }
    } catch (err) {
      console.error('Error saving credits page notice:', err);
      setCreditsNoticeError('An unexpected error occurred while saving credits page notice.');
    } finally {
      setCreditsNoticeLoading(false);
    }
  };

  // New function to save Terms of Service
  const handleSaveTermsOfService = async () => {
    setTermsLoading(true);
    setTermsError(null);
    setTermsSuccess(null);
    
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      setTermsError('Authentication token not found.');
      setTermsLoading(false);
      return;
    }

    try {
      const response: ApiResponse<string> = await backendApi.setTermsOfService(token, termsOfService);
      if (response.success) {
        setTermsSuccess(response.message);
      } else {
        setTermsError(response.message || 'Failed to save Terms of Service.');
      }
    } catch (err) {
      console.error('Error saving Terms of Service:', err);
      setTermsError('An unexpected error occurred while saving Terms of Service.');
    } finally {
      setTermsLoading(false);
    }
  };
  
  // New function to save Privacy Policy
  const handleSavePrivacyPolicy = async () => {
    setPrivacyLoading(true);
    setPrivacyError(null);
    setPrivacySuccess(null);
    
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      setPrivacyError('Authentication token not found.');
      setPrivacyLoading(false);
      return;
    }

    try {
      const response: ApiResponse<string> = await backendApi.setPrivacyPolicy(token, privacyPolicy);
      if (response.success) {
        setPrivacySuccess(response.message);
      } else {
        setPrivacyError(response.message || 'Failed to save Privacy Policy.');
      }
    } catch (err) {
      console.error('Error saving Privacy Policy:', err);
      setPrivacyError('An unexpected error occurred while saving Privacy Policy.');
    } finally {
      setPrivacyLoading(false);
    }
  };
  
  // New function to save Social Media Links
  const handleSaveSocialMediaLinks = async () => {
    setSocialLinksLoading(true);
    setSocialLinksError(null);
    setSocialLinksSuccess(null);
    
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      setSocialLinksError('Authentication token not found.');
      setSocialLinksLoading(false);
      return;
    }

    try {
      const response: ApiResponse<{ instagram: string; twitter: string; globe: string; chain: string }> = await backendApi.setSocialMediaLinks(token, socialMediaLinks);
      if (response.success) {
        setSocialLinksSuccess(response.message);
      } else {
        setSocialLinksError(response.message || 'Failed to save social media links.');
      }
    } catch (err) {
      console.error('Error saving social media links:', err);
      setSocialLinksError('An unexpected error occurred while saving social media links.');
    } finally {
      setSocialLinksLoading(false);
    }
  };
  
  // Helper functions for contact details
  const getContactByType = (type: string) => {
    return contactDetails.find(contact => contact.type === type);
  };
  
  const updateContact = (type: string, field: keyof ContactDetail, value: any) => {
    setContactDetails(prev => {
      const existingContact = prev.find(contact => contact.type === type);
      if (existingContact) {
        return prev.map(contact => 
          contact.type === type ? { ...contact, [field]: value } : contact
        );
      } else {
        // Create new contact if it doesn't exist
        const newContact: ContactDetail = {
          id: `contact-${type}-${Date.now()}`,
          type: type as 'email' | 'phone' | 'address' | 'social',
          value: field === 'value' ? value : '',
          label: type.charAt(0).toUpperCase() + type.slice(1),
          isVisible: field === 'isVisible' ? value : false
        };
        return [...prev, newContact];
      }
    });
  };
  
  const addOrUpdateContact = (type: string, value: string) => {
    if (value.trim() === '') return;
    
    setContactDetails(prev => {
      const existingContact = prev.find(contact => contact.type === type);
      if (existingContact) {
        return prev.map(contact => 
          contact.type === type ? { ...contact, value: value } : contact
        );
      } else {
        const newContact: ContactDetail = {
          id: `contact-${type}-${Date.now()}`,
          type: type as 'email' | 'phone' | 'address' | 'social',
          value: value,
          label: type.charAt(0).toUpperCase() + type.slice(1),
          isVisible: true
        };
        return [...prev, newContact];
      }
    });
  };
  
  // New function to save contact details
  const handleSaveContactDetails = async () => {
    setContactsLoading(true);
    setContactsError(null);
    setContactsSuccess(null);
    
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      setContactsError('Authentication token not found.');
      setContactsLoading(false);
      return;
    }

    try {
      const response: ApiResponse<ContactDetail[]> = await backendApi.saveContactDetails(token, contactDetails);
      if (response.success) {
        setContactDetails(response.data);
        setContactsSuccess('Contact details updated successfully.');
      } else {
        setContactsError(response.message || 'Failed to save contact details.');
      }
    } catch (err) {
      console.error('Error saving contact details:', err);
      setContactsError('An unexpected error occurred while saving contact details.');
    } finally {
      setContactsLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <AdminDashboardLayout title="Admin Dashboard">
        <Loader message="Loading admin data..." className="py-10" />
      </AdminDashboardLayout>
    );
  }

  if (error) {
    return (
      <AdminDashboardLayout title="Admin Dashboard">
        <p className="text-red-500 text-center py-10">{error}</p>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout title="Admin Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <GlassCard className="text-center p-6">
          <h3 className="text-xl font-semibold text-darkText dark:text-lightText mb-2">Total Users</h3>
          <p className="text-5xl font-bold text-accent">{totalUsers}</p>
        </GlassCard>
        <GlassCard className="text-center p-6">
          <h3 className="text-xl font-semibold text-darkText dark:text-lightText mb-2">Pending Payments</h3>
          <p className="text-5xl font-bold text-yellow-500">{pendingPayments}</p>
        </GlassCard>
        <GlassCard className="text-center p-6">
          <h3 className="text-xl font-semibold text-darkText dark:text-lightText mb-2">Credits Distributed</h3>
          <p className="text-5xl font-bold text-blue-500">{totalCreditsDistributed}</p>
        </GlassCard>
      </div>

      {/* Global Announcement / Notice Editor */}
      <GlassCard className="p-6 md:p-8 mt-8 mb-8">
        <h2 className="text-2xl font-bold text-darkText dark:text-lightText mb-4">
          Global Announcement / Notice
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
          This message will be displayed at the top of the landing page for all users.
        </p>
        <div className="space-y-4">
          <textarea
            id="global-notice"
            className={`w-full p-3 bg-white bg-opacity-5 dark:bg-gray-800 dark:bg-opacity-20 backdrop-filter backdrop-blur-sm
              border border-gray-700 dark:border-gray-500 rounded-xl
              text-darkText dark:text-lightText placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-accent
              transition-all duration-300
              ${globalNoticeError ? 'border-red-500 focus:ring-red-500' : ''}`}
            rows={5}
            placeholder="Enter your global announcement or notice here..."
            value={globalNotice}
            onChange={(e) => setGlobalNotice(e.target.value)}
            disabled={globalNoticeLoading}
          ></textarea>
          {globalNoticeError && <p className="text-red-500 text-sm">{globalNoticeError}</p>}
          {globalNoticeSuccess && <p className="text-green-500 text-sm">{globalNoticeSuccess}</p>}
          <Button
            onClick={handleSaveGlobalNotice}
            loading={globalNoticeLoading}
            className="w-full justify-center mt-4"
          >
            Save Global Notice
          </Button>
        </div>
      </GlassCard>

      {/* Credits Page Announcement / Notice Editor */}
      <GlassCard className="p-6 md:p-8 mt-8">
        <h2 className="text-2xl font-bold text-darkText dark:text-lightText mb-4">
          Credits Page Announcement
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
          This message will be displayed at the top of the "Credits" page for all users.
        </p>
        <div className="space-y-4">
          <textarea
            id="credits-page-notice"
            className={`w-full p-3 bg-white bg-opacity-5 dark:bg-gray-800 dark:bg-opacity-20 backdrop-filter backdrop-blur-sm
              border border-gray-700 dark:border-gray-500 rounded-xl
              text-darkText dark:text-lightText placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-accent
              transition-all duration-300
              ${creditsNoticeError ? 'border-red-500 focus:ring-red-500' : ''}`}
            rows={5}
            placeholder="Enter your announcement for the Credits page here..."
            value={creditsPageNotice}
            onChange={(e) => setCreditsPageNotice(e.target.value)}
            disabled={creditsNoticeLoading}
          ></textarea>
          {creditsNoticeError && <p className="text-red-500 text-sm">{creditsNoticeError}</p>}
          {creditsNoticeSuccess && <p className="text-green-500 text-sm">{creditsNoticeSuccess}</p>}
          <Button
            onClick={handleSaveCreditsPageNotice}
            loading={creditsNoticeLoading}
            className="w-full justify-center mt-4"
          >
            Save Credits Page Announcement
          </Button>
        </div>
      </GlassCard>

      {/* Terms of Service Editor */}
      <GlassCard className="p-6 md:p-8 mt-8">
        <h2 className="text-2xl font-bold text-darkText dark:text-lightText mb-4">
          Edit Terms of Service
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
          Edit the Terms of Service content. This will be visible to all users on the Terms of Service page.
          Use **text** for bold and [link text](url) for links.
        </p>
        
        <div className="space-y-4">
          <RichTextEditor
            value={termsOfService}
            onChange={setTermsOfService}
            placeholder="Enter Terms of Service content here... Use **text** for bold and [link text](url) for links."
            disabled={termsLoading}
          />
          {termsError && <p className="text-red-500 text-sm">{termsError}</p>}
          {termsSuccess && <p className="text-green-500 text-sm">{termsSuccess}</p>}
          <Button
            onClick={handleSaveTermsOfService}
            loading={termsLoading}
            className="w-full justify-center mt-4"
          >
            Save Terms of Service
          </Button>
        </div>
      </GlassCard>

      {/* Privacy Policy Editor */}
      <GlassCard className="p-6 md:p-8 mt-8">
        <h2 className="text-2xl font-bold text-darkText dark:text-lightText mb-4">
          Edit Privacy Policy
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
          Edit the Privacy Policy content. This will be visible to all users on the Privacy Policy page.
          Use **text** for bold and [link text](url) for links.
        </p>
        
        <div className="space-y-4">
          <RichTextEditor
            value={privacyPolicy}
            onChange={setPrivacyPolicy}
            placeholder="Enter Privacy Policy content here... Use **text** for bold and [link text](url) for links."
            disabled={privacyLoading}
          />
          {privacyError && <p className="text-red-500 text-sm">{privacyError}</p>}
          {privacySuccess && <p className="text-green-500 text-sm">{privacySuccess}</p>}
          <Button
            onClick={handleSavePrivacyPolicy}
            loading={privacyLoading}
            className="w-full justify-center mt-4"
          >
            Save Privacy Policy
          </Button>
        </div>
      </GlassCard>

      {/* Social Media Links Editor */}
      <GlassCard className="p-6 md:p-8 mt-8">
        <h2 className="text-2xl font-bold text-darkText dark:text-lightText mb-4">
          Edit Social Media Links
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
          Edit the social media links that appear in the footer. Leave blank to hide an icon.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-darkText dark:text-lightText mb-1">
              Instagram URL
            </label>
            <Input
              type="url"
              placeholder="https://instagram.com/youraccount"
              value={socialMediaLinks.instagram}
              onChange={(e) => setSocialMediaLinks({...socialMediaLinks, instagram: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-darkText dark:text-lightText mb-1">
              Twitter/X URL
            </label>
            <Input
              type="url"
              placeholder="https://twitter.com/youraccount"
              value={socialMediaLinks.twitter}
              onChange={(e) => setSocialMediaLinks({...socialMediaLinks, twitter: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-darkText dark:text-lightText mb-1">
              Website URL
            </label>
            <Input
              type="url"
              placeholder="https://yourwebsite.com"
              value={socialMediaLinks.globe}
              onChange={(e) => setSocialMediaLinks({...socialMediaLinks, globe: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-darkText dark:text-lightText mb-1">
              Other Link URL
            </label>
            <Input
              type="url"
              placeholder="https://otherlink.com"
              value={socialMediaLinks.chain}
              onChange={(e) => setSocialMediaLinks({...socialMediaLinks, chain: e.target.value})}
            />
          </div>
          
          {socialLinksError && <p className="text-red-500 text-sm">{socialLinksError}</p>}
          {socialLinksSuccess && <p className="text-green-500 text-sm">{socialLinksSuccess}</p>}
          <Button
            onClick={handleSaveSocialMediaLinks}
            loading={socialLinksLoading}
            className="w-full justify-center mt-4"
          >
            Save Social Media Links
          </Button>
        </div>
      </GlassCard>
      
      {/* Contact Details Editor */}
      <GlassCard className="p-6 md:p-8 mt-8">
        <h2 className="text-2xl font-bold text-darkText dark:text-lightText mb-4">
          Edit Contact Details
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
          Edit contact information that appears on the contact page. Toggle visibility to show or hide each contact method.
        </p>
        
        <div className="space-y-6">
          {/* Email Address Section */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium text-darkText dark:text-lightText">Email Address</h3>
              <button 
                onClick={() => {
                  const emailContact = getContactByType('email');
                  if (emailContact) {
                    updateContact('email', 'isVisible', !emailContact.isVisible);
                  } else {
                    // Create new contact with default visibility
                    updateContact('email', 'isVisible', true);
                  }
                }}
                className="text-accent hover:text-accent/80 transition-colors"
                title={getContactByType('email')?.isVisible ? "Hide from public" : "Show to public"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
            </div>
            <Input
              type="email"
              placeholder="Enter email address"
              value={getContactByType('email')?.value || ''}
              onChange={(e) => addOrUpdateContact('email', e.target.value)}
            />
            <div className="flex items-center mt-2">
              <input
                type="checkbox"
                id="email-visible"
                checked={getContactByType('email')?.isVisible || false}
                onChange={(e) => updateContact('email', 'isVisible', e.target.checked)}
                className="h-4 w-4 text-accent focus:ring-accent border-gray-300 rounded"
              />
              <label htmlFor="email-visible" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                Visible to public
              </label>
            </div>
          </div>
          
          {/* Phone Number Section */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium text-darkText dark:text-lightText">Phone Number</h3>
              <button 
                onClick={() => {
                  const phoneContact = getContactByType('phone');
                  if (phoneContact) {
                    updateContact('phone', 'isVisible', !phoneContact.isVisible);
                  } else {
                    // Create new contact with default visibility
                    updateContact('phone', 'isVisible', true);
                  }
                }}
                className="text-accent hover:text-accent/80 transition-colors"
                title={getContactByType('phone')?.isVisible ? "Hide from public" : "Show to public"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
            </div>
            <Input
              type="tel"
              placeholder="Enter phone number"
              value={getContactByType('phone')?.value || ''}
              onChange={(e) => addOrUpdateContact('phone', e.target.value)}
            />
            <div className="flex items-center mt-2">
              <input
                type="checkbox"
                id="phone-visible"
                checked={getContactByType('phone')?.isVisible || false}
                onChange={(e) => updateContact('phone', 'isVisible', e.target.checked)}
                className="h-4 w-4 text-accent focus:ring-accent border-gray-300 rounded"
              />
              <label htmlFor="phone-visible" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                Visible to public
              </label>
            </div>
          </div>
          
          {/* Address Section */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium text-darkText dark:text-lightText">Address</h3>
              <button 
                onClick={() => {
                  const addressContact = getContactByType('address');
                  if (addressContact) {
                    updateContact('address', 'isVisible', !addressContact.isVisible);
                  } else {
                    // Create new contact with default visibility
                    updateContact('address', 'isVisible', true);
                  }
                }}
                className="text-accent hover:text-accent/80 transition-colors"
                title={getContactByType('address')?.isVisible ? "Hide from public" : "Show to public"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
            </div>
            <Input
              type="text"
              placeholder="Enter address"
              value={getContactByType('address')?.value || ''}
              onChange={(e) => addOrUpdateContact('address', e.target.value)}
            />
            <div className="flex items-center mt-2">
              <input
                type="checkbox"
                id="address-visible"
                checked={getContactByType('address')?.isVisible || false}
                onChange={(e) => updateContact('address', 'isVisible', e.target.checked)}
                className="h-4 w-4 text-accent focus:ring-accent border-gray-300 rounded"
              />
              <label htmlFor="address-visible" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                Visible to public
              </label>
            </div>
          </div>
          
          {/* Notice/Announcement Section */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium text-darkText dark:text-lightText">Notice/Announcement</h3>
              <button 
                onClick={() => {
                  const noticeContact = getContactByType('social');
                  if (noticeContact) {
                    updateContact('social', 'isVisible', !noticeContact.isVisible);
                  } else {
                    // Create new contact with default visibility
                    updateContact('social', 'isVisible', true);
                  }
                }}
                className="text-accent hover:text-accent/80 transition-colors"
                title={getContactByType('social')?.isVisible ? "Hide from public" : "Show to public"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
            </div>
            <textarea
              className="w-full p-3 bg-white bg-opacity-5 dark:bg-gray-800 dark:bg-opacity-20 backdrop-filter backdrop-blur-sm
                border border-gray-700 dark:border-gray-500 rounded-xl
                text-darkText dark:text-lightText placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-accent
                transition-all duration-300"
              rows={3}
              placeholder="Enter notice or announcement"
              value={getContactByType('social')?.value || ''}
              onChange={(e) => addOrUpdateContact('social', e.target.value)}
            ></textarea>
            <div className="flex items-center mt-2">
              <input
                type="checkbox"
                id="notice-visible"
                checked={getContactByType('social')?.isVisible || false}
                onChange={(e) => updateContact('social', 'isVisible', e.target.checked)}
                className="h-4 w-4 text-accent focus:ring-accent border-gray-300 rounded"
              />
              <label htmlFor="notice-visible" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                Visible to public
              </label>
            </div>
          </div>
          
          {contactsError && <p className="text-red-500 text-sm">{contactsError}</p>}
          {contactsSuccess && <p className="text-green-500 text-sm">{contactsSuccess}</p>}
          <Button
            onClick={handleSaveContactDetails}
            loading={contactsLoading}
            className="w-full justify-center mt-4"
          >
            Save Contact Details
          </Button>
        </div>
      </GlassCard>

      <p className="text-gray-500 dark:text-gray-400 text-sm mt-8 text-center">
        This dashboard provides an overview of key platform metrics.
      </p>
    </AdminDashboardLayout>
  );
};

export default AdminDashboardPage;