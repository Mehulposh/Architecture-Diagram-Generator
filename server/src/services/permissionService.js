/**
 * Helper methods for evaluating project permissions.
 * @module services/permissionService
 */

/**
 * Returns a string id regardless of whether the value is:
 * - ObjectId
 * - populated mongoose document
 * - plain string
 */
/**
 * Normalizes a value to a string identifier.
 * @param {string|import('mongoose').Types.ObjectId|{_id?: import('mongoose').Types.ObjectId}|unknown} value - Value to normalize.
 * @returns {string|null} String representation of the identifier.
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

/**
 * Checks whether the supplied user is the project owner.
 * @param {object} project - Project document.
 * @param {string} userId - User id to evaluate.
 * @returns {boolean}
 */
function isOwner(project, userId) {
  if (!project || !userId) return false;

  return getId(project.owner) === getId(userId);
}

/**
 * Finds a collaborator entry for the current user.
 * @param {object} project - Project document.
 * @param {string} userId - User id to evaluate.
 * @returns {object|null}
 */
function getCollaborator(project, userId) {
  if (!project || !userId) return null;

  return (
    project.collaborators.find(
      (c) => getId(c.user) === getId(userId)
    ) || null
  );
}

/**
 * Checks whether the supplied user is a collaborator on the project.
 * @param {object} project - Project document.
 * @param {string} userId - User id to evaluate.
 * @returns {boolean}
 */
function isCollaborator(project, userId) {
  return !!getCollaborator(project, userId);
}

/**
 * Checks whether the supplied user can edit the project.
 * @param {object} project - Project document.
 * @param {string} userId - User id to evaluate.
 * @returns {boolean}
 */
function isEditor(project, userId) {
  if (isOwner(project, userId)) {
    return true;
  }

  const collaborator = getCollaborator(project, userId);

  return collaborator?.permission === "editor";
}

/**
 * Checks whether the supplied user can view the project.
 * @param {object} project - Project document.
 * @param {string} userId - User id to evaluate.
 * @returns {boolean}
 */
function isViewer(project, userId) {
  if (isOwner(project, userId)) {
    return true;
  }

  return isCollaborator(project, userId);
}

/**
 * Determines whether a user can view the project.
 * @param {object} project - Project document.
 * @param {string} userId - User id to evaluate.
 * @returns {boolean}
 */
function canView(project, userId) {
  return isViewer(project, userId);
}

/**
 * Determines whether a user can edit the project.
 * @param {object} project - Project document.
 * @param {string} userId - User id to evaluate.
 * @returns {boolean}
 */
function canEdit(project, userId) {
  return isEditor(project, userId);
}

/**
 * Determines whether a user can invite collaborators.
 * @param {object} project - Project document.
 * @param {string} userId - User id to evaluate.
 * @returns {boolean}
 */
function canInvite(project, userId) {
  return isOwner(project, userId);
}

/**
 * Determines whether a user can delete the project.
 * @param {object} project - Project document.
 * @param {string} userId - User id to evaluate.
 * @returns {boolean}
 */
function canDelete(project, userId) {
  return isOwner(project, userId);
}

/**
 * Determines whether a user can trigger generation actions.
 * @param {object} project - Project document.
 * @param {string} userId - User id to evaluate.
 * @returns {boolean}
 */
function canGenerate(project, userId) {
  return isEditor(project, userId);
}

/**
 * Determines whether a user can restore a saved version.
 * @param {object} project - Project document.
 * @param {string} userId - User id to evaluate.
 * @returns {boolean}
 */
function canRestoreVersion(project, userId) {
  return isEditor(project, userId);
}

/**
 * Determines whether a user can change collaborator permissions.
 * @param {object} project - Project document.
 * @param {string} userId - User id to evaluate.
 * @returns {boolean}
 */
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