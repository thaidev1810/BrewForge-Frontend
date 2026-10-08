import { createDomainSlice } from '@/utils/createDomainSlice'
import { sopService } from './sopService'
const domain = createDomainSlice('sops', sopService)
export const fetchSopVersions = domain.fetchList
export const fetchSopVersion = domain.fetchDetail
export const mutateSopVersion = domain.mutate
export default domain.reducer
