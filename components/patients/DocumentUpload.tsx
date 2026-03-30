'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { addDocumentMetadata } from '@/lib/actions/patient.actions'
import type { PatientDocument } from '@/lib/types/patient'
import { Upload, FileText, Trash2 } from 'lucide-react'

interface DocumentUploadProps {
  patientId: string
  documents: PatientDocument[]
}

const categories = ['general', 'xray', 'report', 'consent', 'referral', 'other']

export function DocumentUpload({ patientId, documents }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [category, setCategory] = useState('general')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (file: File) => {
    setUploading(true)
    setError(null)
    try {
      const res = await fetch('/api/documents/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, contentType: file.type, patientId }),
      })
      const { signedUrl, path, error: urlError } = await res.json()
      if (urlError) throw new Error(urlError)

      await fetch(signedUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })

      const result = await addDocumentMetadata({
        patient_id: patientId,
        name: file.name,
        category,
        storage_path: path,
        mime_type: file.type,
        size_bytes: file.size,
      })
      if ('error' in result) throw new Error(result.error)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-9 rounded-lg border border-[#E4E7EE] bg-white px-3 text-[13px] text-slate-700 capitalize"
        >
          {categories.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
        </select>
        <Button
          type="button"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="bg-teal-600 hover:bg-teal-700 h-9 text-[12px] font-semibold"
          style={{ fontFamily: 'var(--font-sora)' }}
        >
          <Upload className="w-3.5 h-3.5 mr-1.5" />
          {uploading ? 'Uploading…' : 'Upload file'}
        </Button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f) }}
        />
      </div>

      {error && <p className="text-[12px] text-red-600">{error}</p>}

      {documents.length === 0 ? (
        <p className="text-[13px] text-slate-400 py-4">No documents uploaded yet.</p>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-[#E4E7EE]">
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <div>
                  <a
                    href={`/api/documents/download?path=${encodeURIComponent(doc.file_path)}`}
                    className="text-[13px] font-medium text-slate-800 hover:text-teal-600"
                    target="_blank" rel="noopener noreferrer"
                  >
                    {doc.file_name}
                  </a>
                  <p className="text-[11px] text-slate-400 capitalize">{doc.category} · {new Date(doc.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <button className="text-slate-300 hover:text-red-500 transition-colors p-1">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
