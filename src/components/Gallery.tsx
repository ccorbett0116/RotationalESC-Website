import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiService, GalleryImage } from "@/services/api";
import { ImageModal, ImageWithHover } from "@/components/ImageModal";

const Gallery = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % Math.ceil(images.length / getImagesPerSlide()));
  }, [images.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + Math.ceil(images.length / getImagesPerSlide())) % Math.ceil(images.length / getImagesPerSlide()));
  }, [images.length]);

  useEffect(() => {
    const fetchGalleryImages = async () => {
      try {
        setLoading(true);
        const data = await apiService.getGalleryImages();
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
  }, []);

  // Auto-flip functionality
  useEffect(() => {
    if (images.length <= getImagesPerSlide()) return; // Don't auto-flip if all images fit on one slide
    
    const startAutoFlip = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        if (!isPaused && !isModalOpen) {
          nextSlide();
        }
      }, 4000); // Flip every 4 seconds
    };

    if (!isPaused && !isModalOpen) {
      startAutoFlip();
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

  const handleModalOpen = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const getImagesPerSlide = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 1024) return 3; // lg and above
      if (window.innerWidth >= 768) return 2;  // md
      return 1; // sm and below
    }
    return 3;
  };


  if (loading) {
    return (
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Service Gallery
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
              Service Gallery
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
              Service Gallery
            </h2>
            <p className="text-muted-foreground">No gallery images available at the moment.</p>
          </div>
        </div>
      </section>
    );
  }

  const imagesPerSlide = getImagesPerSlide();
  const totalSlides = Math.ceil(images.length / imagesPerSlide);
  const startIndex = currentIndex * imagesPerSlide;
  const visibleImages = images.slice(startIndex, startIndex + imagesPerSlide);

  return (
    <>
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Service Gallery
            </h2>
            <p className="text-xl text-muted-foreground">
              See our pump repair professionals in action
            </p>
          </div>

          <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {visibleImages.map((image, index) => (
                <ImageModal
                  key={image.id}
                  images={images.map(img => ({
                    id: img.id,
                    url: img.image_url,
                    alt: img.alt_text || img.title,
                    title: img.title,
                    description: img.description
                  }))}
                  initialIndex={startIndex + index}
                  onModalOpen={handleModalOpen}
                  onModalClose={handleModalClose}
                  trigger={
                    <div className="group overflow-hidden rounded-lg border border-border bg-card shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer h-full flex flex-col">
                      <div className="aspect-[4/3] overflow-hidden relative group flex-shrink-0">
                        <ImageWithHover
                          src={image.image_url}
                          alt={image.alt_text || image.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <h3 className="font-semibold text-foreground mb-2">{image.title}</h3>
                        {image.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{image.description}</p>
                        )}
                      </div>
                    </div>
                  }
                />
              ))}
            </div>

            {totalSlides > 1 && (
              <div className="flex justify-center items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevSlide}
                  disabled={currentIndex === 0}
                  className="h-10 w-10 rounded-full p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex space-x-2">
                  {Array.from({ length: totalSlides }).map((_, index) => (
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
                  disabled={currentIndex === totalSlides - 1}
                  className="h-10 w-10 rounded-full p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default Gallery;