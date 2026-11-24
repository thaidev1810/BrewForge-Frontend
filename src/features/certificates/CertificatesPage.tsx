import { useAppSelector } from '@/app/hooks'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState, LoadState, Panel } from '@/components/common/Panel'
import { StatusBadge } from '@/components/common/StatusBadge'
import { useTrainingData } from '@/hooks/useTrainingData'
import { stageOf, STAGE_LABELS, STAGE_VARIANTS } from '@/features/training/trainingProgress'

// The barista's certificates, and the skill passport: one line per course.
export function CertificatesPage() {
  const user = useAppSelector((state) => state.auth.user)!
  const data = useTrainingData()
  const mine = data.certificates.filter((certificate) => certificate.traineeId === user.id)
  const myAssignments = data.assignments.filter((assignment) => assignment.traineeId === user.id)
  const sopLabel = (id: string) => { const sop = data.sops.find((item) => item.id === id); return sop ? `${sop.title} v${sop.version}` : id }

  return (
    <>
      <PageHeader title="Certificates" description="Every certificate names the exact SOP version you were certified on." />
      <LoadState loading={data.loading} error={data.error} />
      <Panel title="My certificates">
        {mine.length === 0 ? <EmptyState>No certificate yet. Pass the quiz and the practical to earn one.</EmptyState> : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {mine.map((certificate) => (
              <li key={certificate.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium">{data.courses.find((course) => course.id === certificate.courseId)?.title ?? 'Course'}</h3>
                  <StatusBadge variant={certificate.revokedAt ? 'error' : 'success'}>{certificate.revokedAt ? 'Revoked' : 'Valid'}</StatusBadge>
                </div>
                <dl className="mt-2 text-sm">
                  <div className="flex gap-2"><dt className="text-muted-foreground">SOP</dt><dd>{sopLabel(certificate.sopVersionId)}</dd></div>
                  <div className="flex gap-2"><dt className="text-muted-foreground">Issued</dt><dd>{new Date(certificate.issuedAt).toLocaleDateString()}</dd></div>
                  {certificate.revocationReason && <div className="flex gap-2"><dt className="text-muted-foreground">Reason</dt><dd>{certificate.revocationReason}</dd></div>}
                </dl>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <Panel title="Skill passport">
        {data.courses.filter((course) => !course.archived).length === 0 ? <EmptyState>No courses yet.</EmptyState> : (
          <ul className="divide-y">
            {data.courses.filter((course) => !course.archived).map((course) => {
              const assignment = myAssignments.filter((item) => item.courseId === course.id && item.status !== 'CANCELLED').at(-1)
              const stage = assignment ? stageOf(assignment, data.facts) : null
              return (
                <li key={course.id} className="flex items-center justify-between gap-3 py-3">
                  <span>{course.title}</span>
                  {stage ? <StatusBadge variant={STAGE_VARIANTS[stage]}>{STAGE_LABELS[stage]}</StatusBadge> : <StatusBadge>Not started</StatusBadge>}
                </li>
              )
            })}
          </ul>
        )}
      </Panel>
    </>
  )
}
