import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/Layout";
import { useState, useEffect } from "react";
import { apiService, CompanyInfo } from "@/services/api";

const PrivacyPolicy = () => {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        const data = await apiService.getCompanyInfo();
        setCompanyInfo(data);
      } catch (error) {
        console.error('Error fetching company info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyInfo();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (!companyInfo) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Error loading company information</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Privacy Policy</h1>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Policy for {companyInfo.name}</CardTitle>
              <p className="text-muted-foreground">
                Last updated: {new Date('2025-09-06').toLocaleDateString()}
              </p>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none space-y-6">
              <section>
                <h3 className="text-lg font-semibold mb-3">Introduction</h3>
                <p className="text-muted-foreground">
                  {companyInfo.name} ("we," "our," or "us") is committed to protecting your privacy. 
                  This Privacy Policy explains how we collect, use, disclose, and safeguard your 
                  information when you visit our website and use our services.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">Information We Collect</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Personal Information</h4>
                    <p className="text-muted-foreground">
                      We may collect personal information that you voluntarily provide to us when you:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                      <li>Make a purchase</li>
                      <li>Contact us for support</li>
                      <li>Fill out forms on our website</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Automatically Collected Information</h4>
                    <p className="text-muted-foreground">
                      When you visit our website, we may automatically collect certain information 
                      about your device and usage patterns, including:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                      <li>IP address and location information</li>
                      <li>Browser type and version</li>
                      <li>Operating system</li>
                      <li>Pages visited and time spent</li>
                      <li>Referring website addresses</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">How We Use Your Information</h3>
                <p className="text-muted-foreground mb-2">
                  We use the information we collect for various purposes, including:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Processing and fulfilling your orders</li>
                  <li>Providing customer service and support</li>
                  <li>Improving our website and services</li>
                  <li>Preventing fraud and enhancing security</li>
                  <li>Complying with legal obligations</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">Information Sharing and Disclosure</h3>
                <p className="text-muted-foreground mb-2">
                  We do not sell, trade, or otherwise transfer your personal information to third parties 
                  except in the following circumstances:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>When required by law or legal process</li>
                  <li>To protect our rights, property, or safety</li>
                  <li>In connection with a business transaction or reorganization</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">Data Security</h3>
                <p className="text-muted-foreground">
                  We implement appropriate technical and organizational security measures to protect 
                  your personal information against unauthorized access, alteration, disclosure, or 
                  destruction. However, no method of transmission over the internet or electronic 
                  storage is 100% secure.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">Cookies and Tracking Technologies</h3>
                <p className="text-muted-foreground">
                  We use cookies and similar tracking technologies to enhance your browsing experience, 
                  analyze website traffic, and personalize content. You can control cookie settings 
                  through your browser preferences.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">Your Rights and Choices</h3>
                <p className="text-muted-foreground mb-2">
                  Depending on your location, you may have certain rights regarding your personal information:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Access to your personal information</li>
                  <li>Correction of inaccurate information</li>
                  <li>Deletion of your personal information</li>
                  <li>Objection to processing</li>
                  <li>Data portability</li>
                  <li>Withdrawal of consent</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">Children's Privacy</h3>
                <p className="text-muted-foreground">
                  Our website and services are not intended for children under the age of 13. We do not 
                  knowingly collect personal information from children under 13. If we become aware that 
                  we have collected such information, we will take steps to delete it promptly.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">Changes to This Privacy Policy</h3>
                <p className="text-muted-foreground">
                  We may update this Privacy Policy from time to time. We will notify you of any material 
                  changes by posting the new Privacy Policy on this page and updating the "Last updated" 
                  date. We encourage you to review this Privacy Policy periodically.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">Contact Us</h3>
                <p className="text-muted-foreground mb-2">
                  If you have any questions about this Privacy Policy or our privacy practices, 
                  please contact us at:
                </p>
                <div className="text-muted-foreground">
                  <p>{companyInfo.name}</p>
                  <p>{companyInfo.address}</p>
                  <p>Phone: {companyInfo.phone}</p>
                  <p>Email: {companyInfo.email}</p>
                </div>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default PrivacyPolicy;