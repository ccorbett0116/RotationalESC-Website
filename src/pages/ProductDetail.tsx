import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ShoppingCart, Share2, Download, FileText, Image, File } from "lucide-react";
import { apiService, Product } from "@/services/api";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useCanonical } from "@/hooks/useCanonical";
import { useProductAnalytics } from "@/hooks/useAnalytics";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";
import { formatCAD } from "@/lib/currency";
import Layout from "@/components/Layout";
import { ImageModal, ImageWithHover } from "@/components/ImageModal";
import ProductCard from "@/components/ProductCard";
import Image from "@/components/Image";

const getFileIcon = (attachment: any) => {
  if (attachment.is_image) {
    return <Image className="h-5 w-5" />;
  } else if (attachment.is_pdf) {
    return <FileText className="h-5 w-5" />;
  } else if (attachment.is_document) {
    return <FileText className="h-5 w-5" />;
  } else {
    return <File className="h-5 w-5" />;
  }
};

const downloadFile = (attachment: any, toast: any) => {
  try {
    const link = document.createElement('a');
    link.href = attachment.data_url;
    link.download = attachment.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download started",
      description: `${attachment.filename} is being downloaded`,
    });
  } catch (error) {
    toast({
      title: "Download failed",
      description: "Unable to download the file. Please try again.",
      variant: "destructive",
    });
  }
};

const ProductDetail = () => {
  const { id } = useParams();
  useCanonical(`/product/${id}`);
  const navigate = useNavigate();
  const { addItem, getItemQuantity } = useCart();
  const { toast } = useToast();
  const { data: companyInfo } = useCompanyInfo();
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Initialize analytics for this product
  const analytics = useProductAnalytics(id || '', product?.name || '');
  
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const productData = await apiService.getProduct(id);
        setProduct(productData);
        
        // Fetch related products using the dedicated endpoint
        const relatedProductsData = await apiService.getRelatedProducts(productData.id);
        setRelatedProducts(relatedProductsData);
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    
    const currentQuantityInCart = getItemQuantity(product.id);
    
    // Check if adding this quantity would exceed available quantity
    if (currentQuantityInCart + quantity > product.quantity) {
      toast({
        title: "Cannot add items",
        description: `Only ${product.quantity} units available. You already have ${currentQuantityInCart} in your cart.`,
        variant: "destructive",
      });
      return;
    }
    
    addItem(product.id, quantity);
    
    // Track add to cart event
    analytics.trackAddToCart();
    
    toast({
      title: "Added to cart",
      description: `${quantity} x ${product.name} added to your cart`,
    });
  };

  const handleShare = async () => {
    if (!product) return;
    
    const shareData = {
      title: product.name,
      text: `Check out this ${product.name} from ${companyInfo?.name || 'Rotational Equipment Services'}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        // Use native share API if available (mobile devices)
        await navigator.share(shareData);
      } else {
        // Fallback to copying to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied!",
          description: "Product link has been copied to your clipboard",
        });
      }
    } catch (error) {
      // If both fail, show error message
      toast({
        title: "Share failed",
        description: "Unable to share this product",
        variant: "destructive",
      });
    }
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-lg">Loading product...</div>
        </div>
      </Layout>
    );
  }
  
  if (!product) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Product Not Found</h1>
            <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist.</p>
            <Link to="/shop">
              <Button>Back to Shop</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8 text-sm text-muted-foreground">
          <Link to="/shop" className="hover:text-foreground flex items-center gap-1 transition-all duration-300 hover:scale-105 hover:shadow-md">
            <ArrowLeft className="h-4 w-4" />
            Back to Shop
          </Link>
          <span>/</span>
          <span>{product.category.name}</span>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </div>

        {/* Product Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div 
              className="bg-muted rounded-lg overflow-hidden relative group cursor-pointer"
              style={{
                transition: 'all 0.3s ease-in-out',
                transform: 'translateY(0px) scale(1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 20px 40px -12px rgba(0, 0, 0, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0px) scale(1)';
                e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
              }}
            >
              {product.images && product.images.length > 0 ? (
                <ImageModal
                  images={product.images.map(img => ({
                    id: img.id,
                    url: img.image_url,
                    alt: img.alt_text || product.name,
                    title: `${product.name} - Image ${product.images.indexOf(img) + 1}`,
                  }))}
                  initialIndex={currentImageIndex}
                  trigger={
                    <ImageWithHover
                      src={product.images[currentImageIndex]?.image_url}
                      alt={product.images[currentImageIndex]?.alt_text || product.name}
                    />
                  }
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <span className="text-muted-foreground text-lg">No Image Available</span>
                </div>
              )}
            </div>
            
            {/* Image Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => {
                      setCurrentImageIndex(index);
                      analytics.trackImageView(image.id.toString());
                    }}
                    className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all duration-200 hover:scale-105 ${
                      currentImageIndex === index ? 'border-primary' : 'border-transparent hover:border-primary/50'
                    }`}
                  >
                    <Image
                      src={image.image_url}
                      alt={image.alt_text || `${product.name} ${index + 1}`}
                      className="w-full h-full"
                      objectFit="cover"
                      lazy={true}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex gap-2 mb-4">
                <Badge variant="outline">{product.category.name}</Badge>
                <Badge variant={product.is_available ? "success" : "secondary"}>
                  {product.is_available ? "In Stock" : "Out of Stock"}
                </Badge>
              </div>
              <h1 
                className="text-3xl font-bold text-foreground mb-4 cursor-pointer transition-colors duration-300 hover:text-primary"
                style={{
                  transition: 'all 0.3s ease-in-out',
                  transform: 'translateY(0px) scale(1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)';
                  e.currentTarget.style.filter = 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0px) scale(1)';
                  e.currentTarget.style.filter = 'none';
                }}
              >
                {product.name}
              </h1>
              <div 
                className="text-3xl font-bold text-primary mb-6 cursor-pointer"
                style={{
                  transition: 'all 0.3s ease-in-out',
                  transform: 'translateY(0px) scale(1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                  e.currentTarget.style.filter = 'drop-shadow(0 6px 12px rgba(0, 0, 0, 0.15))';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0px) scale(1)';
                  e.currentTarget.style.filter = 'none';
                }}
              >
                {formatCAD(Number(product.price))}
              </div>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Material */}
            {product.material && (
              <div>
                <h3 className="font-semibold mb-2">Material</h3>
                <Badge variant="secondary">{product.material}</Badge>
              </div>
            )}

            {/* Tags */}
            {product.tags_list && product.tags_list.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags_list.map(tag => (
                    <Badge key={tag} variant="outline">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Quantity {product.quantity > 0 && (
                    <span className="text-muted-foreground">
                      ({product.quantity} available
                      {getItemQuantity(product.id) > 0 && `, ${getItemQuantity(product.id)} in cart`})
                    </span>
                  )}
                </label>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="transition-all duration-300 hover:scale-110 hover:shadow-md"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={!product.is_available}
                  >
                    -
                  </Button>
                  <span className="w-12 text-center">{quantity}</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="transition-all duration-300 hover:scale-110 hover:shadow-md"
                    onClick={() => {
                      const currentInCart = getItemQuantity(product.id);
                      const maxAllowed = product.quantity - currentInCart;
                      setQuantity(Math.min(maxAllowed, quantity + 1));
                    }}
                    disabled={!product.is_available || quantity >= (product.quantity - getItemQuantity(product.id))}
                  >
                    +
                  </Button>
                </div>
              </div>

              <div className="flex gap-4">
                <Button 
                  className="flex-1 transition-all duration-300 hover:scale-105 hover:shadow-lg" 
                  size="lg"
                  disabled={!product.is_available}
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {product.is_available ? "Add to Cart" : "Out of Stock"}
                </Button>
                <Button variant="outline" size="lg" className="transition-all duration-300 hover:scale-105 hover:shadow-lg" onClick={handleShare}>
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <Tabs defaultValue="description" className="mb-16">
          <TabsList className={`grid w-full ${product.attachments && product.attachments.length > 0 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabsTrigger value="description" className="text-xs sm:text-sm">
              Description
            </TabsTrigger>
            <TabsTrigger value="specifications" className="text-xs sm:text-sm">
              <span className="hidden sm:inline">Specifications</span>
              <span className="sm:hidden">Specs</span>
            </TabsTrigger>
            {product.attachments && product.attachments.length > 0 && (
              <TabsTrigger value="attachments" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Files ({product.attachments.length})</span>
                <span className="sm:hidden">Files</span>
              </TabsTrigger>
            )}
          </TabsList>
          <TabsContent value="description" className="mt-6">
            <div 
              className="cursor-pointer"
              style={{
                transition: 'all 0.3s ease-in-out',
                transform: 'translateY(0px) scale(1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)';
                e.currentTarget.style.boxShadow = '0 15px 30px -12px rgba(0, 0, 0, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0px) scale(1)';
                e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
              }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Product Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {product.description}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="specifications" className="mt-6">
            <div 
              className="cursor-pointer"
              style={{
                transition: 'all 0.3s ease-in-out',
                transform: 'translateY(0px) scale(1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)';
                e.currentTarget.style.boxShadow = '0 15px 30px -12px rgba(0, 0, 0, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0px) scale(1)';
                e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
              }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Technical Specifications</CardTitle>
                  <CardDescription>
                    Detailed technical information for {product.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {product.specifications && product.specifications.length > 0 ? (
                    <div className="grid gap-4">
                      {product.specifications.map((spec) => (
                        <div key={spec.id} className="grid grid-cols-2 gap-4 py-3 border-b border-border last:border-0">
                          <span className="font-medium">{spec.key}</span>
                          <span className="text-muted-foreground">{spec.value}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No specifications available.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          {product.attachments && product.attachments.length > 0 && (
            <TabsContent value="attachments" className="mt-6">
              <div 
                className="cursor-pointer"
                style={{
                  transition: 'all 0.3s ease-in-out',
                  transform: 'translateY(0px) scale(1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)';
                  e.currentTarget.style.boxShadow = '0 15px 30px -12px rgba(0, 0, 0, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0px) scale(1)';
                  e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
                }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Product Files & Documents</CardTitle>
                    <CardDescription>
                      Download product documentation, manuals, and related files
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                      {product.attachments
                        .filter(attachment => attachment.is_public)
                        .sort((a, b) => a.order - b.order)
                        .map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-start sm:items-center gap-3 p-4 border border-border rounded-lg hover:bg-accent/50 transition-all duration-300 hover:scale-105 hover:shadow-md group"
                        >
                          <div className="flex-shrink-0 text-muted-foreground group-hover:text-foreground transition-colors mt-0.5 sm:mt-0">
                            {getFileIcon(attachment)}
                          </div>
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium text-foreground leading-tight">
                                {attachment.filename}
                              </p>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex-shrink-0 h-8 w-8 p-0 sm:h-9 sm:w-9 transition-all duration-300 hover:scale-110"
                                onClick={() => downloadFile(attachment, toast)}
                              >
                                <Download className="h-4 w-4" />
                                <span className="sr-only">Download {attachment.filename}</span>
                              </Button>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{attachment.file_size_human}</span>
                              <span>•</span>
                              <span className="capitalize">
                                {attachment.content_type.split('/')[1] || attachment.content_type}
                              </span>
                            </div>
                            {attachment.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 sm:line-clamp-1">
                                {attachment.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {product.attachments.filter(attachment => attachment.is_public).length === 0 && (
                      <p className="text-muted-foreground text-center py-8">
                        No public files available for this product.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section>
            <h2 
              className="text-2xl font-bold text-foreground mb-8 cursor-pointer transition-colors duration-300 hover:text-primary"
              style={{
                transition: 'all 0.3s ease-in-out',
                transform: 'translateY(0px) scale(1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                e.currentTarget.style.filter = 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.1))';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0px) scale(1)';
                e.currentTarget.style.filter = 'none';
              }}
            >
              Related Products
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard 
                  key={relatedProduct.id}
                  product={relatedProduct}
                  showAddToCart={true}
                  showAvailabilityBadge={true}
                  onAddToCart={(product) => {
                    const currentQuantityInCart = getItemQuantity(product.id);
                    
                    if (currentQuantityInCart + 1 > product.quantity) {
                      toast({
                        title: "Cannot add item",
                        description: `Only ${product.quantity} units of ${product.name} are available. You already have ${currentQuantityInCart} in your cart.`,
                        variant: "destructive",
                      });
                      return;
                    }
                    
                    addItem(product.id, 1);
                    toast({
                      title: "Added to cart",
                      description: `${product.name} added to your cart`,
                    });
                  }}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
};

export default ProductDetail;