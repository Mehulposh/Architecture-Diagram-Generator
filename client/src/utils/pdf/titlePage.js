import {
  PAGE_WIDTH,
  PAGE_HEIGHT,
  COLORS,
  FONT,
} from "./pdfConstants";

function formatDate() {
  return new Date().toLocaleString(undefined, {
    dateStyle: "long",
    timeStyle: "short",
  });
}

export function addTitlePage(doc, state) {
  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, "F");

  // Logo / Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(FONT.title);
  doc.setTextColor(...COLORS.white);

  doc.text("Blueprint", PAGE_WIDTH / 2, 45, {
    align: "center",
  });

  // Project Name
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.amber);

  doc.text(
    state.projectName || "Untitled Architecture",
    PAGE_WIDTH / 2,
    60,
    {
      align: "center",
    }
  );

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.lightGrey);

  doc.text(
    "AI Generated Software Architecture Documentation",
    PAGE_WIDTH / 2,
    72,
    {
      align: "center",
    }
  );

  // Metadata
  const metadata = [
    ["Generated", formatDate()],
    [
      "Architecture Style",
      state.architectureStyle || "Not specified",
    ],
    [
      "Components",
      String(state.nodes?.length || 0),
    ],
    [
      "User Flows",
      String(state.userFlows?.length || 0),
    ],
    [
      "Database Entities",
      String(state.erEntities?.length || 0),
    ],
  ];

  let y = 110;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.amber);

  doc.text("Project Summary", 30, y);

  y += 12;

  metadata.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.white);
    doc.text(`${label}:`, 30, y);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.lightGrey);
    doc.text(value, 85, y);

    y += 10;
  });

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.lightGrey);

  doc.text(
    "Generated using Blueprint AI Architecture Generator",
    PAGE_WIDTH / 2,
    PAGE_HEIGHT - 18,
    {
      align: "center",
    }
  );
}