import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/Layout";

const Maintenance = () => {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
        <Card className="w-full max-w-lg text-center">
          <CardHeader className="pb-4">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              System Maintenance
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              We're currently performing maintenance on our servers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <p className="text-muted-foreground">
                Our system is temporarily unavailable while we perform essential updates and improvements.
              </p>
              <p className="text-muted-foreground">
                We apologize for any inconvenience and appreciate your patience.
              </p>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-foreground">What you can do:</h3>
              <ul className="text-sm text-muted-foreground space-y-1 text-left">
                <li>• Try refreshing the page in a few minutes</li>
                <li>• Check back later for full functionality</li>
              </ul>
            </div>

            <div className="flex justify-center">
              <Button onClick={handleRefresh} className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Maintenance;