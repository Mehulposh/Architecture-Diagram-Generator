import Toolbar from "../components/Toolbar";
import PromptBar from "../components/prompt/PromptBar";
import Workspace from "../components/editor/Workspace";
import Footer from "../components/editor/Footer";
import PermissionBanner from "../components/editor/PermissionBanner";

import DocumentationPanel from "../components/DocumentationPanel";
import NodeDetailsPanel from "../components/NodeDetailsPanel";
import EntityDetailsPanel from "../components/EntityDetailsPanel";

export default function Editor() {
  return (
    <div className="flex h-screen flex-col">

      <Toolbar />

      <PermissionBanner />

      <PromptBar />

      <Workspace />

      <Footer />

      <DocumentationPanel />

      <NodeDetailsPanel />

      <EntityDetailsPanel />

    </div>
  );
}