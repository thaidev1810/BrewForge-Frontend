import { createDomainSlice } from '@/utils/createDomainSlice'
import { certificateService } from './certificateService'
const domain = createDomainSlice('certificates', certificateService)
export const fetchCertificates = domain.fetchList
export const fetchCertificate = domain.fetchDetail
export const mutateCertificate = domain.mutate
export default domain.reducer
