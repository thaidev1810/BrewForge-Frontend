import type { Operation } from './contracts'
type Scope = 'Catalog' | 'Recipes' | 'Training' | 'Coverage' | 'Quality' | 'Reports' | 'Users' | 'Notifications' | 'Settings' | 'Sales' | 'Impact'
function scope(operation: Operation): Scope {
  const family = operation.split('.')[0]
  if (family === 'UserLookup' || family === 'Users' || family === 'Auth') return 'Users'
  if (family === 'Notifications') return 'Notifications'
  if (family === 'Settings') return 'Settings'
  if (family === 'ImpactAnalysis') return 'Impact'
  if (family === 'Sales') return 'Sales'
  if (['Branches', 'Ingredients', 'EquipmentClasses', 'Categories', 'Products'].includes(family)) return 'Catalog'
  if (['Recipes', 'RecipeVersions'].includes(family)) return 'Recipes'
  if (['Pilots', 'BranchLaunchStatus', 'Skills'].includes(family)) return 'Coverage'
  if (['BranchAudits', 'CorrectiveActions'].includes(family)) return 'Quality'
  if (['Dashboards', 'AuditLog', 'Reports'].includes(family)) return 'Reports'
  return 'Training'
}
const tag = (id: Scope) => ({ type: 'Scope' as const, id })
export function readTags(operation: Operation) { return ['Workspace' as const, tag(scope(operation))] }
export function mutationTags(operation: Operation) {
  const current = scope(operation), scopes = new Set<Scope>([current, 'Reports'])
  if (current === 'Users') for (const s of ['Catalog', 'Coverage', 'Training', 'Quality', 'Recipes'] as const) scopes.add(s)
  if (current === 'Catalog' || current === 'Recipes' || current === 'Impact') for (const s of ['Catalog', 'Recipes', 'Impact', 'Training', 'Coverage'] as const) scopes.add(s)
  if (current === 'Catalog') for (const s of ['Users', 'Quality', 'Sales'] as const) scopes.add(s)
  if (current === 'Training') { scopes.add('Coverage'); scopes.add('Quality'); scopes.add('Notifications') }
  if (current === 'Coverage') { scopes.add('Sales'); scopes.add('Training') }
  if (current === 'Quality') { scopes.add('Training'); scopes.add('Notifications') }
  if (operation === 'CorrectiveActions.AssignRetraining') scopes.add('Coverage')
  if (current === 'Users' || current === 'Impact' || current === 'Recipes') scopes.add('Notifications')
  return [...scopes].map(tag)
}
