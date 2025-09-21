import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiService, GalleryImage as GalleryImageType } from "@/services/api";
import { ImageModal } from "@/components/ImageModal";
import GalleryImage from "@/components/GalleryImage";

interface GalleryProps {
  title: string;
  description: string;
  galleryType: 'service' | 'new-equipment';
}

const Gallery = ({ title, description, galleryType }: GalleryProps) => {
  const [images, setImages] = useState<GalleryImageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    const fetchGalleryImages = async () => {
      try {
        setLoading(true);
        const data = galleryType === 'service' 
          ? await apiService.getGalleryImages()
          : await apiService.getNewGalleryImages();
        setImages(data);
        setError(null);

      } catch (err) {
        setError("Failed to load gallery images");
        console.error("Gallery fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGalleryImages();
  }, [galleryType]);

  // Auto-scroll functionality
  useEffect(() => {
    if (images.length <= 3) return; // Don't auto-scroll if 3 or fewer images
    
    const startAutoScroll = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        if (!isPaused && !isModalOpen) {
          nextSlide();
        }
      }, 4000); // Move every 4 seconds
    };

    if (!isPaused && !isModalOpen) {
      startAutoScroll();
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, isModalOpen, images.length, nextSlide]);


  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const getVisibleImages = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 1024) return 3; // lg and above
      if (window.innerWidth >= 768) return 2;  // md
      return 1; // sm and below
    }
    return 3;
  };

  const getDisplayImages = () => {
    if (images.length === 0) return [];
    
    const visibleCount = getVisibleImages();
    const startIndex = Math.max(0, currentIndex - Math.floor(visibleCount / 2));
    const endIndex = Math.min(images.length, startIndex + visibleCount);
    const adjustedStartIndex = Math.max(0, endIndex - visibleCount);
    
    return images.slice(adjustedStartIndex, endIndex).map((image, index) => ({
      ...image,
      displayIndex: adjustedStartIndex + index,
      isCenter: adjustedStartIndex + index === currentIndex
    }));
  };

  if (loading) {
    return (
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {title}
            </h2>
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {title}
            </h2>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  if (!images.length) {
    return (
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {title}
            </h2>
            <p className="text-muted-foreground">No gallery images available at the moment.</p>
          </div>
        </div>
      </section>
    );
  }

  const displayImages = getDisplayImages();

  return (
    <>
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {title}
            </h2>
            <p className="text-xl text-muted-foreground">
              {description}
            </p>
          </div>

          <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <div className="flex justify-center">
              <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 transition-all duration-500 ease-in-out ${
                galleryType === 'new-equipment' ? 'stagger-children' : ''
              }`}>
                {displayImages.map((image) => (
                  <div 
                    key={image.id}
                    className={`group overflow-hidden rounded-lg border border-border bg-card shadow-sm hover:shadow-md transition-all duration-500 cursor-pointer h-full flex flex-col ${
                      image.isCenter ? 'scale-105 shadow-lg border-primary/50' : 'scale-95 opacity-75'
                    }`}
                    onClick={() => handleImageClick(image.displayIndex)}
                  >
                    <div className="aspect-[4/3] overflow-hidden relative group flex-shrink-0">
                      <GalleryImage
                        imageId={image.id}
                        type={galleryType}
                        src={image.image_url}
                        alt={image.alt_text || image.title}
                        className="w-full h-full"
                        imgClassName="hover:scale-105 transition-transform duration-300"
                        aspectRatio="4/3"
                        objectFit="cover"
                        lazy={true}
                        placeholder="skeleton"
                      />
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <h3 className="font-semibold text-foreground mb-2">{image.title}</h3>
                      {image.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{image.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {images.length > 1 && (
              <div className="flex justify-center items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevSlide}
                  className="h-10 w-10 rounded-full p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex space-x-2">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`h-2 w-2 rounded-full transition-colors ${
                        index === currentIndex ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextSlide}
                  className="h-10 w-10 rounded-full p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Only create modal when actually opened to prevent loading all images */}
      {isModalOpen && (
        <ImageModal
          images={images.map(img => ({
            id: img.id,
            src: img.image_url,
            alt: img.alt_text || img.title,
            title: img.title,
            description: img.description
          }))}
          initialIndex={selectedImageIndex}
          onClose={handleModalClose}
          isOpen={true}
        />
      )}
    </>
  );
};

export default Gallery;