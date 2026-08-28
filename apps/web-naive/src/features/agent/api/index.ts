// Feature-owned transport facades. The legacy API files remain implementation
// adapters during the one-time migration, while consumers only depend on this
// public feature entry point.
export {
  createAgent as createAdminAgent,
  deleteAgent as deleteAdminAgent,
  getAgentById as getAdminAgentById,
  getAgentListAll as getAdminAgentListAll,
  getAgentPage as getAdminAgentPage,
  toggleAgentStatus as toggleAdminAgentStatus,
  updateAgent as updateAdminAgent,
} from './admin';
export type {
  PageResult as AdminAgentPageResult,
  AgentAdminApi,
} from './admin';
export * from './agent';
export * from './graph';
export * from './intent-def';
export * from './node-type';
export * from './runtime';
export * from './tutor-agent';
export * from './version';
