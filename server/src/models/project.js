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
      // Rich per-component documentation (Feature 2). All optional so
      // older saved projects and hand-added nodes degrade gracefully.
      purpose: String,
      responsibilities: [String],
      inputs: [String],
      outputs: [String],
      technologies: [String],
      // Stored as node ids, never as plain names, so renames stay correct
      // automatically (same [[id]] pattern used in documentation text).
      communicatesWith: [String],
      whyItExists: String,
      realWorldExamples: [String],
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

const flowNodeSchema = new mongoose.Schema(
  {
    id: String,
    role: String, // which user role this step belongs to, matches domainAnalysis.userRoles
    stepType: { type: String, enum: ['start', 'action', 'decision', 'end','handoff',], default: 'action' },
    label: String,
    description: String,
    position: { x: Number, y: Number },
     // Only set when stepType is 'handoff': names the OTHER role this step
    // passes control to/from. Since each role now has its own genuinely
    // independent diagram (no shared canvas to draw a literal cross-diagram
    // arrow on), a hand-off is represented as a step in one role's diagram
    // that explicitly names the other role, rather than an edge that can't
    // exist between two separate diagrams.
    handoffRole: String,
  },
  { _id: false }
);

const flowEdgeSchema = new mongoose.Schema(
  {
    id: String,
    source: String,
    target: String,
    label: String, // e.g. "yes" / "no" out of a decision step
    animated: Boolean,
  },
  { _id: false }
);

// One genuinely independent diagram per user role.
const roleFlowSchema = new mongoose.Schema(
  {
    role: String, // matches domainAnalysis.userRoles
    summary: String, // 1-2 sentence overview of this specific role's journey
    nodes: [flowNodeSchema],
    edges: [flowEdgeSchema],
  },
  { _id: false }
);

const entityAttributeSchema = new mongoose.Schema(
  {
    name: String,
    type: String, // e.g. "UUID", "String", "Enum", "Timestamp", "Decimal"
    description: String,
    required: Boolean,
    isPrimaryKey: Boolean,
    isForeignKey: Boolean,
    // The id of the entity this attribute references, if isForeignKey — an
    // id, never a name, for the same rename-safety reason as everywhere else.
    foreignKeyRef: String,
    unique: Boolean,
    defaultValue: String,
  },
  { _id: false }
);

const entitySchema = new mongoose.Schema(
  {
    id: String,
    name: String, // the renameable, human-readable entity/table name
    position: { x: Number, y: Number },
    purpose: String,
    attributes: [entityAttributeSchema],
  },
  { _id: false }
);

const relationshipSchema = new mongoose.Schema(
  {
    id: String,
    source: String, // entity id
    target: String, // entity id
    cardinality: { type: String, enum: ['1:1', '1:N', 'N:1', 'M:N'] },
    label: String, // short verb phrase, e.g. "places"
    description: String, // business reasoning, e.g. why this relationship exists
    isJunctionTable: Boolean, // true if this M:N is realized via a join table
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
    // Shared domain understanding, produced once per generation and reused as
    // context for every derived artifact (architecture now; user flow and ER
    // diagram in later phases) so they all agree on domain, roles, and
    // terminology instead of drifting independently.
    domainAnalysis: {
      domain: String,
      appType: String,
      coreFeatures: [String],
      userRoles: [String],
      technicalRequirements: [String],
      complexity: { type: String, enum: ['simple', 'moderate', 'complex'] },
    },
    nodes: [nodeSchema],
    edges: [edgeSchema],
     // A separate artifact from the architecture diagram: each user role gets
    // its OWN genuinely independent diagram (not lanes sharing one canvas),
    // since that's what makes them individually viewable, editable, and
    // exportable. Still reuses domainAnalysis.userRoles for the role list so
    // terminology stays consistent with the rest of the project.
    userFlow: {
      flows: [roleFlowSchema],
    },
    // Same pattern again: its own artifact, reusing domainAnalysis for
    // consistent terminology rather than being independently classified.
    erDiagram: {
      entities: [entitySchema],
      relationships: [relationshipSchema],
    },
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
      userFlowOverview: String,
      erOverview: String,
      databaseDesignDecisions: String,
    },
    versions: [versionSchema],
    collaborators: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        permission: {
          type: String,
          enum: ["viewer", "editor"],
          default: "viewer",
        },
      },
    ],
    isPublic: { type: Boolean, default: false },
    shareToken: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);