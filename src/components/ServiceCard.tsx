import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, LucideIcon } from "lucide-react";

interface ServiceCardProps {
  id: number;
  title: string;
  description: string;
  features: string[];
  icon: LucideIcon;
  showFeatures?: boolean;
  className?: string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  id,
  title,
  description,
  features,
  icon: IconComponent,
  showFeatures = true,
  className = ""
}) => {
  return (
    <div 
      className={`h-full cursor-pointer ${className}`}
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
      <Card className="h-full group bg-background/80 backdrop-blur-sm border hover:border-primary/50 transition-colors duration-300">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <IconComponent className="h-5 w-5 text-primary flex-shrink-0" />
            </div>
            <span className="line-clamp-2">{title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="mb-4 text-sm">
            {description}
          </CardDescription>
          {showFeatures && (
            <ul className="space-y-2">
              {features.slice(0, 3).map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{feature}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceCard;