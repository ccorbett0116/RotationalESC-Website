import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiService, GalleryImage } from "@/services/api";

const Gallery = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

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

  const openLightbox = (index: number) => {
    setSelectedImage(index);
    setCurrentIndex(index);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.ceil(images.length / getImagesPerSlide()));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + Math.ceil(images.length / getImagesPerSlide())) % Math.ceil(images.length / getImagesPerSlide()));
  };

  const getImagesPerSlide = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 1024) return 3; // lg and above
      if (window.innerWidth >= 768) return 2;  // md
      return 1; // sm and below
    }
    return 3;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImage !== null) {
        if (e.key === "Escape") closeLightbox();
        if (e.key === "ArrowLeft") prevImage();
        if (e.key === "ArrowRight") nextImage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage]);

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

          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {visibleImages.map((image, index) => (
                <div
                  key={image.id}
                  className="group cursor-pointer overflow-hidden rounded-lg border border-border bg-card shadow-sm hover:shadow-md transition-all duration-300"
                  onClick={() => openLightbox(startIndex + index)}
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={image.image_url}
                      alt={image.alt_text || image.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground mb-2">{image.title}</h3>
                    {image.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{image.description}</p>
                    )}
                  </div>
                </div>
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

      {selectedImage !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="relative max-w-5xl max-h-full">
            <Button
              variant="ghost"
              size="sm"
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              <X className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={prevImage}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={nextImage}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>

            <div className="flex flex-col items-center">
              <img
                src={images[currentIndex].image_url}
                alt={images[currentIndex].alt_text || images[currentIndex].title}
                className="max-w-full max-h-[80vh] object-contain"
              />
              <div className="text-center mt-4 px-4">
                <h3 className="text-white text-xl font-semibold mb-2">
                  {images[currentIndex].title}
                </h3>
                {images[currentIndex].description && (
                  <p className="text-white/80 text-sm max-w-2xl">
                    {images[currentIndex].description}
                  </p>
                )}
                <p className="text-white/60 text-xs mt-2">
                  {currentIndex + 1} of {images.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Gallery;