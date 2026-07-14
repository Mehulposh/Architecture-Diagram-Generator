const mongoose = require('mongoose');

const nodeSchema = new mongoose.Schema(
  {
    id: String,
    type: String, // frontend | backend | database | cache | queue | api-gateway | load-balancer | cloud | external
    position: { x: Number, y: Number },
    data: {
      label: String,
      description: String,
      icon: String,
      color: String,
    },
  },
  { _id: false }
);

const edgeSchema = new mongoose.Schema(
  {
    id: String,
    source: String,
    target: String,
    label: String,
    animated: Boolean,
  },
  { _id: false }
);

const versionSchema = new mongoose.Schema(
  {
    label: String,
    nodes: [nodeSchema],
    edges: [edgeSchema],
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    prompt: { type: String, default: '' },
    architectureStyle: {
      type: String,
      enum: ['monolithic', 'microservices', 'event-driven', 'serverless', 'layered'],
      default: 'microservices',
    },
    diagramLevel: {
      type: String,
      enum: ['high-level', 'low-level', 'deployment', 'database', 'communication-flow'],
      default: 'high-level',
    },
    nodes: [nodeSchema],
    edges: [edgeSchema],
    techStack: {
      frontend: [String],
      backend: [String],
      database: [String],
      messaging: [String],
      cloud: [String],
      monitoring: [String],
    },
    documentation: {
      systemOverview: String,
      componentDescriptions: String,
      apiFlow: String,
      databaseDesign: String,
      deploymentGuidelines: String,
    },
    versions: [versionSchema],
    collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isPublic: { type: Boolean, default: false },
    shareToken: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);