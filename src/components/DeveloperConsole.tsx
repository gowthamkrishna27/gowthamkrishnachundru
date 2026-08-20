import React, { useState, useEffect, useRef } from "react";
import { PortfolioData } from "../types";
import { fetchPortfolioCheckouts, CheckoutRecord } from "../lib/supabase";

interface DeveloperConsoleProps {
  isOpen: boolean;
  onClose: () => void;
  data: PortfolioData;
  onOpenAdmin: () => void;
  isLockedOut: boolean;
}

interface CommandHistoryItem {
  id: string;
  cmd: string;
  result: React.ReactNode;
}

export const DeveloperConsole: React.FC<DeveloperConsoleProps> = ({
  isOpen,
  onClose,
  data,
  onOpenAdmin,
  isLockedOut
}) => {
  const [inputVal, setInputVal] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyPointer, setHistoryPointer] = useState<number>(-1);
  const [outputs, setOutputs] = useState<CommandHistoryItem[]>([]);
  const [isMaximized, setIsMaximized] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Initial PowerShell Welcome Header
  useEffect(() => {
    if (outputs.length === 0 && data) {
      setOutputs([
        {
          id: "ps-header",
          cmd: "",
          result: (
            <div className="text-zinc-200 select-none pb-2 leading-relaxed space-y-1">
              <div>Windows PowerShell</div>
              <div>Copyright (C) Microsoft Corporation. All rights reserved.</div>
              <div className="text-zinc-400 text-[11px] pt-0.5">
                Type <span className="text-yellow-300 font-bold">help</span> or <span className="text-yellow-300 font-bold">dir</span> to get started. Press <span className="text-zinc-300 font-semibold">Tab</span> for autocompletion.
              </div>
            </div>
          )
        }
      ]);
    }
  }, [data]);

  // Auto focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  // Scroll to bottom when output arrives
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [outputs]);

  // Keyboard shortcut Esc to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const runCommand = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      setOutputs((prev) => [
        ...prev,
        { id: `${Date.now()}`, cmd: "", result: null }
      ]);
      return;
    }

    setHistory((prev) => [...prev, trimmed]);
    setHistoryPointer(-1);

    const parts = trimmed.split(" ");
    const command = parts[0].toLowerCase();
    const args = parts.slice(1).join(" ").toLowerCase();

    let resultNode: React.ReactNode = null;

    switch (command) {
      case "help":
      case "get-help":
      case "man":
      case "?":
        resultNode = (
          <div className="space-y-2 text-zinc-300 py-1">
            <div className="text-white font-semibold">TOPIC: Windows PowerShell Help System</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-xs">
              <div><span className="text-yellow-300 font-semibold">dir, ls, gci</span> <span className="text-zinc-400">- List projects and virtual files</span></div>
              <div><span className="text-yellow-300 font-semibold">cat, type &lt;file&gt;</span> <span className="text-zinc-400">- Read file (bio, resume, skills)</span></div>
              <div><span className="text-yellow-300 font-semibold">irm, curl &lt;api&gt;</span> <span className="text-zinc-400">- Query live API JSON endpoints</span></div>
              <div><span className="text-yellow-300 font-semibold">whoami</span> <span className="text-zinc-400">- Current identity & profile</span></div>
              <div><span className="text-yellow-300 font-semibold">Get-Checkouts</span> <span className="text-zinc-400">- Real-time DB visitor records</span></div>
              <div><span className="text-yellow-300 font-semibold">Get-Experience</span> <span className="text-zinc-400">- Career timeline & roles</span></div>
              <div><span className="text-yellow-300 font-semibold">Get-Skills</span> <span className="text-zinc-400">- Technical skill breakdown</span></div>
              <div><span className="text-yellow-300 font-semibold">Get-Contact</span> <span className="text-zinc-400">- Email, socials & links</span></div>
              <div><span className="text-yellow-300 font-semibold">Get-Process</span> <span className="text-zinc-400">- Running background stack services</span></div>
              <div><span className="text-yellow-300 font-semibold">$PSVersionTable</span> <span className="text-zinc-400">- PowerShell & runtime version</span></div>
              <div><span className="text-yellow-300 font-semibold">cls, clear</span> <span className="text-zinc-400">- Clear screen</span></div>
              <div><span className="text-yellow-300 font-semibold">admin, sudo</span> <span className="text-zinc-400">- Launch Admin Passphrase Gate</span></div>
              <div><span className="text-yellow-300 font-semibold">exit</span> <span className="text-zinc-400">- Close terminal window</span></div>
            </div>
          </div>
        );
        break;

      case "dir":
      case "ls":
      case "get-childitem":
      case "gci":
        resultNode = (
          <div className="space-y-1 py-1 font-mono text-xs">
            <div className="text-zinc-400 pb-1">
              &nbsp;&nbsp;&nbsp;&nbsp;Directory: C:\Users\GowthamKrishna
            </div>
            <div className="text-zinc-400 border-b border-zinc-700/80 pb-0.5 grid grid-cols-12 gap-2 text-[11px]">
              <span className="col-span-3 sm:col-span-2">Mode</span>
              <span className="col-span-4 sm:col-span-3">LastWriteTime</span>
              <span className="col-span-2 sm:col-span-2 text-right">Length</span>
              <span className="col-span-3 sm:col-span-5 pl-2">Name</span>
            </div>
            {/* Virtual Files */}
            <div className="grid grid-cols-12 gap-2 text-[11px] text-zinc-300">
              <span className="col-span-3 sm:col-span-2 text-zinc-500">-a----</span>
              <span className="col-span-4 sm:col-span-3 text-zinc-400">{new Date().toLocaleDateString()}</span>
              <span className="col-span-2 sm:col-span-2 text-right text-zinc-400">1024</span>
              <span className="col-span-3 sm:col-span-5 pl-2 text-sky-300">bio.txt</span>
            </div>
            <div className="grid grid-cols-12 gap-2 text-[11px] text-zinc-300">
              <span className="col-span-3 sm:col-span-2 text-zinc-500">-a----</span>
              <span className="col-span-4 sm:col-span-3 text-zinc-400">{new Date().toLocaleDateString()}</span>
              <span className="col-span-2 sm:col-span-2 text-right text-zinc-400">2048</span>
              <span className="col-span-3 sm:col-span-5 pl-2 text-sky-300">resume.md</span>
            </div>
            <div className="grid grid-cols-12 gap-2 text-[11px] text-zinc-300">
              <span className="col-span-3 sm:col-span-2 text-zinc-500">-a----</span>
              <span className="col-span-4 sm:col-span-3 text-zinc-400">{new Date().toLocaleDateString()}</span>
              <span className="col-span-2 sm:col-span-2 text-right text-zinc-400">4096</span>
              <span className="col-span-3 sm:col-span-5 pl-2 text-sky-300">skills.json</span>
            </div>

            {/* Projects Directory */}
            {data.projects.map((proj, idx) => (
              <div key={proj.id || idx} className="grid grid-cols-12 gap-2 text-[11px] text-zinc-300">
                <span className="col-span-3 sm:col-span-2 text-zinc-500">d-----</span>
                <span className="col-span-4 sm:col-span-3 text-zinc-400">{proj.year}</span>
                <span className="col-span-2 sm:col-span-2 text-right text-zinc-400">&lt;DIR&gt;</span>
                <span className="col-span-3 sm:col-span-5 pl-2 text-emerald-300 font-semibold truncate">
                  {proj.title.replace(/\s+/g, "-").toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        );
        break;

      case "cat":
      case "type":
      case "get-content":
      case "gc":
        if (args.includes("bio") || args.includes("about")) {
          resultNode = (
            <div className="space-y-1 text-zinc-200 py-1 leading-relaxed">
              <div className="text-white font-bold">{data.profile.name}</div>
              <div className="text-yellow-300">{data.profile.headline}</div>
              <div className="text-zinc-300 text-xs pt-1">{data.profile.bio}</div>
              <div className="text-zinc-400 text-xs pt-1">Institution: {data.profile.collegeInfo}</div>
            </div>
          );
        } else if (args.includes("resume")) {
          resultNode = (
            <div className="space-y-2 text-zinc-200 py-1 text-xs font-mono">
              <div className="text-white font-bold border-b border-zinc-700 pb-1"># RESUME / CURRICULUM VITAE</div>
              <div><span className="text-zinc-400">Name:</span> {data.profile.name}</div>
              <div><span className="text-zinc-400">Role:</span> {data.profile.headline}</div>
              <div><span className="text-zinc-400">Contact:</span> {data.profile.email}</div>
              <div><span className="text-zinc-400">GitHub:</span> {data.profile.githubUrl}</div>
              <div><span className="text-zinc-400">LinkedIn:</span> {data.profile.linkedinUrl}</div>
            </div>
          );
        } else if (args.includes("skills")) {
          resultNode = (
            <pre className="p-2 rounded bg-black/40 text-emerald-300 text-xs overflow-x-auto">
              {JSON.stringify(data.skills, null, 2)}
            </pre>
          );
        } else {
          resultNode = (
            <div className="text-rose-400 font-mono text-xs">
              Get-Content : Cannot find path '{args || "unspecified"}' because it does not exist. Try 'cat bio.txt' or 'cat resume.md'.
            </div>
          );
        }
        break;

      case "whoami":
      case "about":
      case "profile":
        resultNode = (
          <div className="space-y-1 text-zinc-200 py-1 text-xs">
            <div>portfolio\{data.profile.name.toLowerCase().replace(/\s+/g, "")}</div>
            <div className="text-yellow-300 pt-0.5">{data.profile.headline}</div>
            <div className="text-zinc-400">{data.profile.email} • {data.profile.collegeInfo}</div>
          </div>
        );
        break;

      case "get-skills":
      case "skills":
        resultNode = (
          <div className="space-y-2 py-1 text-xs">
            {data.skills.map((cat, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="text-yellow-300 font-bold">{cat.title}:</div>
                <div className="text-zinc-300 pl-4">{cat.skills.join(", ")}</div>
              </div>
            ))}
          </div>
        );
        break;

      case "get-experience":
      case "experience":
      case "timeline":
      case "education":
        resultNode = (
          <div className="space-y-2.5 py-1 text-xs">
            {data.timeline.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="text-white font-bold flex items-center justify-between">
                  <span className="text-sky-300">{item.role}</span>
                  <span className="text-zinc-400 text-[11px] font-mono">{item.period}</span>
                </div>
                <div className="text-yellow-300 text-[11px]">{item.organization} ({item.location})</div>
                {item.description && item.description.length > 0 && (
                  <div className="text-zinc-300 text-[11px] pl-2">
                    {item.description.map((d, dIdx) => (
                      <div key={dIdx}>• {d}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
        break;

      case "get-contact":
      case "contact":
      case "socials":
      case "email":
        resultNode = (
          <div className="space-y-1 text-zinc-200 py-1 text-xs">
            <div><span className="text-zinc-400">Email:</span> <a href={`mailto:${data.profile.email}`} className="text-sky-300 underline">{data.profile.email}</a></div>
            <div><span className="text-zinc-400">GitHub:</span> <a href={data.profile.githubUrl} target="_blank" rel="noreferrer" className="text-sky-300 underline">{data.profile.githubUrl}</a></div>
            <div><span className="text-zinc-400">LinkedIn:</span> <a href={data.profile.linkedinUrl} target="_blank" rel="noreferrer" className="text-sky-300 underline">{data.profile.linkedinUrl}</a></div>
            <div><span className="text-zinc-400">Twitter/X:</span> <a href={data.profile.twitterUrl} target="_blank" rel="noreferrer" className="text-sky-300 underline">{data.profile.twitterUrl}</a></div>
          </div>
        );
        break;

      case "irm":
      case "invoke-restmethod":
      case "curl":
      case "fetch":
        const target = args || "/api/v1/profile";
        let resData: any = data.profile;
        if (target.includes("project")) resData = data.projects;
        else if (target.includes("skill")) resData = data.skills;
        else if (target.includes("timeline")) resData = data.timeline;
        else if (target.includes("all")) resData = data;

        resultNode = (
          <div className="space-y-1 py-1 font-mono text-xs">
            <div className="text-emerald-400">StatusCode: 200 OK | Protocol: HTTP/2.0</div>
            <pre className="p-2 rounded bg-black/50 text-emerald-300 text-[11px] overflow-x-auto max-h-56">
              {JSON.stringify(resData, null, 2)}
            </pre>
          </div>
        );
        break;

      case "ps":
      case "get-process":
      case "gps":
        resultNode = (
          <div className="space-y-1 py-1 font-mono text-xs">
            <div className="text-zinc-400 border-b border-zinc-700/80 pb-0.5 grid grid-cols-12 gap-2 text-[11px]">
              <span className="col-span-2">Handles</span>
              <span className="col-span-2">NPM(K)</span>
              <span className="col-span-2 text-right">WS(K)</span>
              <span className="col-span-2 text-right">Id</span>
              <span className="col-span-4 pl-2">ProcessName</span>
            </div>
            {[
              { handles: 342, npm: 48, ws: 10420, id: 1012, name: "react-runtime" },
              { handles: 180, npm: 22, ws: 6120, id: 2044, name: "vite-bundler" },
              { handles: 512, npm: 64, ws: 14880, id: 3180, name: "supabase-realtime" },
              { handles: 95, npm: 12, ws: 3400, id: 4420, name: "tailwind-engine" }
            ].map((p) => (
              <div key={p.id} className="grid grid-cols-12 gap-2 text-[11px] text-zinc-300">
                <span className="col-span-2 text-zinc-400">{p.handles}</span>
                <span className="col-span-2 text-zinc-400">{p.npm}</span>
                <span className="col-span-2 text-right text-zinc-400">{p.ws}</span>
                <span className="col-span-2 text-right text-yellow-400">{p.id}</span>
                <span className="col-span-4 pl-2 text-emerald-300 font-semibold">{p.name}</span>
              </div>
            ))}
          </div>
        );
        break;

      case "get-checkouts":
      case "checkouts":
      case "visits":
      case "traffic":
        resultNode = (
          <div className="space-y-1.5 py-1 font-mono text-xs">
            <div className="text-emerald-400 font-bold">Querying Supabase portfolio_checkouts table...</div>
            <div className="text-zinc-300 text-[11px] leading-relaxed">
              Every portfolio checkout/visit is captured in real-time with device, browser, OS, screen resolution, and timestamp.
            </div>
            <div className="p-2 rounded bg-black/50 text-zinc-300 text-[11px] border border-zinc-700/60">
              <div>• Table: <span className="text-yellow-300 font-bold">portfolio_checkouts</span></div>
              <div>• Status: <span className="text-emerald-400 font-bold">ACTIVE & LOGGING</span></div>
              <div>• Schema: <span className="text-sky-300 font-mono">id, session_id, action_type, browser, os, device_type, ip_address, created_at</span></div>
            </div>
          </div>
        );
        break;

      case "$psversiontable":
      case "get-host":
      case "version":
        resultNode = (
          <div className="space-y-1 py-1 font-mono text-xs text-zinc-300">
            <div className="text-zinc-400 border-b border-zinc-700 pb-0.5">Name&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Value</div>
            <div>PSVersion&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;7.4.2</div>
            <div>PSEdition&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Core</div>
            <div>OS&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Microsoft Windows NT 10.0</div>
            <div>Platform&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Win32NT</div>
            <div>AppEngine&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Vite + React 18 + Supabase</div>
          </div>
        );
        break;

      case "admin":
      case "sudo":
        if (isLockedOut) {
          resultNode = (
            <div className="text-rose-400 font-mono text-xs">
              Access Denied: Administrator console is temporarily locked out due to security policy.
            </div>
          );
        } else {
          resultNode = (
            <div className="space-y-1 text-xs py-1">
              <div className="text-yellow-300">Invoking Administrator Passphrase Modal...</div>
              <button
                onClick={() => {
                  onClose();
                  onOpenAdmin();
                }}
                className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs inline-flex items-center gap-1.5 transition-all mt-1"
              >
                ➔ Click to open Passphrase Gate
              </button>
            </div>
          );
        }
        break;

      case "clear":
      case "cls":
      case "clear-host":
        setOutputs([]);
        setInputVal("");
        return;

      case "write-host":
      case "echo":
        resultNode = <div className="text-zinc-200 text-xs py-0.5">{parts.slice(1).join(" ")}</div>;
        break;

      case "get-date":
      case "date":
        resultNode = <div className="text-zinc-300 text-xs py-0.5">{new Date().toString()}</div>;
        break;

      case "exit":
      case "quit":
        onClose();
        return;

      default:
        resultNode = (
          <div className="text-rose-400 font-mono text-xs py-0.5">
            {trimmed} : The term '{command}' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name or type <span className="text-yellow-300 underline cursor-pointer" onClick={() => runCommand("help")}>help</span>.
          </div>
        );
        break;
    }

    setOutputs((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        cmd: trimmed,
        result: resultNode
      }
    ]);
    setInputVal("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      runCommand(inputVal);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIdx = historyPointer === -1 ? history.length - 1 : Math.max(0, historyPointer - 1);
      setHistoryPointer(nextIdx);
      setInputVal(history[nextIdx] || "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIdx = historyPointer + 1;
      if (nextIdx >= history.length) {
        setHistoryPointer(-1);
        setInputVal("");
      } else {
        setHistoryPointer(nextIdx);
        setInputVal(history[nextIdx] || "");
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const psCommands = [
        "help", "dir", "ls", "cat", "type", "whoami", "get-checkouts",
        "get-skills", "get-experience", "get-contact", "get-process",
        "irm", "curl", "cls", "clear", "$psversiontable", "admin", "exit"
      ];
      const match = psCommands.find((c) => c.startsWith(inputVal.toLowerCase().trim()));
      if (match) {
        setInputVal(match);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`w-full bg-[#012456] text-[#eeedf0] border border-[#0d3b7a] rounded-lg shadow-2xl flex flex-col font-mono text-xs overflow-hidden transition-all duration-200 ${
          isMaximized ? "h-[94vh] max-w-6xl" : "h-[80vh] max-h-[640px] max-w-3xl"
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)"
        }}
      >
        {/* Windows PowerShell Title Bar */}
        <div className="flex items-center justify-between bg-[#001737] px-3 py-1.5 border-b border-[#0d3b7a]/80 select-none shrink-0">
          <div className="flex items-center gap-2">
            {/* PowerShell Blue Icon Badge */}
            <div className="w-4 h-4 rounded bg-[#012456] border border-[#1e4a8a] flex items-center justify-center text-[10px] font-bold text-sky-300">
              &gt;_
            </div>
            <span className="text-zinc-200 text-xs font-semibold tracking-tight">
              Windows PowerShell
            </span>
          </div>

          {/* Classic Windows Window Controls (Minimize, Maximize, Close) */}
          <div className="flex items-center">
            <button
              onClick={onClose}
              className="w-8 h-6 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors text-xs"
              title="Minimize / Hide"
            >
              ─
            </button>
            <button
              onClick={() => setIsMaximized((prev) => !prev)}
              className="w-8 h-6 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors text-xs"
              title={isMaximized ? "Restore" : "Maximize"}
            >
              {isMaximized ? "❐" : "□"}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-6 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-rose-600 transition-colors text-xs font-semibold"
              title="Close (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Minimalist Command Suggestions Pill Bar */}
        <div className="bg-[#001c45] border-b border-[#0d3b7a]/60 px-3 py-1 flex items-center gap-2 overflow-x-auto shrink-0 text-[11px]">
          <span className="text-zinc-400 text-[10px] uppercase font-bold shrink-0">Quick Cmds:</span>
          {["help", "dir", "whoami", "get-checkouts", "get-skills", "get-experience", "get-contact", "get-process", "cls"].map((cmd) => (
            <button
              key={cmd}
              onClick={() => runCommand(cmd)}
              className="px-2 py-0.5 rounded bg-[#012456] hover:bg-[#0c3875] text-zinc-300 hover:text-white border border-[#1b437c] transition-colors shrink-0"
            >
              {cmd}
            </button>
          ))}
        </div>

        {/* Terminal Body / Output Scroll View */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 select-text font-mono"
          onClick={() => inputRef.current?.focus()}
        >
          {outputs.map((item) => (
            <div key={item.id} className="space-y-1">
              {item.cmd !== "" && (
                <div className="flex items-center gap-1.5 text-zinc-200">
                  <span className="text-zinc-300 font-semibold select-none">
                    PS C:\Users\GowthamKrishna&gt;
                  </span>
                  <span className="font-semibold text-white">{item.cmd}</span>
                </div>
              )}
              {item.result && <div className="pl-0">{item.result}</div>}
            </div>
          ))}

          {/* Active Input Line */}
          <div className="flex items-center gap-1.5 pt-1 text-zinc-100">
            <span className="text-zinc-300 font-semibold select-none shrink-0">
              PS C:\Users\GowthamKrishna&gt;
            </span>
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              spellCheck="false"
              className="flex-1 bg-transparent outline-none border-none text-white caret-white font-mono text-xs p-0 m-0"
              autoFocus
            />
          </div>
        </div>

        {/* Minimalist Status Footer */}
        <div className="bg-[#001737] border-t border-[#0d3b7a]/80 px-3 py-1 text-[11px] text-zinc-400 flex items-center justify-between select-none shrink-0">
          <div>
            <span>PowerShell 7.4.2</span>
          </div>
          <div>
            <span>Press <kbd className="px-1 py-0.2 bg-[#012456] border border-[#1b437c] rounded text-zinc-300">Esc</kbd> to close</span>
          </div>
        </div>
      </div>
    </div>
  );
};
