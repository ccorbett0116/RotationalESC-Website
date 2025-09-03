import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Package, CreditCard, Settings, MapPin } from "lucide-react";
import Layout from "@/components/Layout";

const MyAccount = () => {
  const [activeTab, setActiveTab] = useState("profile");

  // Mock user data
  const user = {
    name: "John Smith",
    email: "john.smith@company.com",
    phone: "(555) 123-4567",
    company: "Industrial Solutions Inc.",
    address: {
      street: "456 Business Ave",
      city: "Industrial City",
      state: "IC",
      zip: "12345"
    }
  };

  // Mock order history
  const orders = [
    {
      id: "ORD-2024-001",
      date: "2024-01-15",
      status: "Delivered",
      total: 2499.99,
      items: ["Industrial Centrifugal Pump"]
    },
    {
      id: "ORD-2024-002",
      date: "2024-01-10",
      status: "Shipped",
      total: 3799.98,
      items: ["Variable Frequency Drive Motor", "Heavy Duty Ball Bearing"]
    },
    {
      id: "ORD-2023-015",
      date: "2023-12-20",
      status: "Delivered",
      total: 15999.99,
      items: ["Rotary Screw Compressor"]
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Delivered":
        return <Badge className="bg-green-100 text-green-800">Delivered</Badge>;
      case "Shipped":
        return <Badge className="bg-blue-100 text-blue-800">Shipped</Badge>;
      case "Processing":
        return <Badge className="bg-yellow-100 text-yellow-800">Processing</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">My Account</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="addresses" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Addresses
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" defaultValue={user.name} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" defaultValue={user.email} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" defaultValue={user.phone} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input id="company" defaultValue={user.company} />
                  </div>
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order History</CardTitle>
                <CardDescription>
                  View your past orders and track current shipments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border border-border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold">Order {order.id}</h3>
                          <p className="text-sm text-muted-foreground">
                            Placed on {new Date(order.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(order.status)}
                          <p className="text-lg font-semibold text-primary mt-1">
                            ${order.total.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {order.items.map((item, index) => (
                          <p key={index} className="text-sm text-muted-foreground">
                            • {item}
                          </p>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        {order.status === "Delivered" && (
                          <Button variant="outline" size="sm">
                            Reorder
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Addresses Tab */}
          <TabsContent value="addresses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Shipping Addresses</CardTitle>
                <CardDescription>
                  Manage your shipping and billing addresses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border border-border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">Default Address</h3>
                      <Badge variant="secondary">Primary</Badge>
                    </div>
                    <div className="text-muted-foreground">
                      <p>{user.company}</p>
                      <p>{user.address.street}</p>
                      <p>{user.address.city}, {user.address.state} {user.address.zip}</p>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button variant="outline" size="sm">Delete</Button>
                    </div>
                  </div>
                  <Button variant="outline">
                    Add New Address
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your account preferences and security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-4">Password</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input id="current-password" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input id="new-password" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input id="confirm-password" type="password" />
                    </div>
                    <Button>Update Password</Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-4">Email Preferences</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="order-updates" defaultChecked />
                      <Label htmlFor="order-updates">Order updates and shipping notifications</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="promotions" defaultChecked />
                      <Label htmlFor="promotions">Promotional emails and special offers</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="newsletter" />
                      <Label htmlFor="newsletter">Monthly newsletter</Label>
                    </div>
                  </div>
                  <Button className="mt-4">Save Preferences</Button>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-4 text-destructive">Danger Zone</h3>
                  <p className="text-muted-foreground mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <Button variant="destructive">Delete Account</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default MyAccount;