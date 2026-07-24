const Project = require("../models/project");
const {
  canView,
  canEdit,
  canDelete,
  canInvite,
  canGenerate,
  canRestoreVersion,
  canChangePermission,
} = require("../services/permissionService");

/**
 * Loads the project and verifies the current user has the
 * requested permission.
 *
 * Usage:
 *
 * router.get("/:id",
 *   requireAuth,
 *   requireProjectPermission("view"),
 *   handler
 * );
 *
 * The loaded project is attached to:
 *
 * req.project
 *
 * so the route does not need another database query.
 */

const permissionMap = {
  view: canView,
  edit: canEdit,
  delete: canDelete,
  invite: canInvite,
  generate: canGenerate,
  restore: canRestoreVersion,
  changePermission: canChangePermission,
};

function requireProjectPermission(permission = "view") {
  return async (req, res, next) => {
    try {
      const project = await Project.findById(req.params.id)
        .populate("owner", "name email")
        .populate("collaborators.user", "name email");

      if (!project) {
        return res.status(404).json({
          error: "Project not found.",
        });
      }

      const validator = permissionMap[permission];

      if (!validator) {
        return res.status(500).json({
          error: `Unknown permission "${permission}".`,
        });
      }

      const allowed = validator(project, req.userId);

      if (!allowed) {
        return res.status(403).json({
          error: "You do not have permission to perform this action.",
        });
      }

      req.project = project;

      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = requireProjectPermission;