import { createClient } from "@supabase/supabase-js";
import { PortfolioData, Project, SkillCategory, TimelineItem, ProfileData } from "../types";

const DEFAULT_URL = "https://lkzsjkwxzhkdgcuokzwt.supabase.co";
const DEFAULT_KEY = "sb_publishable_uAhwwf-K_jnBBMCkITT9lg_qYs3_gqu";

export function getSupabaseConfig() {
  const metaEnv = (import.meta as any).env || {};
  const url =
    (typeof window !== "undefined" && localStorage.getItem("supabase_url")) ||
    metaEnv.VITE_SUPABASE_URL ||
    DEFAULT_URL;

  const key =
    (typeof window !== "undefined" && localStorage.getItem("supabase_anon_key")) ||
    metaEnv.VITE_SUPABASE_ANON_KEY ||
    DEFAULT_KEY;

  return { url, key };
}

export function getSupabaseClient() {
  const { url, key } = getSupabaseConfig();
  if (url && key) {
    try {
      return createClient(url, key);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Fetch all portfolio data from relational Supabase tables
 */
export async function fetchPortfolioData(): Promise<PortfolioData | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const [profileRes, projectsRes, skillsRes, timelineRes] = await Promise.all([
      supabase.from("personal_profile").select("*").eq("id", "primary").single(),
      supabase.from("projects").select("*").order("sort_order", { ascending: true }),
      supabase.from("skills").select("*").order("sort_order", { ascending: true }),
      supabase.from("experience_timeline").select("*").order("sort_order", { ascending: true })
    ]);

    if (!profileRes.error && profileRes.data) {
      const p = profileRes.data;
      const profile: ProfileData = {
        name: p.name || "",
        headline: p.headline || "",
        bio: p.bio || "",
        email: p.email || "",
        githubUrl: p.github_url || "",
        linkedinUrl: p.linkedin_url || "",
        twitterUrl: p.twitter_url || "",
        collegeInfo: p.college_info || ""
      };

      const projects: Project[] = (projectsRes.data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        year: item.year,
        status: item.status,
        tagline: item.tagline,
        challenge: item.challenge,
        tech: Array.isArray(item.tech) ? item.tech : [],
        githubUrl: item.github_url,
        liveUrl: item.live_url
      }));

      const rawSkills: SkillCategory[] = (skillsRes.data || []).map((item: any) => ({
        title: item.title,
        iconName: item.icon_name,
        skills: Array.isArray(item.skills_list)
          ? Array.from(new Set(item.skills_list.map((s: string) => String(s).trim()).filter(Boolean)))
          : []
      }));

      // Filter out duplicate categories by title and discard empty categories
      const seenTitles = new Set<string>();
      const skills: SkillCategory[] = [];
      for (const s of rawSkills) {
        if (s.title && !seenTitles.has(s.title.toLowerCase()) && s.skills.length > 0) {
          seenTitles.add(s.title.toLowerCase());
          skills.push(s);
        }
      }

      const timeline: TimelineItem[] = (timelineRes.data || []).map((item: any) => ({
        id: item.id,
        type: item.type,
        role: item.role,
        organization: item.organization,
        period: item.period,
        location: item.location,
        description: Array.isArray(item.description) ? item.description : [],
        skills: Array.isArray(item.skills) ? item.skills : []
      }));

      return { profile, projects, skills, timeline };
    }
  } catch (err) {
    console.error("Supabase multi-table fetch error:", err);
  }

  return null;
}

/**
 * Direct CRUD: Update Personal Profile Table
 */
export async function dbUpdateProfile(profile: ProfileData): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { error } = await supabase.from("personal_profile").upsert({
    id: "primary",
    name: profile.name,
    headline: profile.headline,
    bio: profile.bio,
    email: profile.email,
    github_url: profile.githubUrl,
    linkedin_url: profile.linkedinUrl,
    twitter_url: profile.twitterUrl,
    college_info: profile.collegeInfo,
    updated_at: new Date().toISOString()
  });

  if (error) console.error("Error updating personal_profile:", error);
  return !error;
}

/**
 * Direct CRUD: Upsert a Project into projects table
 */
export async function dbUpsertProject(project: Project, sortOrder = 1): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { error } = await supabase.from("projects").upsert({
    id: project.id,
    title: project.title,
    year: project.year,
    status: project.status,
    tagline: project.tagline,
    challenge: project.challenge,
    tech: project.tech,
    github_url: project.githubUrl,
    live_url: project.liveUrl || null,
    sort_order: sortOrder
  });

  if (error) console.error("Error upserting project:", error);
  return !error;
}

/**
 * Direct CRUD: Delete a Project from projects table
 */
export async function dbDeleteProject(projectId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) console.error("Error deleting project:", error);
  return !error;
}

/**
 * Direct CRUD: Upsert Skills list into skills table
 */
export async function dbUpdateSkills(skills: SkillCategory[]): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  // Clear existing skill category rows to prevent stale or duplicate entries
  await supabase.from("skills").delete().neq("id", "_empty_");

  const payload = skills.map((s, idx) => ({
    id: `skill-cat-${idx + 1}`,
    title: s.title,
    icon_name: s.iconName,
    skills_list: s.skills,
    sort_order: idx + 1
  }));

  const { error } = await supabase.from("skills").upsert(payload);
  if (error) console.error("Error updating skills:", error);
  return !error;
}

/**
 * Direct CRUD: Upsert a Timeline Item into experience_timeline table
 */
export async function dbUpsertTimeline(item: TimelineItem, sortOrder = 1): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { error } = await supabase.from("experience_timeline").upsert({
    id: item.id,
    type: item.type,
    role: item.role,
    organization: item.organization,
    period: item.period,
    location: item.location,
    description: item.description,
    skills: item.skills || [],
    sort_order: sortOrder
  });

  if (error) console.error("Error upserting timeline item:", error);
  return !error;
}

/**
 * Direct CRUD: Delete a Timeline Item from experience_timeline table
 */
export async function dbDeleteTimeline(timelineId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { error } = await supabase.from("experience_timeline").delete().eq("id", timelineId);
  if (error) console.error("Error deleting timeline item:", error);
  return !error;
}

/**
 * Bulk save all portfolio data across all tables
 */
export async function savePortfolioData(newData: PortfolioData): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { profile, projects, skills, timeline } = newData;

    const p1 = dbUpdateProfile(profile);

    const projectsPayload = projects.map((p, idx) => ({
      id: p.id,
      title: p.title,
      year: p.year,
      status: p.status,
      tagline: p.tagline,
      challenge: p.challenge,
      tech: p.tech,
      github_url: p.githubUrl,
      live_url: p.liveUrl || null,
      sort_order: idx + 1
    }));
    const p2 = supabase.from("projects").upsert(projectsPayload);

    const p3 = dbUpdateSkills(skills);

    const timelinePayload = timeline.map((t, idx) => ({
      id: t.id,
      type: t.type,
      role: t.role,
      organization: t.organization,
      period: t.period,
      location: t.location,
      description: t.description,
      skills: t.skills || [],
      sort_order: idx + 1
    }));
    const p4 = supabase.from("experience_timeline").upsert(timelinePayload);

    await Promise.all([p1, p2, p3, p4]);
    return true;
  } catch (err) {
    console.error("Failed to save to database tables:", err);
    return false;
  }
}

/**
 * Fetch the active security passphrase directly from Supabase DB
 */
export async function fetchSecurityPhrase(): Promise<string> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("personal_profile")
        .select("security_phrase")
        .eq("id", "primary")
        .single();

      if (!error && data?.security_phrase) {
        return data.security_phrase;
      }
    } catch (err) {
      console.error("Error fetching security_phrase from DB:", err);
    }
  }

  return "";
}

/**
 * Update the security passphrase directly in Supabase DB
 */
export async function dbUpdateSecurityPhrase(newPhrase: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (typeof window !== "undefined") {
    localStorage.setItem("admin_security_passphrase", newPhrase);
  }

  if (supabase) {
    try {
      const { error } = await supabase
        .from("personal_profile")
        .update({ security_phrase: newPhrase })
        .eq("id", "primary");

      if (error) console.error("Error updating security_phrase in DB:", error);
      return !error;
    } catch (err) {
      console.error("Failed to update security_phrase:", err);
      return false;
    }
  }

  return true;
}

/**
 * Wipe all data from all Supabase cloud database tables
 */
export async function dbWipeAllData(): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (typeof window !== "undefined") {
    localStorage.removeItem("portfolio_cms_data");
  }

  if (supabase) {
    try {
      // 1. Delete all projects
      await supabase.from("projects").delete().neq("id", "_empty_");

      // 2. Delete all skills
      await supabase.from("skills").delete().neq("id", "_empty_");

      // 3. Delete all experience timeline milestones
      await supabase.from("experience_timeline").delete().neq("id", "_empty_");

      // Fetch existing security phrase to preserve it
      const currentPhrase = await fetchSecurityPhrase();

      // 4. Reset personal profile to blank strings while preserving the security phrase
      await supabase.from("personal_profile").upsert({
        id: "primary",
        name: "Developer Name",
        headline: "Software Engineer",
        bio: "Brief developer bio...",
        email: "your.email@domain.com",
        github_url: "https://github.com",
        linkedin_url: "https://linkedin.com",
        twitter_url: "https://twitter.com",
        college_info: "Your College / University • Location",
        security_phrase: currentPhrase || "",
        updated_at: new Date().toISOString()
      });

      return true;
    } catch (err) {
      console.error("Error wiping database data:", err);
      return false;
    }
  }

  return true;
}

/**
 * Record failed admin login attempt directly into Supabase security_audit_logs table
 */
export async function dbRecordFailedAttempt(attemptedPhrase: string, status = "REJECTED"): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    let clientIp = "Unknown";
    try {
      const ipRes = await fetch("https://api.ipify.org?format=json", { signal: AbortSignal.timeout(3000) });
      if (ipRes.ok) {
        const json = await ipRes.json();
        clientIp = json.ip || "Unknown";
      }
    } catch {
      // Ignore IP timeout
    }

    const { error } = await supabase.from("security_audit_logs").insert({
      attempt_type: "FAILED_PASSPHRASE",
      attempted_value: attemptedPhrase,
      ip_address: clientIp,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "Unknown",
      status: status,
      attempted_at: new Date().toISOString()
    });

    if (error) {
      console.warn("Could not log to security_audit_logs table:", error.message);
    }
    return !error;
  } catch (err) {
    console.error("Failed to log security attempt to DB:", err);
    return false;
  }
}

export interface CheckoutRecord {
  id?: string;
  session_id?: string;
  action_type?: string;
  page_path?: string;
  referrer?: string;
  user_agent?: string;
  browser?: string;
  os?: string;
  device_type?: string;
  screen_resolution?: string;
  language?: string;
  ip_address?: string;
  created_at?: string;
}

function parseClientEnvironment() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      browser: "Unknown",
      os: "Unknown",
      deviceType: "Unknown",
      screenResolution: "Unknown",
      language: "Unknown",
      referrer: "Direct",
      pagePath: "/"
    };
  }

  const ua = navigator.userAgent || "";
  let browser = "Other";
  if (ua.includes("Firefox/")) browser = "Firefox";
  else if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("Chrome/") && !ua.includes("Edg/")) browser = "Chrome";
  else if (ua.includes("Safari/") && !ua.includes("Chrome/")) browser = "Safari";
  else if (ua.includes("OPR/") || ua.includes("Opera/")) browser = "Opera";

  let os = "Other";
  if (ua.includes("Win")) os = "Windows";
  else if (ua.includes("Mac") && !ua.includes("iPhone") && !ua.includes("iPad")) os = "macOS";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("Linux")) os = "Linux";

  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
  const isTablet = /iPad|Tablet/i.test(ua);
  const deviceType = isTablet ? "Tablet" : isMobile ? "Mobile" : "Desktop";

  const screenResolution = window.screen ? `${window.screen.width}x${window.screen.height}` : "Unknown";
  const language = navigator.language || "Unknown";
  const referrer = document.referrer || "Direct";
  const pagePath = window.location.pathname + window.location.hash || "/";

  return { browser, os, deviceType, screenResolution, language, referrer, pagePath };
}

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "server-session";
  let sessionId = sessionStorage.getItem("portfolio_visitor_session_id");
  if (!sessionId) {
    sessionId = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem("portfolio_visitor_session_id", sessionId);
  }
  return sessionId;
}

/**
 * Record every visitor checkout / page view directly in Supabase DB
 */
export async function recordPortfolioCheckout(
  actionType = "PAGE_VISIT",
  customPath?: string
): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const env = parseClientEnvironment();
    const sessionId = getOrCreateSessionId();

    let clientIp = "Unknown";
    try {
      const ipRes = await fetch("https://api.ipify.org?format=json", {
        signal: AbortSignal.timeout(2500)
      });
      if (ipRes.ok) {
        const json = await ipRes.json();
        clientIp = json.ip || "Unknown";
      }
    } catch {
      // Non-blocking fallback
    }

    const payload: CheckoutRecord = {
      session_id: sessionId,
      action_type: actionType,
      page_path: customPath || env.pagePath,
      referrer: env.referrer,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "Unknown",
      browser: env.browser,
      os: env.os,
      device_type: env.deviceType,
      screen_resolution: env.screenResolution,
      language: env.language,
      ip_address: clientIp,
      created_at: new Date().toISOString()
    };

    // Primary: Insert into portfolio_checkouts
    const { error } = await supabase.from("portfolio_checkouts").insert(payload);

    if (error) {
      // Fallback: If portfolio_checkouts table not created yet, log to security_audit_logs
      await supabase.from("security_audit_logs").insert({
        attempt_type: `CHECKOUT_${actionType}`,
        attempted_value: `${env.browser} on ${env.os} (${env.deviceType}) - Path: ${payload.page_path}`,
        ip_address: clientIp,
        user_agent: payload.user_agent,
        status: "RECORDED",
        attempted_at: payload.created_at
      });
    }

    return true;
  } catch (err) {
    console.error("Failed to record portfolio checkout in DB:", err);
    return false;
  }
}

/**
 * Fetch recorded portfolio checkouts for Admin analytics
 */
export async function fetchPortfolioCheckouts(limit = 100): Promise<CheckoutRecord[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("portfolio_checkouts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!error && data) {
      return data;
    }
  } catch {
    // Fallback to security audit logs
  }

  try {
    const { data } = await supabase
      .from("security_audit_logs")
      .select("*")
      .order("attempted_at", { ascending: false })
      .limit(limit);

    if (data) {
      return data.map((item: any) => ({
        id: item.id,
        session_id: item.id,
        action_type: item.attempt_type,
        page_path: item.attempted_value,
        ip_address: item.ip_address,
        user_agent: item.user_agent,
        created_at: item.attempted_at
      }));
    }
  } catch {
    // Ignore
  }

  return [];
}

