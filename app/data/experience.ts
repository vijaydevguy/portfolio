export interface ExperienceItem {
  id?: string;
  _id?: string;
  role: string;
  company: string;
  type: string;
  period?: string;
  duration?: string;
  location?: string;
  description: string | string[];
  order?: number;
  isVisible?: boolean;
}

export interface EducationItem {
  _id?: string;
  degree: string;
  field: string;
  institution: string;
  location: string;
  graduated: string;
  score: string;
  isVisible?: boolean;
}

export const WORK_EXPERIENCE: ExperienceItem[] = [
  {
    id: "bestlabz-sde",
    role: "Software Development Engineer (SDE)",
    company: "Best Labz",
    type: "Full-time",
    period: "Dec 2025 – Present",
    duration: "11 mos",
    location: "Remote / On-site",
    description: [
      "Building and maintaining full-stack web applications using React.js, Next.js, Node.js, and Express.js.",
      "Developing RESTful APIs with MongoDB and MySQL for multi-tenant SaaS workflows.",
      "Creating reusable, responsive UI components focused on performance and usability.",
    ],
  },
  {
    id: "bestlabz-uiux",
    role: "Product / UI UX Designer & Frontend Developer",
    company: "Best Labz",
    type: "Full-time",
    period: "May 2024 – Nov 2025",
    duration: "1 yr 8 mos",
    location: "Remote",
    description: [
      "Designed user flows, wireframes, and UI prototypes in Figma.",
      "Developed responsive frontend components with React.js and Tailwind CSS.",
      "Bridged design and engineering to ensure interface consistency.",
    ],
  },
  {
    id: "senchola-intern",
    role: "Frontend Developer Intern",
    company: "Senchola Technologies",
    type: "Internship",
    // No dates/time period as requested - simply stating the internship was completed
    description: [
      "Built responsive web interfaces and strengthened core JavaScript and React fundamentals.",
      "Collaborated with senior engineers using Git version control and modern web practices.",
    ],
  },
];

export const EDUCATION: EducationItem = {
  degree: "B.E.",
  field: "Computer Science Engineering",
  institution: "Thirumalai Engineering College (Anna University)",
  location: "Kanchipuram, Tamil Nadu",
  graduated: "June 2023",
  score: "CGPA: 7.89",
};
