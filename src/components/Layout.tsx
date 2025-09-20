import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, User, Menu, X, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Helmet } from "react-helmet";
import heroImage from "@/assets/home-banner.webp";
import apiService, { EquipmentCategory } from "@/services/api";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { getTotalItems } = useCart();
  const { data: companyInfo } = useCompanyInfo();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [isMobileProductsOpen, setIsMobileProductsOpen] = useState(false);
  const [equipmentCategories, setEquipmentCategories] = useState<EquipmentCategory[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load equipment categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categories = await apiService.getEquipmentCategories();
        setEquipmentCategories(categories);
      } catch (error) {
        console.error('Failed to load equipment categories:', error);
        // Fallback to hardcoded categories if API fails
        setEquipmentCategories([
          { id: 1, name: 'Pumps', slug: 'pumps', description: '', order: 1 },
          { id: 2, name: 'Mechanical Seals', slug: 'mechanical-seals', description: '', order: 2 },
          { id: 3, name: 'Packing', slug: 'packing', description: '', order: 3 }
        ]);
      }
    };
    loadCategories();
  }, []);

  const navigation = [
    { name: 'Home', href: '/' },
    {
      name: 'Products',
      href: '#',
      isDropdown: true,
      categories: [
        ...equipmentCategories.map(category => ({
          title: category.name,
          href: `/${category.slug}`,
        })),
        {
          title: 'Service & Repair',
          href: '/service-repair',
        },
        {
          title: 'New Equipment',
          href: '/new-equipment',
        },
      ]
    },
    { name: 'Shop', href: '/shop' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' }
  ];

  const isActive = (path: string, isDropdown?: boolean) => {
    if (isDropdown) {
      // For Products dropdown, check if we're on any equipment category or service pages
      const equipmentPaths = equipmentCategories.map(cat => `/${cat.slug}`);
      const allProductPaths = [...equipmentPaths, '/service-repair', '/new-equipment'];
      return allProductPaths.includes(location.pathname);
    }
    return location.pathname === path;
  };


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProductsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Preload home banner image only on home page */}
      {location.pathname === '/' && (
        <Helmet>
          <link rel="preload" as="image" href={heroImage} fetchpriority="high" crossOrigin="anonymous" />
        </Helmet>
      )}
      {/* Header */}
      <header className="border-b border-border bg-card relative z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
              {navigation.map((item) => (
                'isDropdown' in item ? (
                  <div
                    key={item.name}
                    className="relative group"
                    ref={dropdownRef}
                    onMouseEnter={() => {
                      setIsProductsOpen(true);
                    }}
                    onMouseLeave={() => {
                      setIsProductsOpen(false);
                    }}
                  >
                    <button
                      className={`px-3 py-2 text-xl font-medium transition-colors inline-flex items-center ${
                        isActive(item.href, item.isDropdown)
                          ? 'text-primary border-b-2 border-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {item.name}
                      <ChevronDown
                        className={`ml-1 h-4 w-4 transition-transform duration-200 group-hover:rotate-180`}
                      />
                    </button>

                    <div 
                      className={`absolute right-0 top-full w-48 bg-card border border-border rounded-md shadow-lg overflow-hidden transition-all duration-200 ${
                        isProductsOpen ? 'opacity-100 transform scale-100' : 'opacity-0 transform scale-95 pointer-events-none'
                      }`}
                    >
                      <div className="flex flex-col py-2">
                        {item.categories.map((category) => (
                          <Link
                            key={category.title}
                            to={`/${category.title.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            {category.title}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`px-3 py-2 text-xl font-medium transition-colors ${
                      isActive(item.href)
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {item.name}
                  </Link>
                )
              ))}
            </nav>

            {/* Right side icons */}
            <div className="flex items-center justify-end flex-1">
              <div className="flex items-center space-x-2 lg:space-x-4">
                <Link to="/cart" className="relative">
                  <Button variant="ghost" size="sm">
                    <ShoppingCart className="h-4 w-4" />
                    {getTotalItems() > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs">
                        {getTotalItems()}
                      </Badge>
                    )}
                    <span className="sr-only">Shopping Cart</span>
                  </Button>
                </Link>
                <ThemeToggle />
              </div>
            </div>

            {/* Mobile menu button - Now separate from other icons */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden ml-4"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-border">
              <nav className="flex flex-col space-y-2">
                {navigation.map((item) => (
                  'isDropdown' in item ? (
                    <div key={item.name} className="space-y-2">
                      <button
                        onClick={() => {
                          setIsMobileProductsOpen(!isMobileProductsOpen);
                        }}
                        className="w-full flex items-center justify-between px-4 py-2 text-base font-medium text-muted-foreground hover:text-foreground"
                      >
                        {item.name}
                        <ChevronDown
                          className={`ml-1 h-4 w-4 transition-transform duration-200 ${
                            isMobileProductsOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      
                      {isMobileProductsOpen && (
                        <div className="bg-muted/50 py-2 relative z-50">
                          {item.categories.map((category) => (
                            <Link
                              key={category.title}
                              to={`/${category.title.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                              className="block px-8 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer touch-manipulation"
                              onClick={() => {
                                setIsMobileProductsOpen(false);
                                setIsMobileMenuOpen(false);
                              }}
                            >
                              {category.title}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`block px-4 py-2 text-base font-medium transition-colors ${
                        isActive(item.href, item.isDropdown)
                          ? 'text-primary bg-primary/10'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                      onClick={() => {setIsMobileMenuOpen(false);
                      }}
                    >
                      {item.name}
                    </Link>
                  )
                ))}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary/80 rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">RES</span>
                </div>
                <span className="font-bold text-lg text-foreground">
                  {companyInfo?.name || ""}
                </span>
              </div>
              <p className="text-muted-foreground mb-4">{companyInfo?.tagline || ""}</p>
              <p className="text-sm text-muted-foreground">{companyInfo?.address || ""}</p>
              <p className="text-sm text-muted-foreground">{companyInfo?.phone || ""}</p>
              <p className="text-sm text-muted-foreground">{companyInfo?.email || ""}</p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold text-foreground mb-4 text-2xl">Quick Links</h3>
              <ul className="space-y-2">
                {navigation.map((item, idx) => {
                  if (idx === navigation.length - 3) return null; // skip last one
                  return (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-semibold text-foreground mb-4 text-2xl">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/privacy-policy"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/refund-policy"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Refund Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/shipping-policy"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Shipping Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-border pt-8 mt-8">
            <p className="text-center text-sm text-muted-foreground">
              © {new Date().getFullYear()} {companyInfo?.name || ""}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;