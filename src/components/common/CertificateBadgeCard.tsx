import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Download, Eye, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StateBadge, fmtDate } from '@/components/common/Kit'
import type { CertificateDto } from '@/types/backend'

interface CertificateBadgeCardProps {
  certificate: CertificateDto
  holderName: string
  holderRole?: string
}

export async function downloadCertificatePng(certificate: CertificateDto, holderName: string) {
  const issuedDateStr = fmtDate(certificate.issuedAt)
  const recipeLabel = certificate.recipeCode
    ? `SOP Recipe ${certificate.recipeCode} · Released v${certificate.versionNo ?? 1}`
    : 'BrewForge Core Standard Accreditation'

  const img = new Image()
  img.crossOrigin = 'anonymous'
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Failed to load certificate template'))
    img.src = '/brewforge-certificate.jpg'
  })

  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth || 764
  canvas.height = img.naturalHeight || 1024
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  const leftX = Math.round(canvas.width * 0.32)
  const maxTextWidth = Math.round(canvas.width * 0.6)

  ctx.fillStyle = '#8b5e3c'
  ctx.font = '600 13px "Be Vietnam Pro", sans-serif'
  ctx.fillText('CHỨNG NHẬN ĐẠT CHUẨN TAY NGHỀ & SOP / AWARDED TO', leftX, Math.round(canvas.height * 0.505))

  ctx.fillStyle = '#2d1a12'
  ctx.font = '800 30px "Be Vietnam Pro", sans-serif'
  ctx.fillText(holderName.toUpperCase(), leftX, Math.round(canvas.height * 0.552), maxTextWidth)

  ctx.fillStyle = '#7a4b2a'
  ctx.font = '600 12px "Be Vietnam Pro", sans-serif'
  ctx.fillText('ĐÃ HOÀN THÀNH KHÓA ĐÀO TẠO & SÁT HẠCH THỰC HÀNH:', leftX, Math.round(canvas.height * 0.608))

  ctx.fillStyle = '#2d1a12'
  ctx.font = '700 20px "Be Vietnam Pro", sans-serif'
  const words = certificate.courseTitle.split(' ')
  let line = ''
  let y = Math.round(canvas.height * 0.642)
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxTextWidth && line) {
      ctx.fillText(line, leftX, y)
      line = word
      y += 27
    } else {
      line = test
    }
  }
  if (line) {
    ctx.fillText(line, leftX, y)
    y += 30
  }

  ctx.fillStyle = '#b85022'
  ctx.font = '700 14px "JetBrains Mono", monospace'
  ctx.fillText(`${recipeLabel} · [${certificate.status}]`, leftX, y + 6)

  ctx.fillStyle = '#3b2316'
  ctx.font = 'italic 600 18px Georgia, serif'
  ctx.fillText('BrewForge Training & QA Council', leftX, Math.round(canvas.height * 0.856))

  ctx.fillStyle = '#6e5243'
  ctx.font = '600 12px "JetBrains Mono", monospace'
  ctx.fillText(`CERT #${certificate.id} · ISSUED: ${issuedDateStr}`, leftX, Math.round(canvas.height * 0.896))

  const link = document.createElement('a')
  link.download = `BrewForge-Certificate-${certificate.id}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

export function CertificateSurface({
  certificate,
  holderName,
  holderRole,
  large = false,
  onClick,
}: {
  certificate: CertificateDto
  holderName: string
  holderRole?: string
  large?: boolean
  onClick?: () => void
}) {
  const issuedDateStr = fmtDate(certificate.issuedAt)
  const recipeLabel = certificate.recipeCode
    ? `SOP Recipe ${certificate.recipeCode} · Released v${certificate.versionNo ?? 1}`
    : 'BrewForge Core Standard Accreditation'

  return (
    <div
      onClick={onClick}
      className={`relative w-full overflow-hidden rounded-xl border border-[#d9c7b2] bg-[#fbf7f0] shadow-md select-none ${
        large ? 'max-w-[540px]' : 'cursor-pointer transition-transform hover:scale-[1.01]'
      }`}
      style={{ aspectRatio: '764 / 1024' }}
    >
      <img
        src="/brewforge-certificate.jpg"
        alt={`Certificate #${certificate.id} - ${certificate.courseTitle}`}
        className="h-full w-full object-cover"
      />

      <div className="absolute right-[5%] top-[4%] flex items-center gap-1.5">
        <StateBadge value={certificate.status} />
      </div>

      <div
        className="absolute left-[32%] right-[8%] flex flex-col justify-end"
        style={{ top: '44%', height: '12.2%' }}
      >
        <p className={`font-mono uppercase tracking-wider text-[#8b5e3c] ${large ? 'text-[11px]' : 'text-[8.5px]'}`}>
          {holderRole ? `${holderRole} · ` : ''}CHỨNG NHẬN ĐẠT CHUẨN / AWARDED TO
        </p>
        <p
          className={`truncate font-display font-black uppercase tracking-tight text-[#2d1a12] ${
            large ? 'text-2xl sm:text-[26px]' : 'text-sm sm:text-base'
          }`}
          title={holderName}
        >
          {holderName}
        </p>
      </div>

      <div
        className="absolute left-[32%] right-[8%] flex flex-col justify-start"
        style={{ top: '58.2%', height: '21%' }}
      >
        <p className={`font-semibold uppercase tracking-wide text-[#7a4b2a] ${large ? 'text-[11px]' : 'text-[8px]'}`}>
          Hoàn thành khóa đào tạo &amp; sát hạch thực hành:
        </p>
        <h4
          className={`mt-1 line-clamp-3 font-bold leading-snug text-[#2d1a12] ${
            large ? 'text-base sm:text-lg' : 'text-[11px] sm:text-xs'
          }`}
          title={certificate.courseTitle}
        >
          {certificate.courseTitle}
        </h4>
        <p
          className={`mt-1.5 font-mono font-semibold text-[#c04d20] ${
            large ? 'text-xs' : 'text-[9px]'
          }`}
        >
          {recipeLabel}
        </p>
      </div>

      <div
        className="absolute left-[32%] right-[36%] flex flex-col justify-end"
        style={{ top: '79%', height: '7.8%' }}
      >
        <p className={`serif-i font-semibold text-[#3b2316] ${large ? 'text-sm sm:text-base' : 'text-[10px]'}`}>
          BrewForge QA &amp; Training Board
        </p>
      </div>
      <div
        className="absolute left-[32%] right-[35%]"
        style={{ top: '87.6%' }}
      >
        <p className={`font-mono font-semibold text-[#6e5243] ${large ? 'text-[11px]' : 'text-[8px]'}`}>
          CERT #{certificate.id} · {issuedDateStr}
        </p>
      </div>
    </div>
  )
}

export function CertificatePreviewModal({
  certificate,
  holderName,
  holderRole,
  onClose,
}: {
  certificate: CertificateDto
  holderName: string
  holderRole?: string
  onClose: () => void
}) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    setDownloading(true)
    try {
      await downloadCertificatePng(certificate, holderName)
    } finally {
      setDownloading(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-[560px] flex-col items-center overflow-y-auto rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex w-full items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold">Chứng chỉ #{certificate.id} — {holderName}</h3>
            <p className="truncate text-xs text-muted-foreground">{certificate.courseTitle}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button size="sm" type="button" disabled={downloading} onClick={() => void handleDownload()}>
              <Download className="mr-1.5 size-3.5" /> {downloading ? 'Đang tải...' : 'Tải chứng chỉ PNG'}
            </Button>
            <Button size="sm" variant="ghost" type="button" onClick={onClose}>
              <X className="size-4" />
            </Button>
          </div>
        </div>
        <CertificateSurface
          certificate={certificate}
          holderName={holderName}
          holderRole={holderRole}
          large
        />
      </div>
    </div>,
    document.body,
  )
}

export function CertificateBadgeCard({ certificate, holderName, holderRole }: CertificateBadgeCardProps) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const issuedDateStr = fmtDate(certificate.issuedAt)

  const handleDownloadPng = async () => {
    setDownloading(true)
    try {
      await downloadCertificatePng(certificate, holderName)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <>
      <div className="flex flex-col rounded-2xl border bg-card p-3 shadow-sm transition hover:shadow-md">
        <CertificateSurface
          certificate={certificate}
          holderName={holderName}
          holderRole={holderRole}
          onClick={() => setPreviewOpen(true)}
        />

        <div className="mt-3 flex items-center justify-between gap-2 border-t pt-2.5 text-xs">
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground" title={certificate.courseTitle}>
              #{certificate.id} · {certificate.courseTitle}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {certificate.recipeCode ? `${certificate.recipeCode} (v${certificate.versionNo})` : 'Core Standard'} · Cấp ngày {issuedDateStr}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Button size="sm" variant="outline" type="button" onClick={() => setPreviewOpen(true)}>
              <Eye className="mr-1 size-3.5" /> Xem
            </Button>
            <Button size="sm" type="button" disabled={downloading} onClick={() => void handleDownloadPng()}>
              <Download className="mr-1 size-3.5" /> {downloading ? '...' : 'Tải PNG'}
            </Button>
          </div>
        </div>
      </div>

      {previewOpen && (
        <CertificatePreviewModal
          certificate={certificate}
          holderName={holderName}
          holderRole={holderRole}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </>
  )
}
