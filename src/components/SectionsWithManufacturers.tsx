import React, { useEffect, useState } from 'react';
import apiService, { SectionWithManufacturers } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink, Image as ImageIcon } from 'lucide-react';

interface SectionsWithManufacturersProps {
  title: string;
  description?: string;
  page?: string; // Filter sections by page
}

// Enhanced Image Component with loading states
const ManufacturerImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
}> = ({ src, alt, className = "" }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageHeight, setImageHeight] = useState("h-48");

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    const aspectRatio = img.naturalWidth / img.naturalHeight;
    
    // Dynamically adjust height based on aspect ratio
    if (aspectRatio > 3) {
      // Very wide banner images
      setImageHeight("h-32");
    } else if (aspectRatio > 2.5) {
      // Wide banner images  
      setImageHeight("h-36");
    } else if (aspectRatio < 0.6) {
      // Very tall images
      setImageHeight("h-56");
    } else if (aspectRatio < 0.8) {
      // Tall images
      setImageHeight("h-52");
    } else {
      // Square-ish images
      setImageHeight("h-48");
    }
    
    setIsLoading(false);
  };

  const handleImageError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  if (hasError) {
    return (
      <div className={`${imageHeight} bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <span className="text-xs text-muted-foreground">Image not available</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className={`${imageHeight} bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center`}>
          <Skeleton className="w-16 h-16 rounded-lg" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full ${imageHeight} object-contain p-4 group-hover:scale-105 transition-all duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    </div>
  );
};

const SectionsWithManufacturersComponent: React.FC<SectionsWithManufacturersProps> = ({ 
  title, 
  description,
  page 
}) => {
  const [sections, setSections] = useState<SectionWithManufacturers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSectionsWithManufacturers = async () => {
      try {
        setLoading(true);
        const data = await apiService.getSectionsWithManufacturers(page);
        setSections(data);
      } catch (err) {
        console.error('Error fetching sections with manufacturers:', err);
        setError('Failed to load manufacturer data');
      } finally {
        setLoading(false);
      }
    };

    fetchSectionsWithManufacturers();
  }, [page]);

  const handleManufacturerClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Hero Section Skeleton */}
        <section className="py-16 bg-gradient-to-r from-primary/10 to-accent/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Skeleton className="h-12 w-96 mx-auto mb-6" />
            {description && <Skeleton className="h-6 w-2/3 mx-auto" />}
          </div>
        </section>

        {/* Content Skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="space-y-20">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-8">
                {/* Section header skeleton */}
                <div className="text-center">
                  <Skeleton className="h-10 w-64 mx-auto mb-4" />
                  <Skeleton className="h-1 w-24 mx-auto rounded-full" />
                </div>
                
                {/* Grid skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 lg:gap-8">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((j) => (
                    <Card key={j} className="overflow-hidden">
                      <CardContent className="p-0">
                        {/* Image skeleton */}
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4">
                          <Skeleton className="w-full h-40 rounded-lg" />
                        </div>
                        {/* Label skeleton */}
                        <div className="p-4 border-t border-gray-100">
                          <Skeleton className="h-4 w-3/4 mx-auto" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <section className="py-16 bg-gradient-to-r from-primary/10 to-accent/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              {title}
            </h1>
            {description && (
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {description}
              </p>
            )}
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            {title}
          </h1>
          {description && (
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {description}
            </p>
          )}
        </div>
      </section>

      {/* Sections and Manufacturers */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {sections.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-foreground mb-2">No Manufacturers Found</h3>
              <p className="text-muted-foreground">
                We're currently updating our manufacturer listings for this section. Please check back soon.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-20">
            {sections.map((section) => (
              <div key={section.id} className="space-y-8">
                {/* Section Header */}
                <div className="text-center">
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                    {section.label}
                  </h2>
                  <div className="w-24 h-1 bg-primary mx-auto rounded-full"></div>
                </div>
                
                {section.manufacturers.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No manufacturers found for this section.</p>
                  </div>
                ) : (
                  /* Improved Grid Layout */
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 lg:gap-8">
                    {section.manufacturers.map((manufacturer) => (
                      <Card 
                        key={manufacturer.id}
                        className="group relative hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer bg-white border-2 border-transparent hover:border-primary/20 overflow-hidden"
                        onClick={() => handleManufacturerClick(manufacturer.url)}
                      >
                        <CardContent className="p-0">
                          {/* Image Container with Dynamic Aspect Ratio */}
                          <div className="relative bg-gradient-to-br from-gray-50 to-gray-100">
                            {manufacturer.image_url ? (
                              <ManufacturerImage 
                                src={manufacturer.image_url}
                                alt={manufacturer.label}
                              />
                            ) : (
                              <div className="h-48 bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center">
                                <div className="text-center">
                                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <span className="text-2xl font-bold text-primary">
                                      {manufacturer.label.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <span className="text-sm text-muted-foreground">No Image</span>
                                </div>
                              </div>
                            )}
                            
                            {/* Subtle gradient overlay for better text contrast */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                            
                            {/* External link indicator */}
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <div className="bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-sm">
                                <ExternalLink className="h-3 w-3 text-primary" />
                              </div>
                            </div>
                          </div>
                          
                          {/* Manufacturer Name - Fixed Height Section */}
                          <div className="p-4 bg-white border-t border-gray-100">
                            <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors duration-300 text-center leading-tight min-h-[2.5rem] flex items-center justify-center">
                              <span className="line-clamp-2">
                                {manufacturer.label}
                              </span>
                            </h3>
                          </div>

                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-primary/3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SectionsWithManufacturersComponent;
