import usePermissions from "../../hooks/usePermissions";

const CONFIG = {
  owner: {
    icon: "👑",
    title: "Owner",
    text: "You have full access to this project.",
    color: "text-amber",
  },

  editor: {
    icon: "✏️",
    title: "Editor",
    text: "You can modify this project.",
    color: "text-node-service",
  },

  viewer: {
    icon: "👀",
    title: "Read-only",
    text: "Editing is disabled.",
    color: "text-paper/70",
  },
};

export default function PermissionBanner() {
  const { permission } = usePermissions();

  const info = CONFIG[permission];

  if (!info) return null;

  return (
    <div className="border-b border-blueprint-line/20 bg-blueprint-900/50 px-5 py-2">

      <div className={`flex items-center gap-2 text-xs ${info.color}`}>

        <span>{info.icon}</span>

        <span className="font-semibold">
          {info.title}
        </span>

        <span className="text-paper/60">
          {info.text}
        </span>

      </div>

    </div>
  );
}