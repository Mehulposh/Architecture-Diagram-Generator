import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import useDiagramStore from '../store/useDiagramStore';
import { resolveComponentRefs } from './resolveRefs';

const PAGE_WIDTH = 210; // A4, mm
const PAGE_HEIGHT = 297;
const MARGIN = 18;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const NAVY = [11, 30, 61];
const AMBER = [178, 121, 26]; // darkened for print legibility
const BODY_GREY = [55, 55, 55];

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}

// Switches to the requested view (if not already there), waits for React
// Flow to finish laying out and fitting the diagram, then captures the
// canvas as a PNG data URL along with its on-screen aspect ratio so it can
// be scaled correctly on the page.
async function captureView(view) {
  const { diagramView, setDiagramView } = useDiagramStore.getState();
  if (diagramView !== view) setDiagramView(view);

  // Give React (state update + commit) and React Flow (fitView, which runs
  // on its own layout pass) a few frames to settle before we screenshot.
  await nextFrame();
  await nextFrame();
  await new Promise((r) => setTimeout(r, 300));

  const el = document.querySelector('.react-flow');
  if (!el) return null;

  const rect = el.getBoundingClientRect();
  const dataUrl = await toPng(el, { backgroundColor: '#0B1E3D', pixelRatio: 2 });
  return { dataUrl, width: rect.width, height: rect.height };
}

function addHeading(doc, text, y) {
  if (y > PAGE_HEIGHT - MARGIN - 10) {
    doc.addPage();
    y = MARGIN;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...NAVY);
  doc.text(text, MARGIN, y);
  doc.setDrawColor(...AMBER);
  doc.setLineWidth(0.6);
  doc.line(MARGIN, y + 2, PAGE_WIDTH - MARGIN, y + 2);
  doc.setFont('helvetica', 'normal');
  return y + 11;
}

function addSubheading(doc, text, y) {
  if (y > PAGE_HEIGHT - MARGIN - 8) {
    doc.addPage();
    y = MARGIN;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...AMBER);
  doc.text(text.toUpperCase(), MARGIN, y);
  doc.setFont('helvetica', 'normal');
  return y + 6.5;
}

function addWrappedText(doc, text, y, fontSize = 10.5) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(fontSize);
  doc.setTextColor(...BODY_GREY);
  const lines = doc.splitTextToSize(text, CONTENT_WIDTH);
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

// Renders either a bullet list (if the resolved text is already formatted as
// one, e.g. componentDescriptions) or a plain wrapped paragraph.
function addDocText(doc, raw, resolutionNodes, y) {
  if (!raw) return y;
  const resolved = resolveComponentRefs(raw, resolutionNodes);
  const lines = resolved.split('\n').filter(Boolean);
  const isBulletList = lines.length > 1 && lines.every((l) => l.trim().startsWith('- '));

  if (isBulletList) {
    for (const line of lines) {
      y = addWrappedText(doc, `\u2022  ${line.replace(/^-\s*/, '')}`, y);
    }
    return y + 3;
  }
  return addWrappedText(doc, resolved, y) + 3;
}

function addImage(doc, capture, y) {
  if (!capture) return y;
  const { dataUrl, width, height } = capture;
  const ratio = height / width;
  let imgWidth = CONTENT_WIDTH;
  let imgHeight = imgWidth * ratio;
  const maxHeight = PAGE_HEIGHT - MARGIN * 2;
  if (imgHeight > maxHeight) {
    imgHeight = maxHeight;
    imgWidth = imgHeight / ratio;
  }
  if (y + imgHeight > PAGE_HEIGHT - MARGIN) {
    doc.addPage();
    y = MARGIN;
  }
  const x = MARGIN + (CONTENT_WIDTH - imgWidth) / 2;
  doc.addImage(dataUrl, 'PNG', x, y, imgWidth, imgHeight);
  return y + imgHeight + 8;
}

export async function exportDocumentationPdf() {
  const state = useDiagramStore.getState();
  const originalView = state.diagramView;

  const hasArchitecture = state.nodes.length > 0;
  const hasUserFlow = state.userFlowNodes.length > 0;
  const hasEr = state.erEntities.length > 0;

  if (!hasArchitecture && !hasUserFlow && !hasEr) {
    throw new Error('Nothing to export yet — generate at least one diagram first.');
  }

  // Capture whichever diagrams exist. This visibly flips through the
  // Architecture / User Flow / ER tabs while exporting — expected, since
  // each screenshot has to actually be on screen to be captured.
  const architectureCapture = hasArchitecture ? await captureView('architecture') : null;
  const userFlowCapture = hasUserFlow ? await captureView('userFlow') : null;
  const erCapture = hasEr ? await captureView('er') : null;

  useDiagramStore.getState().setDiagramView(originalView);
  await nextFrame();

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  // --- Title page ---
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(30);
  doc.setTextColor(255, 255, 255);
  doc.text('Blueprint', PAGE_WIDTH / 2, 130, { align: 'center' });
  doc.setFontSize(15);
  doc.setTextColor(242, 169, 59);
  doc.text(state.projectName || 'Untitled architecture', PAGE_WIDTH / 2, 146, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(215, 215, 215);
  doc.text('Generated project documentation', PAGE_WIDTH / 2, 156, { align: 'center' });

  doc.addPage();
  let y = MARGIN;

  // --- Architecture ---
  if (hasArchitecture) {
    y = addHeading(doc, 'Architecture', y);
    y = addImage(doc, architectureCapture, y);

    const docs = state.documentation || {};
    const sections = [
      ['System Overview', docs.systemOverview],
      ['Component Descriptions', docs.componentDescriptions],
      ['API Flow', docs.apiFlow],
      ['Database Design', docs.databaseDesign],
      ['Deployment Guidelines', docs.deploymentGuidelines],
    ];
    for (const [title, raw] of sections) {
      if (!raw) continue;
      y = addSubheading(doc, title, y);
      y = addDocText(doc, raw, state.nodes, y);
    }
  }

  // --- User Flow ---
  if (hasUserFlow) {
    doc.addPage();
    y = MARGIN;
    y = addHeading(doc, 'User Flow', y);
    y = addImage(doc, userFlowCapture, y);

    if (state.userFlowOverview) {
      y = addSubheading(doc, 'User Flow Overview', y);
      y = addDocText(doc, state.userFlowOverview, state.userFlowNodes, y);
    }
  }

  // --- ER Diagram ---
  if (hasEr) {
    doc.addPage();
    y = MARGIN;
    y = addHeading(doc, 'ER Diagram', y);
    y = addImage(doc, erCapture, y);

    // erOverview/databaseDesignDecisions reference entities via [[id]]
    // tokens the same way architecture docs reference nodes — reshape
    // entities into the {id, data:{label}} shape the resolver expects.
    const erResolutionNodes = state.erEntities.map((e) => ({ id: e.id, data: { label: e.name } }));

    if (state.erOverview) {
      y = addSubheading(doc, 'ER Diagram Overview', y);
      y = addDocText(doc, state.erOverview, erResolutionNodes, y);
    }

    if (state.erRelationships.length > 0) {
      y = addSubheading(doc, 'Relationship Summary', y);
      const byId = Object.fromEntries(state.erEntities.map((e) => [e.id, e.name]));
      for (const rel of state.erRelationships) {
        const line = `${byId[rel.source] || rel.source}  ->  ${byId[rel.target] || rel.target}   (${rel.cardinality}${rel.label ? `, ${rel.label}` : ''})`;
        y = addWrappedText(doc, line, y, 9.5);
      }
      y += 3;
    }

    if (state.databaseDesignDecisions) {
      y = addSubheading(doc, 'Database Design Decisions', y);
      y = addDocText(doc, state.databaseDesignDecisions, erResolutionNodes, y);
    }
  }

  const filename = (state.projectName || 'architecture').replace(/[^\w\- ]+/g, '').trim() || 'architecture';
  doc.save(`${filename}.pdf`);
}