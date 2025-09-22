import React from 'react';
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, X } from "lucide-react";
import { Product, ProductSpecification } from "@/services/api";
import { formatCAD } from "@/lib/currency";
import Image from "@/components/Image";

interface ProductCardProps {
  product: Product;
  showAddToCart?: boolean;
  showSpecifications?: boolean;
  showAvailabilityBadge?: boolean;
  searchTerm?: string;
  onAddToCart?: (product: Product) => void;
  className?: string;
}

interface ProductCardSpecsProps {
  product: Product;
  searchTerm?: string;
  getSpecificationMatches?: (product: Product, searchTerm: string) => ProductSpecification[];
}

const ProductCardSpecs: React.FC<ProductCardSpecsProps> = ({ 
  product, 
  searchTerm, 
  getSpecificationMatches 
}) => {
  if (!product.specifications || product.specifications.length === 0) return null;

  const specMatches = searchTerm && getSpecificationMatches 
    ? getSpecificationMatches(product, searchTerm) 
    : [];

  return (
    <div className="mb-4">
      <div className="text-xs text-muted-foreground mb-2 font-medium">
        Key Specifications
        {searchTerm && specMatches.length > 0 && (
          <Badge variant="secondary" className="ml-2 text-xs">
            {specMatches.length} match{specMatches.length !== 1 ? 'es' : ''}
          </Badge>
        )}:
      </div>
      <div className="grid grid-cols-1 gap-1 text-xs">
        {product.specifications.slice(0, 3).map((spec) => {
          const isMatch = searchTerm && specMatches.some(s => s.id === spec.id);
          return (
            <div 
              key={spec.id} 
              className={`flex justify-between border-b border-border/30 pb-1 ${
                isMatch ? 'bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded' : ''
              }`}
            >
              <span className="font-medium text-foreground">{spec.key}:</span>
              <span className="text-muted-foreground">{spec.value}</span>
            </div>
          );
        })}
        {product.specifications.length > 3 && (
          <div className="text-center text-xs text-muted-foreground mt-1 italic">
            +{product.specifications.length - 3} more specifications
          </div>
        )}
      </div>
    </div>
  );
};

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  showAddToCart = false,
  showSpecifications = false,
  showAvailabilityBadge = false,
  searchTerm,
  onAddToCart,
  className = "",
}) => {
  const getSpecificationMatches = (product: Product, searchTerm: string): ProductSpecification[] => {
    if (!searchTerm.trim() || !product.specifications) return [];
    
    const query = searchTerm.toLowerCase().trim();
    const searchTerms = query.split(' ').filter(term => term.length > 0);
    
    return product.specifications.filter(spec =>
      searchTerms.some(term =>
        spec.key.toLowerCase().includes(term) ||
        spec.value.toLowerCase().includes(term)
      )
    );
  };

  return (
    <div 
      className="h-full cursor-pointer"
      style={{
        transition: 'all 0.3s ease-in-out',
        transform: 'translateY(0px) scale(1)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-12px) scale(1.05)';
        e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0px) scale(1)';
        e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
      }}
    >
      <Card className={`h-full flex flex-col group border hover:border-primary/50 transition-colors duration-300 ${className}`}>
      <div className="bg-muted rounded-t-lg overflow-hidden p-4">
        {product.primary_image ? (
          <Image
            src={product.primary_image}
            alt={product.name}
            className="w-full h-48"
            objectFit="contain"
            lazy={true}
            placeholder="skeleton"
            errorFallback={
              <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <span className="text-muted-foreground">No Image</span>
              </div>
            }
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <span className="text-muted-foreground">No Image</span>
          </div>
        )}
      </div>

      <CardHeader className={showSpecifications ? "flex-1" : "flex-grow pb-2"}>
        {showAvailabilityBadge && (
          <div className="flex justify-between items-start mb-2">
            <Badge variant={product.is_available ? "success" : "secondary"}>
              {product.is_available ? "In Stock" : "Out of Stock"}
            </Badge>
            <Badge variant="outline">
              {product.category.name}
            </Badge>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
          <div className="flex-grow">
            <CardTitle className={`${showSpecifications ? "text-lg leading-tight" : "text-lg line-clamp-2"}`}>
              {product.name}
            </CardTitle>
            {!showAvailabilityBadge && (
              <Badge variant="secondary" className="mt-2 text-xs">
                {product.category.name}
              </Badge>
            )}
          </div>
          <div className="text-right sm:text-left">
            <div className={`${showSpecifications ? "text-2xl" : "text-xl lg:text-2xl"} font-bold text-primary`}>
              {formatCAD(Number(product.price))}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 mt-auto">
        <CardDescription className={`mb-4 text-sm ${showSpecifications ? "" : "line-clamp-3"}`}>
          {showSpecifications 
            ? (product.description.length > 120 
                ? `${product.description.substring(0, 120)}...`
                : product.description)
            : `${product.description.substring(0, 100)}...`
          }
        </CardDescription>
        
        {showSpecifications && (
          <ProductCardSpecs 
            product={product}
            searchTerm={searchTerm}
            getSpecificationMatches={getSpecificationMatches}
          />
        )}

        <div className="space-y-2">
          <Link to={`/product/${product.id}`}>
            <Button variant="outline" className="w-full transition-all duration-300 hover:scale-105 hover:shadow-md">
              View Details
            </Button>
          </Link>
          {showAddToCart && (
            <Button 
              className="w-full transition-all duration-300 hover:scale-105 hover:shadow-md" 
              disabled={!product.is_available}
              onClick={() => onAddToCart?.(product)}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {product.is_available ? "Add to Cart" : "Out of Stock"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
    </div>
  );
};

export default ProductCard;