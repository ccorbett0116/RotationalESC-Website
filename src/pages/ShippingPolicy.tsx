import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { AlertCircle, Phone, Mail } from "lucide-react";
import Layout from "@/components/Layout";
import { useCanonical } from "@/hooks/useCanonical";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";
const ShippingPolicy = () => {
  useCanonical('/shipping-policy');
  const { data: companyInfo, isLoading: loading } = useCompanyInfo();

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
        <h1 className="text-3xl font-bold text-foreground mb-8">Shipping Policy</h1>

        <div className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This policy applies to all equipment purchases from {companyInfo.name}. Due to the size, weight, and specialized handling of industrial equipment, shipping is arranged individually for each order.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Shipping Policy</CardTitle>
              <p className="text-muted-foreground">
                Last updated: {new Date("2025-09-11").toLocaleDateString()}
              </p>
            </CardHeader>

            <CardContent className="prose prose-sm max-w-none space-y-6">
              <section>
                <h3 className="text-lg font-semibold mb-3">Overview</h3>
                <p className="text-muted-foreground">
                  At {companyInfo.name}, we specialize in shipping industrial equipment across Canada and the United States. Because every shipment can vary significantly in dimensions, weight, handling requirements, and destination, shipping arrangements are confirmed on a per-order basis.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">Order Confirmation &amp; Shipping Arrangements</h3>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>After your order is placed, our team will contact you via email to confirm the details.</li>
                  <li>Together, we will determine the most appropriate and cost-effective shipping method based on equipment size, destination, and delivery timelines.</li>
                  <li>Shipping costs are not automatically calculated at checkout and will be discussed directly with the purchaser.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">Payment for Shipping</h3>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Once a shipping method is selected, we will provide a final invoice including applicable shipping charges.</li>
                  <li>Payment in full is required before equipment is released for shipment.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">Customs &amp; Duties (International Orders)</h3>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Customs clearance, import duties, and taxes may apply for cross-border shipments.</li>
                  <li>Our team will work directly with the purchaser to navigate customs requirements and ensure all documentation is completed correctly.</li>
                  <li>The purchaser is ultimately responsible for any duties, tariffs, and compliance with local regulations.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">Delivery Timelines</h3>
                <p className="text-muted-foreground">
                  Delivery timelines depend on the selected carrier, destination, and equipment type. We will provide an estimated delivery schedule during the confirmation process and communicate any updates as needed.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">Damaged or Lost Shipments</h3>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>All shipments include basic carrier insurance unless otherwise specified.</li>
                  <li>For high-value orders, we recommend discussing additional insurance options with our team.</li>
                  <li>Please inspect your shipment upon delivery and notify us immediately of any damage or loss so we can assist with the carrier claim process.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
                <p className="text-muted-foreground mb-4">
                  For questions about shipping or to finalize arrangements, contact us:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">{companyInfo.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">{companyInfo.email}</span>
                  </div>
                  <p className="text-muted-foreground text-sm mt-2">
                    Customer service hours: {companyInfo.hours}
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">Policy Changes</h3>
                <p className="text-muted-foreground">
                  We may update this Shipping Policy from time to time. Any changes will be posted on our website and will apply to purchases made after the effective date.
                </p>
              </section>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                If you have questions about our shipping policy, our customer service team is here to help.
              </p>
              <Link to="/contact">
                <Button>Contact Customer Service</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ShippingPolicy;
