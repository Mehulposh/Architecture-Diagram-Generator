import { useState } from "react";
import { Link } from "react-router-dom";
import { toPng, toSvg } from "html-to-image";
import useDiagramStore from "../store/useDiagramStore";
import { exportDocumentationPdf } from "../utils/exportPdf";

export default function Toolbar() {
  const {
    projectName,
    setProjectName,
    saveProject,
    user,
    logout,
    setDocsOpen,
    documentation,
    userFlowOverview,
    erOverview,
    diagramView,
    setDiagramView,
    theme,
    toggleTheme,
  } = useDiagramStore();

  const [status, setStatus] = useState("");
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleSave = async () => {
    setStatus("Saving…");

    try {
      await saveProject();
      setStatus("Saved");
    } catch(err) {
      console.error('saving error', err);
      
      setStatus("Save failed");
    }

    setTimeout(() => setStatus(""), 1800);
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    setStatus("Building PDF…");

    try {
      await exportDocumentationPdf();
      setStatus("PDF downloaded");
    } catch (err) {
      setStatus(err.message || "PDF export failed");
    } finally {
      setIsExportingPdf(false);
      setTimeout(() => setStatus(""), 2200);
    }
  };

  const download = (dataUrl, ext) => {
    const view = useDiagramStore.getState().diagramView;

    const viewSuffix =
      view === "userFlow"
        ? "-user-flow"
        : view === "er"
        ? "-er-diagram"
        : "";

    const link = document.createElement("a");
    link.download = `${projectName || "architecture"}${viewSuffix}.${ext}`;
    link.href = dataUrl;
    link.click();
  };

  const exportAs = async (format) => {
    const el = document.querySelector(".react-flow");

    if (!el) return;

    const dataUrl =
      format === "png" ? await toPng(el) : await toSvg(el);

    download(dataUrl, format);
  };

  return (
    <header className="flex items-center justify-between border-b border-blueprint-line/30 bg-blueprint-950 px-5 py-3">
      {/* Left */}
      <div className="flex items-center gap-3">
        <span className="font-display text-lg font-bold text-paper">
          Blueprint
        </span>

        <input
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="rounded-sm border border-transparent bg-transparent px-2 py-1 font-body text-sm text-paper/80 hover:border-blueprint-line/30 focus:border-amber"
        />

        <div className="flex rounded-sm border border-blueprint-line/40 p-0.5 text-xs">
          <button
            onClick={() => setDiagramView("architecture")}
            className={`rounded-sm px-2.5 py-1 ${
              diagramView === "architecture"
                ? "bg-amber font-semibold text-blueprint-950"
                : "text-paper/70 hover:bg-blueprint-800"
            }`}
          >
            Architecture
          </button>

          <button
            onClick={() => setDiagramView("userFlow")}
            className={`rounded-sm px-2.5 py-1 ${
              diagramView === "userFlow"
                ? "bg-amber font-semibold text-blueprint-950"
                : "text-paper/70 hover:bg-blueprint-800"
            }`}
          >
            User Flow
          </button>

          <button
            onClick={() => setDiagramView("er")}
            className={`rounded-sm px-2.5 py-1 ${
              diagramView === "er"
                ? "bg-amber font-semibold text-blueprint-950"
                : "text-paper/70 hover:bg-blueprint-800"
            }`}
          >
            ER Diagram
          </button>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 text-sm">
        {status && (
          <span className="text-xs text-node-cloud">{status}</span>
        )}

        <Link
          to="/projects"
          className="rounded-sm border border-blueprint-line/40 px-3 py-1.5 text-paper/90 hover:bg-blueprint-800"
        >
          My Projects
        </Link>

        <button
          onClick={handleSave}
          className="rounded-sm border border-blueprint-line/40 px-3 py-1.5 text-paper/90 hover:bg-blueprint-800"
        >
          Save
        </button>

        {/* Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu((prev) => !prev)}
            className="flex items-center gap-2 rounded-sm border border-blueprint-line/40 px-3 py-1.5 text-paper/90 hover:bg-blueprint-800"
          >
            Export

            <svg
              className={`h-4 w-4 transition-transform ${
                showExportMenu ? "rotate-180" : ""
              }`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 011.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              />
            </svg>
          </button>

          {showExportMenu && (
            <>
              {/* Invisible Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowExportMenu(false)}
              />

              {/* Menu */}
              <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-md border border-blueprint-line/40 bg-blueprint-950 shadow-2xl">
                <button
                  onClick={() => {
                    exportAs("png");
                    setShowExportMenu(false);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-paper/90 transition hover:bg-blueprint-800"
                >
                  🖼 <span>Export as PNG</span>
                </button>

                <button
                  onClick={() => {
                    exportAs("svg");
                    setShowExportMenu(false);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-paper/90 transition hover:bg-blueprint-800"
                >
                  📐 <span>Export as SVG</span>
                </button>

                <button
                  disabled={isExportingPdf}
                  onClick={async () => {
                    setShowExportMenu(false);
                    await handleExportPdf();
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-paper/90 transition hover:bg-blueprint-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  📄{" "}
                  <span>
                    {isExportingPdf
                      ? "Exporting PDF..."
                      : "Export as PDF"}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>

        <button
          onClick={() => setDocsOpen(true)}
          disabled={
            !documentation &&
            !userFlowOverview &&
            !erOverview
          }
          className="rounded-sm border border-blueprint-line/40 px-3 py-1.5 text-paper/90 hover:bg-blueprint-800 disabled:opacity-40"
        >
          Docs
        </button>

        <button
          onClick={toggleTheme}
          title={
            theme === "dark"
              ? "Switch to light (diazo print) theme"
              : "Switch to dark theme"
          }
          className="rounded-sm border border-blueprint-line/40 p-1.5 text-paper/80 hover:bg-blueprint-800 hover:text-amber"
        >
          {theme === "dark" ? (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        {user && (
          <div className="ml-3 flex items-center gap-2 border-l border-blueprint-line/30 pl-3">
            {user.isAdmin && (
              <Link
                to="/admin"
                className="text-paper/60 hover:text-amber"
              >
                Admin
              </Link>
            )}

            <Link
              to="/profile"
              className="text-paper/60 hover:text-amber"
            >
              {user.name}
            </Link>

            <button
              onClick={logout}
              className="text-paper/50 hover:text-amber"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}