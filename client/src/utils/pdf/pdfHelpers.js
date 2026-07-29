import {
  PAGE_HEIGHT,
  PAGE_WIDTH,
  MARGIN,
  CONTENT_WIDTH,
  COLORS,
  FONT,
} from "./pdfConstants";

export function addHeading(doc, text, y) {
  if (y > PAGE_HEIGHT - MARGIN - 10) {
    doc.addPage();
    y = MARGIN;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(FONT.heading);
  doc.setTextColor(...COLORS.navy);

  doc.text(text, MARGIN, y);

  doc.setDrawColor(...COLORS.amber);
  doc.setLineWidth(0.6);

  doc.line(
    MARGIN,
    y + 2,
    PAGE_WIDTH - MARGIN,
    y + 2
  );

  doc.setFont("helvetica", "normal");

  return y + 11;
}

export function addSubHeading(doc, text, y) {
  if (y > PAGE_HEIGHT - MARGIN - 8) {
    doc.addPage();
    y = MARGIN;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(FONT.subHeading);
  doc.setTextColor(...COLORS.amber);

  doc.text(text.toUpperCase(), MARGIN, y);

  doc.setFont("helvetica", "normal");

  return y + 6.5;
}

export function addWrappedText(
  doc,
  text,
  y,
  fontSize = FONT.body
) {
  if (!text) return y;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(fontSize);
  doc.setTextColor(...COLORS.body);

  const lines = doc.splitTextToSize(
    text,
    CONTENT_WIDTH
  );

  const lineHeight = fontSize * 0.5;

  for (const line of lines) {
    if (y > PAGE_HEIGHT - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }

    doc.text(line, MARGIN, y);

    y += lineHeight;
  }

  return y;
}

export function addBulletList(
  doc,
  items,
  y,
  fontSize = FONT.body
) {
  for (const item of items) {
    y = addWrappedText(
      doc,
      `• ${item}`,
      y,
      fontSize
    );
  }

  return y + 3;
}

export function addImage(doc, capture, y) {
  if (!capture) return y;

  const {
    dataUrl,
    width,
    height,
  } = capture;

  const ratio = height / width;

  let imgWidth = CONTENT_WIDTH;
  let imgHeight = imgWidth * ratio;

  const maxHeight =
    PAGE_HEIGHT - MARGIN * 2;

  if (imgHeight > maxHeight) {
    imgHeight = maxHeight;
    imgWidth = imgHeight / ratio;
  }

  if (y + imgHeight > PAGE_HEIGHT - MARGIN) {
    doc.addPage();
    y = MARGIN;
  }

  const x =
    MARGIN +
    (CONTENT_WIDTH - imgWidth) / 2;

  doc.addImage(
    dataUrl,
    "PNG",
    x,
    y,
    imgWidth,
    imgHeight
  );

  return y + imgHeight + 8;
}