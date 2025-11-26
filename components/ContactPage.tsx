// components/ContactPage.tsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from './ui/GlassCard';
import Loader from './ui/Loader';
import { backendApi } from '../services/backendApi';
import { ApiResponse, ContactDetail } from '../types';
import { CONTACT_EMAIL } from '../constants';

const ContactPage: React.FC = () => {
  const [contacts, setContacts] = useState<ContactDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContacts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response: ApiResponse<ContactDetail[]> = await backendApi.getContactDetails();
        if (response.success) {
          // Filter only visible contacts
          const visibleContacts = response.data.filter(contact => contact.isVisible);
          setContacts(visibleContacts);
        } else {
          setError(response.message || 'Failed to fetch contact details.');
        }
      } catch (err) {
        console.error('Error fetching contacts:', err);
        setError('An unexpected error occurred while fetching contact details.');
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, []);

  const getIconForType = (type: string) => {
    switch (type) {
      case 'email':
        return (
          <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'phone':
        return (
          <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        );
      case 'address':
        return (
          <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'social':
        return (
          <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        );
      default:
        return (
          <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-160px)]">
        <Loader message="Loading contact information..." />
      </div>
    );
  }

  // Separate announcement from other contacts
  const announcement = contacts.find(contact => contact.label === 'Announcement');
  const regularContacts = contacts.filter(contact => contact.label !== 'Announcement');

  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-8 lg:p-12 min-h-[calc(100vh-160px)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl"
      >
        <GlassCard className="p-6 md:p-8 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-darkText dark:text-lightText mb-4">
            Contact Us
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-8">
            Get in touch with us through any of the following methods
          </p>

          {error ? (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
              <p className="text-red-500">{error}</p>
            </div>
          ) : (
            <>
              {/* Announcement Section */}
              {announcement && (
                <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 mb-8">
                  <h2 className="text-xl font-bold text-accent mb-2">Announcement</h2>
                  <p className="text-darkText dark:text-lightText">
                    {announcement.value}
                  </p>
                </div>
              )}

              {/* Regular Contacts */}
              {regularContacts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    No contact information available at the moment.
                  </p>
                  <p className="text-gray-500 dark:text-gray-400">
                    You can reach us at: <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent hover:underline">{CONTACT_EMAIL}</a>
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {regularContacts.map((contact) => (
                    <GlassCard key={contact.id} className="p-6 flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {getIconForType(contact.type)}
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-semibold text-darkText dark:text-lightText">
                          {contact.label || contact.type.charAt(0).toUpperCase() + contact.type.slice(1)}
                        </h3>
                        {contact.type === 'email' ? (
                          <a 
                            href={`mailto:${contact.value}`} 
                            className="text-accent hover:underline break-all"
                          >
                            {contact.value}
                          </a>
                        ) : contact.type === 'phone' ? (
                          <a 
                            href={`tel:${contact.value}`} 
                            className="text-accent hover:underline"
                          >
                            {contact.value}
                          </a>
                        ) : (
                          <p className="text-darkText dark:text-lightText break-all">
                            {contact.value}
                          </p>
                        )}
                      </div>
                    </GlassCard>
                  ))}
                </div>
              )}
            </>
          )}

          <div className="mt-12 pt-8 border-t border-gray-700/50 dark:border-gray-300/50">
            <h2 className="text-2xl font-bold text-darkText dark:text-lightText mb-4">
              Send us a message
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Have questions or feedback? We'd love to hear from you.
            </p>
            <a 
              href={`mailto:${CONTACT_EMAIL}`} 
              className="inline-block bg-accent hover:bg-accent/90 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Email Us
            </a>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default ContactPage;