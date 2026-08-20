import { PortfolioData } from "../types";
import { printOrDownloadResumePDF } from "./resumeGenerator";

declare global {
  interface Window {
    gowtham?: {
      help: () => void;
      getProfile: () => any;
      getProjects: () => any;
      getSkills: () => any;
      getTimeline: () => any;
      copyEmail: () => void;
      downloadResume: () => void;
      openConsole: () => void;
    };
  }
}

export function initBrowserConsoleEasterEgg(
  data: PortfolioData,
  onOpenConsoleModal: () => void
) {
  if (typeof window === "undefined") return;

  const headerStyle =
    "background: #18181b; color: #38bdf8; font-weight: bold; font-size: 14px; padding: 6px 12px; border-radius: 6px 6px 0 0; border: 1px solid #27272a;";
  const bodyStyle =
    "background: #09090b; color: #a1a1aa; font-family: monospace; font-size: 12px; padding: 10px 12px; border-radius: 0 0 6px 6px; border: 1px solid #27272a; border-top: none; line-height: 1.6;";
  const highlightStyle = "color: #34d399; font-weight: bold;";
  const cmdStyle = "color: #fbbf24; font-weight: bold; background: #27272a; padding: 2px 6px; border-radius: 4px;";

  console.log(
    `%c✦ Gowtham Krishna | Full-Stack Portfolio DevTools%c\n` +
      `👋 Welcome, curious developer!\n` +
      `You're inspecting the live portfolio of Gowtham Krishna.\n\n` +
      `Try running these interactive helper commands in the browser console:\n` +
      `  • %cgowtham.help()%c           - View all console helpers\n` +
      `  • %cgowtham.getProfile()%c     - View JSON profile\n` +
      `  • %cgowtham.getProjects()%c    - List all projects\n` +
      `  • %cgowtham.getSkills()%c      - View skill breakdown\n` +
      `  • %cgowtham.downloadResume()%c - Generate & download printable resume\n` +
      `  • %cgowtham.openConsole()%c    - Open in-page interactive terminal\n\n` +
      `📬 Ready to build something together? Reach out: %c${data.profile.email}%c`,
    headerStyle,
    bodyStyle,
    cmdStyle,
    bodyStyle,
    cmdStyle,
    bodyStyle,
    cmdStyle,
    bodyStyle,
    cmdStyle,
    bodyStyle,
    cmdStyle,
    bodyStyle,
    cmdStyle,
    bodyStyle,
    highlightStyle,
    bodyStyle
  );

  window.gowtham = {
    help: () => {
      console.table([
        { Command: "gowtham.getProfile()", Purpose: "Dumps raw profile & contact details" },
        { Command: "gowtham.getProjects()", Purpose: "Dumps all portfolio projects" },
        { Command: "gowtham.getSkills()", Purpose: "Dumps categorized technical stack" },
        { Command: "gowtham.getTimeline()", Purpose: "Dumps experience and education" },
        { Command: "gowtham.downloadResume()", Purpose: "Generates ATS-friendly PDF resume" },
        { Command: "gowtham.copyEmail()", Purpose: "Copies email directly to clipboard" },
        { Command: "gowtham.openConsole()", Purpose: "Launches the in-page CLI modal" }
      ]);
    },
    getProfile: () => data.profile,
    getProjects: () => data.projects,
    getSkills: () => data.skills,
    getTimeline: () => data.timeline,
    downloadResume: () => {
      printOrDownloadResumePDF(data);
      console.log("%c[Resume] %cGenerating and opening PDF resume...", "color: #34d399; font-weight: bold;", "color: #e4e4e7;");
    },
    copyEmail: () => {
      navigator.clipboard.writeText(data.profile.email);
      console.log(`%c[Copied] %c${data.profile.email} copied to clipboard!`, "color: #34d399; font-weight: bold;", "color: #e4e4e7;");
    },
    openConsole: () => {
      onOpenConsoleModal();
      console.log("%c[Opened] %cDeveloper Console modal launched on screen!", "color: #38bdf8; font-weight: bold;", "color: #e4e4e7;");
    }
  };
}
