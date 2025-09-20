import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {CheckCircle, Users, BookOpenCheck, Wrench, ShoppingCart, MessageSquare} from "lucide-react";
import Layout from "@/components/Layout";
import heroImage from "@/assets/home-banner.webp";
import ProductCard from "@/components/ProductCard";
import ServiceCard from "@/components/ServiceCard";
import { apiService, Product } from "@/services/api";
import { useEffect, useState } from "react";
import { useCanonical } from "@/hooks/useCanonical";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";
import { Helmet } from "react-helmet";
// Define services inline
const services = [
  {
    id: 1,
    title: "Equipment Repair",
    description: "Professional repair services for industrial equipment",
    features: ["Expert diagnostics", "Quality parts", "Fast turnaround"],
    icon: Wrench
  },
  {
    id: 2,
    title: "Equipment Sales",
    description: "A dedicated team of sales professionals committed to finding the right solution for you",
    features: ["Equipment selection", "Pump and part sales", "Custom built solutions"],
    icon: ShoppingCart
  },
  {
    id: 3,
    title: "Consultation",
    description: "Expert advice on equipment selection and optimization",
    features: ["Technical expertise", "Cost analysis", "Performance optimization"],
    icon: MessageSquare
  }
];

const Home = () => {
  useCanonical('/');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: companyInfo } = useCompanyInfo();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch products only - company info handled by hook
        const productsResponse = await apiService.getProducts({ page: 1, ordering: 'order' });
        
        // Use products ordered by 'order' field (lowest numbers first, null values last)
        setProducts(productsResponse.results);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-lg text-muted-foreground"></p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-lg text-red-500">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4 transition-all duration-300 hover:scale-105 hover:shadow-lg">
              Try Again
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!companyInfo) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-lg text-muted-foreground"></p>
          </div>
        </div>
      </Layout>
    );
  }
  return (
    <Layout>
      <Helmet>
        <meta name="format-detection" content="telephone=no" />
        <style>{`
          .hero-image { 
            will-change: auto;
            transform: translateZ(0);
          }
        `}</style>
      </Helmet>
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt="Industrial equipment banner"
            className="w-full h-full object-cover hero-image"
            fetchPriority="high"
            loading="eager"
            decoding="sync"
          />
          <div className="absolute inset-0 bg-[rgba(0,0,0,0.6)] backdrop-blur-[2px]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="text-center lg:text-left order-2 lg:order-1">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white">
                {companyInfo.name.split(' ').slice(0, -1).join(' ')}
                <span className="block text-primary">{companyInfo.name.split(' ').slice(-1)[0]}</span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-200 mb-8">
                {companyInfo.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/shop">
                  <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 hover:scale-105 hover:shadow-lg">
                    Browse Equipment
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white transition-all duration-300 hover:scale-105 hover:shadow-lg">
                    Get Quote
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative order-1 lg:order-2">
             
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-muted/50 relative overflow-hidden">
        {/* Decorative background elements for desktop */}
        <div className="absolute inset-0 hidden lg:block">
          <div className="absolute top-10 left-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-primary/3 rounded-full blur-2xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div 
            className="text-center mb-16 cursor-pointer"
            style={{
              transition: 'all 0.3s ease-in-out',
              transform: 'translateY(0px) scale(1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';
              e.currentTarget.style.filter = 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.1))';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0px) scale(1)';
              e.currentTarget.style.filter = 'none';
            }}
          >
            <h2 className="text-3xl font-bold text-foreground mb-4 transition-colors duration-300 hover:text-primary">Our Services</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comprehensive solutions for all your rotational equipment needs
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 stagger-children">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                id={service.id}
                title={service.title}
                description={service.description}
                features={service.features}
                icon={service.icon}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div 
            className="text-center mb-16 cursor-pointer"
            style={{
              transition: 'all 0.3s ease-in-out',
              transform: 'translateY(0px) scale(1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';
              e.currentTarget.style.filter = 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.1))';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0px) scale(1)';
              e.currentTarget.style.filter = 'none';
            }}
          >
            <h2 className="text-3xl font-bold text-foreground mb-4 transition-colors duration-300 hover:text-primary">Featured Equipment</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              High-quality rotational equipment for industrial applications
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 stagger-children">
            {products.slice(0, 3).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="text-center mt-12">
            <Link to="/shop">
              <Button size="lg" className="transition-all duration-300 hover:scale-105 hover:shadow-lg">View All Equipment</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-muted/50 relative overflow-hidden">
        {/* Decorative background elements for desktop */}
        <div className="absolute inset-0 hidden lg:block">
          <div className="absolute top-20 right-20 w-36 h-36 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-28 h-28 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute top-1/3 right-1/3 w-20 h-20 bg-primary/3 rounded-full blur-2xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div 
            className="text-center mb-16 cursor-pointer"
            style={{
              transition: 'all 0.3s ease-in-out',
              transform: 'translateY(0px) scale(1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';
              e.currentTarget.style.filter = 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.1))';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0px) scale(1)';
              e.currentTarget.style.filter = 'none';
            }}
          >
            <h2 className="text-3xl font-bold text-foreground mb-4 transition-colors duration-300 hover:text-primary">Why Choose Us</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Trusted expertise and quality service since {companyInfo.founded}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="text-center group hover:bg-background/50 rounded-lg p-6 -m-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg group-hover:shadow-xl">
                <Users className="h-10 w-10 text-primary group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-lg lg:text-xl font-semibold mb-3 group-hover:text-primary transition-colors duration-300">Expert Team</h3>
              <p className="text-sm lg:text-base text-muted-foreground">
                Having over 40 years of experience with pumps, mechanical seals, and other industrial equipment, our team is ready to find the right solution for you
              </p>
            </div>
            <div className="text-center group hover:bg-background/50 rounded-lg p-6 -m-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg group-hover:shadow-xl">
                <BookOpenCheck className="h-10 w-10 text-primary group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-lg lg:text-xl font-semibold mb-3 group-hover:text-primary transition-colors duration-300">Factory Trained Professionals</h3>
              <p className="text-sm lg:text-base text-muted-foreground">
                Our professionals are factory trained and able to provide expert selection advice, as well as handle installations and repairs.
              </p>
            </div>
            <div className="text-center sm:col-span-2 lg:col-span-1 group hover:bg-background/50 rounded-lg p-6 -m-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg group-hover:shadow-xl">
                <CheckCircle className="h-10 w-10 text-primary group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-lg lg:text-xl font-semibold mb-3 group-hover:text-primary transition-colors duration-300">Industry Experience & Knowledge</h3>
              <p className="text-sm lg:text-base text-muted-foreground">
               Our professionals have extensive experience in many industries. We understand manufacturing, installation, and operational issues of our customers which enables us to meet todays demanding requirements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div 
            className="cursor-pointer mb-8"
            style={{
              transition: 'all 0.3s ease-in-out',
              transform: 'translateY(0px) scale(1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';
              e.currentTarget.style.filter = 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.1))';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0px) scale(1)';
              e.currentTarget.style.filter = 'none';
            }}
          >
            <h2 className="text-3xl font-bold text-foreground mb-4 transition-colors duration-300 hover:text-primary">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-muted-foreground">
              Contact us today for a consultation and quote on your rotational equipment needs
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact">
              <Button size="lg" className="transition-all duration-300 hover:scale-105 hover:shadow-lg">
                Contact Us Today
              </Button>
            </Link>
            <Link to="/shop">
              <Button variant="outline" size="lg" className="transition-all duration-300 hover:scale-105 hover:shadow-lg">
                Browse Equipment
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Home;