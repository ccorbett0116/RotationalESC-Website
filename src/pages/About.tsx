import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Award } from "lucide-react";
import { useCanonical } from "@/hooks/useCanonical";
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
import { apiService, CompanyInfo } from "@/services/api";
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import AboutUsImage from "@/assets/about-banner.jpg";
import NewAboutUsImage from "@/assets/about-hero.png";


const About = () => {
  useCanonical('/about');
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        const data = await apiService.getCompanyInfo();
        setCompanyInfo(data);
      } catch (err) {
        console.error('Error fetching company info:', err);
        setError('Failed to load company information');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyInfo();
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

  if (error || !companyInfo) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-lg text-red-500">{error || 'Company information not found'}</p>
          </div>
        </div>
      </Layout>
    );
  }
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-16">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${AboutUsImage})`,
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
              About {companyInfo.name}
            </h1>
            <p className="text-xl text-gray-200 max-w-3xl mx-auto">
              {companyInfo.description}
            </p>
          </div>
        </div>
      </section>

      {/* Company Stats */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-2">
                {new Date().getFullYear() - 1981}+
              </h3>
              <p className="text-muted-foreground">Years of Experience</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-2">{1000}+</h3>
              <p className="text-muted-foreground">Graduated Students</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-2">Vendors</h3>
              <p className="text-muted-foreground">Authorized Representative to Several Key Manufacturers</p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">Our Story</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Rotational Equipment Services (RES) is a trusted supplier of industrial pumps and mechanical seals, serving critical industries such as wastewater treatment, petroleum, steel, and food processing. With over 40 years of hands-on experience and a strong base of repeat business, RES has built a reputation for reliability, technical knowledge, and responsive service.

                  Our founder brings a distinguished background working directly for leading pump and seal manufacturers, where he became a recognized subject matter expert in product development. He has spent years training professionals in hydraulic fundamentals and root cause failure analysis, personally graduating thousands of students across North America. This combination of practical industry expertise and deep technical insight continues to shape RES’s approach—delivering solutions that are not only reliable, but informed by decades of frontline experience and innovation.
                </p>
              </div>
            </div>
            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
              <img
                src={NewAboutUsImage}
                alt="Industry professionals talking"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">What We Do</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comprehensive services for all your rotational equipment needs
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((service) => (
              <Card key={service.id}>
                <CardHeader>
                  <CardTitle>{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">
                    {service.description}
                  </CardDescription>
                  <ul className="space-y-2">
                    {service.features.map((feature, index) => (
                      <li key={index} className="text-sm text-muted-foreground">
                        • {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default About;