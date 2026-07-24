/**
 * Returns a string id regardless of whether the value is:
 * - ObjectId
 * - populated mongoose document
 * - plain string
 */
function getId(value) {
  if (!value) return null;

  if (typeof value === "string") {
    return value;
  }

  if (value._id) {
    return value._id.toString();
  }

  return value.toString();
}

function isOwner(project, userId) {
  if (!project || !userId) return false;

  return getId(project.owner) === getId(userId);
}

function getCollaborator(project, userId) {
  if (!project || !userId) return null;

  return (
    project.collaborators.find(
      (c) => getId(c.user) === getId(userId)
    ) || null
  );
}

function isCollaborator(project, userId) {
  return !!getCollaborator(project, userId);
}

function isEditor(project, userId) {
  if (isOwner(project, userId)) {
    return true;
  }

  const collaborator = getCollaborator(project, userId);

  return collaborator?.permission === "editor";
}

function isViewer(project, userId) {
  if (isOwner(project, userId)) {
    return true;
  }

  return isCollaborator(project, userId);
}

function canView(project, userId) {
  return isViewer(project, userId);
}

function canEdit(project, userId) {
  return isEditor(project, userId);
}

function canInvite(project, userId) {
  return isOwner(project, userId);
}

function canDelete(project, userId) {
  return isOwner(project, userId);
}

function canGenerate(project, userId) {
  return isEditor(project, userId);
}

function canRestoreVersion(project, userId) {
  return isEditor(project, userId);
}

function canChangePermission(project, userId) {
  return isOwner(project, userId);
}

module.exports = {
  getId,
  isOwner,
  getCollaborator,
  isCollaborator,
  isEditor,
  isViewer,
  canView,
  canEdit,
  canInvite,
  canDelete,
  canGenerate,
  canRestoreVersion,
  canChangePermission,
};