import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ZoomIn, ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "./Image";

interface ImageData {
  id: string | number;
  src: string;
  alt?: string;
  title?: string;
  description?: string;
}

interface ImageModalProps {
  images: ImageData[];
  initialIndex?: number;
  isOpen?: boolean;
  onClose?: () => void;
  trigger?: React.ReactNode;
  className?: string;
}

interface ImageZoomProps {
  src: string;
  alt: string;
  className?: string;
  trigger: React.ReactNode;
}

export const ImageZoom = ({ src, alt, className = "", trigger }: ImageZoomProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div onClick={() => setIsOpen(true)} className={className}>
        {trigger}
      </div>

      {isOpen && (
        <ImageModal
          images={[{ id: 'zoom', src, alt }]}
          initialIndex={0}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export const ImageWithHover = ({ 
  src, 
  alt, 
  onClick, 
  className = "",
  aspectRatio = "4/3"
}: { 
  src: string; 
  alt: string; 
  onClick?: () => void;
  className?: string;
  aspectRatio?: string;
}) => {
  return (
    <div className={`relative cursor-pointer group ${className}`} onClick={onClick}>
      <Image
        src={src}
        alt={alt}
        className="w-full"
        imgClassName="hover:scale-105 transition-transform duration-200"
        aspectRatio={aspectRatio}
        objectFit="contain"
        lazy={false}
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
        <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      </div>
    </div>
  );
};

export const ImageModal = ({ 
  images, 
  initialIndex = 0, 
  isOpen = false,
  onClose,
  trigger,
  className = "" 
}: ImageModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  // Use external isOpen if provided, otherwise use internal state
  const actualIsOpen = isOpen || internalIsOpen;

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (actualIsOpen) {
        if (e.key === "Escape") {
          handleClose();
        }
        if (e.key === "ArrowLeft") prevImage();
        if (e.key === "ArrowRight") nextImage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [actualIsOpen, currentIndex, images.length]);

  useEffect(() => {
    if (actualIsOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [actualIsOpen]);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleClose = () => {
    setInternalIsOpen(false);
    onClose?.();
  };

  const handleOpen = () => {
    setInternalIsOpen(true);
  };

  const currentImage = images[currentIndex];

  return (
    <>
      {trigger && (
        <div onClick={handleOpen} className={className}>
          {trigger}
        </div>
      )}

      {actualIsOpen && (
        <div 
          className="fixed inset-0 z-50 bg-gray-900 flex items-center justify-center p-4"
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0,
            zIndex: 9999
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleClose();
            }
          }}
        >
          <div className="relative max-w-5xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
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
              <Image
                src={currentImage.src}
                alt={currentImage.alt || currentImage.title || `Image ${currentIndex + 1}`}
                className="max-w-full max-h-[80vh]"
                imgClassName="max-w-full max-h-[80vh]"
                objectFit="contain"
                lazy={false}
                priority={true}
                placeholder="none"
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