export interface ProjectItem {
  id: string;
  slug: string;
  title: string;
  category: string; // Dynamic categories (+ All)
  projectType: string; // Dynamic project types (+ All)
  shortDescription: string;
  technologies: string[]; // 3 to 4 key technologies
  previewImages: string[]; // exactly 3 preview images
  hasDetailPage: boolean;
  liveUrl?: string;
  githubUrl?: string;
  overview?: string;
  keyFeatures?: string[] | string;
  role?: string;
  order?: number;
  isFeaturedOnHome?: boolean;
}

export const PROJECTS_DATA: ProjectItem[] = [
  {
    id: "multi-tenant-pos",
    slug: "multi-tenant-ecommerce-pos",
    title: "Multi-Tenant E-Commerce & POS SaaS",
    category: "Development",
    projectType: "Professional", // Workplace project
    shortDescription:
      "Enterprise platform managing Master Admin, multi-vendor Tenant stores, and customer storefronts with real-time POS billing.",
    technologies: ["React.js", "Redux", "Node.js", "MongoDB"],
    previewImages: [
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1000&q=80",
    ],
    hasDetailPage: true,
    overview:
      "A comprehensive multi-tenant architecture designed to scale merchant stores with role-based access, automated inventory sync, and localized POS billing checkout workflows.",
    keyFeatures: [
      "Role-Based Access Control (RBAC) across Master Admin and Store Tenants",
      "Dynamic product catalog and category hierarchy management",
      "Order lifecycle tracking, customer management, and invoice generation",
      "Multi-store subscription plan gating and billing analytics",
    ],
    role: "Full Stack SDE • Best Labz",
  },
  {
    id: "hefgro-saas",
    slug: "hefgro-saas-landing",
    title: "Hefgro SaaS Platform",
    category: "Development",
    projectType: "Professional", // Workplace project
    shortDescription:
      "High-conversion, responsive SaaS interface showcasing smart inventory, procurement, and factory operation workflows.",
    technologies: ["Next.js", "Tailwind CSS", "React.js", "Figma"],
    previewImages: [
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1000&q=80",
    ],
    hasDetailPage: true,
    liveUrl: "https://www.hefgro.com/",
    overview:
      "Engineered a polished, responsive digital presence for an industrial operations SaaS, emphasizing interactive module previews, rapid loading times, and intuitive typography.",
    keyFeatures: [
      "Interactive feature showcases and workflow diagrams",
      "Optimized Core Web Vitals with seamless responsive scaling",
      "Clean UI component design system aligned with industrial software branding",
    ],
    role: "Frontend Developer • Best Labz",
  },
  {
    id: "mern-ecommerce",
    slug: "fullstack-mern-ecommerce",
    title: "Full Stack E-Commerce Platform",
    category: "Development",
    projectType: "Personal", // Own Project
    shortDescription:
      "Complete shopping platform featuring customer authentication, cart state management, checkout, and merchant admin panel.",
    technologies: ["MERN Stack", "Express.js", "MongoDB", "Tailwind"],
    previewImages: [
      "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1522204523234-8729aa6e3d5f?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1000&q=80",
    ],
    hasDetailPage: true,
    liveUrl: "https://ecommerce-frontend-five-orpin.vercel.app/",
    overview:
      "Production-ready e-commerce store with secure JWT user sessions, real-time cart mutations, catalog filtering, and comprehensive administrative dashboards.",
    keyFeatures: [
      "JWT-based user registration, authentication, and password security",
      "Persistent shopping cart with stock availability checks",
      "Admin portal for product uploads, order tracking, and sales analytics",
    ],
    role: "Independent Full Stack Project",
  },
  {
    id: "internal-enterprise-design",
    slug: "enterprise-uiux-systems",
    title: "Enterprise Design System & Prototypes",
    category: "UI / UX Design",
    projectType: "Professional", // Workplace project
    shortDescription:
      "Proprietary component libraries, wireframes, and design guidelines crafted for internal client enterprise suites.",
    technologies: ["Figma", "UI/UX", "Design Systems", "Prototyping"],
    previewImages: [
      "https://images.unsplash.com/photo-1581291518655-9523c93269c4?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1000&q=80",
    ],
    hasDetailPage: false,
    overview:
      "Comprehensive design systems built in Figma specifying typography hierarchies, color accessibility tokens, and interactive micro-states.",
    role: "UI/UX Designer • Best Labz",
  },
];
