import { useState, useEffect } from "react";
import {
  ArrowUpRight,
  Check,
  Copy,
  Github,
  Linkedin,
  Mail,
  FileText,
  Layers,
  Cpu,
  Server,
  MapPin,
  GraduationCap,
  Briefcase,
  User,
  FolderGit2,
  Boxes,
  Send,
  Calendar,
  Sparkles,
  Zap,
  ArrowUp,
  Terminal,
  Sliders,
  Eye,
  EyeOff,
  ArrowRight
} from "lucide-react";
import { PortfolioData } from "./types";
import { AdminPanel } from "./components/AdminPanel";
import { DeveloperConsole } from "./components/DeveloperConsole";
import { ResumeModal } from "./components/ResumeModal";
import { initBrowserConsoleEasterEgg } from "./lib/consoleEasterEgg";
import {
  fetchPortfolioData,
  savePortfolioData,
  fetchSecurityPhrase,
  dbRecordFailedAttempt,
  recordPortfolioCheckout
} from "./lib/supabase";

const NAV_ITEMS = [
  { label: "About", href: "#hero", icon: User },
  { label: "Projects", href: "#projects", icon: FolderGit2 },
  { label: "Stack", href: "#stack", icon: Boxes },
  { label: "Experience", href: "#experience", icon: Briefcase },
  { label: "Contact", href: "#contact", icon: Mail }
];

export default function App() {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("#hero");
  const [isScrolled, setIsScrolled] = useState(false);
  const [showDevConsole, setShowDevConsole] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [viewMode, setViewMode] = useState<"portfolio" | "admin">("portfolio");
  const [loading, setLoading] = useState(true);

  // Security Passphrase Gate & Lockout State (3 strikes -> 2-day lockout)
  const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

  const [isLockedOut, setIsLockedOut] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const until = localStorage.getItem("admin_lockout_until");
      if (until && Date.now() < Number(until)) {
        return true;
      }
      localStorage.removeItem("admin_lockout_until");
    }
    return false;
  });

  const [failedAttempts, setFailedAttempts] = useState<number>(() => {
    if (typeof window !== "undefined") {
      return Number(localStorage.getItem("admin_failed_attempts") || 0);
    }
    return 0;
  });

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [passphraseInput, setPassphraseInput] = useState("");
  const [passphraseError, setPassphraseError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("Wrong phrase");
  const [showPassphrase, setShowPassphrase] = useState(false);

  const handleOpenAdmin = () => {
    if (isLockedOut) return;
    setPassphraseInput("");
    setPassphraseError(false);
    setShowAuthModal(true);
  };

  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerifyPassphrase = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLockedOut || isVerifying) {
      if (isLockedOut) setShowAuthModal(false);
      return;
    }

    const input = passphraseInput.trim();
    if (!input) return;

    setIsVerifying(true);
    try {
      const rawDbPhrase = await fetchSecurityPhrase();
      const dbPhrase = (rawDbPhrase || "").trim();

      // Strictly check against the security phrase configured in the database
      const isMatch = Boolean(dbPhrase && input.toLowerCase() === dbPhrase.toLowerCase());

      if (isMatch) {
        setShowAuthModal(false);
        setPassphraseInput("");
        setFailedAttempts(0);
        localStorage.removeItem("admin_failed_attempts");
        localStorage.removeItem("admin_lockout_until");
        setIsLockedOut(false);
        setViewMode("admin");
      } else {
        const attempted = input;
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);
        localStorage.setItem("admin_failed_attempts", String(nextAttempts));

        if (nextAttempts >= 3) {
          dbRecordFailedAttempt(attempted, "LOCKED_OUT_48H");
          const lockoutTimestamp = Date.now() + TWO_DAYS_MS;
          localStorage.setItem("admin_lockout_until", String(lockoutTimestamp));
          setIsLockedOut(true);
          setShowAuthModal(false);
          setPassphraseInput("");
        } else {
          dbRecordFailedAttempt(attempted, `REJECTED_STRIKE_${nextAttempts}_OF_3`);
          const remaining = 3 - nextAttempts;
          setErrorMessage(`Wrong phrase (${remaining} left)`);
          setPassphraseInput("");
          setPassphraseError(true);
          setTimeout(() => setPassphraseError(false), 2500);
        }
      }
    } finally {
      setIsVerifying(false);
    }
  };

  // Pure Supabase Cloud Database State
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);

  // Fetch live cloud data from Supabase on mount & record visitor checkout
  useEffect(() => {
    // Record this checkout / page visit in DB
    recordPortfolioCheckout("VISIT_LANDING");

    fetchPortfolioData()
      .then((data) => {
        if (data) {
          setPortfolioData(data);
          initBrowserConsoleEasterEgg(data, () => {
            recordPortfolioCheckout("DEVTOOLS_OPEN_CONSOLE");
            setShowDevConsole(true);
          });
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleSaveData = async (newData: PortfolioData) => {
    setPortfolioData(newData);
    await savePortfolioData(newData);
  };

  const handleCopyEmail = () => {
    if (portfolioData?.profile?.email) {
      navigator.clipboard.writeText(portfolioData.profile.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY;
      setIsScrolled(scrollPos > 90);

      const sections = ["hero", "projects", "stack", "experience", "contact"];
      const scrollY = scrollPos + 180;
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollY >= top && scrollY < top + height) {
            setActiveTab(`#${section}`);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Loading Screen while fetching from Cloud Database
  if (loading || !portfolioData) {
    return (
      <div className="min-h-screen bg-[#FBFBFD] flex flex-col items-center justify-center space-y-3">
        <div className="w-7 h-7 rounded-full border-2 border-zinc-200 border-t-zinc-900 animate-spin"></div>
        <span className="font-mono text-xs text-zinc-400 tracking-wider">
          Loading Cloud Database...
        </span>
      </div>
    );
  }

  // Render Admin View if active (always requires passphrase upon re-entry)
  if (viewMode === "admin") {
    return (
      <AdminPanel
        data={portfolioData}
        onSave={handleSaveData}
        onClose={() => setViewMode("portfolio")}
      />
    );
  }

  const { profile, projects, skills, timeline } = portfolioData;

  return (
    <div className="relative min-h-screen bg-[#FBFBFD] text-zinc-900 antialiased selection:bg-zinc-900 selection:text-white font-sans overflow-x-hidden">
      {/* Second-Layer Sketch Artwork with Reactive Scroll Transparency (Desktop / Tablet Only) */}
      <div className="hidden sm:block fixed top-0 right-0 w-full sm:w-[540px] md:w-[700px] lg:w-[840px] xl:w-[960px] h-screen pointer-events-none select-none z-0 overflow-hidden">
        <img
          src="/sketch-bg.png"
          alt="Gowtham Krishna - Sketch Artwork"
          className={`absolute top-24 sm:top-32 md:top-36 lg:top-40 right-0 h-[78vh] w-full object-contain object-right-top mix-blend-multiply origin-top-right transition-all duration-700 ease-apple ${
            isScrolled
              ? "opacity-15 sm:opacity-20 scale-100 blur-[0.5px]"
              : "opacity-90 sm:opacity-95 scale-105 sm:scale-115 lg:scale-125"
          }`}
        />
        {/* Soft edge blend veil */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#FBFBFD] via-[#FBFBFD]/40 sm:via-transparent to-transparent pointer-events-none"></div>
      </div>

      {/* Apple Ambient Liquid Mesh Glows */}
      <div className="fixed -top-40 left-1/4 -translate-x-1/2 w-[650px] h-[380px] bg-gradient-to-tr from-sky-100/30 via-zinc-100/20 to-indigo-50/20 blur-3xl pointer-events-none rounded-full -z-10"></div>

      {/* Liquid UI Icon-Only Floating Island Navbar (Bottom on Mobile, Top on Desktop) */}
      <header className="fixed bottom-4 sm:bottom-auto sm:top-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none transition-all duration-300">
        <div className="pointer-events-auto liquid-glass rounded-full p-1.5 flex items-center gap-1 shadow-[0_8px_30px_rgba(0,0,0,0.1)] sm:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] transition-all duration-300">
          {/* Liquid Nav Icon Pills */}
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setActiveTab(item.href)}
                  title={item.label}
                  aria-label={item.label}
                  className={`liquid-btn w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ease-apple ${
                    isActive
                      ? "text-zinc-900 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08),_inset_0_1px_0_rgba(255,255,255,0.9)] scale-105"
                      : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50"
                  }`}
                >
                  <Icon size={15} />
                </a>
              );
            })}
          </nav>

          <div className="h-4 w-[1px] bg-zinc-300/60 mx-1"></div>

          {/* Action Icons */}
          <div className="flex items-center gap-1">
            {/* Admin CMS Button (Hidden completely for 2 days upon 3 failed attempts) */}
            {!isLockedOut && (
              <button
                onClick={handleOpenAdmin}
                className="liquid-btn w-8 h-8 rounded-full bg-zinc-100/80 hover:bg-zinc-200 flex items-center justify-center text-zinc-700 hover:text-zinc-900 border border-zinc-200/60"
                aria-label="Open Admin CMS"
                title="Admin Panel (Passphrase Protected)"
              >
                <Sliders size={14} />
              </button>
            )}

            {/* Windows PowerShell Developer Console Button */}
            <button
              onClick={() => setShowDevConsole(true)}
              className="liquid-btn w-8 h-8 rounded-full bg-zinc-100/80 hover:bg-zinc-200 flex items-center justify-center text-zinc-700 hover:text-zinc-900 border border-zinc-200/60"
              aria-label="PowerShell Developer Console"
              title="Windows PowerShell Console"
            >
              <Terminal size={14} />
            </button>

            {/* GitHub Profile */}
            <a
              href={profile.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="liquid-btn w-8 h-8 rounded-full bg-zinc-100/80 hover:bg-zinc-200 flex items-center justify-center text-zinc-700 hover:text-zinc-900 border border-zinc-200/60"
              aria-label="GitHub Profile"
              title="GitHub Profile"
            >
              <Github size={14} />
            </a>

            {/* Resume Downloader Button */}
            <button
              onClick={() => setShowResumeModal(true)}
              className="liquid-btn w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-white shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
              aria-label="Download Resume"
              title="Download Resume (PDF, MD, JSON)"
            >
              <FileText size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container Aligned slightly to the left */}
      <main className="max-w-4xl mx-auto md:-translate-x-8 lg:-translate-x-14 xl:-translate-x-20 px-4 sm:px-6 pt-8 sm:pt-24 pb-28 space-y-16 sm:space-y-20 relative z-10 transition-transform duration-500 ease-apple">
        {/* 1. Hero Section */}
        <section id="hero" className="pt-2 sm:pt-6 space-y-6">
          {/* Mobile Profile Photo (Visible on Mobile Only - Unobstructed at the Top) */}
          <div className="sm:hidden flex justify-start pb-1">
            <div className="liquid-glass-card rounded-3xl p-2.5 max-w-[190px] w-full shadow-sm border border-zinc-200/90">
              <div className="aspect-[4/5] w-full overflow-hidden rounded-2xl bg-zinc-100">
                <img
                  src="/sketch-bg.png"
                  alt={profile.name}
                  className="w-full h-full object-contain object-top select-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6 max-w-xl">
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 leading-tight">
                {profile.name}
              </h1>
              <p className="text-base sm:text-lg text-zinc-600 leading-relaxed font-normal">
                {profile.bio}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#projects"
                className="liquid-btn group inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 shadow-[0_4px_14px_rgba(0,0,0,0.12)]"
              >
                <span>View Projects</span>
                <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300 ease-apple" />
              </a>

              <button
                onClick={handleCopyEmail}
                className="liquid-btn inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full liquid-glass text-zinc-800 text-sm font-medium hover:bg-white transition-all shadow-sm"
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-emerald-600" />
                    <span className="text-emerald-700 font-medium">Copied to Clipboard</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} className="text-zinc-500" />
                    <span>Copy Email</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowResumeModal(true)}
                className="liquid-btn inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-full liquid-glass text-zinc-800 text-sm font-medium hover:bg-white transition-all shadow-sm"
                title="Download Resume"
              >
                <FileText size={14} className="text-zinc-600" />
                <span>Resume</span>
              </button>

              <div className="flex items-center gap-1.5">
                <a
                  href={profile.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="liquid-btn w-10 h-10 rounded-full liquid-glass flex items-center justify-center text-zinc-600 hover:text-zinc-900 shadow-sm"
                  title="GitHub"
                >
                  <Github size={15} />
                </a>
                <a
                  href={profile.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="liquid-btn w-10 h-10 rounded-full liquid-glass flex items-center justify-center text-zinc-600 hover:text-zinc-900 shadow-sm"
                  title="LinkedIn"
                >
                  <Linkedin size={15} />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Featured Projects */}
        <section id="projects" className="space-y-6">
          <div className="flex items-end justify-between border-b border-zinc-200/80 pb-3">
            <div>
              <span className="font-mono text-xs uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-1.5">
                <FolderGit2 size={13} className="text-zinc-400" />
                <span>01 / Portfolio</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 mt-0.5">
                Featured Projects
              </h2>
            </div>
            <a
              href={profile.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group text-xs font-medium text-zinc-500 hover:text-zinc-900 flex items-center gap-1 transition-colors ease-apple"
            >
              <span>View All Repos</span>
              <ArrowUpRight size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300 ease-apple" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
            {projects.map((project) => (
              <div
                key={project.id}
                className="liquid-glass-card group rounded-3xl p-6 sm:p-7 flex flex-col justify-between h-full hover:border-zinc-300/90 transition-all duration-300"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700">
                        <FolderGit2 size={14} />
                      </div>
                      <span className="font-mono text-xs text-zinc-400 font-medium">{project.year}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {project.githubUrl && (
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="liquid-btn w-8 h-8 rounded-full liquid-glass flex items-center justify-center text-zinc-700 hover:text-zinc-900"
                          title="View Source Code"
                        >
                          <Github size={14} />
                        </a>
                      )}
                      {project.liveUrl && (
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="liquid-btn w-8 h-8 rounded-full liquid-glass flex items-center justify-center text-zinc-700 hover:text-zinc-900 group/btn"
                          title="Open Live Deployment"
                        >
                          <ArrowUpRight
                            size={14}
                            className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform duration-300 ease-apple"
                          />
                        </a>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 tracking-tight">
                      {project.title}
                    </h3>
                    <p className="text-xs font-medium text-zinc-500 mt-0.5">
                      {project.tagline}
                    </p>
                  </div>

                  <p className="text-xs sm:text-[13px] text-zinc-600 leading-relaxed">
                    {project.challenge}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-4 mt-5 border-t border-zinc-200/50">
                  {project.tech.map((t) => (
                    <span
                      key={t}
                      className="px-2.5 py-0.5 rounded-full text-[10.5px] font-medium bg-zinc-100/90 text-zinc-600 border border-zinc-200/60 hover:bg-zinc-200/80 transition-colors"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {/* Apple-style Liquid Pulse In-Development Card */}
            <div className="liquid-glass-card rounded-3xl p-6 sm:p-7 flex flex-col justify-between h-full">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700 border border-amber-200/60">
                      <Zap size={13} />
                    </div>
                    <span className="font-mono text-xs text-zinc-400 font-medium">In Pipeline</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-medium bg-amber-50 text-amber-700 border border-amber-200/70 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                    Building
                  </span>
                </div>
                <div className="flex animate-pulse space-x-4 pt-1">
                  <div className="w-10 h-10 rounded-2xl bg-zinc-200/80 shrink-0"></div>
                  <div className="flex-1 space-y-3.5 py-1">
                    <div className="h-2.5 rounded-full bg-zinc-200/80 w-3/4"></div>
                    <div className="space-y-2.5">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2 h-2 rounded-full bg-zinc-200/80"></div>
                        <div className="col-span-1 h-2 rounded-full bg-zinc-200/80"></div>
                      </div>
                      <div className="h-2 rounded-full bg-zinc-200/80"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 mt-5 border-t border-zinc-200/50 font-mono text-[11px] text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Sparkles size={11} className="text-amber-600" />
                  <span>Next open-source system</span>
                </span>
                <span className="text-zinc-500 font-semibold">Q3 2026</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Technical Stack */}
        <section id="stack" className="space-y-6">
          <div className="border-b border-zinc-200/80 pb-3">
            <span className="font-mono text-xs uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-1.5">
              <Boxes size={13} className="text-zinc-400" />
              <span>02 / Architecture</span>
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 mt-0.5">
              Technical Stack & Skills
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
            {skills.map((category) => {
              const Icon =
                category.iconName === "Layers"
                  ? Layers
                  : category.iconName === "Server"
                  ? Server
                  : Cpu;

              return (
                <div
                  key={category.title}
                  className="liquid-glass-card rounded-3xl p-6 sm:p-7 flex flex-col justify-between h-full hover:border-zinc-300/90 transition-all duration-300 group"
                >
                  <div>
                    <div className="flex items-center gap-3 pb-4 border-b border-zinc-200/50">
                      <div className="p-2 rounded-2xl liquid-glass flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ease-apple">
                        <Icon className="w-4 h-4 text-zinc-700" />
                      </div>
                      <h3 className="text-sm font-bold text-zinc-900 tracking-tight">
                        {category.title}
                      </h3>
                    </div>

                    <ul className="mt-4 space-y-2.5">
                      {category.skills.map((skill) => (
                        <li key={skill} className="flex items-center gap-2.5 text-xs font-mono text-zinc-700 hover:text-zinc-950 transition-colors">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 group-hover:bg-zinc-500 transition-colors shrink-0"></span>
                          <span>{skill}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. Experience & Education Timeline */}
        <section id="experience" className="space-y-6">
          <div className="border-b border-zinc-200/80 pb-3">
            <span className="font-mono text-xs uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-1.5">
              <Briefcase size={13} className="text-zinc-400" />
              <span>03 / Background</span>
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 mt-0.5">
              Experience & Education
            </h2>
          </div>

          <div className="relative space-y-8 before:absolute before:left-3.5 sm:before:left-4 before:top-4 before:bottom-4 before:w-[2px] before:-translate-x-1/2 before:bg-zinc-200/90">
            {timeline.map((item) => (
              <div key={item.id} className="relative pl-8 sm:pl-10 group">
                {/* Geometrically centered timeline node */}
                <div className="absolute left-3.5 sm:left-4 -translate-x-1/2 top-5 w-7 h-7 rounded-full bg-white border-2 border-zinc-300 group-hover:border-zinc-900 group-hover:scale-110 flex items-center justify-center transition-all duration-300 ease-apple shadow-sm z-10">
                  {item.type === "education" ? (
                    <GraduationCap size={12} className="text-zinc-700" />
                  ) : (
                    <Briefcase size={12} className="text-zinc-700" />
                  )}
                </div>

                <div className="liquid-glass-card rounded-3xl p-6 sm:p-7 space-y-3.5 hover:border-zinc-300/90 transition-all duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div>
                      <h3 className="text-base font-bold text-zinc-900 tracking-tight">
                        {item.role}
                      </h3>
                      <p className="text-xs font-medium text-zinc-600 mt-0.5">
                        {item.organization}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 font-mono text-xs text-zinc-500 liquid-glass px-2.5 py-0.5 rounded-full w-fit shadow-none shrink-0">
                      <Calendar size={11} className="text-zinc-400" />
                      <span>{item.period}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono">
                    <MapPin size={12} className="shrink-0" />
                    <span>{item.location}</span>
                  </div>

                  <ul className="space-y-1.5 pt-1 text-xs text-zinc-600 leading-relaxed">
                    {item.description.map((desc, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-zinc-400 mt-1 shrink-0">•</span>
                        <span>{desc}</span>
                      </li>
                    ))}
                  </ul>

                  {item.skills && (
                    <div className="flex flex-wrap gap-1.5 pt-3 border-t border-zinc-200/50">
                      {item.skills.map((s) => (
                        <span
                          key={s}
                          className="px-2.5 py-0.5 rounded-full text-[10.5px] font-mono bg-zinc-100/90 text-zinc-600 border border-zinc-200/50 hover:bg-zinc-200/80 transition-colors"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Contact Section */}
        <section id="contact" className="space-y-6">
          <div className="liquid-glass-card rounded-3xl p-6 sm:p-9 space-y-6 hover:border-zinc-300/90 transition-all duration-300">
            <div className="space-y-2">
              <span className="font-mono text-xs uppercase tracking-wider text-orange-600 font-semibold flex items-center gap-1.5">
                <Send size={12} className="text-orange-600" />
                <span>Get In Touch</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
                Let's collaborate on ambitious software.
              </h2>
              <p className="text-sm text-zinc-600 max-w-xl leading-relaxed">
                Whether you have an opportunity or want to discuss full-stack engineering and open-source tooling, my inbox is always open.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href={`mailto:${profile.email}`}
                className="liquid-btn group inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 shadow-[0_4px_16px_rgba(0,0,0,0.15)]"
              >
                <Mail size={15} />
                <span>Send Email</span>
                <ArrowUpRight size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300 ease-apple" />
              </a>

              <button
                onClick={handleCopyEmail}
                className="liquid-btn inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full liquid-glass text-zinc-800 text-sm font-medium hover:bg-white shadow-sm"
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-emerald-600" />
                    <span className="text-emerald-700 font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} className="text-zinc-500" />
                    <span>Copy Address</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowResumeModal(true)}
                className="liquid-btn inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full liquid-glass text-zinc-800 text-sm font-medium hover:bg-white shadow-sm"
                title="Download Resume"
              >
                <FileText size={14} className="text-zinc-600" />
                <span>Resume (PDF)</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Floating Scroll to Top Quick Action */}
      {isScrolled && (
        <button
          onClick={scrollToTop}
          className="liquid-btn fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 w-9 h-9 sm:w-10 sm:h-10 rounded-full liquid-glass flex items-center justify-center text-zinc-700 hover:text-zinc-900 shadow-md hover:shadow-lg transition-all duration-300 ease-apple"
          aria-label="Scroll to top"
          title="Back to Top"
        >
          <ArrowUp size={15} />
        </button>
      )}

      {/* Footer Container with Matching Left Alignment */}
      <footer className="border-t border-zinc-200/80 bg-white/40 backdrop-blur-md py-8 text-xs text-zinc-500 relative z-10">
        <div className="max-w-4xl mx-auto md:-translate-x-8 lg:-translate-x-14 xl:-translate-x-20 px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 transition-transform duration-500 ease-apple">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <span className="font-semibold text-zinc-900">{profile.name}</span>
            <span className="hidden sm:inline text-zinc-300">•</span>
            <span className="font-mono text-zinc-500">
              {profile.collegeInfo}
            </span>
          </div>

          <div className="flex items-center gap-4 font-medium">
            <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="hover:text-zinc-900 transition-colors">
              GitHub
            </a>
            <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="hover:text-zinc-900 transition-colors">
              LinkedIn
            </a>
          </div>
        </div>
      </footer>

      {/* Interactive Developer Console Modal */}
      <DeveloperConsole
        isOpen={showDevConsole}
        onClose={() => setShowDevConsole(false)}
        data={portfolioData}
        onOpenAdmin={handleOpenAdmin}
        isLockedOut={isLockedOut}
      />

      {/* Dynamic Resume Generator & Downloader Modal */}
      <ResumeModal
        isOpen={showResumeModal}
        onClose={() => setShowResumeModal(false)}
        data={portfolioData}
      />

      {/* Minimal Security Passphrase Gateway Modal */}
      {showAuthModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/30 backdrop-blur-md transition-all duration-300 animate-in fade-in"
          onClick={() => setShowAuthModal(false)}
        >
          <div
            className="liquid-glass rounded-2xl w-full max-w-[320px] p-3 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.2)] border border-zinc-200/90 relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleVerifyPassphrase} className="space-y-2" autoComplete="off">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type={showPassphrase ? "text" : "password"}
                    placeholder="Enter phrase..."
                    value={passphraseInput}
                    autoComplete="new-password"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    data-lpignore="true"
                    data-form-type="other"
                    name="auth_phrase_field"
                    onChange={(e) => {
                      setPassphraseInput(e.target.value);
                      if (passphraseError) setPassphraseError(false);
                    }}
                    autoFocus
                    className={`w-full pl-3 pr-7 py-2 rounded-xl border text-xs font-mono outline-none transition-all ${
                      passphraseError
                        ? "border-rose-400 bg-rose-50/60 text-rose-900 focus:ring-1 focus:ring-rose-500"
                        : "border-zinc-200 bg-zinc-50/70 text-zinc-900 focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassphrase((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                  >
                    {showPassphrase ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isVerifying || !passphraseInput.trim()}
                  className="liquid-btn w-9 h-9 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white flex items-center justify-center shrink-0 shadow-sm transition-all"
                  title="Unlock"
                >
                  {isVerifying ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <ArrowRight size={14} />
                  )}
                </button>
              </div>

              {passphraseError && (
                <p className="text-[10.5px] font-medium text-rose-600 text-center animate-in fade-in">
                  {errorMessage}
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
