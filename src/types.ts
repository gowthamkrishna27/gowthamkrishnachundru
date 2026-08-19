export interface Project {
  id: string;
  title: string;
  year: string;
  status: "Live" | "In Development";
  tagline: string;
  challenge: string;
  tech: string[];
  githubUrl: string;
  liveUrl?: string;
}

export interface SkillCategory {
  title: string;
  iconName: "Layers" | "Server" | "Cpu";
  skills: string[];
}

export interface TimelineItem {
  id: string;
  type: "experience" | "education";
  role: string;
  organization: string;
  period: string;
  location: string;
  description: string[];
  skills?: string[];
}

export interface ProfileData {
  name: string;
  headline: string;
  bio: string;
  email: string;
  githubUrl: string;
  linkedinUrl: string;
  twitterUrl: string;
  collegeInfo: string;
}

export interface PortfolioData {
  profile: ProfileData;
  projects: Project[];
  skills: SkillCategory[];
  timeline: TimelineItem[];
}
