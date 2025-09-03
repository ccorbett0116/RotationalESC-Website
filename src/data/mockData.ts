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
  material: string;
  specifications: Record<string, string>;
  tags: string[];
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
export const products: ({
  image: object;
  material: string;
  price: number;
  name: string;
  description: string;
  inStock: boolean;
  id: string;
  category: string;
  specifications: { "Flow Rate": string; Head: string; "Inlet Size": string; "Outlet Size": string; Power: string };
  tags: string[]
} | {
  image: string;
  material: string;
  price: number;
  name: string;
  description: string;
  inStock: boolean;
  id: string;
  category: string;
  specifications: { "Flow Rate": string; "Inlet Size": string; "Outlet Size": string; Pressure: string; Power: string };
  tags: string[]
} | {
  image: object;
  material: string;
  price: number;
  name: string;
  description: string;
  inStock: boolean;
  id: string;
  category: string;
  specifications: {
    Control: string;
    "Air Flow": string;
    "Tank Size": string;
    Cooling: string;
    Pressure: string;
    Power: string
  };
  tags: string[]
} | {
  image: string;
  material: string;
  price: number;
  name: string;
  description: string;
  inStock: boolean;
  id: string;
  category: string;
  specifications: {
    "Temperature Rating": string;
    Design: string;
    "Shaft Size": string;
    Type: string;
    "Pressure Rating": string;
    "API Standard": string
  };
  tags: string[]
} | {
  image: object;
  material: string;
  price: number;
  name: string;
  description: string;
  inStock: boolean;
  id: string;
  category: string;
  specifications: {
    Speed: string;
    Frame: string;
    Efficiency: string;
    Voltage: string;
    Enclosure: string;
    Power: string
  };
  tags: string[]
} | {
  image: string;
  material: string;
  price: number;
  name: string;
  description: string;
  inStock: boolean;
  id: string;
  category: string;
  specifications: {
    "Load Rating": string;
    "Speed Limit": string;
    "Outside Diameter": string;
    Width: string;
    Sealing: string;
    Bore: string
  };
  tags: string[]
})[] = [
  {
    id: "pump-001",
    name: "Industrial Centrifugal Pump",
    description: "High-efficiency centrifugal pump designed for industrial applications. Features corrosion-resistant materials and optimized impeller design.",
    price: 2499.99,
    image: centrifugalPumpImg,
    category: "Pumps",
    inStock: true,
    material: "Stainless Steel",
    specifications: {
      "Flow Rate": "500 GPM",
      "Head": "150 ft",
      "Power": "25 HP",
      "Inlet Size": "6 inches",
      "Outlet Size": "4 inches"
    },
    tags: ["centrifugal", "industrial", "stainless steel", "high-efficiency", "corrosion-resistant"]
  },
  {
    id: "pump-002",
    name: "Positive Displacement Pump",
    description: "Reliable positive displacement pump for viscous fluids and precise flow control applications.",
    price: 3299.99,
    image: "/api/placeholder/400/300",
    category: "Pumps",
    inStock: true,
    material: "Cast Iron",
    specifications: {
      "Flow Rate": "200 GPM",
      "Pressure": "300 PSI",
      "Power": "15 HP",
      "Inlet Size": "4 inches",
      "Outlet Size": "3 inches"
    },
    tags: ["positive displacement", "viscous fluids", "flow control", "precision", "cast iron"]
  },
  {
    id: "compressor-001",
    name: "Rotary Screw Compressor",
    description: "Energy-efficient rotary screw compressor with advanced control systems and low maintenance requirements.",
    price: 15999.99,
    image: rotaryCompressorImg,
    category: "Compressors",
    inStock: true,
    material: "Steel",
    specifications: {
      "Air Flow": "125 CFM",
      "Pressure": "175 PSI",
      "Power": "30 HP",
      "Tank Size": "120 gallons",
      "Cooling": "Air Cooled",
      "Control": "VFD"
    },
    tags: ["rotary screw", "compressor", "energy-efficient", "low maintenance", "air cooled"]
  },
  {
    id: "seal-001",
    name: "Mechanical Seal Assembly",
    description: "Durable mechanical seal assembly designed for high-pressure and high-temperature pump applications. Provides reliable sealing performance to minimize leakage and downtime.",
    price: 4999.99,
    image: "/api/placeholder/400/300",
    category: "Seals",
    inStock: true,
    material: "Carbon/SiC/SS316",
    specifications: {
      "Type": "Cartridge Seal",
      "Pressure Rating": "600 PSI",
      "Temperature Rating": "400°F",
      "Shaft Size": "2 inches",
      "Design": "Balanced",
      "API Standard": "API 682"
    },
    tags: ["mechanical seal", "pumps", "leak prevention", "API 682", "industrial"]
  },
  {
    id: "motor-001",
    name: "Variable Frequency Drive Motor",
    description: "Premium efficiency motor with integrated variable frequency drive for optimal energy consumption.",
    price: 1899.99,
    image: vfdMotorImg,
    category: "Motors",
    inStock: true,
    material: "Cast Aluminum",
    specifications: {
      "Power": "50 HP",
      "Voltage": "480V",
      "Speed": "1750 RPM",
      "Efficiency": "96.2%",
      "Frame": "326T",
      "Enclosure": "TEFC"
    },
    tags: ["motor", "VFD", "energy saving", "high efficiency", "industrial"]
  },
  {
    id: "bearing-001",
    name: "Heavy Duty Ball Bearing",
    description: "High-capacity ball bearing designed for heavy industrial applications with extended service life.",
    price: 299.99,
    image: "/api/placeholder/400/300",
    category: "Bearings",
    inStock: true,
    material: "Chrome Steel",
    specifications: {
      "Bore": "100mm",
      "Outside Diameter": "180mm",
      "Width": "34mm",
      "Load Rating": "95 kN",
      "Speed Limit": "4300 RPM",
      "Sealing": "Double Sealed"
    },
    tags: ["ball bearing", "heavy duty", "industrial", "long life", "high load"]
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
  description: "We provide comprehensive services for industrial rotational equipment including pumps, compressors, motors, bearings, and seals. Our experienced team delivers reliable solutions for maintenance, repair, and optimization of your critical equipment.",
  address: "1234 Industrial Blvd, Equipment City, EC 12345",
  phone: "(555) 123-4567",
  email: "info@rotationalequipment.com",
  hours: "Monday - Friday: 8:00 AM - 5:00 PM",
  founded: "1985",
  employees: "50+",
  certifications: ["ISO 9001", "API 610", "ASME Certified"]
};
