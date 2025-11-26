// components/ImageCard.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ImageResult } from '../types';
import Button from './ui/Button';
import GlassCard from './ui/GlassCard';

interface ImageCardProps {
  image: ImageResult;
}

const ImageCard: React.FC<ImageCardProps> = ({ image }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    
    try {
      // Check if the image URL is a data URI
      if (image.url.startsWith('data:')) {
        // For data URIs, we can directly download
        const link = document.createElement('a');
        link.href = image.url;
        link.download = `VERONIKAextra-image-${image.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // For regular URLs, we need to fetch the image first
        const response = await fetch(image.url);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        }
        const blob = await response.blob();
        
        // Create object URL for the blob
        const imageUrl = URL.createObjectURL(blob);
        
        // Create download link
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `VERONIKAextra-image-${image.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the object URL
        URL.revokeObjectURL(imageUrl);
      }
    } catch (error) {
      console.error('Download failed:', error);
      // Show error to user
      alert('Download failed. Opening image in new tab instead.');
      // Fallback: open image in new tab
      window.open(image.url, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <GlassCard className="flex flex-col items-center p-3 h-full">
        <div className="w-full aspect-square bg-gray-700/50 dark:bg-gray-300/50 rounded-lg overflow-hidden flex items-center justify-center mb-3">
          <motion.img
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.3 }}
            src={image.url}
            alt={image.prompt}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <p className="text-xs md:text-sm text-center text-gray-400 dark:text-gray-600 mb-3 line-clamp-2">{image.prompt}</p>
        <Button 
          variant="download" 
          onClick={handleDownload} 
          loading={isDownloading} 
          className="mt-auto w-full py-2 text-sm md:text-base"
        >
          Download
        </Button>
      </GlassCard>
    </motion.div>
  );
};

export default ImageCard;