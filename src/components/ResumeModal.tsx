import React from "react";
import { Download, X } from "lucide-react";
import { PortfolioData } from "../types";
import { printOrDownloadResumePDF } from "../lib/resumeGenerator";

interface ResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PortfolioData;
}

export const ResumeModal: React.FC<ResumeModalProps> = ({
  isOpen,
  onClose,
  data
}) => {
  if (!isOpen) return null;

  const { profile, projects, skills, timeline } = data;
  const experienceItems = timeline.filter((t) => t.type === "experience");
  const educationItems = timeline.filter((t) => t.type === "education");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-zinc-950/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="liquid-glass-card rounded-3xl w-full max-w-2xl h-[88vh] max-h-[820px] flex flex-col shadow-[0_24px_70px_rgba(0,0,0,0.25)] border border-zinc-200/90 overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Minimal Header */}
        <div className="px-6 py-3.5 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md flex items-center justify-between shrink-0">
          <span className="text-sm font-semibold text-zinc-900">
            Resume
          </span>
          <button
            onClick={onClose}
            className="liquid-btn w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-colors"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        {/* Minimal Resume Sheet Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-7 bg-[#FBFBFD] select-text text-zinc-800 font-sans">
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-zinc-200/80 space-y-6 text-xs sm:text-sm">
            {/* Header / Identity */}
            <div className="border-b border-zinc-900 pb-3 space-y-1">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
                {profile.name}
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-zinc-600">
                {profile.headline}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-500 pt-1 font-mono">
                {profile.email && (
                  <a
                    href={`mailto:${profile.email}`}
                    className="text-zinc-700 hover:text-zinc-900 hover:underline"
                  >
                    {profile.email}
                  </a>
                )}
                {profile.collegeInfo && <span>• {profile.collegeInfo}</span>}
                {profile.githubUrl && (
                  <a
                    href={profile.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-700 hover:text-zinc-900 hover:underline"
                  >
                    GitHub
                  </a>
                )}
                {profile.linkedinUrl && (
                  <a
                    href={profile.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-700 hover:text-zinc-900 hover:underline"
                  >
                    LinkedIn
                  </a>
                )}
              </div>
            </div>

            {/* Bio / Summary */}
            {profile.bio && (
              <div className="space-y-1">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-900 border-b border-zinc-200 pb-0.5">
                  Professional Summary
                </h4>
                <p className="text-zinc-600 leading-relaxed text-[11.5px] pt-1">
                  {profile.bio}
                </p>
              </div>
            )}

            {/* Technical Skills */}
            {skills && skills.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-900 border-b border-zinc-200 pb-0.5">
                  Technical Expertise
                </h4>
                <div className="space-y-1 pt-1 text-[11.5px]">
                  {skills.map((cat, idx) => (
                    <div key={idx} className="text-zinc-700">
                      <span className="font-semibold text-zinc-900">{cat.title}:</span>{" "}
                      <span className="text-zinc-600">{cat.skills.join(", ")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {experienceItems.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-900 border-b border-zinc-200 pb-0.5">
                  Experience
                </h4>
                <div className="space-y-3 pt-1">
                  {experienceItems.map((item, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <div className="flex items-baseline justify-between">
                        <span className="font-bold text-zinc-900 text-xs sm:text-[13px]">
                          {item.role}{" "}
                          <span className="font-medium text-zinc-600">· {item.organization}</span>
                        </span>
                        <span className="text-[11px] font-mono text-zinc-500">
                          {item.period}
                        </span>
                      </div>
                      {item.location && (
                        <div className="text-[11px] text-zinc-400">{item.location}</div>
                      )}
                      {item.description && item.description.length > 0 && (
                        <ul className="list-disc list-inside text-zinc-600 text-[11px] space-y-0.5 pl-1 pt-0.5">
                          {item.description.map((desc, dIdx) => (
                            <li key={dIdx}>{desc}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Featured Projects */}
            {projects && projects.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-900 border-b border-zinc-200 pb-0.5">
                  Featured Projects
                </h4>
                <div className="space-y-3 pt-1">
                  {projects.map((proj, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <div className="flex items-baseline justify-between">
                        <span className="font-bold text-zinc-900 text-xs sm:text-[13px]">
                          {proj.title}
                        </span>
                        <span className="text-[11px] font-mono text-zinc-500">
                          {proj.year}
                        </span>
                      </div>
                      {proj.tagline && (
                        <div className="text-[11.5px] font-medium text-zinc-700">
                          {proj.tagline}
                        </div>
                      )}
                      {proj.challenge && (
                        <p className="text-[11px] text-zinc-600 leading-relaxed">
                          {proj.challenge}
                        </p>
                      )}
                      {proj.tech && proj.tech.length > 0 && (
                        <div className="text-[10.5px] font-mono text-zinc-500 pt-0.5">
                          Stack: {proj.tech.join(", ")}
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono">
                        {proj.githubUrl && (
                          <a
                            href={proj.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-700 hover:text-sky-900 hover:underline flex items-center gap-0.5"
                          >
                            <span>GitHub Code</span> ↗
                          </a>
                        )}
                        {proj.liveUrl && (
                          <a
                            href={proj.liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-700 hover:text-emerald-900 hover:underline flex items-center gap-0.5"
                          >
                            <span>Live Preview</span> ↗
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {educationItems.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-900 border-b border-zinc-200 pb-0.5">
                  Education
                </h4>
                <div className="space-y-2 pt-1">
                  {educationItems.map((edu, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <div className="flex items-baseline justify-between">
                        <span className="font-bold text-zinc-900 text-xs sm:text-[13px]">
                          {edu.role}{" "}
                          <span className="font-medium text-zinc-600">· {edu.organization}</span>
                        </span>
                        <span className="text-[11px] font-mono text-zinc-500">
                          {edu.period}
                        </span>
                      </div>
                      {edu.location && (
                        <div className="text-[11px] text-zinc-400">{edu.location}</div>
                      )}
                      {edu.description && edu.description.length > 0 && (
                        <ul className="list-disc list-inside text-zinc-600 text-[11px] space-y-0.5 pl-1 pt-0.5">
                          {edu.description.map((desc, dIdx) => (
                            <li key={dIdx}>{desc}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Minimal Single Download Action Bar */}
        <div className="p-4 sm:px-6 border-t border-zinc-200/80 bg-white/90 backdrop-blur-md flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="liquid-btn text-xs font-medium text-zinc-500 hover:text-zinc-900 px-3 py-1.5"
          >
            Close
          </button>

          <button
            onClick={() => printOrDownloadResumePDF(data)}
            className="liquid-btn inline-flex items-center justify-center gap-2 h-9 px-5 rounded-full bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 shadow-[0_2px_8px_rgba(0,0,0,0.15)] transition-all"
          >
            <Download size={13} />
            <span>Download PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
