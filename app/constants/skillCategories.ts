export const SKILL_CATEGORIES = [
  "Frontend",
  "Backend",
  "Design Tool",
  "Payment Gateways",
  "AI",
  "Database",
  "Cloud",
  "Mobile",
] as const;

export type SkillCategory = typeof SKILL_CATEGORIES[number] | string;
