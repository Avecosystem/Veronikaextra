// components/ImageGenerator.tsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { backendApi } from '../services/backendApi';
import { IMAGE_COST, BRAND_NAME } from '../constants'; // Import BRAND_NAME
import { ImageResult, ApiResponse } from '../types';
import Input from './ui/Input'; // Keep Input for general use if needed, but for prompt we use textarea
import Button from './ui/Button';
import ImageCard from './ImageCard';
import ShimmerCard from './ui/ShimmerCard';
import GlassCard from './ui/GlassCard';
import { motion } from 'framer-motion';
// import CreditDisplay from './CreditDisplay'; // CreditDisplay moved to Navbar and now removed
import Loader from './ui/Loader'; // Import Loader for central loading message

const ImageGenerator: React.FC = () => {
  const { user, isAuthenticated, updateUserCredits, loading: authLoading } = useAuth();
  const [prompt, setPrompt] = useState<string>('');
  const numberOfImages = 1; // Fixed to 1 image generation
  const [generatedImages, setGeneratedImages] = useState<ImageResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [globalNotice, setGlobalNotice] = useState<string>('');
  const [noticeError, setNoticeError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Split BRAND_NAME for styling
  const brandNameParts = BRAND_NAME.split('extra');
  const veronikaPart = brandNameParts[0];
  const extraPart = 'extra';

  // Fetch global notice on component mount
  useEffect(() => {
    const fetchNotice = async () => {
      try {
        const response: ApiResponse<string> = await backendApi.getGlobalNotice();
        if (response.success) {
          setGlobalNotice(response.data);
        } else {
          setNoticeError(response.message || 'Failed to fetch global notice.');
        }
      } catch (err) {
        console.error('Error fetching global notice:', err);
        setNoticeError('An unexpected error occurred while fetching global notice.');
      }
    };
    fetchNotice();
  }, []);


  const handleGenerate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isAuthenticated || !user) {
      setError('Please log in to generate images.');
      return;
    }

    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }

    const requiredCredits = IMAGE_COST * numberOfImages;
    if (user.credits < requiredCredits) {
      setError(`Insufficient credits. You need ${requiredCredits} credits for ${numberOfImages} images.`);
      return;
    }

    // Show provisioning message below the button instead of popup
    setLoading(true);
    setGeneratedImages([]); // Clear previous images
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    
    try {
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        setError('Authentication token not found.');
        setLoading(false);
        return;
      }

      const response: ApiResponse<{ images: string[], newCredits: number }> = await backendApi.generateImage(token, prompt, numberOfImages);

      if (response.success) {
        const newImages: ImageResult[] = response.data.images.map((url, index) => ({
          id: `${Date.now()}-${index}`,
          url,
          prompt,
        }));
        setGeneratedImages(newImages);
        updateUserCredits(response.data.newCredits);
      } else {
        setError(response.message || 'Failed to generate images.');
      }
    } catch (err) {
      console.error('Image generation error:', err);
      setError('An unexpected error occurred during image generation.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, prompt, updateUserCredits]);

  const canGenerate = isAuthenticated && user && user.credits >= IMAGE_COST * numberOfImages && !loading && !authLoading;

  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-6 lg:p-8 min-h-[calc(100vh-160px)]">
      {/* Global Notice Display */}
      {(globalNotice || noticeError) && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-4xl mb-6"
        >
          <GlassCard className={`p-4 text-center text-darkText dark:text-lightText ${noticeError ? 'bg-red-500/20 border-red-500/50' : 'bg-accent/20 border-accent/50'}`}>
            <p className="font-semibold text-base md:text-lg">{noticeError || globalNotice}</p>
          </GlassCard>
        </motion.div>
      )}

      <GlassCard className="max-w-4xl w-full p-4 md:p-6 text-center animate-fade-in mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-darkText dark:text-lightText mb-3">
          <span>{veronikaPart}
            <span className="inline-block bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text bg-[length:200%_auto] animate-text-gradient-slow ml-0.5">
              {extraPart}
            </span>
          </span> Images
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-base mb-6">
          Describe the image you want to create and let AI bring it to life.
        </p>

        <form onSubmit={handleGenerate} className="space-y-5">
          <div className="relative w-full">
            <label htmlFor="image-prompt" className="sr-only">Image Prompt</label>
            <textarea
              id="image-prompt"
              placeholder="Enter your imagination... (e.g., a futuristic cyberpunk city in rain)"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className={`w-full p-3 md:p-4 bg-white bg-opacity-5 dark:bg-gray-800 dark:bg-opacity-20 backdrop-filter backdrop-blur-sm
                border border-gray-700 dark:border-gray-500 rounded-xl
                text-base md:text-lg text-darkText dark:text-lightText placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-accent
                transition-all duration-300 resize-y`}
              rows={3} // Reduced rows for better mobile experience
              disabled={loading}
              aria-label="Image Prompt Input"
            ></textarea>
          </div>

          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
          <Button
            type="submit"
            className={`w-full max-w-sm mx-auto justify-center py-2.5 md:py-3 text-base md:text-lg font-extrabold
                        ${!canGenerate && 'cursor-not-allowed opacity-70'}
                        ${canGenerate && 'animate-pulse-slow'}`}
            loading={loading}
            disabled={!canGenerate}
          >
            Generate Image ({IMAGE_COST * numberOfImages} Credits)
          </Button>
          
          {/* Provisioning Hardware Message - shown below button during loading */}
          {loading && (
            <div className="text-center py-3">
              <h3 className="text-lg md:text-xl font-bold mb-1">
                <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-transparent bg-clip-text">
                  Provisioning hardware...
                </span>
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base">
                <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 text-transparent bg-clip-text font-bold">
                  This may take 1 minute, so go grab a coffee and come back :)
                </span>
              </p>
            </div>
          )}
          
          {!isAuthenticated && (
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
              Please log in to start generating.
            </p>
          )}
        </form>
      </GlassCard>

      {(loading || generatedImages.length > 0) && (
        <div ref={scrollRef} className="mt-8 w-full max-w-6xl animate-fade-in">
          {loading && (
            <div className="flex flex-col items-center justify-center mb-6">
              <Loader message="Generating your masterpieces..." size="md" className="mb-3" />
            </div>
          )}
          <h2 className="text-2xl md:text-3xl font-bold text-darkText dark:text-lightText text-center mb-6">
            Your Creations
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {loading ? (
              Array.from({ length: numberOfImages }).map((_, index) => (
                <ShimmerCard key={`shimmer-${index}`} className="h-64 md:h-80" />
              ))
            ) : (
              generatedImages.map((image) => (
                <ImageCard key={image.id} image={image} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGenerator;