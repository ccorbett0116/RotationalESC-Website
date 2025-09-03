import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, User, Menu, X, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { companyInfo } from "@/data/mockData";
import { ThemeToggle } from "@/components/ThemeToggle";
import Logo from "@/assets/logo.svg";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Shop', href: '/shop' },
    { name: 'Contact', href: '/contact' },
    {
      name: 'Products',
      href: '/shop',
      isDropdown: true,
      categories: [
        {
          title: 'Pumps'
        },
        {
          title: 'Mechanical Seals'
        },
        {
          title: 'Packing'
        },
        {
          title: 'Service & Repair'
        }
      ]
    }
  ];

  const isActive = (path: string) => location.pathname === path;

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
      {/* Header */}
      <header className="border-b border-border bg-card relative z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
              {/* Primary links (exclude Products) */}
              <div className="flex items-center space-x-6">
                {navigation
                  .filter((item) => !item.isDropdown)
                  .map((item) => (
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
                  ))}
              </div>

              {/* Products — separated into its own container */}
              {(() => {
                const product = navigation.find((n) => n.isDropdown);
                if (!product) return null;
                return (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setIsProductsOpen(!isProductsOpen)}
                      aria-expanded={isProductsOpen}
                      aria-controls="products-dropdown"
                      className={`px-3 py-2 text-xl font-medium transition-colors inline-flex items-center ${
                        isActive(product.href)
                          ? 'text-primary border-b-2 border-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {product.name}
                      <ChevronDown
                        className={`ml-1 h-4 w-4 transition-transform duration-200 ${
                          isProductsOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isProductsOpen && (
                      <div 
                        className="absolute left-0 w-screen transform mt-1 z-50" 
                        id="products-dropdown" 
                        role="menu"
                        style={{ left: '50%', transform: 'translateX(-50%)' }}
                      >
                        <div className="w-full bg-card border-t border-border shadow-lg">
                          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-x-8 gap-y-10">
                              {product.categories.map((category) => (
                                <div key={category.title} className="space-y-4">
                                  <h3 className="text-xl font-semibold text-foreground">
                                    {category.title}
                                  </h3>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </nav>

            {/* Right side icons */}
            <div className="flex items-center justify-end flex-1">
              <div className="flex items-center space-x-2 lg:space-x-4">
                <Link to="/account">
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4" />
                    <span className="sr-only">Account</span>
                  </Button>
                </Link>
                <Link to="/cart" className="relative">
                  <Button variant="ghost" size="sm">
                    <ShoppingCart className="h-4 w-4" />
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs">
                      2
                    </Badge>
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
                  <div key={item.name} className="relative">
                    <Link
                      to={item.href}
                      className={`block px-3 py-2 text-base font-medium transition-colors ${
                        isActive(item.href)
                          ? 'text-primary bg-primary/10'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>

                    {/* Dropdown for Products in Mobile */}
                    {item.isDropdown && (
                      <div className="absolute left-0 z-10 mt-2 w-48 bg-card border border-border rounded-md shadow-lg overflow-hidden">
                        {item.categories.map((category) => (
                          <div key={category.title} className="p-4">
                            <span className="block text-sm font-semibold text-foreground">
                              {category.title}
                            </span>
                            <span className="block text-xs text-muted-foreground mb-2">
                              {category.description}
                            </span>
                            <ul className="space-y-1">
                              {category.items.map((subItem) => (
                                <li key={subItem}>
                                  <Link
                                    to={`/${subItem.toLowerCase().replace(/ /g, '-')}`}
                                    className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                  >
                                    {subItem}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
                <span className="font-bold text-lg text-foreground">{companyInfo.name}</span>
              </div>
              <p className="text-muted-foreground mb-4">{companyInfo.tagline}</p>
              <p className="text-sm text-muted-foreground">{companyInfo.address}</p>
              <p className="text-sm text-muted-foreground">{companyInfo.phone}</p>
              <p className="text-sm text-muted-foreground">{companyInfo.email}</p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className=" flex flex-row font-semibold text-foreground mb-4 text-2xl">Quick Links</h3>
              <ul className="flex md:flex-row md:space-x-5 flex-col space-y-2 md:space-y-0 text-xl">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            
          </div>

          <div className="border-t border-border pt-8 mt-8">
            <p className="text-center text-sm text-muted-foreground">
              © {new Date().getFullYear()} {companyInfo.name}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;