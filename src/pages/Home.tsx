import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {CheckCircle, Settings, Users, BookOpenCheck} from "lucide-react";
import Layout from "@/components/Layout";
import heroImage from "@/assets/home-banner.webp";
import ProductCard from "@/components/ProductCard";
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
    features: ["Expert diagnostics", "Quality parts", "Fast turnaround"]
  },
  {
    id: 2,
    title: "Equipment Sales",
    description: "A dedicated team of sales professionals committed to finding the right solution for you",
    features: ["Equipment selection", "Pump and part sales", "Custom built solutions"]
  },
  {
    id: 3,
    title: "Consultation",
    description: "Expert advice on equipment selection and optimization",
    features: ["Technical expertise", "Cost analysis", "Performance optimization"]
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
            <Button onClick={() => window.location.reload()} className="mt-4">
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
                  <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
                    Browse Equipment
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white">
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
      <section className="py-20 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">Our Services</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comprehensive solutions for all your rotational equipment needs
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 stagger-children">
            {services.map((service) => (
              <Card key={service.id} className="h-full">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Settings className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="line-clamp-2">{service.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4 text-sm">
                    {service.description}
                  </CardDescription>
                  <ul className="space-y-2">
                    {service.features.slice(0, 3).map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">Featured Equipment</h2>
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
              <Button size="lg">View All Equipment</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">Why Choose Us</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Trusted expertise and quality service since {companyInfo.founded}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg lg:text-xl font-semibold mb-2">Expert Team</h3>
              <p className="text-sm lg:text-base text-muted-foreground">
                Having over 40 years of experience with pumps, mechanical seals, and other industrial equipment, our team is ready to find the right solution for you
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpenCheck className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg lg:text-xl font-semibold mb-2">Factory Trained Professionals</h3>
              <p className="text-sm lg:text-base text-muted-foreground">
                Our professionals are factory trained and able to provide expert selection advice, as well as handle installations and repairs.
              </p>
            </div>
            <div className="text-center sm:col-span-2 lg:col-span-1">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg lg:text-xl font-semibold mb-2">Industry Experience & Knowledge</h3>
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
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Contact us today for a consultation and quote on your rotational equipment needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact">
              <Button size="lg">
                Contact Us Today
              </Button>
            </Link>
            <Link to="/shop">
              <Button variant="outline" size="lg">
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