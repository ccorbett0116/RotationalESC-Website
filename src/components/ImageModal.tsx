import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ZoomIn, ChevronLeft, ChevronRight, X } from "lucide-react";

interface ImageData {
  id: string | number;
  url: string;
  alt?: string;
  title?: string;
  description?: string;
}

interface ImageModalProps {
  images: ImageData[];
  initialIndex?: number;
  trigger: React.ReactNode;
  className?: string;
}

interface ImageZoomProps {
  src: string;
  alt: string;
  className?: string;
  trigger: React.ReactNode;
}

export const ImageZoom = ({ src, alt, className = "", trigger }: ImageZoomProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-black/95 border-0">
        <div className="relative">
          <img
            src={src}
            alt={alt}
            className="w-full h-auto max-h-[85vh] object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const ImageWithHover = ({ 
  src, 
  alt, 
  onClick, 
  className = "" 
}: { 
  src: string; 
  alt: string; 
  onClick?: () => void;
  className?: string;
}) => {
  return (
    <div className={`relative cursor-pointer group ${className}`} onClick={onClick}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-contain hover:scale-105 transition-transform duration-200"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
        <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      </div>
    </div>
  );
};

export const ImageModal = ({ images, initialIndex = 0, trigger, className = "" }: ImageModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen) {
        if (e.key === "Escape") setIsOpen(false);
        if (e.key === "ArrowLeft") prevImage();
        if (e.key === "ArrowRight") nextImage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex, images.length]);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const currentImage = images[currentIndex];

  return (
    <>
      <div onClick={() => setIsOpen(true)} className={className}>
        {trigger}
      </div>

      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={(e) => {
            // Only close if clicking on the backdrop, not the image content
            if (e.target === e.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          <div className="relative max-w-5xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              <X className="h-4 w-4" />
            </Button>

            {images.length > 1 && (
              <>
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
              </>
            )}

            <div className="flex flex-col items-center">
              <img
                src={currentImage.url}
                alt={currentImage.alt || currentImage.title || `Image ${currentIndex + 1}`}
                className="max-w-full max-h-[80vh] object-contain"
              />
              {(currentImage.title || currentImage.description || images.length > 1) && (
                <div className="text-center mt-4 px-4">
                  {currentImage.title && (
                    <h3 className="text-white text-xl font-semibold mb-2">
                      {currentImage.title}
                    </h3>
                  )}
                  {currentImage.description && (
                    <p className="text-white/80 text-sm max-w-2xl">
                      {currentImage.description}
                    </p>
                  )}
                  {images.length > 1 && (
                    <p className="text-white/60 text-xs mt-2">
                      {currentIndex + 1} of {images.length}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageModal;