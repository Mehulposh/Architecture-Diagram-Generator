import useDiagramStore from "../store/useDiagramStore";

export default function usePermissions() {
  return useDiagramStore((state) => ({
    permission: state.permission,

    isOwner: state.isOwner,
    isEditor: state.isEditor,

    canView: state.canView,
    canEdit: state.canEdit,
    canGenerate: state.canGenerate,
    canDelete: state.canDelete,
    canInvite: state.canInvite,
    canManagePermissions: state.canManagePermissions,
  }));
}