import Sidebar from "../Sidebar";
import CanvasContainer from "./CanvasContainer";

export default function Workspace() {
  return (
    <div className="flex flex-1 overflow-hidden">

      <Sidebar />

      <CanvasContainer />

    </div>
  );
}