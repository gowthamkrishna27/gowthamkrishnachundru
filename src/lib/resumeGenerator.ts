import { PortfolioData } from "../types";

/**
 * Generate standard Clean Markdown Resume from PortfolioData
 */
export function generateResumeMarkdown(data: PortfolioData): string {
  const { profile, projects, skills, timeline } = data;

  const experienceItems = timeline.filter((t) => t.type === "experience");
  const educationItems = timeline.filter((t) => t.type === "education");

  let md = `# ${profile.name || "Gowtham Krishna"}\n`;
  md += `**${profile.headline || "Software Engineer"}**\n`;
  md += `${profile.email ? `Email: ${profile.email} | ` : ""}`;
  md += `${profile.collegeInfo ? `${profile.collegeInfo} | ` : ""}`;
  md += `${profile.githubUrl ? `GitHub: ${profile.githubUrl} | ` : ""}`;
  md += `${profile.linkedinUrl ? `LinkedIn: ${profile.linkedinUrl}` : ""}\n\n`;

  if (profile.bio) {
    md += `## Summary\n${profile.bio}\n\n`;
  }

  if (skills && skills.length > 0) {
    md += `## Technical Skills\n`;
    for (const cat of skills) {
      if (cat.skills && cat.skills.length > 0) {
        md += `- **${cat.title}**: ${cat.skills.join(", ")}\n`;
      }
    }
    md += `\n`;
  }

  if (experienceItems.length > 0) {
    md += `## Experience\n`;
    for (const item of experienceItems) {
      md += `### ${item.role} - ${item.organization}\n`;
      md += `*${item.period} | ${item.location}*\n\n`;
      if (item.description && item.description.length > 0) {
        for (const bullet of item.description) {
          md += `- ${bullet}\n`;
        }
      }
      if (item.skills && item.skills.length > 0) {
        md += `*Technologies:* ${item.skills.join(", ")}\n`;
      }
      md += `\n`;
    }
  }

  if (projects && projects.length > 0) {
    md += `## Featured Projects\n`;
    for (const proj of projects) {
      md += `### ${proj.title} (${proj.year}) - ${proj.status}\n`;
      if (proj.tagline) md += `*${proj.tagline}*\n\n`;
      if (proj.challenge) md += `${proj.challenge}\n\n`;
      if (proj.tech && proj.tech.length > 0) {
        md += `- **Stack**: ${proj.tech.join(", ")}\n`;
      }
      if (proj.githubUrl) md += `- **Source Code**: ${proj.githubUrl}\n`;
      if (proj.liveUrl) md += `- **Live Demo**: ${proj.liveUrl}\n`;
      md += `\n`;
    }
  }

  if (educationItems.length > 0) {
    md += `## Education\n`;
    for (const edu of educationItems) {
      md += `### ${edu.role} - ${edu.organization}\n`;
      md += `*${edu.period} | ${edu.location}*\n\n`;
      if (edu.description && edu.description.length > 0) {
        for (const bullet of edu.description) {
          md += `- ${bullet}\n`;
        }
      }
      md += `\n`;
    }
  }

  return md;
}

/**
 * Trigger download of Markdown file
 */
export function downloadResumeMarkdownFile(data: PortfolioData) {
  const content = generateResumeMarkdown(data);
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const fileName = `${(data.profile.name || "Gowtham_Krishna").replace(/\s+/g, "_")}_Resume.md`;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Trigger download of JSON Resume file
 */
export function downloadResumeJSONFile(data: PortfolioData) {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const fileName = `${(data.profile.name || "Gowtham_Krishna").replace(/\s+/g, "_")}_Resume.json`;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Open a beautifully formatted, print-optimized document ready to Save as PDF
 */
export function printOrDownloadResumePDF(data: PortfolioData) {
  const { profile, projects, skills, timeline } = data;
  const experienceItems = timeline.filter((t) => t.type === "experience");
  const educationItems = timeline.filter((t) => t.type === "education");

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to generate and download the resume PDF.");
    return;
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${profile.name || "Resume"} - Curriculum Vitae</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #18181b;
      background: #ffffff;
      line-height: 1.45;
      font-size: 10.5pt;
      padding: 36px 48px;
      max-width: 850px;
      margin: 0 auto;
    }
    
    @page {
      margin: 0;
      size: A4 portrait;
    }
    
    @media print {
      body {
        padding: 16mm 20mm;
        margin: 0;
        max-width: 100%;
      }
      .no-print {
        display: none !important;
      }
    }
    
    .header {
      border-bottom: 2px solid #18181b;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    
    .name {
      font-size: 22pt;
      font-weight: 700;
      letter-spacing: -0.5px;
      color: #09090b;
    }
    
    .headline {
      font-size: 11.5pt;
      font-weight: 600;
      color: #52525b;
      margin-top: 2px;
    }
    
    .contact-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 8px;
      font-size: 9pt;
      color: #71717a;
    }
    
    .contact-item a {
      color: #18181b;
      text-decoration: none;
    }
    
    .contact-item a:hover {
      text-decoration: underline;
    }
    
    .section {
      margin-bottom: 16px;
    }
    
    .section-title {
      font-size: 10pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #09090b;
      border-bottom: 1px solid #e4e4e7;
      padding-bottom: 3px;
      margin-bottom: 8px;
    }
    
    .summary-text {
      font-size: 9.5pt;
      color: #3f3f46;
      line-height: 1.5;
    }
    
    .skill-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 4px;
      font-size: 9.5pt;
    }
    
    .skill-category {
      color: #27272a;
    }
    
    .skill-category strong {
      color: #09090b;
    }
    
    .item {
      margin-bottom: 10px;
    }
    
    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }
    
    .item-title {
      font-size: 10.5pt;
      font-weight: 700;
      color: #09090b;
    }
    
    .item-org {
      font-size: 10pt;
      font-weight: 600;
      color: #52525b;
    }
    
    .item-date {
      font-size: 9pt;
      font-weight: 500;
      color: #71717a;
      font-variant-numeric: tabular-nums;
    }
    
    .item-location {
      font-size: 8.5pt;
      color: #a1a1aa;
    }
    
    .item-bullets {
      margin-top: 4px;
      padding-left: 18px;
      font-size: 9.2pt;
      color: #3f3f46;
    }
    
    .item-bullets li {
      margin-bottom: 2px;
    }
    
    .project-tech {
      font-size: 8.5pt;
      color: #52525b;
      margin-top: 2px;
      font-style: italic;
    }
    
    .print-bar {
      position: fixed;
      top: 12px;
      right: 12px;
      background: #18181b;
      color: #ffffff;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      border: none;
      display: flex;
      align-items: center;
      gap: 6px;
      z-index: 999;
    }
    
    .print-bar:hover {
      background: #27272a;
    }
  </style>
</head>
<body>
  <button class="print-bar no-print" onclick="window.print()">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
    Save as PDF / Print
  </button>

  <header class="header">
    <h1 class="name">${profile.name || "Gowtham Krishna"}</h1>
    <div class="headline">${profile.headline || "Software Engineer"}</div>
    <div class="contact-bar">
      ${profile.email ? `<div class="contact-item"><a href="mailto:${profile.email}">${profile.email}</a></div>` : ""}
      ${profile.collegeInfo ? `<div class="contact-item"><span>${profile.collegeInfo}</span></div>` : ""}
      ${profile.githubUrl ? `<div class="contact-item"><a href="${profile.githubUrl}" target="_blank">${profile.githubUrl.replace(/^https?:\/\//, '')}</a></div>` : ""}
      ${profile.linkedinUrl ? `<div class="contact-item"><a href="${profile.linkedinUrl}" target="_blank">${profile.linkedinUrl.replace(/^https?:\/\//, '')}</a></div>` : ""}
    </div>
  </header>

  ${
    profile.bio
      ? `
  <section class="section">
    <h2 class="section-title">Professional Summary</h2>
    <p class="summary-text">${profile.bio}</p>
  </section>
  `
      : ""
  }

  ${
    skills && skills.length > 0
      ? `
  <section class="section">
    <h2 class="section-title">Technical Expertise</h2>
    <div class="skill-grid">
      ${skills
        .filter((s) => s.skills && s.skills.length > 0)
        .map(
          (s) => `
        <div class="skill-category">
          <strong>${s.title}:</strong> ${s.skills.join(", ")}
        </div>
      `
        )
        .join("")}
    </div>
  </section>
  `
      : ""
  }

  ${
    experienceItems.length > 0
      ? `
  <section class="section">
    <h2 class="section-title">Experience</h2>
    ${experienceItems
      .map(
        (exp) => `
      <div class="item">
        <div class="item-header">
          <div>
            <span class="item-title">${exp.role}</span>
            ${exp.organization ? `<span class="item-org"> · ${exp.organization}</span>` : ""}
          </div>
          <span class="item-date">${exp.period}</span>
        </div>
        ${exp.location ? `<div class="item-location">${exp.location}</div>` : ""}
        ${
          exp.description && exp.description.length > 0
            ? `
          <ul class="item-bullets">
            ${exp.description.map((b) => `<li>${b}</li>`).join("")}
          </ul>
        `
            : ""
        }
      </div>
    `
      )
      .join("")}
  </section>
  `
      : ""
  }

  ${
    projects && projects.length > 0
      ? `
  <section class="section">
    <h2 class="section-title">Featured Projects</h2>
    ${projects
      .map(
        (proj) => `
      <div class="item">
        <div class="item-header">
          <div>
            <span class="item-title">${proj.title}</span>
            <span class="item-org"> · ${proj.status}</span>
          </div>
          <span class="item-date">${proj.year}</span>
        </div>
        ${proj.tagline ? `<div class="summary-text" style="font-size: 9pt; font-weight: 500;">${proj.tagline}</div>` : ""}
        ${proj.challenge ? `<div class="summary-text" style="font-size: 8.8pt; margin-top: 2px;">${proj.challenge}</div>` : ""}
        ${proj.tech && proj.tech.length > 0 ? `<div class="project-tech">Tech: ${proj.tech.join(", ")}</div>` : ""}
        <div style="font-size: 8.5pt; margin-top: 3px; display: flex; gap: 10px;">
          ${proj.githubUrl ? `<a href="${proj.githubUrl}" target="_blank" style="color: #0369a1; text-decoration: underline;">GitHub: ${proj.githubUrl}</a>` : ""}
          ${proj.liveUrl ? `<a href="${proj.liveUrl}" target="_blank" style="color: #047857; text-decoration: underline;">Live Demo: ${proj.liveUrl}</a>` : ""}
        </div>
      </div>
    `
      )
      .join("")}
  </section>
  `
      : ""
  }

  ${
    educationItems.length > 0
      ? `
  <section class="section">
    <h2 class="section-title">Education</h2>
    ${educationItems
      .map(
        (edu) => `
      <div class="item">
        <div class="item-header">
          <div>
            <span class="item-title">${edu.role}</span>
            ${edu.organization ? `<span class="item-org"> · ${edu.organization}</span>` : ""}
          </div>
          <span class="item-date">${edu.period}</span>
        </div>
        ${edu.location ? `<div class="item-location">${edu.location}</div>` : ""}
        ${
          edu.description && edu.description.length > 0
            ? `
          <ul class="item-bullets">
            ${edu.description.map((b) => `<li>${b}</li>`).join("")}
          </ul>
        `
            : ""
        }
      </div>
    `
      )
      .join("")}
  </section>
  `
      : ""
  }

  <script>
    // Automatically trigger print dialog after document is loaded
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.print();
      }, 400);
    });
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
