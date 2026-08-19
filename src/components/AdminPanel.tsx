import React, { useState } from "react";
import {
  PortfolioData,
  Project,
  TimelineItem,
  ProfileData
} from "../types";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Edit3,
  User,
  FolderGit2,
  Boxes,
  Briefcase,
  Download,
  Upload,
  Check,
  ExternalLink,
  Code2,
  Layers,
  Server,
  Cpu
} from "lucide-react";

import {
  dbUpdateProfile,
  dbUpsertProject,
  dbDeleteProject,
  dbUpdateSkills,
  dbUpsertTimeline,
  dbDeleteTimeline,
  dbUpdateSecurityPhrase,
  dbWipeAllData
} from "../lib/supabase";

interface AdminPanelProps {
  data: PortfolioData;
  onSave: (newData: PortfolioData) => void;
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  data,
  onSave,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<
    "profile" | "projects" | "skills" | "timeline" | "backup"
  >("profile");

  const [formData, setFormData] = useState<PortfolioData>(data);
  const [savedToast, setSavedToast] = useState(false);

  // Edit / New Project state
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isNewProject, setIsNewProject] = useState(false);

  // Edit / New Timeline item state
  const [editingTimeline, setEditingTimeline] = useState<TimelineItem | null>(null);
  const [isNewTimeline, setIsNewTimeline] = useState(false);

  // New Skill state
  const [newSkillText, setNewSkillText] = useState<{ [categoryTitle: string]: string }>({});

  const showToast = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const handleProfileChange = (key: keyof ProfileData, value: string) => {
    setFormData((prev) => {
      const updated = {
        ...prev,
        profile: {
          ...prev.profile,
          [key]: value
        }
      };
      return updated;
    });
  };

  const handleSaveProfile = async () => {
    await dbUpdateProfile(formData.profile);
    onSave(formData);
    showToast();
  };

  const handleSaveAll = () => {
    onSave(formData);
    showToast();
  };

  const handleResetToDefault = async () => {
    const confirmWipe = window.confirm(
      "⚠️ DANGER: Are you sure you want to completely WIPE all data from the database?\n\nThis will permanently delete all projects, skills, and timeline entries from your Supabase cloud database."
    );
    if (confirmWipe) {
      await dbWipeAllData();
      const wipedData: PortfolioData = {
        profile: {
          name: "Developer Name",
          headline: "Software Engineer",
          bio: "Brief developer bio...",
          email: "your.email@domain.com",
          githubUrl: "https://github.com",
          linkedinUrl: "https://linkedin.com",
          twitterUrl: "https://twitter.com",
          collegeInfo: "Your College / University • Location"
        },
        projects: [],
        skills: [],
        timeline: []
      };
      setFormData(wipedData);
      onSave(wipedData);
      showToast();
    }
  };

  // --- Direct Project Handlers ---
  const handleSaveProject = async (project: Project) => {
    let updatedProjects: Project[] = [];
    setFormData((prev) => {
      const exists = prev.projects.some((p) => p.id === project.id);
      if (exists) {
        updatedProjects = prev.projects.map((p) => (p.id === project.id ? project : p));
      } else {
        updatedProjects = [...prev.projects, project];
      }
      return { ...prev, projects: updatedProjects };
    });

    await dbUpsertProject(project);
    onSave({ ...formData, projects: updatedProjects.length > 0 ? updatedProjects : formData.projects });
    setEditingProject(null);
    setIsNewProject(false);
    showToast();
  };

  const handleDeleteProject = async (id: string) => {
    if (window.confirm("Delete this project from database?")) {
      const updatedProjects = formData.projects.filter((p) => p.id !== id);
      setFormData((prev) => ({
        ...prev,
        projects: updatedProjects
      }));
      await dbDeleteProject(id);
      onSave({ ...formData, projects: updatedProjects });
      showToast();
    }
  };

  // --- Skill Handlers ---
  const handleAddSkill = async (categoryIndex: number, skill: string) => {
    if (!skill.trim()) return;
    const newSkills = [...formData.skills];
    newSkills[categoryIndex] = {
      ...newSkills[categoryIndex],
      skills: [...newSkills[categoryIndex].skills, skill.trim()]
    };
    setFormData((prev) => ({ ...prev, skills: newSkills }));
    setNewSkillText((prev) => ({ ...prev, [categoryIndex]: "" }));
    await dbUpdateSkills(newSkills);
    onSave({ ...formData, skills: newSkills });
    showToast();
  };

  const handleRemoveSkill = async (categoryIndex: number, skillIndex: number) => {
    const newSkills = [...formData.skills];
    const category = newSkills[categoryIndex];
    newSkills[categoryIndex] = {
      ...category,
      skills: category.skills.filter((_, idx) => idx !== skillIndex)
    };
    setFormData((prev) => ({ ...prev, skills: newSkills }));
    await dbUpdateSkills(newSkills);
    onSave({ ...formData, skills: newSkills });
    showToast();
  };

  // --- Direct Timeline Handlers ---
  const handleSaveTimeline = async (item: TimelineItem) => {
    let updatedTimeline: TimelineItem[] = [];
    setFormData((prev) => {
      const exists = prev.timeline.some((t) => t.id === item.id);
      if (exists) {
        updatedTimeline = prev.timeline.map((t) => (t.id === item.id ? item : t));
      } else {
        updatedTimeline = [...prev.timeline, item];
      }
      return { ...prev, timeline: updatedTimeline };
    });

    await dbUpsertTimeline(item);
    onSave({ ...formData, timeline: updatedTimeline.length > 0 ? updatedTimeline : formData.timeline });
    setEditingTimeline(null);
    setIsNewTimeline(false);
    showToast();
  };

  const handleDeleteTimeline = async (id: string) => {
    if (window.confirm("Delete this timeline entry from database?")) {
      const updatedTimeline = formData.timeline.filter((t) => t.id !== id);
      setFormData((prev) => ({
        ...prev,
        timeline: updatedTimeline
      }));
      await dbDeleteTimeline(id);
      onSave({ ...formData, timeline: updatedTimeline });
      showToast();
    }
  };

  // --- Backup JSON Handlers ---
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(formData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `portfolio-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.profile && parsed.projects) {
            setFormData(parsed);
            onSave(parsed);
            alert("Portfolio data successfully imported!");
          }
        } catch {
          alert("Invalid JSON file format.");
        }
      };
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-zinc-900 font-sans antialiased pb-20">
      {/* Top Sticky Admin Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-zinc-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="liquid-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-xs font-semibold text-zinc-700 transition-colors"
          >
            <ArrowLeft size={13} />
            <span>Live Portfolio</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {savedToast && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 animate-in fade-in">
              <Check size={12} />
              Saved to Live Portfolio!
            </span>
          )}

          <button
            onClick={handleResetToDefault}
            className="liquid-btn hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 hover:bg-rose-50 hover:text-rose-600 text-xs font-medium text-zinc-600 transition-colors"
            title="Permanently wipe all database records"
          >
            <Trash2 size={12} className="text-rose-500" />
            <span>Wipe Database</span>
          </button>

          <button
            onClick={handleSaveAll}
            className="liquid-btn inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Save size={13} />
            <span>Save All Changes</span>
          </button>
        </div>
      </header>

      {/* Main Admin Workspace */}
      <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-8">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-200/60 w-fit mb-8 overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "profile"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <User size={13} />
            <span>Profile & Bio</span>
          </button>

          <button
            onClick={() => setActiveTab("projects")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "projects"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <FolderGit2 size={13} />
            <span>Projects ({formData.projects.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("skills")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "skills"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <Boxes size={13} />
            <span>Technical Stack</span>
          </button>

          <button
            onClick={() => setActiveTab("timeline")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "timeline"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <Briefcase size={13} />
            <span>Experience & Education</span>
          </button>

          <button
            onClick={() => setActiveTab("backup")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "backup"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <Code2 size={13} />
            <span>Backup & JSON</span>
          </button>
        </div>

        {/* TAB 1: Profile & Identity */}
        {activeTab === "profile" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/80 shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-bold text-zinc-900 tracking-tight">
                  Personal Identity & Bio
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Update your headline, biography, and social accounts shown in the Hero and Footer sections.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700">Full Name</label>
                  <input
                    type="text"
                    value={formData.profile.name}
                    onChange={(e) => handleProfileChange("name", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700">Email Address</label>
                  <input
                    type="email"
                    value={formData.profile.email}
                    onChange={(e) => handleProfileChange("email", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none transition-all"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700">Hero Biography / Introduction</label>
                  <textarea
                    rows={3}
                    value={formData.profile.bio}
                    onChange={(e) => handleProfileChange("bio", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none transition-all leading-relaxed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700">GitHub Profile URL</label>
                  <input
                    type="url"
                    value={formData.profile.githubUrl}
                    onChange={(e) => handleProfileChange("githubUrl", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700">LinkedIn Profile URL</label>
                  <input
                    type="url"
                    value={formData.profile.linkedinUrl}
                    onChange={(e) => handleProfileChange("linkedinUrl", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700">Twitter / X URL</label>
                  <input
                    type="url"
                    value={formData.profile.twitterUrl}
                    onChange={(e) => handleProfileChange("twitterUrl", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700">College & Location (Footer)</label>
                  <input
                    type="text"
                    value={formData.profile.collegeInfo}
                    onChange={(e) => handleProfileChange("collegeInfo", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleSaveProfile}
                  className="liquid-btn px-5 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 transition-all shadow-sm"
                >
                  Apply Profile Updates
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Projects Manager */}
        {activeTab === "projects" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-zinc-900 tracking-tight">
                  Featured Projects
                </h2>
                <p className="text-xs text-zinc-500">
                  Manage projects, challenge descriptions, repository links, and tech stacks.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingProject({
                    id: `project-${Date.now()}`,
                    title: "",
                    year: "2024",
                    status: "Live",
                    tagline: "",
                    challenge: "",
                    tech: [],
                    githubUrl: "https://github.com/gowthamkrishna27",
                    liveUrl: ""
                  });
                  setIsNewProject(true);
                }}
                className="liquid-btn inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 shadow-sm"
              >
                <Plus size={13} />
                <span>Add Project</span>
              </button>
            </div>

            {/* Project List */}
            <div className="grid grid-cols-1 gap-4">
              {formData.projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-zinc-400 font-semibold">{project.year}</span>
                      <h3 className="text-sm font-bold text-zinc-900 tracking-tight">
                        {project.title}
                      </h3>
                    </div>
                    <p className="text-xs text-zinc-500">{project.tagline}</p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {project.tech.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-100 text-zinc-600 border border-zinc-200/60"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                        title="View Repo"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                    <button
                      onClick={() => {
                        setEditingProject(project);
                        setIsNewProject(false);
                      }}
                      className="p-2 rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                      title="Edit Project"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                      title="Delete Project"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal for Project Edit/Create */}
            {editingProject && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
                <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-zinc-200 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
                  <h3 className="text-sm font-bold text-zinc-900">
                    {isNewProject ? "Add New Project" : `Edit ${editingProject.title}`}
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="font-semibold text-zinc-700">Project Title</label>
                      <input
                        type="text"
                        value={editingProject.title}
                        onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                        className="w-full mt-1 px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-zinc-700">Year</label>
                      <input
                        type="text"
                        value={editingProject.year}
                        onChange={(e) => setEditingProject({ ...editingProject, year: e.target.value })}
                        className="w-full mt-1 px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-zinc-700">Tagline / Subtitle</label>
                      <input
                        type="text"
                        value={editingProject.tagline}
                        onChange={(e) => setEditingProject({ ...editingProject, tagline: e.target.value })}
                        className="w-full mt-1 px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-zinc-700">Engineering Challenge & Description</label>
                      <textarea
                        rows={3}
                        value={editingProject.challenge}
                        onChange={(e) => setEditingProject({ ...editingProject, challenge: e.target.value })}
                        className="w-full mt-1 px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 outline-none leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-zinc-700">
                        Technologies (Comma separated: React, Python, Docker)
                      </label>
                      <input
                        type="text"
                        value={editingProject.tech.join(", ")}
                        onChange={(e) =>
                          setEditingProject({
                            ...editingProject,
                            tech: e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                          })
                        }
                        className="w-full mt-1 px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-zinc-700">GitHub Repository URL</label>
                      <input
                        type="url"
                        value={editingProject.githubUrl}
                        onChange={(e) => setEditingProject({ ...editingProject, githubUrl: e.target.value })}
                        className="w-full mt-1 px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-zinc-700">Live Demo URL (Optional)</label>
                      <input
                        type="url"
                        value={editingProject.liveUrl || ""}
                        onChange={(e) => setEditingProject({ ...editingProject, liveUrl: e.target.value })}
                        className="w-full mt-1 px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                    <button
                      onClick={() => setEditingProject(null)}
                      className="px-4 py-2 rounded-xl bg-zinc-100 text-xs font-semibold text-zinc-600 hover:bg-zinc-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveProject(editingProject)}
                      className="px-4 py-2 rounded-xl bg-zinc-900 text-xs font-semibold text-white hover:bg-zinc-800"
                    >
                      Save Project
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Technical Skills */}
        {activeTab === "skills" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-base font-bold text-zinc-900 tracking-tight">
                Technical Stack & Architecture
              </h2>
              <p className="text-xs text-zinc-500">
                Add, remove, or modify skills across Frontend, Backend & Systems, and DevOps categories.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {formData.skills.map((category, catIdx) => {
                const Icon =
                  category.iconName === "Layers"
                    ? Layers
                    : category.iconName === "Server"
                    ? Server
                    : Cpu;

                return (
                  <div
                    key={category.title}
                    className="bg-white rounded-3xl p-6 border border-zinc-200/80 shadow-sm space-y-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-100">
                        <div className="p-1.5 rounded-xl bg-zinc-100 text-zinc-700">
                          <Icon size={14} />
                        </div>
                        <input
                          type="text"
                          value={category.title}
                          onChange={(e) => {
                            const newSkills = [...formData.skills];
                            newSkills[catIdx].title = e.target.value;
                            setFormData({ ...formData, skills: newSkills });
                          }}
                          className="font-bold text-xs text-zinc-900 bg-transparent outline-none w-full"
                        />
                      </div>

                      <div className="space-y-1.5 pt-3">
                        {category.skills.map((skill, skillIdx) => (
                          <div
                            key={skillIdx}
                            className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/50 text-xs font-mono text-zinc-800 transition-colors group"
                          >
                            <span>{skill}</span>
                            <button
                              onClick={() => handleRemoveSkill(catIdx, skillIdx)}
                              className="text-zinc-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Remove skill"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-zinc-100 flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder="Add skill (e.g. GraphQL)"
                        value={newSkillText[catIdx] || ""}
                        onChange={(e) =>
                          setNewSkillText({ ...newSkillText, [catIdx]: e.target.value })
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleAddSkill(catIdx, newSkillText[catIdx] || "");
                          }
                        }}
                        className="w-full px-3 py-1.5 rounded-xl border border-zinc-200 text-xs outline-none bg-zinc-50/50"
                      />
                      <button
                        onClick={() => handleAddSkill(catIdx, newSkillText[catIdx] || "")}
                        className="px-2.5 py-1.5 rounded-xl bg-zinc-900 text-white text-xs font-medium shrink-0"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: Experience & Education */}
        {activeTab === "timeline" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-zinc-900 tracking-tight">
                  Experience & Education Milestones
                </h2>
                <p className="text-xs text-zinc-500">
                  Manage academic qualifications, degrees, and full-stack engineering roles.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingTimeline({
                    id: `timeline-${Date.now()}`,
                    type: "experience",
                    role: "",
                    organization: "",
                    period: "2024 — Present",
                    location: "Remote",
                    description: ["Key contribution point 1"],
                    skills: ["React", "FastAPI"]
                  });
                  setIsNewTimeline(true);
                }}
                className="liquid-btn inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 shadow-sm"
              >
                <Plus size={13} />
                <span>Add Milestone</span>
              </button>
            </div>

            <div className="space-y-4">
              {formData.timeline.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-sm flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
                        {item.type}
                      </span>
                      <h3 className="text-sm font-bold text-zinc-900 tracking-tight">
                        {item.role}
                      </h3>
                    </div>
                    <p className="text-xs text-zinc-600">
                      {item.organization} • <span className="font-mono text-zinc-400">{item.period}</span>
                    </p>
                    <ul className="text-xs text-zinc-500 pt-1 space-y-0.5">
                      {item.description.map((d, i) => (
                        <li key={i}>• {d}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingTimeline(item);
                        setIsNewTimeline(false);
                      }}
                      className="p-2 rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                      title="Edit Milestone"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteTimeline(item.id)}
                      className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                      title="Delete Milestone"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Timeline Item Modal */}
            {editingTimeline && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
                <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-zinc-200 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
                  <h3 className="text-sm font-bold text-zinc-900">
                    {isNewTimeline ? "Add Milestone" : `Edit ${editingTimeline.role}`}
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="font-semibold text-zinc-700">Milestone Type</label>
                      <select
                        value={editingTimeline.type}
                        onChange={(e) =>
                          setEditingTimeline({
                            ...editingTimeline,
                            type: e.target.value as "experience" | "education"
                          })
                        }
                        className="w-full mt-1 px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 outline-none"
                      >
                        <option value="experience">Experience</option>
                        <option value="education">Education</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-zinc-700">Role / Degree Title</label>
                      <input
                        type="text"
                        value={editingTimeline.role}
                        onChange={(e) =>
                          setEditingTimeline({ ...editingTimeline, role: e.target.value })
                        }
                        className="w-full mt-1 px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-zinc-700">Organization / College</label>
                      <input
                        type="text"
                        value={editingTimeline.organization}
                        onChange={(e) =>
                          setEditingTimeline({
                            ...editingTimeline,
                            organization: e.target.value
                          })
                        }
                        className="w-full mt-1 px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-zinc-700">Period (e.g. 2023 — 2027)</label>
                      <input
                        type="text"
                        value={editingTimeline.period}
                        onChange={(e) =>
                          setEditingTimeline({ ...editingTimeline, period: e.target.value })
                        }
                        className="w-full mt-1 px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-zinc-700">Location</label>
                      <input
                        type="text"
                        value={editingTimeline.location}
                        onChange={(e) =>
                          setEditingTimeline({ ...editingTimeline, location: e.target.value })
                        }
                        className="w-full mt-1 px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-zinc-700">
                        Key Points (One point per line)
                      </label>
                      <textarea
                        rows={3}
                        value={editingTimeline.description.join("\n")}
                        onChange={(e) =>
                          setEditingTimeline({
                            ...editingTimeline,
                            description: e.target.value.split("\n").filter(Boolean)
                          })
                        }
                        className="w-full mt-1 px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 outline-none leading-relaxed"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                    <button
                      onClick={() => setEditingTimeline(null)}
                      className="px-4 py-2 rounded-xl bg-zinc-100 text-xs font-semibold text-zinc-600 hover:bg-zinc-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveTimeline(editingTimeline)}
                      className="px-4 py-2 rounded-xl bg-zinc-900 text-xs font-semibold text-white hover:bg-zinc-800"
                    >
                      Save Milestone
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: Backup & JSON */}
        {activeTab === "backup" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/80 shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-bold text-zinc-900 tracking-tight">
                  Portfolio Data Backup & Export
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Export your active content configuration as a JSON file or import a saved backup.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleExportJSON}
                  className="liquid-btn inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 shadow-sm"
                >
                  <Download size={14} />
                  <span>Download Backup (JSON)</span>
                </button>

                <label className="liquid-btn inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold cursor-pointer border border-zinc-200">
                  <Upload size={14} />
                  <span>Import Backup File</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJSON}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Supabase Cloud Sync Setting */}
              <div className="pt-4 border-t border-zinc-100 space-y-3">
                <div>
                  <h3 className="text-xs font-bold text-zinc-900 tracking-tight flex items-center gap-1.5">
                    <Server size={13} />
                    <span>Supabase Cloud Database Sync</span>
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Connect directly to your Supabase PostgreSQL cloud database for persistent synchronization.
                  </p>
                </div>

                <div className="space-y-2 max-w-lg">
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-600">Supabase Project URL</label>
                    <input
                      type="text"
                      defaultValue={localStorage.getItem("supabase_url") || "https://lkzsjkwxzhkdgcuokzwt.supabase.co"}
                      id="supabase-url-input"
                      className="w-full mt-1 px-3 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-mono text-zinc-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-zinc-600">Supabase Anon (Public) API Key</label>
                    <input
                      type="password"
                      placeholder="Paste your anon public key (eyJhbGciOi...)"
                      defaultValue={localStorage.getItem("supabase_anon_key") || ""}
                      id="supabase-anon-key-input"
                      className="w-full mt-1 px-3 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-mono text-zinc-900 outline-none"
                    />
                  </div>

                  <button
                    onClick={() => {
                      const urlInput = document.getElementById("supabase-url-input") as HTMLInputElement;
                      const keyInput = document.getElementById("supabase-anon-key-input") as HTMLInputElement;
                      if (urlInput) localStorage.setItem("supabase_url", urlInput.value.trim());
                      if (keyInput) localStorage.setItem("supabase_anon_key", keyInput.value.trim());
                      alert("Supabase cloud settings saved! Realtime cloud sync is now active.");
                    }}
                    className="px-4 py-1.5 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 transition-colors"
                  >
                    Save Supabase Keys
                  </button>
                </div>
              </div>

              {/* Security Passphrase Setting */}
              <div className="pt-4 border-t border-zinc-100 space-y-3">
                <div>
                  <h3 className="text-xs font-bold text-zinc-900 tracking-tight flex items-center gap-1.5">
                    <Code2 size={13} />
                    <span>Security Passphrase</span>
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Change the access passphrase required to enter this Admin Panel.
                  </p>
                </div>

                <div className="flex items-center gap-2 max-w-sm">
                  <input
                    type="password"
                    placeholder="Enter new passphrase..."
                    autoComplete="new-password"
                    spellCheck="false"
                    data-lpignore="true"
                    id="security-passphrase-input"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-mono text-zinc-900 outline-none"
                  />
                  <button
                    onClick={async () => {
                      const input = document.getElementById("security-passphrase-input") as HTMLInputElement;
                      if (input && input.value.trim()) {
                        await dbUpdateSecurityPhrase(input.value.trim());
                        input.value = "";
                        alert("Security passphrase updated directly in database!");
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 shrink-0"
                  >
                    Update Passphrase
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-zinc-700 font-mono">
                  Live JSON State
                </span>
                <pre className="p-4 rounded-2xl bg-zinc-950 text-zinc-200 font-mono text-xs max-h-72 overflow-y-auto leading-relaxed shadow-inner">
                  {JSON.stringify(formData, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
