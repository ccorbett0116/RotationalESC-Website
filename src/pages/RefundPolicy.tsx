import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { AlertCircle, Phone, Mail } from "lucide-react";
import Layout from "@/components/Layout";
import { useState, useEffect } from "react";
import { apiService, CompanyInfo } from "@/services/api";

const RefundPolicy = () => {
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
          <h1 className="text-3xl font-bold text-foreground mb-8">Refund Policy</h1>

          <div className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This policy applies to all equipment purchases from {companyInfo.name}.
                Please read carefully before making your purchase.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>Return and Refund Policy</CardTitle>
                <p className="text-muted-foreground">
                  Last updated: {new Date().toLocaleDateString()}
                </p>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none space-y-6">

                <section>
                  <h3 className="text-lg font-semibold mb-3">Overview</h3>
                  <p className="text-muted-foreground">
                    At {companyInfo.name}, all sales of industrial equipment are final.
                    This refund policy outlines the limited circumstances under which returns,
                    exchanges, and refunds are accepted.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">Return Period</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Defective, Damaged, or Incorrectly Shipped Items</h4>
                      <p className="text-muted-foreground">
                        Returns must be initiated within <strong>7 days</strong> of delivery.
                        Items must remain unused, in original packaging, and accompanied by
                        a Return Merchandise Authorization (RMA).
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Custom or Special Order Items</h4>
                      <p className="text-muted-foreground">
                        Custom manufactured or special order items are non-returnable.
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">Eligible Returns</h3>
                  <p className="text-muted-foreground">
                    Items eligible for return are limited to defective, damaged, or incorrectly shipped equipment, as outlined above.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">Non-Returnable Items</h3>
                  <p className="text-muted-foreground">
                    Custom manufactured or special order equipment cannot be returned.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">Return Process</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Step 1: Contact Us</h4>
                      <p className="text-muted-foreground">
                        Contact our customer service team to initiate a return.
                        You will need your order number and reason for return.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Step 2: Authorization</h4>
                      <p className="text-muted-foreground">
                        We will provide you with a Return Merchandise Authorization (RMA)
                        number and return instructions.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Step 3: Ship the Item</h4>
                      <p className="text-muted-foreground">
                        Package the item securely in its original packaging and ship to our
                        designated return facility. Include the RMA number on the package.
                        <em> Return shipping costs are the responsibility of the customer.</em>
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Step 4: Inspection</h4>
                      <p className="text-muted-foreground">
                        We will inspect the returned item within 5–7 business days of receipt
                        to confirm eligibility for refund or exchange.
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">Refund Processing</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Refund Timeline</h4>
                      <p className="text-muted-foreground">
                        Approved refunds will be processed within <strong>10 business days</strong>
                        after inspection. Refunds are issued to the original payment method.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Refund Amount</h4>
                      <p className="text-muted-foreground">
                        Refunds cover the purchase price only. Shipping charges are non-refundable.
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">Exchanges</h3>
                  <p className="text-muted-foreground">
                    We offer exchanges for defective, damaged, or incorrectly shipped items.
                    Any price difference for exchanges must be paid before shipping the replacement.
                    Exchange requests follow the same process as returns.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">Defective or Damaged Items</h3>
                  <p className="text-muted-foreground">
                    If you receive a defective, damaged, or incorrectly shipped item,
                    you must report it within 7 days of delivery.
                    Return shipping costs are the responsibility of the customer.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
                  <p className="text-muted-foreground mb-4">
                    For return questions or to initiate a return, please contact us:
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
                    We reserve the right to modify this refund policy at any time.
                    Changes will be posted on our website and will apply to purchases
                    made after the effective date.
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
                  If you have questions about our refund policy or need to initiate a return,
                  our customer service team is here to help.
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

export default RefundPolicy;