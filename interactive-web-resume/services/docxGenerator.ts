import * as docx from "docx";
import { ResumeData } from "../types";

const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, TabStopType, TabStopPosition, BorderStyle } = docx;

// Constants for styling to match the "LaTeX" look
const FONT_FAMILY = "Times New Roman"; // Standard ATS font, similar serif style to Merriweather
const TITLE_SIZE = 48; // 24pt
const SECTION_TITLE_SIZE = 24; // 12pt
const BODY_SIZE = 21; // 10.5pt
const SPACING_AFTER_SECTION = 120; // Space after section title
const SPACING_AFTER_ITEM = 100; // Space after an item block

// Helper to create a section title with a bottom border (Exact match to web preview)
const createSectionTitle = (title: string) => {
  return new Paragraph({
    text: title.toUpperCase(),
    heading: HeadingLevel.HEADING_2,
    border: {
      bottom: {
        color: "000000",
        space: 1,
        style: BorderStyle.SINGLE,
        size: 6,
      },
    },
    spacing: {
      before: 240, // More space before section
      after: 80, // Tighter space after line
    },
    run: {
      font: FONT_FAMILY,
      bold: true,
      size: SECTION_TITLE_SIZE,
      tracking: 50, // Slight letter spacing for uppercase
    },
  });
};

// Helper for bullet points
const createBullet = (text: string) => {
  return new Paragraph({
    text: text,
    bullet: {
      level: 0,
    },
    spacing: {
      before: 30, // Tight bullets
      after: 30,
    },
    run: {
        font: FONT_FAMILY,
        size: BODY_SIZE,
    }
  });
};

// Helper for row with right-aligned date
const createTwoColumnRow = (leftText: string, rightText: string, isBold = false, isItalic = false) => {
    return new Paragraph({
        children: [
          new TextRun({ 
              text: leftText, 
              bold: isBold, 
              italics: isItalic,
              font: FONT_FAMILY, 
              size: BODY_SIZE 
            }),
          new TextRun({
            text: `\t${rightText}`,
            bold: isBold,
            italics: isItalic,
            font: FONT_FAMILY,
            size: BODY_SIZE
          }),
        ],
        tabStops: [
          {
            type: TabStopType.RIGHT,
            position: TabStopPosition.MAX,
          },
        ],
        spacing: {
            before: 40,
            after: 0
        }
      });
}

export const generateDocx = async (data: ResumeData) => {
  const children: docx.Paragraph[] = [];

  // --- Header ---
  children.push(
    new Paragraph({
      text: (data.fullName || "Your Name").toUpperCase(),
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      run: {
        font: FONT_FAMILY,
        bold: true,
        size: TITLE_SIZE,
        tracking: 40,
      },
    })
  );

  // Address Line
  const addressLine = [data.city, data.state].filter(Boolean).join(", ");
  if (addressLine) {
    children.push(
        new Paragraph({
            text: addressLine,
            alignment: AlignmentType.CENTER,
            spacing: { after: 40 },
            run: { font: FONT_FAMILY, size: BODY_SIZE }
        })
    );
  }

  // Contact Info Line (Phone | Email | LinkedIn | GitHub)
  const contactParts = [
      data.phone,
      data.email,
      data.linkedin ? data.linkedin.replace('https://', '').replace('www.', '') : null,
      data.github ? data.github.replace('https://', '').replace('www.', '') : null,
      data.portfolio ? data.portfolio.replace('https://', '').replace('www.', '') : null
  ].filter(Boolean);

  if (contactParts.length > 0) {
      children.push(
        new Paragraph({
            text: contactParts.join(" | "),
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }, // Space after header before first section
            run: { font: FONT_FAMILY, size: BODY_SIZE }
        })
      );
  }


  // --- Education ---
  if (data.education && data.education.length > 0) {
    children.push(createSectionTitle("Education"));
    data.education.forEach((edu) => {
      // Degree & Date (Bold)
      children.push(createTwoColumnRow(edu.degree, `${edu.startDate ? edu.startDate + " – " : ""}${edu.endDate}`, true, false));
      // Institution & Score (Italic)
      children.push(createTwoColumnRow(edu.institution, edu.score, false, true));
      // Location (Normal)
      if(edu.location) {
        children.push(
            new Paragraph({
                text: edu.location,
                run: { font: FONT_FAMILY, size: 18, color: "555555" }, // Slightly smaller/grey
                spacing: { after: 60 }
            })
        );
      } else {
        children.push(new Paragraph({ text: "", spacing: { after: 60 } }));
      }
    });
  }

  // --- Technical Skills ---
  if (data.technicalSkills?.tools || data.technicalSkills?.skills) {
    children.push(createSectionTitle("Technical Skills"));
    
    if (data.technicalSkills.tools) {
      children.push(new Paragraph({
        children: [
            new TextRun({ text: "Developer Tools: ", bold: true, font: FONT_FAMILY, size: BODY_SIZE }),
            new TextRun({ text: data.technicalSkills.tools, font: FONT_FAMILY, size: BODY_SIZE })
        ],
        spacing: { after: 40 }
      }));
    }
    if (data.technicalSkills.skills) {
      children.push(new Paragraph({
        children: [
            new TextRun({ text: "Skills: ", bold: true, font: FONT_FAMILY, size: BODY_SIZE }),
            new TextRun({ text: data.technicalSkills.skills, font: FONT_FAMILY, size: BODY_SIZE })
        ],
        spacing: { after: 40 }
      }));
    }
  }

  // --- Internships ---
  if (data.internships && data.internships.length > 0) {
    children.push(createSectionTitle("Internships"));
    data.internships.forEach((intern) => {
      // Company & Date
      children.push(createTwoColumnRow(intern.company, `${intern.startDate} – ${intern.endDate}`, true, false));
      // Role & Location
      children.push(createTwoColumnRow(intern.role, intern.location, false, true));
      
      // Bullets
      if (Array.isArray(intern.points)) {
        intern.points.forEach((point) => children.push(createBullet(point)));
      }
      children.push(new Paragraph({ text: "", spacing: { after: SPACING_AFTER_ITEM } })); // Spacer
    });
  }

  // --- Projects ---
  if (data.projects && data.projects.length > 0) {
    children.push(createSectionTitle("Projects"));
    data.projects.forEach((proj) => {
      // Name (Tech) & Date
      const nameText = proj.technologies ? `${proj.name} (${proj.technologies})` : proj.name;
      
      children.push(
        new Paragraph({
            children: [
              new TextRun({ text: proj.name, bold: true, font: FONT_FAMILY, size: BODY_SIZE }),
              new TextRun({ text: proj.technologies ? ` (${proj.technologies})` : "", italics: true, font: FONT_FAMILY, size: BODY_SIZE }),
              new TextRun({
                text: `\t${proj.startDate}`,
                bold: true,
                font: FONT_FAMILY,
                size: BODY_SIZE
              }),
            ],
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            spacing: { before: 40, after: 0 }
        })
      );
      
      if (Array.isArray(proj.points)) {
        proj.points.forEach((point) => children.push(createBullet(point)));
      }
      children.push(new Paragraph({ text: "", spacing: { after: SPACING_AFTER_ITEM } })); // Spacer
    });
  }

  // --- Achievements ---
  if (data.achievements && data.achievements.length > 0) {
    children.push(createSectionTitle("Achievement"));
    data.achievements.forEach((ach) => {
      children.push(new Paragraph({ 
          text: ach, 
          font: FONT_FAMILY, 
          size: BODY_SIZE,
          spacing: { after: 60 }
      }));
    });
  }

  // --- Certificates ---
  if (data.certificates && data.certificates.length > 0) {
    children.push(createSectionTitle("Certificates"));
    data.certificates.forEach((cert) => {
        children.push(createTwoColumnRow(cert.name, cert.date, true, false));
        children.push(new Paragraph({ 
            text: cert.issuer, 
            italics: true, 
            font: FONT_FAMILY, 
            size: BODY_SIZE, 
            spacing: { after: 100 } 
        }));
    });
  }

  // --- Extracurricular ---
  if (data.extracurricular && data.extracurricular.length > 0) {
    children.push(createSectionTitle("Extracurricular"));
    data.extracurricular.forEach((extra) => {
      children.push(createTwoColumnRow(extra.organization, `${extra.startDate} – ${extra.endDate}`, true, false));
      children.push(new Paragraph({ 
          text: extra.role, 
          italics: true, 
          font: FONT_FAMILY, 
          size: BODY_SIZE 
      }));
      if (Array.isArray(extra.points)) {
        extra.points.forEach((point) => children.push(createBullet(point)));
      }
      children.push(new Paragraph({ text: "", spacing: { after: SPACING_AFTER_ITEM } })); // Spacer
    });
  }

  // Generate and download
  const doc = new Document({
    creator: "ATS Resume Builder",
    title: `${data.fullName} Resume`,
    sections: [
      {
        properties: {
            page: {
                margin: {
                    top: 720, // 0.5 inch (Twips)
                    right: 720,
                    bottom: 720,
                    left: 720,
                }
            }
        },
        children: children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${data.fullName.replace(/\s+/g, "_")}_Resume.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};