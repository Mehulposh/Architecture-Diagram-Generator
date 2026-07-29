import { toPng } from "html-to-image";
import useDiagramStore from "../../store/useDiagramStore";

function nextFrame() {
  return new Promise((resolve) =>
    requestAnimationFrame(resolve)
  );
}

async function waitForRender() {
  await nextFrame();
  await nextFrame();
  await new Promise((resolve) =>
    setTimeout(resolve, 300)
  );
}

async function captureCurrentCanvas() {
  const el = document.querySelector(".react-flow");

  if (!el) return null;

  const rect = el.getBoundingClientRect();

  const dataUrl = await toPng(el, {
    backgroundColor: "#0B1E3D",
    pixelRatio: 2,
    cacheBust: true,
    skipFonts: true,
  });

  return {
    dataUrl,
    width: rect.width,
    height: rect.height,
  };
}

export async function captureArchitecture() {
  const store = useDiagramStore.getState();

  store.setDiagramView("architecture");

  await waitForRender();

  return captureCurrentCanvas();
}

export async function captureERDiagram() {
  const store = useDiagramStore.getState();

  store.setDiagramView("er");

  await waitForRender();

  return captureCurrentCanvas();
}

export async function captureUserFlows() {
  const store = useDiagramStore.getState();
// console.log(useDiagramStore.getState().userFlows);
  const originalRole = store.selectedFlowRole;

  const captures = [];

  store.setDiagramView("userFlow");

  await waitForRender();

  for (const flow of store.userFlows || []) {
    // console.log("flow", flow);
    // console.log("flow.nodes", flow.nodes);
    store.setSelectedFlowRole(flow.role);

    await waitForRender();


    captures.push({
      role: flow.role,
      nodes: flow.nodes,
      edges: flow.edges,
      capture: await captureCurrentCanvas(),
    });
  }

  if (originalRole) {
    store.setSelectedFlowRole(originalRole);
  }

  await waitForRender();

  return captures;
}