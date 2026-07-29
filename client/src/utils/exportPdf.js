import { jsPDF } from "jspdf";

import useDiagramStore from "../store/useDiagramStore";

import {
  captureArchitecture,
  captureUserFlows,
  captureERDiagram,
} from "./pdf/captureDiagram";

import { addTitlePage } from "./pdf/titlePage";
import { addArchitectureSection } from "./pdf/architectureSection";
import { addUserFlowSection } from "./pdf/userFlowSection";
import { addERSection } from "./pdf/erSection";

export async function exportDocumentationPdf() {
  const state = useDiagramStore.getState();

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // -----------------------------
  // Cover Page
  // -----------------------------
  addTitlePage(doc, state);

  // -----------------------------
  // Architecture
  // -----------------------------
  if (state.nodes?.length) {
    const architectureCapture =
      await captureArchitecture();

    if (architectureCapture) {
      doc.addPage();

      addArchitectureSection(
        doc,
        state,
        architectureCapture
      );
    }
  }

  // -----------------------------
  // User Flows
  // -----------------------------
  if (state.userFlows?.length) {
    const userFlowCaptures =
      await captureUserFlows();

    if (userFlowCaptures.length) {
      doc.addPage();

      addUserFlowSection(
        doc,
        state,
        userFlowCaptures
      );
    }
  }

  // -----------------------------
  // ER Diagram
  // -----------------------------
  if (state.erEntities?.length) {
    const erCapture =
      await captureERDiagram();

    if (erCapture) {
      doc.addPage();

      addERSection(
        doc,
        state,
        erCapture
      );
    }
  }

  // -----------------------------
  // Save
  // -----------------------------
  const filename =
    (state.projectName || "architecture")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "_");

  doc.save(`${filename}.pdf`);
}