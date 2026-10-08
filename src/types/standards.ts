export interface EquipmentStandard { id: string; name: string }
export interface SharedStandards {
  id: string
  equipment: EquipmentStandard[]
  // SOP versions are a single global catalog, never owned/overridden by a branch.
  sopScope: 'GLOBAL'
}
