// One mock backing directory shared by assignments and the Branches service.
// No branch has local equipment or SOP overrides.
export const mockBranches = new Map([
  ['demo-branch-1', { id: 'demo-branch-1', name: 'BrewForge Central', code: 'CENTRAL', address: 'Demo location', active: true }],
])
