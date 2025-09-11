import React from 'react';
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Minus, MessageCircle } from "lucide-react";
import { Product } from "@/services/api";
import { formatCAD } from "@/lib/currency";

interface CartProductCardProps {
  product: Product;
  quantity: number;
  onUpdateQuantity: (productId: string, newQuantity: number) => void;
  onRemoveItem: (productId: string) => void;
  className?: string;
}

const CartProductCard: React.FC<CartProductCardProps> = ({
  product,
  quantity,
  onUpdateQuantity,
  onRemoveItem,
  className = "",
}) => {
  return (
    <Card className={`h-full flex flex-col relative ${className}`}>
      {/* Delete button - top right */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemoveItem(product.id)}
        className="absolute top-2 right-2 z-10 text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <div className="bg-muted rounded-t-lg overflow-hidden p-4">
        {product.primary_image ? (
          <img
            src={product.primary_image}
            alt={product.name}
            className="w-full h-auto object-contain max-h-32"
          />
        ) : (
          <div className="w-full h-32 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <span className="text-muted-foreground text-sm">No Image</span>
          </div>
        )}
      </div>

      <CardHeader className="flex-1 pb-2 pr-12">
        <div className="flex justify-between items-start mb-2">
          <Badge 
            variant={product.is_available ? "default" : "secondary"}
            className={product.is_available ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : ""}
          >
            {product.is_available ? `${product.quantity} in stock` : "Out of Stock"}
          </Badge>
          <Badge variant="outline">
            {product.category.name}
          </Badge>
        </div>
        
        <CardTitle className="text-lg leading-tight">
          <Link
            to={`/product/${product.id}`}
            className="hover:text-primary"
          >
            {product.name}
          </Link>
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0 mt-auto">
        <CardDescription className="mb-4 text-sm line-clamp-2">
          {product.description.length > 80 
            ? `${product.description.substring(0, 80)}...`
            : product.description
          }
        </CardDescription>

        {/* Bottom section with quantity controls and price */}
        <div className="flex items-center justify-between">
          {/* Quantity Controls - bottom left/middle */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUpdateQuantity(product.id, quantity - 1)}
              disabled={quantity <= 1}
              className="h-8 w-8 p-0"
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center font-medium">{quantity}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUpdateQuantity(product.id, quantity + 1)}
              disabled={!product.is_available || quantity >= product.quantity}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {/* Price - bottom right */}
          <div className="text-right">
            <div className="text-lg font-semibold text-primary">
              {formatCAD(Number(product.price) * quantity)}
            </div>
            <div className="text-xs text-muted-foreground">
              {formatCAD(Number(product.price))} each
            </div>
            {product.is_available && product.quantity <= 3 && (
              <Link to="/contact" className="text-xs text-amber-600 hover:underline flex items-center gap-1 justify-end mt-1">
                <MessageCircle className="h-2.5 w-2.5" />
                Need more?
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CartProductCard;