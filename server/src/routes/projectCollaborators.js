const express = require("express");

const requireAuth = require("../middleware/auth");
const requireProjectPermission = require("../middleware/projectPermissions");

const Project = require("../models/project");
const User = require("../models/user");

/**
 * Router for managing collaborator access on a project.
 * @type {import('express').Router}
 */
const router = express.Router({ mergeParams: true });

/*
|--------------------------------------------------------------------------
| Get Collaborators
|--------------------------------------------------------------------------
*/

/**
 * Retrieves the owner and collaborator list for a project.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>}
 */
router.get(
  "/",
  requireAuth,
  requireProjectPermission("view"),
  async (req, res) => {
    const project = req.project;

    await project.populate("owner", "name email");
    await project.populate("collaborators.user", "name email");

    res.json({
      owner: project.owner,
      collaborators: project.collaborators,
    });
  }
);

/*
|--------------------------------------------------------------------------
| Invite Collaborator
|--------------------------------------------------------------------------
*/

/**
 * Invites a user to collaborate on a project.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware callback.
 * @returns {Promise<void>}
 */
router.post(
  "/",
  requireAuth,
  requireProjectPermission("invite"),
  async (req, res, next) => {
    try {
      const { email, permission = "viewer" } = req.body;

      if (!email?.trim()) {
        return res.status(400).json({
          error: "Email is required.",
        });
      }

      if (!["viewer", "editor"].includes(permission)) {
        return res.status(400).json({
          error: "Invalid permission.",
        });
      }

      const collaborator = await User.findOne({
        email: email.trim().toLowerCase(),
      });

      if (!collaborator) {
        return res.status(404).json({
          error: "User not found.",
        });
      }

      const project = req.project;

      if (project.owner.toString() === collaborator._id.toString()) {
        return res.status(400).json({
          error: "Project owner cannot be added as collaborator.",
        });
      }

      const alreadyExists = project.collaborators.some(
        (c) => c.user.toString() === collaborator._id.toString()
      );

      if (alreadyExists) {
        return res.status(409).json({
          error: "User is already a collaborator.",
        });
      }

      project.collaborators.push({
        user: collaborator._id,
        permission,
      });

      await project.save();

      await project.populate("collaborators.user", "name email");

      res.status(201).json({
        collaborators: project.collaborators,
      });
    } catch (err) {
      next(err);
    }
  }
);

/*
|--------------------------------------------------------------------------
| Update Permission
|--------------------------------------------------------------------------
*/

/**
 * Updates the permission level of an existing collaborator.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware callback.
 * @returns {Promise<void>}
 */
router.patch(
  "/:userId",
  requireAuth,
  requireProjectPermission("changePermission"),
  async (req, res, next) => {
    console.log("PATCH collaborator route hit");
    console.log(req.params);
    try {
      const { permission } = req.body;

      if (!["viewer", "editor"].includes(permission)) {
        return res.status(400).json({
          error: "Invalid permission.",
        });
      }

      const project = req.project;

      console.log("Requested user:", req.params.userId);

      console.log(
        project.collaborators.map((c) => ({
          user: c.user,
          type: typeof c.user,
          toString: c.user?.toString?.(),
        }))
      );
      const collaborator = project.collaborators.find(
        (c) => c.user._id.toString() === req.params.userId
      );
      
      if (!collaborator) {
        return res.status(404).json({
          error: "Collaborator not found.",
        });
      }

      collaborator.permission = permission;

      await project.save();

      await project.populate("collaborators.user", "name email");

      res.json({
        collaborators: project.collaborators,
      });
    } catch (err) {
      next(err);
    }
  }
);

/*
|--------------------------------------------------------------------------
| Remove Collaborator
|--------------------------------------------------------------------------
*/

/**
 * Removes a collaborator from a project.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware callback.
 * @returns {Promise<void>}
 */
router.delete(
  "/:userId",
  requireAuth,
  requireProjectPermission("invite"),
  async (req, res, next) => {
    try {
      const project = req.project;

      const exists = project.collaborators.some(
        (c) => c.user.toString() === req.params.userId
      );

      if (!exists) {
        return res.status(404).json({
          error: "Collaborator not found.",
        });
      }

      project.collaborators = project.collaborators.filter(
        (c) => c.user.toString() !== req.params.userId
      );

      await project.save();

      await project.populate("collaborators.user", "name email");

      res.json({
        collaborators: project.collaborators,
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;