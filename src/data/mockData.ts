import centrifugalPumpImg from "@/assets/centrifugal-pump.jpg";
import rotaryCompressorImg from "@/assets/rotary-compressor.jpg";
import vfdMotorImg from "@/assets/vfd-motor.jpg";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  inStock: boolean;
  specifications: Record<string, string>;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  features: string[];
}

export interface TeamMember {
  id: string;
  name: string;
  position: string;
  bio: string;
  image: string;
}

// Products Data
export const products: Product[] = [
  {
    id: "pump-001",
    name: "Industrial Centrifugal Pump",
    description: "High-efficiency centrifugal pump designed for industrial applications. Features corrosion-resistant materials and optimized impeller design.",
    price: 2499.99,
    image: centrifugalPumpImg,
    category: "Pumps",
    inStock: true,
    specifications: {
      "Flow Rate": "500 GPM",
      "Head": "150 ft",
      "Power": "25 HP",
      "Inlet Size": "6 inches",
      "Outlet Size": "4 inches",
      "Material": "Stainless Steel"
    }
  },
  {
    id: "pump-002",
    name: "Positive Displacement Pump",
    description: "Reliable positive displacement pump for viscous fluids and precise flow control applications.",
    price: 3299.99,
    image: "/api/placeholder/400/300",
    category: "Pumps",
    inStock: true,
    specifications: {
      "Flow Rate": "200 GPM",
      "Pressure": "300 PSI",
      "Power": "15 HP",
      "Inlet Size": "4 inches",
      "Outlet Size": "3 inches",
      "Material": "Cast Iron"
    }
  },
  {
    id: "compressor-001",
    name: "Rotary Screw Compressor",
    description: "Energy-efficient rotary screw compressor with advanced control systems and low maintenance requirements.",
    price: 15999.99,
    image: rotaryCompressorImg,
    category: "Compressors",
    inStock: true,
    specifications: {
      "Air Flow": "125 CFM",
      "Pressure": "175 PSI",
      "Power": "30 HP",
      "Tank Size": "120 gallons",
      "Cooling": "Air Cooled",
      "Control": "VFD"
    }
  },
  {
    id: "turbine-001",
    name: "Steam Turbine Generator",
    description: "High-performance steam turbine generator for power generation applications with advanced control systems.",
    price: 45000.00,
    image: "/api/placeholder/400/300",
    category: "Turbines",
    inStock: false,
    specifications: {
      "Power Output": "1000 kW",
      "Steam Pressure": "600 PSI",
      "Steam Temperature": "750°F",
      "Efficiency": "85%",
      "Speed": "3600 RPM",
      "Generator": "Synchronous"
    }
  },
  {
    id: "motor-001",
    name: "Variable Frequency Drive Motor",
    description: "Premium efficiency motor with integrated variable frequency drive for optimal energy consumption.",
    price: 1899.99,
    image: vfdMotorImg,
    category: "Motors",
    inStock: true,
    specifications: {
      "Power": "50 HP",
      "Voltage": "480V",
      "Speed": "1750 RPM",
      "Efficiency": "96.2%",
      "Frame": "326T",
      "Enclosure": "TEFC"
    }
  },
  {
    id: "bearing-001",
    name: "Heavy Duty Ball Bearing",
    description: "High-capacity ball bearing designed for heavy industrial applications with extended service life.",
    price: 299.99,
    image: "/api/placeholder/400/300",
    category: "Bearings",
    inStock: true,
    specifications: {
      "Bore": "100mm",
      "Outside Diameter": "180mm",
      "Width": "34mm",
      "Load Rating": "95 kN",
      "Speed Limit": "4300 RPM",
      "Sealing": "Double Sealed"
    }
  }
];

// Services Data
export const services: Service[] = [
  {
    id: "maintenance",
    title: "Preventive Maintenance",
    description: "Comprehensive maintenance programs to keep your rotational equipment running at peak performance.",
    features: [
      "Regular equipment inspections",
      "Scheduled maintenance services",
      "Performance monitoring",
      "Predictive maintenance analysis",
      "Emergency repair services"
    ]
  },
  {
    id: "repair",
    title: "Equipment Repair",
    description: "Expert repair services for all types of rotational equipment with certified technicians.",
    features: [
      "On-site repair services",
      "Workshop rebuilds",
      "Parts replacement",
      "Performance testing",
      "Warranty coverage"
    ]
  },
  {
    id: "consulting",
    title: "Technical Consulting",
    description: "Professional consulting services to optimize your equipment performance and efficiency.",
    features: [
      "System optimization",
      "Energy efficiency audits",
      "Equipment selection",
      "Process improvement",
      "Training programs"
    ]
  }
];

// Team Data
export const teamMembers: TeamMember[] = [
  {
    id: "john-smith",
    name: "John Smith",
    position: "Chief Engineer",
    bio: "Over 20 years of experience in rotational equipment design and maintenance. Expert in pump systems and industrial applications.",
    image: "/api/placeholder/300/300"
  },
  {
    id: "sarah-johnson",
    name: "Sarah Johnson",
    position: "Service Manager",
    bio: "Experienced service professional specializing in preventive maintenance programs and customer relations.",
    image: "/api/placeholder/300/300"
  },
  {
    id: "mike-davis",
    name: "Mike Davis",
    position: "Technical Specialist",
    bio: "Certified technician with expertise in compressor systems, turbines, and advanced diagnostic techniques.",
    image: "/api/placeholder/300/300"
  }
];

// Company Information
export const companyInfo = {
  name: "Rotational Equipment Services",
  tagline: "Your trusted partner for industrial rotational equipment",
  description: "We provide comprehensive services for industrial rotational equipment including pumps, compressors, turbines, and motors. Our experienced team delivers reliable solutions for maintenance, repair, and optimization of your critical equipment.",
  address: "1234 Industrial Blvd, Equipment City, EC 12345",
  phone: "(555) 123-4567",
  email: "info@rotationalequipment.com",
  hours: "Monday - Friday: 8:00 AM - 5:00 PM",
  founded: "1985",
  employees: "50+",
  certifications: ["ISO 9001", "API 610", "ASME Certified"]
};