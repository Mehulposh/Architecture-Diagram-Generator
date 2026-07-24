const express = require("express");
const crypto = require("crypto");
const collaboratorRoutes = require("./projectCollaborators");

const requireAuth = require("../middleware/auth");
const requireProjectPermission = require("../middleware/projectPermissions");

const Project = require("../models/project");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| My Projects
|--------------------------------------------------------------------------
*/

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.userId },
        { "collaborators.user": req.userId },
      ],
    })
      .select(
        "name architectureStyle diagramLevel updatedAt createdAt owner collaborators"
      )
      .populate("owner", "name email")
      .sort({ updatedAt: -1 });

    res.json(projects);
  } catch (err) {
    next(err);
  }
});

/*
|--------------------------------------------------------------------------
| Create Project
|--------------------------------------------------------------------------
*/

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const {
      name,
      prompt,
      architectureStyle,
      diagramLevel,
      nodes,
      edges,
      techStack,
      documentation,
      domainAnalysis,
      userFlow,
      erDiagram,
    } = req.body;

    const project = await Project.create({
      owner: req.userId,
      name: name || "Untitled architecture",
      prompt,
      architectureStyle,
      diagramLevel,
      nodes,
      edges,
      techStack,
      documentation,
      domainAnalysis,
      userFlow,
      erDiagram,
      collaborators: [],
      versions: [
        {
          label: "Initial version",
          nodes,
          edges,
        },
      ],
    });

    const populated = await Project.findById(project._id)
      .populate("owner", "name email")
      .populate("collaborators.user", "name email");

    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
});

/*
|--------------------------------------------------------------------------
| Get Project
|--------------------------------------------------------------------------
*/

router.get(
  "/:id",
  requireAuth,
  requireProjectPermission("view"),
  async (req, res) => {
    res.json(req.project);
  }
);

/*
|--------------------------------------------------------------------------
| Update Project
|--------------------------------------------------------------------------
*/

router.put(
  "/:id",
  requireAuth,
  requireProjectPermission("edit"),
  async (req, res, next) => {
    try {
      const project = req.project;

      const {
        name,
        architectureStyle,
        nodes,
        edges,
        techStack,
        documentation,
        domainAnalysis,
        userFlow,
        erDiagram,
        saveVersion,
        versionLabel,
      } = req.body;

      if (name !== undefined) project.name = name;

      if (architectureStyle !== undefined)
        project.architectureStyle = architectureStyle;

      if (nodes !== undefined)
        project.nodes = nodes;

      if (edges !== undefined)
        project.edges = edges;

      if (techStack !== undefined)
        project.techStack = techStack;

      if (documentation !== undefined)
        project.documentation = documentation;

      if (domainAnalysis !== undefined)
        project.domainAnalysis = domainAnalysis;

      if (userFlow !== undefined)
        project.userFlow = userFlow;

      if (erDiagram !== undefined)
        project.erDiagram = erDiagram;

      if (saveVersion) {
        project.versions.push({
          label:
            versionLabel ||
            `Version ${project.versions.length + 1}`,
          nodes: project.nodes,
          edges: project.edges,
        });
      }

      await project.save();

      await project.populate("owner", "name email");
      await project.populate("collaborators.user", "name email");

      res.json(project);
    } catch (err) {
      next(err);
    }
  }
);

/*
|--------------------------------------------------------------------------
| Delete Project
|--------------------------------------------------------------------------
*/

router.delete(
  "/:id",
  requireAuth,
  requireProjectPermission("delete"),
  async (req, res, next) => {
    try {
      await req.project.deleteOne();

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

/*
|--------------------------------------------------------------------------
| Share Project
|--------------------------------------------------------------------------
*/

router.post(
  "/:id/share",
  requireAuth,
  requireProjectPermission("invite"),
  async (req, res, next) => {
    try {
      const project = req.project;

      project.isPublic = true;

      if (!project.shareToken) {
        project.shareToken = crypto
          .randomBytes(16)
          .toString("hex");
      }

      await project.save();

      res.json({
        shareToken: project.shareToken,
      });
    } catch (err) {
      next(err);
    }
  }
);

/*
|--------------------------------------------------------------------------
| Public Project
|--------------------------------------------------------------------------
*/

router.get("/public/:shareToken", async (req, res, next) => {
  try {
    const project = await Project.findOne({
      shareToken: req.params.shareToken,
      isPublic: true,
    })
      .populate("owner", "name email")
      .populate("collaborators.user", "name email");

    if (!project) {
      return res.status(404).json({
        error: "Shared project not found.",
      });
    }

    res.json(project);
  } catch (err) {
    next(err);
  }
});

/*
|--------------------------------------------------------------------------
| Versions
|--------------------------------------------------------------------------
*/

router.get(
  "/:id/versions",
  requireAuth,
  requireProjectPermission("view"),
  async (req, res) => {
    res.json(req.project.versions);
  }
);

/*
|--------------------------------------------------------------------------
| Restore Version
|--------------------------------------------------------------------------
*/

router.post(
  "/:id/versions/:index/restore",
  requireAuth,
  requireProjectPermission("restore"),
  async (req, res, next) => {
    try {
      const project = req.project;

      const version =
        project.versions[Number(req.params.index)];

      if (!version) {
        return res.status(404).json({
          error: "Version not found.",
        });
      }

      project.nodes = version.nodes;
      project.edges = version.edges;

      await project.save();

      res.json(project);
    } catch (err) {
      next(err);
    }
  }
);


router.use(
  "/:id/collaborators",
  collaboratorRoutes
);
module.exports = router;