import React, { useEffect, useState } from 'react';
import apiService, { SectionWithManufacturers } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink } from 'lucide-react';

interface SectionsWithManufacturersProps {
  title: string;
  description?: string;
}

const SectionsWithManufacturersComponent: React.FC<SectionsWithManufacturersProps> = ({ 
  title, 
  description 
}) => {
  const [sections, setSections] = useState<SectionWithManufacturers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSectionsWithManufacturers = async () => {
      try {
        setLoading(true);
        const data = await apiService.getSectionsWithManufacturers();
        setSections(data);
      } catch (err) {
        console.error('Error fetching sections with manufacturers:', err);
        setError('Failed to load manufacturer data');
      } finally {
        setLoading(false);
      }
    };

    fetchSectionsWithManufacturers();
  }, []);

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
          <div className="space-y-16">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((j) => (
                    <Card key={j} className="aspect-square">
                      <CardContent className="p-4 h-full flex flex-col">
                        <Skeleton className="flex-1 w-full mb-3" />
                        <Skeleton className="h-4 w-3/4 mx-auto" />
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
          <div className="text-center">
            <p className="text-muted-foreground">No sections or manufacturers found.</p>
          </div>
        ) : (
          <div className="space-y-16">
            {sections.map((section) => (
              <div key={section.id} className="space-y-6">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  {section.label}
                </h2>
                
                {section.manufacturers.length === 0 ? (
                  <p className="text-muted-foreground">No manufacturers found for this section.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {section.manufacturers.map((manufacturer) => (
                      <Card 
                        key={manufacturer.id}
                        className="aspect-square hover:shadow-lg transition-shadow duration-200 cursor-pointer group"
                        onClick={() => handleManufacturerClick(manufacturer.url)}
                      >
                        <CardContent className="p-4 h-full flex flex-col justify-between">
                          <div className="flex-1 flex items-center justify-center">
                            {manufacturer.image_url ? (
                              <img
                                src={manufacturer.image_url}
                                alt={manufacturer.label}
                                className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-200"
                              />
                            ) : (
                              <div className="w-full h-full bg-muted rounded flex items-center justify-center">
                                <span className="text-muted-foreground text-sm">No Image</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-3 text-center">
                            <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors duration-200">
                              {manufacturer.label}
                            </p>
                          </div>
                          
                          {/* External link indicator */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          </div>
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
