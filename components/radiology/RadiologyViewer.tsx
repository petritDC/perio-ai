'use client'

import dynamic from 'next/dynamic'
import { useState, useTransition, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { addRadiologyImage, deleteRadiologyImage } from '@/lib/actions/radiology.actions'
import { createClient } from '@/lib/supabase/client'
import type { RadiologyImage } from '@/lib/queries/radiology.queries'
import type { BLTooth } from '@/lib/services/bl-diagnosis.service'
import { X, ZoomIn } from 'lucide-react'

/** Avoid static import here — prevents Turbopack/runtime ReferenceError on some setups */
const BLRadiologyOverlay = dynamic(
  () => import('./BLRadiologyOverlay').then((m) => m.BLRadiologyOverlay),
  { ssr: false },
)

type RadiologyLightbox =
  | { kind: 'simple'; url: string; fileName: string }
  | { kind: 'bl'; url: string; fileName: string }

function formatBytes(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isImageMime(mimeType: string | null): boolean {
  return !!mimeType && mimeType.startsWith('image/')
}

const PREVIEW_URL_TTL_SEC = 3600

export default function RadiologyViewer({
  patientId,
  initialImages,
  blAnalysisTeeth,
}: {
  patientId: string
  initialImages: RadiologyImage[]
  /** When set, clicking an image opens AI bone-level analysis in a dialog */
  blAnalysisTeeth?: BLTooth[]
}) {
  const [images, setImages] = useState(initialImages)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)
  const [lightbox, setLightbox] = useState<RadiologyLightbox | null>(null)
  const [previewUrlsById, setPreviewUrlsById] = useState<Record<string, string>>({})

  useEffect(() => {
    let cancelled = false
    const imageRows = images.filter((row) => isImageMime(row.mimeType))
    if (imageRows.length === 0) {
      setPreviewUrlsById({})
      return
    }

    async function loadPreviews() {
      const supabase = createClient()
      const pairs = await Promise.all(
        imageRows.map(async (row) => {
          const { data } = await supabase.storage
            .from('documents')
            .createSignedUrl(row.filePath, PREVIEW_URL_TTL_SEC)
          return [row.id, data?.signedUrl ?? ''] as const
        }),
      )
      if (cancelled) return
      setPreviewUrlsById(
        Object.fromEntries(pairs.filter(([, url]) => url.length > 0)) as Record<string, string>,
      )
    }

    void loadPreviews()
    return () => {
      cancelled = true
    }
  }, [images])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null)
    setUploading(true)

    try {
      const urlRes = await fetch('/api/documents/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, fileName: file.name, category: 'radiology' }),
      })
      if (!urlRes.ok) throw new Error('Could not get upload URL')
      const { signedUrl, path } = await urlRes.json()

      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })
      if (!uploadRes.ok) throw new Error('Upload failed')

      const fd = new FormData()
      fd.set('patientId', patientId)
      fd.set('fileName', file.name)
      fd.set('filePath', path)
      fd.set('fileSize', String(file.size))
      fd.set('mimeType', file.type)
      const result = await addRadiologyImage(fd)
      if (result?.error) throw new Error(result.error)

      window.location.reload()
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function handleDelete(id: string, filePath: string) {
    startTransition(async () => {
      const result = await deleteRadiologyImage(id, filePath)
      if (!result?.error) {
        setImages((prev) => prev.filter((img) => img.id !== id))
      }
    })
  }

  async function openLightbox(img: RadiologyImage) {
    if (!isImageMime(img.mimeType)) {
      // For non-images (PDF, DICOM) open in new tab as before
      const supabase = createClient()
      const { data } = await supabase.storage.from('documents').createSignedUrl(img.filePath, 60)
      if (data?.signedUrl) window.open(data.signedUrl, '_blank')
      return
    }
    // For images, get a signed URL and show in modal
    const supabase = createClient()
    const { data } = await supabase.storage.from('documents').createSignedUrl(img.filePath, 60)
    if (data?.signedUrl) {
      if (blAnalysisTeeth && blAnalysisTeeth.length > 0) {
        setLightbox({ kind: 'bl', url: data.signedUrl, fileName: img.fileName })
      } else {
        setLightbox({ kind: 'simple', url: data.signedUrl, fileName: img.fileName })
      }
    }
  }

  return (
    <>
      <div className="space-y-6">
        {/* Upload */}
        <div className="bg-white rounded-xl border border-[#E4E7EE] shadow-[var(--shadow-card)] p-4">
          <h3 className="text-sm font-semibold text-[#030213] mb-3">Upload X-Ray / Image</h3>
          {uploadError ? <p className="text-xs text-[#d4183d] mb-2">{uploadError}</p> : null}
          <div className="flex items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.dcm,.pdf"
              onChange={handleUpload}
              disabled={uploading}
              className="text-sm text-[#717182] file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-[#E4E7EE] file:text-xs file:bg-white file:text-[#030213] hover:file:bg-[#F7F9FC] cursor-pointer"
            />
            {uploading ? <span className="text-xs text-[#717182]">Uploading…</span> : null}
          </div>
          <p className="text-xs text-[#717182] mt-2">Accepts: JPEG, PNG, DICOM (.dcm), PDF</p>
        </div>

        {/* Gallery */}
        <div>
          <h3 className="text-sm font-semibold text-[#030213] mb-3">Images ({images.length})</h3>
          {images.length === 0 ? (
            <p className="text-sm text-[#717182] italic">No radiology images uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="bg-white rounded-xl border border-[#E4E7EE] shadow-[var(--shadow-card)] overflow-hidden group"
                >
                  <button
                    type="button"
                    onClick={() => openLightbox(img)}
                    className="w-full h-28 bg-[#F7F9FC] flex items-center justify-center text-3xl hover:bg-[#E9EBEF] transition-colors relative overflow-hidden"
                  >
                    {isImageMime(img.mimeType) && previewUrlsById[img.id] ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewUrlsById[img.id]}
                          alt={img.fileName}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </>
                    ) : (
                      <span aria-hidden className="relative z-0">
                        {isImageMime(img.mimeType) ? '🩻' : '📄'}
                      </span>
                    )}
                    <span className="absolute inset-0 z-10 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none">
                      <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                    </span>
                  </button>
                  <div className="p-2">
                    <p className="text-xs font-medium text-[#030213] truncate">{img.fileName}</p>
                    <p className="text-[10px] text-[#717182]">
                      {new Date(img.createdAt).toLocaleDateString('en-GB')}
                      {img.fileSize ? ` · ${formatBytes(img.fileSize)}` : ''}
                    </p>
                  </div>
                  <div className="px-2 pb-2 flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-[10px] h-6"
                      onClick={() => openLightbox(img)}
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-[10px] h-6 text-[#d4183d] hover:text-[#d4183d] hover:bg-red-50"
                      disabled={isPending}
                      onClick={() => handleDelete(img.id, img.filePath)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI bone-level analysis (dialog) */}
      <Dialog
        open={lightbox?.kind === 'bl'}
        onOpenChange={(open) => {
          if (!open) setLightbox(null)
        }}
      >
        <DialogContent
          className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"
          showCloseButton
        >
          {lightbox?.kind === 'bl' && blAnalysisTeeth ? (
            <>
              <DialogHeader className="text-left">
                <DialogTitle
                  className="text-[13px] font-semibold text-slate-900"
                  style={{ fontFamily: 'var(--font-sora)' }}
                >
                  AI Bone Level Analysis
                </DialogTitle>
                <DialogDescription className="text-[10px] font-mono text-slate-400">
                  mock_BL.JSON · {lightbox.fileName}
                </DialogDescription>
              </DialogHeader>
              <BLRadiologyOverlay
                imageUrl={lightbox.url}
                teeth={blAnalysisTeeth}
                variant="embedded"
              />
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Simple image lightbox */}
      {lightbox?.kind === 'simple' && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightbox(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white flex items-center gap-1.5 text-[13px]"
            >
              <X className="w-4 h-4" /> Close
            </button>
            <p className="absolute -top-10 left-0 text-white/70 text-[12px] truncate max-w-[70%]">
              {lightbox.fileName}
            </p>
            <img
              src={lightbox.url}
              alt={lightbox.fileName}
              className="w-full h-full object-contain rounded-lg max-h-[85vh]"
            />
          </div>
        </div>
      )}
    </>
  )
}
