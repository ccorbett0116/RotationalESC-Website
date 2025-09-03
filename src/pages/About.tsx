import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Award } from "lucide-react";
import { companyInfo, teamMembers, services } from "@/data/mockData";
import Layout from "@/components/Layout";

const About = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              About {companyInfo.name}
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
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
                {new Date().getFullYear() - parseInt(companyInfo.founded)}+
              </h3>
              <p className="text-muted-foreground">Years of Experience</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-2">{companyInfo.employees}</h3>
              <p className="text-muted-foreground">Expert Professionals</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-2">
                {companyInfo.certifications.length}
              </h3>
              <p className="text-muted-foreground">Industry Certifications</p>
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
                  Founded in {companyInfo.founded}, Rotational Equipment Services began as a small family business 
                  with a vision to provide reliable, high-quality equipment solutions for industrial applications. 
                  Over the decades, we've grown into a trusted partner for businesses across the region.
                </p>
                <p>
                  Our commitment to excellence and customer satisfaction has driven our success. We've built 
                  lasting relationships with clients by delivering not just products, but comprehensive solutions 
                  that keep their operations running smoothly.
                </p>
                <p>
                  Today, we continue to innovate and expand our services while maintaining the personal touch 
                  and attention to detail that has defined us from the beginning.
                </p>
              </div>
            </div>
            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
              <img
                src="/api/placeholder/600/400"
                alt="Company facility"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">Certifications & Standards</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We maintain the highest industry standards and certifications to ensure quality and safety
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {companyInfo.certifications.map((cert, index) => (
              <Badge key={index} variant="outline" className="text-lg py-2 px-4">
                {cert}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">Our Team</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Meet the experienced professionals who make it all happen
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {teamMembers.map((member) => (
              <Card key={member.id} className="text-center">
                <CardHeader>
                  <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden bg-muted">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardTitle>{member.name}</CardTitle>
                  <CardDescription className="font-medium text-primary">
                    {member.position}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
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