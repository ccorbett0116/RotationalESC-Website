import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, User, Menu, X } from "lucide-react";
import { useState } from "react";
import { companyInfo } from "@/data/mockData";
import { ThemeToggle } from "@/components/ThemeToggle";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Shop', href: '/shop' },
    { name: 'Contact', href: '/contact' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary/80 rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">RES</span>
              </div>
              <span className="font-bold text-base lg:text-lg text-foreground truncate">{companyInfo.name}</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-6 lg:space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Right side icons */}
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

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                <span className="sr-only">Toggle menu</span>
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-border">
              <nav className="flex flex-col space-y-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
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
              <h3 className="font-semibold text-foreground mb-4">Quick Links</h3>
              <ul className="space-y-2">
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

            {/* Legal */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/privacy"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/refund"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Refund Policy
                  </Link>
                </li>
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