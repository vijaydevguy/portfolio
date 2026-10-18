import React from "react";

export interface SkillItem {
  name: string;
  category: string;
  iconSvg: React.ReactNode;
}

// Exactly 16 unique technologies cleanly divided into 2 rows of 8 unique icons
// Row 1: Frontend & UI Core
export const SKILLS_ROW_1: SkillItem[] = [
  {
    name: "React.js",
    category: "Frontend",
    iconSvg: (
      <svg
        className="w-12 h-12 text-[#61DAFB]"
        viewBox="0 0 115.3 100"
        fill="currentColor"
      >
        <circle cx="57.65" cy="50" r="10.7" />
        <path d="M57.65 67.4c17.5 0 31.8-7.8 31.8-17.4s-14.3-17.4-31.8-17.4-31.8 7.8-31.8 17.4 14.3 17.4 31.8 17.4zm0-30.8c14.2 0 25.8 6 25.8 13.4s-11.6 13.4-25.8 13.4-25.8-6-25.8-13.4 11.6-13.4 25.8-13.4z" />
        <path d="M42.6 58.7c8.7 15.2 22.7 23.5 31 18.7s8.1-20.9-.7-36.1-22.7-23.5-31-18.7-8.1 20.9.7 36.1zm26.6-15.4c7.1 12.3 8.3 22.6 2.6 25.9s-14.8-4-21.9-16.3-8.3-22.6-2.6-25.9 14.8 4 21.9 16.3z" />
        <path d="M72.7 58.7c8.7-15.2 9-31.3.7-36.1s-22.3 3.5-31 18.7-9 31.3-.7 36.1 22.3-3.5 31-18.7zm-26.6-15.4c7.1-12.3 16.2-19.6 21.9-16.3s4.5 13.6-2.6 25.9-16.2 19.6-21.9 16.3-4.5-13.6 2.6-25.9z" />
      </svg>
    ),
  },
  {
    name: "Next.js",
    category: "Frontend",
    iconSvg: (
      <svg
        className="w-12 h-12 text-black"
        viewBox="0 0 180 180"
        fill="currentColor"
      >
        <mask
          height="180"
          id="mask-next"
          maskUnits="userSpaceOnUse"
          width="180"
          x="0"
          y="0"
        >
          <circle cx="90" cy="90" fill="white" r="90" />
        </mask>
        <g mask="url(#mask-next)">
          <circle cx="90" cy="90" fill="black" r="90" />
          <path
            d="M149.508 157.086L69.142 54H54V125.97H66.1136V69.3836L139.999 164.845C143.333 162.614 146.509 159.986 149.508 157.086Z"
            fill="white"
          />
          <rect fill="white" height="72" width="12" x="115" y="54" />
        </g>
      </svg>
    ),
  },
  {
    name: "JavaScript",
    category: "Frontend",
    iconSvg: (
      <svg
        className="w-12 h-12 text-[#F7DF1E]"
        viewBox="0 0 630 630"
        fill="currentColor"
      >
        <rect width="630" height="630" fill="#F7DF1E" rx="80" />
        <path
          d="M370.4 468.6c13.7 22.1 31.3 35.8 59.8 35.8 25 0 41.2-12.3 41.2-29.4 0-20.6-16.2-28-43.6-39.7l-15.2-6.4c-43.6-18.6-72.5-42.2-72.5-92.6 0-46.1 35.8-81.4 92.1-81.4 39.7 0 68.1 14.7 87.7 49l-34.8 22.5c-10.8-19.1-23.5-27-52.9-27-24 0-38.2 11.3-38.2 26.5 0 18.6 13.7 26 40.2 37.2l15.2 6.4c52 22.5 76.5 45.1 76.5 95.6 0 54.4-42.6 84.8-100.5 84.8-56.4 0-93.6-28-112.2-67.6l37.2-21.1zm-177.4 6.9c7.8 13.7 14.7 25 31.4 25 16.2 0 26.5-6.4 26.5-31.4V257.6h48v213.7c0 51.5-30.4 75-73 75-38.7 0-61.8-19.6-73.5-44.1l40.6-26.7z"
          fill="#000000"
        />
      </svg>
    ),
  },
  {
    name: "TypeScript",
    category: "Frontend",
    iconSvg: (
      <svg
        className="w-12 h-12 text-[#3178C6]"
        viewBox="0 0 128 128"
        fill="currentColor"
      >
        <rect width="128" height="128" rx="20" fill="#3178C6" />
        <path
          d="M1.5 64C1.5 29.5 29.5 1.5 64 1.5S126.5 29.5 126.5 64 98.5 126.5 64 126.5 1.5 98.5 1.5 64z"
          fill="#3178C6"
        />
        <path
          d="M53.1 53.6H38.5v43.8h-9.9V53.6H14.1v-8.2H53.1v8.2zm23.8 28.5c2.9 4.3 6.6 6.9 12.6 6.9 5.3 0 8.7-2.6 8.7-6.2 0-4.3-3.4-5.9-9.2-8.4l-3.2-1.4c-9.2-3.9-15.3-8.9-15.3-19.5 0-9.7 7.6-17.1 19.4-17.1 8.4 0 14.3 3.1 18.5 10.3l-7.3 4.8c-2.3-4-5-5.7-11.1-5.7-5.1 0-8.1 2.4-8.1 5.6 0 3.9 2.9 5.5 8.5 7.8l3.2 1.4c11 4.7 16.1 9.5 16.1 20.1 0 11.5-9 17.9-21.2 17.9-11.9 0-19.7-5.9-23.6-14.2l7.8-4.5z"
          fill="#FFFFFF"
        />
      </svg>
    ),
  },
  {
    name: "HTML5 & CSS3",
    category: "Frontend",
    iconSvg: (
      <svg
        className="w-12 h-12 text-[#E34F26]"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2L3 5l2 14 7 3 7-3 2-14-9-3zm0 2.2l6.8 2.3-1.6 11.2-5.2 2.2-5.2-2.2L5.2 6.5 12 4.2z" />
      </svg>
    ),
  },
  {
    name: "Tailwind CSS",
    category: "Frontend",
    iconSvg: (
      <svg
        className="w-12 h-12 text-[#06B6D4]"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12.001,4.8c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624 C13.666,10.618,15.027,12,18.001,12c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624 C16.337,6.182,14.976,4.8,12.001,4.8z M6.001,12c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624 c1.177,1.194,2.538,2.576,5.512,2.576c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624 C10.337,13.382,8.976,12,6.001,12z" />
      </svg>
    ),
  },
  {
    name: "Redux & State",
    category: "Frontend",
    iconSvg: (
      <svg
        className="w-12 h-12 text-[#764ABC]"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M15.4 7.2c-.8-.5-1.9-.3-2.4.5-.5.8-.3 1.9.5 2.4 1.4.8 2.2 2.3 2.2 3.9 0 2.5-2 4.5-4.5 4.5S6.7 16.5 6.7 14c0-1.6.8-3.1 2.2-3.9.8-.5 1-1.6.5-2.4-.5-.8-1.6-1-2.4-.5C4.8 8.6 3.7 11.2 3.7 14c0 4.1 3.4 7.5 7.5 7.5s7.5-3.4 7.5-7.5c0-2.8-1.1-5.4-3.3-6.8z" />
      </svg>
    ),
  },
  {
    name: "Figma",
    category: "Design",
    iconSvg: (
      <svg
        className="w-12 h-12 text-[#F24E1E]"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M8 2a4 4 0 00-4 4 4 4 0 004 4h4V2H8zm8 0h-4v8h4a4 4 0 004-4 4 4 0 00-4-4zm-8 8a4 4 0 00-4 4 4 4 0 004 4h4v-8H8zm8 0h-4v8h4a4 4 0 004-4 4 4 0 00-4-4zm-8 8a4 4 0 00-4 4 4 4 0 004 4 4 4 0 004-4v-4H8z" />
      </svg>
    ),
  },
];

// Row 2: Backend, Cloud & Dev Tools (No duplicates from Row 1)
export const SKILLS_ROW_2: SkillItem[] = [
  {
    name: "Node.js",
    category: "Backend",
    iconSvg: (
      <svg
        className="w-12 h-12 text-[#339933]"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2L3.5 6.9v9.8L12 21.6l8.5-4.9V6.9L12 2zm6.7 13.9L12 19.8l-6.7-3.9V8.2L12 4.3l6.7 3.9v7.7z" />
      </svg>
    ),
  },
  {
    name: "Express.js",
    category: "Backend",
    iconSvg: (
      <svg
        className="w-12 h-12 text-zinc-900"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z" />
      </svg>
    ),
  },
  {
    name: "MongoDB",
    category: "Backend",
    iconSvg: (
      <svg
        className="w-12 h-12 text-[#47A248]"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12.007 2C11.66 2 11.23.2 11.23.2s-2.07 3.66-2.66 4.9C6.44 9.5 6 12 6 13.6c0 4.2 2.7 7.4 6 8.4 3.3-1 6-4.2 6-8.4 0-1.6-.44-4.1-2.57-8.5-.59-1.24-2.66-4.9-2.66-4.9s-.42 1.8-.76 1.8z" />
      </svg>
    ),
  },
  {
    name: "Firebase",
    category: "Cloud",
    iconSvg: (
      <svg
        className="w-12 h-12 text-[#FFCA28]"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M3.89 15.67L6.85.92c.07-.35.48-.49.75-.26l3.32 2.87 2.05-3.13a.501.501 0 01.88.08l2.25 4.49 4.02-4.11c.27-.27.72-.11.77.27l2.87 14.54-19.86-.02z" />
      </svg>
    ),
  },
  {
    name: "Google Cloud (GCP)",
    category: "Cloud",
    iconSvg: (
      <svg
        className="w-12 h-12 text-[#4285F4]"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z" />
      </svg>
    ),
  },
  {
    name: "Vercel",
    category: "Cloud",
    iconSvg: (
      <svg
        className="w-12 h-12 text-black"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M24 22.525H0l12-21.05 12 21.05z" />
      </svg>
    ),
  },
  {
    name: "Git & GitHub",
    category: "Tools",
    iconSvg: (
      <svg
        className="w-12 h-12 text-[#F05032]"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
    ),
  },
  {
    name: "Postman & APIs",
    category: "Tools",
    iconSvg: (
      <svg
        className="w-12 h-12 text-[#FF6C37]"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.8 8.8l-4.5 4.5c-.4.4-1 .4-1.4 0l-2.2-2.2c-.4-.4-.4-1 0-1.4.4-.4 1-.4 1.4 0l1.5 1.5 3.8-3.8c.4-.4 1-.4 1.4 0 .4.4.4 1 0 1.4z" />
      </svg>
    ),
  },
];
