// components/Footer.tsx
import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { BRAND_NAME, COPYRIGHT_YEAR, CONTACT_EMAIL } from '../constants';
import { backendApi } from '../services/backendApi';
import { ApiResponse } from '../types';

const Footer: React.FC = () => {
  const [socialMediaLinks, setSocialMediaLinks] = useState<{
    instagram: string;
    twitter: string;
    globe: string;
    chain: string;
  }>({ instagram: '', twitter: '', globe: '', chain: '' });

  useEffect(() => {
    const fetchSocialMediaLinks = async () => {
      try {
        const response: ApiResponse<{ instagram: string; twitter: string; globe: string; chain: string }> = await backendApi.getSocialMediaLinks();
        if (response.success) {
          setSocialMediaLinks(response.data);
        }
      } catch (error) {
        console.error('Error fetching social media links:', error);
      }
    };

    fetchSocialMediaLinks();
  }, []);

  return (
    <footer className="w-full py-6 px-4 md:px-8 lg:px-12 mt-auto
                       bg-gradient-to-t from-darkBg/80 to-darkBg/50 dark:from-lightBg/80 dark:to-lightBg/50
                       backdrop-filter backdrop-blur-lg border-t border-gray-700/50 dark:border-gray-300/50
                       text-center text-gray-500 text-sm">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col">
          {/* Social Media Icons */}
          <div className="flex justify-center space-x-5 mb-5">
            {socialMediaLinks.instagram && (
              <a href={socialMediaLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-accent transition-colors duration-200">
                <svg className="h-5 w-5 md:h-6 md:w-6" fill="currentColor" viewBox="0 0 24 24" aria-label="Instagram">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            )}
            
            {socialMediaLinks.twitter && (
              <a href={socialMediaLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-accent transition-colors duration-200">
                <svg className="h-5 w-5 md:h-6 md:w-6" fill="currentColor" viewBox="0 0 24 24" aria-label="Twitter">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
            )}
            
            {socialMediaLinks.globe && (
              <a href={socialMediaLinks.globe} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-accent transition-colors duration-200">
                <svg className="h-5 w-5 md:h-6 md:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Website">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
                </svg>
              </a>
            )}
            
            {socialMediaLinks.chain && (
              <a href={socialMediaLinks.chain} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-accent transition-colors duration-200">
                <svg className="h-5 w-5 md:h-6 md:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Link">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                </svg>
              </a>
            )}
          </div>
          
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-6 items-center">
            <div className="w-full h-px bg-gray-700 dark:bg-gray-300 mb-3 md:mb-0"></div> {/* Subtle horizontal rule */}
            <p className="text-xs md:text-sm font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 flex items-center mb-2 md:mb-0 animate-fade-in"> {/* Enhanced trust indicator */}
              Secure by Babe finance by AV ecosystem
              <svg className="h-3 w-3 md:h-4 md:w-4 inline-block ml-1 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-label="Verified"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
            </p>
            <div className="flex space-x-4 md:space-x-6">
              <NavLink to="/terms" className="text-xs md:text-sm hover:text-accent transition-colors duration-200">Terms</NavLink>
              <NavLink to="/privacy" className="text-xs md:text-sm hover:text-accent transition-colors duration-200">Privacy</NavLink>
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-xs md:text-sm hover:text-accent transition-colors duration-200">Contact</a>
            </div>
          </div>
          
          {/* Copyright text moved to bottom left corner */}
          <div className="mt-5 text-left">
            <p className="text-xs md:text-sm">&copy; {COPYRIGHT_YEAR} {BRAND_NAME}. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;