import React, { useEffect, useState } from 'react';
import apiService, { SectionWithManufacturers } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink } from 'lucide-react';

interface SectionsWithManufacturersProps {
  title: string;
  description?: string;
  page?: string; // Filter sections by page
}

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
                    <Card key={j} className="aspect-square">
                      <CardContent className="p-6 h-full flex flex-col">
                        <Skeleton className="flex-1 w-full mb-4 rounded-lg" />
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
                  /* Enhanced Grid Layout */
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 lg:gap-8">
                    {section.manufacturers.map((manufacturer) => (
                      <Card 
                        key={manufacturer.id}
                        className="group relative aspect-square hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer bg-white border-2 border-transparent hover:border-primary/20"
                        onClick={() => handleManufacturerClick(manufacturer.url)}
                      >
                        <CardContent className="p-6 h-full flex flex-col justify-between">
                          {/* Image Container */}
                          <div className="flex-1 flex items-center justify-center mb-4">
                            {manufacturer.image_url ? (
                              <div className="w-full h-full relative overflow-hidden rounded-lg">
                                <img
                                  src={manufacturer.image_url}
                                  alt={manufacturer.label}
                                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                                />
                              </div>
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-muted to-muted/60 rounded-lg flex items-center justify-center">
                                <span className="text-muted-foreground text-sm font-medium">
                                  {manufacturer.label.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* Manufacturer Name */}
                          <div className="text-center">
                            <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-2">
                              {manufacturer.label}
                            </h3>
                          </div>
                          
                          {/* External link indicator */}
                          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="bg-primary/10 p-1.5 rounded-full">
                              <ExternalLink className="h-3 w-3 text-primary" />
                            </div>
                          </div>

                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
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
