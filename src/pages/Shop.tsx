import { useState, useEffect, useMemo, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, X } from "lucide-react";
import { apiService, Product, Category, ProductSpecification } from "@/services/api";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useCanonical } from "@/hooks/useCanonical";
import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import ShopImage from "@/assets/ShopImage.jpg"; 

const Shop = () => {
  useCanonical('/shop');
  const { addItem, getItemQuantity } = useCart();
  const { toast } = useToast();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [categoriesData, productsData] = await Promise.all([
          apiService.getCategories(),
          apiService.getProducts({ ordering: 'name' })
        ]);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        setAllProducts(Array.isArray(productsData?.results) ? productsData.results : []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setCategories([]);
        setAllProducts([]);
        toast({
          title: "Error",
          description: "Failed to load products. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Helper function to check if search matches specifications
  const getSpecificationMatches = useCallback((product: Product, searchTerm: string): ProductSpecification[] => {
    if (!searchTerm.trim() || !product.specifications) return [];
    
    const query = searchTerm.toLowerCase().trim();
    const searchTerms = query.split(' ').filter(term => term.length > 0);
    
    return product.specifications.filter(spec =>
      searchTerms.some(term =>
        spec.key.toLowerCase().includes(term) ||
        spec.value.toLowerCase().includes(term)
      )
    );
  }, []);

  // Enhanced search function that searches through all product fields
  const searchProducts = useCallback((products: Product[], searchTerm: string): Product[] => {
    if (!searchTerm.trim()) return products;
    
    const query = searchTerm.toLowerCase().trim();
    const searchTerms = query.split(' ').filter(term => term.length > 0);
    
    return products.filter(product => {
      // For each search term, check if it matches any field
      return searchTerms.every(term => {
        // Search in basic product fields
        const basicMatch = 
          product.name.toLowerCase().includes(term) ||
          product.description.toLowerCase().includes(term) ||
          product.material?.toLowerCase().includes(term) ||
          product.category.name.toLowerCase().includes(term) ||
          product.tags_list?.some(tag => tag.toLowerCase().includes(term)) || false;
        
        // Search in specifications (both key and value)
        const specsMatch = product.specifications?.some(spec => 
          spec.key.toLowerCase().includes(term) ||
          spec.value.toLowerCase().includes(term)
        ) || false;
        
        // Search in price (convert to string)
        const priceMatch = product.price.toString().includes(term);
        
        // Search in category description if available
        const categoryDescMatch = product.category.description?.toLowerCase().includes(term) || false;
        
        return basicMatch || specsMatch || priceMatch || categoryDescMatch;
      });
    });
  }, []);

  // Filter and sort products based on current selections
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = allProducts;

    // Apply category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(product => product.category.name === selectedCategory);
    }

    // Apply search filter
    filtered = searchProducts(filtered, searchTerm);

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "price":
          return Number(a.price) - Number(b.price);
        case "-price":
          return Number(b.price) - Number(a.price);
        case "category__name":
          return a.category.name.localeCompare(b.category.name);
        case "-created_at":
          return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
        default:
          return 0;
      }
    });

    return sorted;
  }, [allProducts, selectedCategory, searchTerm, sortBy, searchProducts]);

  const handleAddToCart = (product: Product) => {
    const currentQuantityInCart = getItemQuantity(product.id);
    
    // Check if adding one more would exceed available quantity
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
  };

  // Sort options with descriptive labels
  const sortOptions = [
    { value: "name", label: "Sort by: Name (A-Z)" },
    { value: "price", label: "Sort by: Price (Low to High)" },
    { value: "-price", label: "Sort by: Price (High to Low)" },
    { value: "category__name", label: "Sort by: Category" },
    { value: "-created_at", label: "Sort by: Newest First" },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-lg">Loading products...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <section className="relative py-16">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${ShopImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 25%',
            backgroundRepeat: 'no-repeat',
          }}
        >
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-[rgba(0,0,0,0.6)] backdrop-blur-[2px]"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Equipment Shop
            </h1>
            <p className="text-xl text-gray-200 max-w-2xl mx-auto">
              Browse our comprehensive selection of industrial rotational equipment
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products, categories, specs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-transparent"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full lg:w-auto">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground whitespace-nowrap">Filter & Sort:</span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-52">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredAndSortedProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                {searchTerm || selectedCategory !== "all" 
                  ? "No products found matching your criteria." 
                  : "No products available."}
              </p>
              {(searchTerm || selectedCategory !== "all") && (
                <p className="text-sm text-muted-foreground mt-2">
                  Try adjusting your search terms or filters.
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-8">
                <div className="space-y-2">
                  <p className="text-muted-foreground">
                    Showing {filteredAndSortedProducts.length} product{filteredAndSortedProducts.length !== 1 ? 's' : ''}
                    {allProducts.length > 0 && ` of ${allProducts.length} total`}
                  </p>
                  
                  {/* Active filters */}
                  <div className="flex flex-wrap gap-2">
                    {searchTerm && (
                      <Badge variant="secondary" className="text-xs">
                        Search: "{searchTerm}"
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => setSearchTerm("")}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    )}
                    {selectedCategory !== "all" && (
                      <Badge variant="secondary" className="text-xs">
                        Category: {selectedCategory}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => setSelectedCategory("all")}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    )}
                    {(searchTerm || selectedCategory !== "all") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-6"
                        onClick={() => {
                          setSearchTerm("");
                          setSelectedCategory("all");
                        }}
                      >
                        Clear all filters
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 stagger-children">
                {filteredAndSortedProducts.map((product) => (
                  <ProductCard 
                    key={product.id}
                    product={product}
                    showAddToCart={true}
                    showSpecifications={true}
                    showAvailabilityBadge={true}
                    searchTerm={searchTerm}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Shop;