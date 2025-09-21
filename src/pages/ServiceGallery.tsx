import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import Gallery from "@/components/Gallery";
import { useCanonical } from "@/hooks/useCanonical";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface GalleryImageData {
  id: number;
  title: string;
  description: string;
  alt_text: string;
  order: number;
  image_url: string;
  created_at: string;
}

interface GalleryCategoryData {
  id: number;
  name: string;
  slug: string;
  description: string;
  meta_title?: string;
  meta_description?: string;
  images: GalleryImageData[];
}

interface ServiceGalleryProps {
  slug?: string;
}

const ServiceGallery = ({ slug: propSlug }: ServiceGalleryProps) => {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const [galleryData, setGalleryData] = useState<GalleryCategoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get slug from prop or params
  const actualSlug = propSlug || paramSlug;

  useCanonical(`/gallery/${actualSlug}`);

  useEffect(() => {
    const fetchGalleryData = async () => {
      if (!actualSlug) {
        setError("No gallery slug provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/galleries/${actualSlug}/`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("Gallery not found");
          } else {
            setError("Failed to load gallery data");
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        setGalleryData(data);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching gallery data:", err);
        setError("Failed to load gallery data");
      } finally {
        setLoading(false);
      }
    };

    fetchGalleryData();
  }, [actualSlug]);

  // Update document title and meta description if provided
  useEffect(() => {
    if (galleryData) {
      document.title = galleryData.meta_title || `${galleryData.name} | Rotational Equipment Services`;
      
      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription && galleryData.meta_description) {
        metaDescription.setAttribute('content', galleryData.meta_description);
      }
    }
  }, [galleryData]);

  // Show loading state
  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-background">
          {/* Hero Section Skeleton */}
          <section className="py-16 bg-gradient-to-r from-primary/10 to-accent/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <Skeleton className="h-12 w-96 mx-auto mb-6" />
              <Skeleton className="h-6 w-2/3 mx-auto" />
            </div>
          </section>

          {/* Gallery Grid Skeleton */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(12)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-0">
                    <Skeleton className="w-full h-64" />
                    <div className="p-4">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Show error state (will redirect to 404)
  if (error || !galleryData) {
    return <Navigate to="/404" replace />;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-r from-primary/10 to-accent/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              {galleryData.name}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {galleryData.description}
            </p>
            {galleryData.images.length > 0 && (
              <div className="mt-4">
                <Badge variant="outline" className="text-sm">
                  {galleryData.images.length} {galleryData.images.length === 1 ? 'Image' : 'Images'}
                </Badge>
              </div>
            )}
          </div>
        </section>

        {/* Gallery Carousel */}
        {galleryData.images.length === 0 ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-semibold text-foreground mb-2">No Images Found</h3>
                <p className="text-muted-foreground">
                  We're currently updating our gallery. Please check back soon for new images.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <Gallery 
            title=""
            description=""
            galleryType={actualSlug === 'service-repair' ? 'service' : 'new-equipment'}
          />
        )}
      </div>
    </Layout>
  );
};

export default ServiceGallery;