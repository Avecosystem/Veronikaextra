// components/TermsOfServicePage.tsx
import React, { useEffect, useState } from 'react';
import { BRAND_NAME, CONTACT_EMAIL, COPYRIGHT_YEAR } from '../constants';
import GlassCard from './ui/GlassCard';
import { backendApi } from '../services/backendApi';
import { ApiResponse } from '../types';
import Loader from './ui/Loader';
import { markdownToHtml } from '../utils/markdownParser';

const TermsOfServicePage: React.FC = () => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTermsOfService = async () => {
      try {
        setLoading(true);
        const response: ApiResponse<string> = await backendApi.getTermsOfService();
        if (response.success) {
          if (response.data && response.data.trim() !== '') {
            // Convert markdown to HTML
            setContent(markdownToHtml(response.data));
          } else {
            // Load default content if none exists
            setContent(markdownToHtml(`
              # Terms of Service
              
              Welcome to ${BRAND_NAME}! These Terms of Service ("Terms") govern your access to and use of the ${BRAND_NAME} website and services (collectively, the "Service"). By accessing or using the Service, you agree to be bound by these Terms.
              
              ## 1. Acceptance of Terms
              
              By creating an account, or by using the ${BRAND_NAME} Service, you agree to these Terms. If you do not agree to these Terms, do not use the Service.
              
              ## 2. Use of Service
              
              - You must be at least 13 years old to use the Service.
              - You agree to use the Service only for lawful purposes and in a way that does not infringe the rights of, restrict, or inhibit anyone else's use and enjoyment of the Service.
              - You are responsible for maintaining the confidentiality of your account login information and are fully responsible for all activities that occur under your account.
              - We provide credits for generating images. Each image generation will deduct credits from your balance as specified in the Service. Credits are non-refundable and have no cash value.
              
              ## 3. Content Policy
              
              - You are solely responsible for the content you generate using the Service (your "Prompts") and any images generated based on those Prompts ("Generated Images").
              - You agree not to use the Service to generate content that is unlawful, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, libelous, invasive of another's privacy, hateful, or racially, ethnically, or otherwise objectionable.
              - We do not store your Prompts or Generated Images. Once an image is presented to you, it is your responsibility to download it.
              
              ## 4. Intellectual Property
              
              - The Service and its original content, features, and functionality are and will remain the exclusive property of ${BRAND_NAME} and its licensors.
              - Regarding Generated Images, the ownership and rights are subject to the terms of the underlying AI model provider (Google AI Studio). You are responsible for ensuring your use of generated images complies with all applicable laws and third-party rights.
              
              ## 5. Disclaimers
              
              The Service is provided on an "AS IS" and "AS AVAILABLE" basis. ${BRAND_NAME} makes no warranties, expressed or implied, and hereby disclaims all other warranties, including without limitation, implied warranties of merchantability, fitness for a particular purpose, or non-infringement.
              
              ## 6. Limitation of Liability
              
              In no event shall ${BRAND_NAME}, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use or alteration of your transmissions or content, whether based on warranty, contract, tort (including negligence) or any other legal theory, whether or not we have been informed of the possibility of such damage, and even if a remedy set forth herein is found to have failed of its essential purpose.
              
              ## 7. Changes to Terms
              
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
              
              ## 8. Contact Us
              
              If you have any questions about these Terms, please contact us at [${CONTACT_EMAIL}](mailto:${CONTACT_EMAIL}).
              
              Last updated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            `.trim()));
          }
        } else {
          setError(response.message || 'Failed to load Terms of Service.');
        }
      } catch (err) {
        console.error('Error fetching Terms of Service:', err);
        setError('An unexpected error occurred while loading Terms of Service.');
      } finally {
        setLoading(false);
      }
    };

    fetchTermsOfService();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-4 md:p-8 lg:p-12 min-h-[calc(100vh-160px)] animate-fade-in">
        <GlassCard className="max-w-3xl w-full p-6 md:p-8 text-center">
          <Loader message="Loading Terms of Service..." />
        </GlassCard>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-4 md:p-8 lg:p-12 min-h-[calc(100vh-160px)] animate-fade-in">
        <GlassCard className="max-w-3xl w-full p-6 md:p-8 text-center">
          <p className="text-red-500">Error: {error}</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-8 lg:p-12 min-h-[calc(100vh-160px)] animate-fade-in">
      <GlassCard className="max-w-3xl w-full p-6 md:p-8 text-left">
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </GlassCard>
    </div>
  );
};

export default TermsOfServicePage;