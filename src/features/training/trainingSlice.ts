import { createDomainSlice } from '@/utils/createDomainSlice'
import { trainingService } from './trainingService'
const domain = createDomainSlice('training', trainingService)
export const fetchTrainingAssignments = domain.fetchList
export const fetchTrainingAssignment = domain.fetchDetail
export const mutateTrainingAssignment = domain.mutate
export default domain.reducer
