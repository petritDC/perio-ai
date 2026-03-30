'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react'
import {
  createTreatmentPlan,
  updatePlanItem,
  addPlanItem,
  deletePlanItem,
} from '@/lib/actions/treatment-plan.actions'
import type {
  TreatmentPlanWithItems,
  TreatmentPlanItem,
  PlanStatus,
  ItemStatus,
} from '@/lib/types/treatment-plan'

// ─── Badge helpers ────────────────────────────────────────────────────────────

const planStatusStyles: Record<PlanStatus, string> = {
  draft: 'bg-slate-100 text-slate-600',
  active: 'bg-teal-50 text-teal-700',
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-600',
}

const itemStatusStyles: Record<ItemStatus, string> = {
  pending: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-amber-50 text-amber-700',
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-600',
}

function PlanBadge({ status }: { status: PlanStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${planStatusStyles[status]}`}
      style={{ fontFamily: 'var(--font-sora)' }}
    >
      {status.replace('_', ' ')}
    </span>
  )
}

function ItemBadge({ status }: { status: ItemStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${itemStatusStyles[status]}`}
      style={{ fontFamily: 'var(--font-sora)' }}
    >
      {status.replace('_', ' ')}
    </span>
  )
}

// ─── Add Item inline form ─────────────────────────────────────────────────────

function AddItemForm({
  planId,
  onDone,
}: {
  planId: string
  onDone: () => void
}) {
  const router = useRouter()
  const [description, setDescription] = useState('')
  const [toothNumber, setToothNumber] = useState('')
  const [procedureCode, setProcedureCode] = useState('')
  const [priority, setPriority] = useState('1')
  const [estimatedCost, setEstimatedCost] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!description.trim()) {
      setError('Description is required.')
      return
    }
    setSubmitting(true)
    const result = await addPlanItem({
      planId,
      description: description.trim(),
      toothNumber: toothNumber ? Number(toothNumber) : undefined,
      procedureCode: procedureCode.trim() || undefined,
      priority: Number(priority),
      estimatedCost: estimatedCost ? Number(estimatedCost) : undefined,
    })
    setSubmitting(false)
    if ('error' in result) {
      setError(result.error)
      return
    }
    router.refresh()
    onDone()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 p-4 bg-[#F7F9FC] rounded-xl border border-[#E4E7EE] space-y-3"
    >
      <p className="text-[12px] font-semibold text-slate-700 uppercase tracking-wide" style={{ fontFamily: 'var(--font-sora)' }}>
        Add Item
      </p>

      <div>
        <label className="block text-[11px] font-medium text-slate-500 mb-1" style={{ fontFamily: 'var(--font-sora)' }}>
          Description <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Scaling and root planing"
          className="w-full h-8 px-3 text-[13px] rounded-lg border border-[#E4E7EE] bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-slate-800"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1" style={{ fontFamily: 'var(--font-sora)' }}>
            Tooth #
          </label>
          <input
            type="number"
            value={toothNumber}
            onChange={(e) => setToothNumber(e.target.value)}
            placeholder="e.g. 14"
            className="w-full h-8 px-3 text-[13px] rounded-lg border border-[#E4E7EE] bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-slate-800"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1" style={{ fontFamily: 'var(--font-sora)' }}>
            Procedure Code
          </label>
          <input
            type="text"
            value={procedureCode}
            onChange={(e) => setProcedureCode(e.target.value)}
            placeholder="e.g. D4341"
            className="w-full h-8 px-3 text-[13px] rounded-lg border border-[#E4E7EE] bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-slate-800"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1" style={{ fontFamily: 'var(--font-sora)' }}>
            Priority (1–5)
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full h-8 px-3 text-[13px] rounded-lg border border-[#E4E7EE] bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-slate-800"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1" style={{ fontFamily: 'var(--font-sora)' }}>
            Est. Cost ($)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={estimatedCost}
            onChange={(e) => setEstimatedCost(e.target.value)}
            placeholder="e.g. 250"
            className="w-full h-8 px-3 text-[13px] rounded-lg border border-[#E4E7EE] bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-slate-800"
          />
        </div>
      </div>

      {error && (
        <p className="text-[12px] text-red-500">{error}</p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={submitting}
          className="h-7 px-3 text-[12px] font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
          style={{ fontFamily: 'var(--font-sora)' }}
        >
          {submitting ? 'Adding…' : 'Add Item'}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="h-7 px-3 text-[12px] font-medium rounded-lg border border-[#E4E7EE] text-slate-500 hover:text-slate-700 transition-colors"
          style={{ fontFamily: 'var(--font-sora)' }}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

// ─── Single plan item row ─────────────────────────────────────────────────────

function PlanItemRow({ item }: { item: TreatmentPlanItem }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  async function handleStatusChange(newStatus: ItemStatus) {
    setUpdatingStatus(true)
    await updatePlanItem(item.id, { status: newStatus })
    setUpdatingStatus(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('Delete this item?')) return
    setDeleting(true)
    await deletePlanItem(item.id)
    setDeleting(false)
    router.refresh()
  }

  return (
    <div className="flex items-start gap-3 py-3 border-b border-[#E4E7EE] last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="text-[13px] font-medium text-slate-800">{item.description}</span>
          {item.toothNumber !== null && (
            <span className="text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
              Tooth #{item.toothNumber}
            </span>
          )}
          {item.procedureCode && (
            <span className="text-[11px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-mono">
              {item.procedureCode}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
          <span>Priority: {item.priority}</span>
          {item.estimatedCost !== null && (
            <span>${item.estimatedCost.toLocaleString()}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <select
          value={item.status}
          onChange={(e) => handleStatusChange(e.target.value as ItemStatus)}
          disabled={updatingStatus}
          className="h-6 px-2 text-[11px] rounded-md border border-[#E4E7EE] bg-white focus:outline-none focus:ring-1 focus:ring-teal-500/40 text-slate-700 disabled:opacity-50"
          style={{ fontFamily: 'var(--font-sora)' }}
        >
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <ItemBadge status={item.status} />
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-1 text-slate-300 hover:text-red-400 transition-colors disabled:opacity-40"
          title="Delete item"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Single plan card ─────────────────────────────────────────────────────────

function PlanCard({ plan }: { plan: TreatmentPlanWithItems }) {
  const [expanded, setExpanded] = useState(false)
  const [showAddItem, setShowAddItem] = useState(false)

  const createdDate = new Date(plan.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div
      className="bg-white rounded-xl border border-[#E4E7EE]"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      {/* Header */}
      <button
        className="w-full flex items-center gap-3 p-4 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="text-slate-400 shrink-0">
          {expanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[14px] font-semibold text-slate-900"
              style={{ fontFamily: 'var(--font-sora)' }}
            >
              {plan.title}
            </span>
            <PlanBadge status={plan.status} />
            <span className="text-[11px] text-slate-400 ml-auto">
              {createdDate}
            </span>
          </div>
          {plan.description && (
            <p className="text-[12px] text-slate-500 mt-0.5 truncate">
              {plan.description}
            </p>
          )}
        </div>
        <span className="text-[11px] text-slate-400 shrink-0">
          {plan.items.length} item{plan.items.length !== 1 ? 's' : ''}
        </span>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-[#E4E7EE]">
          {plan.items.length === 0 ? (
            <p className="text-[12px] text-slate-400 italic py-3">No items yet.</p>
          ) : (
            <div className="mt-1">
              {plan.items.map((item) => (
                <PlanItemRow key={item.id} item={item} />
              ))}
            </div>
          )}

          {showAddItem ? (
            <AddItemForm planId={plan.id} onDone={() => setShowAddItem(false)} />
          ) : (
            <button
              onClick={() => setShowAddItem(true)}
              className="mt-3 flex items-center gap-1.5 text-[12px] font-medium text-teal-600 hover:text-teal-700 transition-colors"
              style={{ fontFamily: 'var(--font-sora)' }}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Item
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── New Plan inline form ─────────────────────────────────────────────────────

function NewPlanForm({
  patientId,
  onDone,
}: {
  patientId: string
  onDone: () => void
}) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!title.trim()) {
      setError('Title is required.')
      return
    }
    setSubmitting(true)
    const fd = new FormData()
    fd.append('patientId', patientId)
    fd.append('title', title.trim())
    if (description.trim()) fd.append('description', description.trim())
    const result = await createTreatmentPlan(fd)
    setSubmitting(false)
    if ('error' in result) {
      setError(result.error)
      return
    }
    router.refresh()
    onDone()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border border-[#E4E7EE] p-4 space-y-3"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <p
        className="text-[12px] font-semibold text-slate-700 uppercase tracking-wide"
        style={{ fontFamily: 'var(--font-sora)' }}
      >
        New Treatment Plan
      </p>

      <div>
        <label
          className="block text-[11px] font-medium text-slate-500 mb-1"
          style={{ fontFamily: 'var(--font-sora)' }}
        >
          Title <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Phase 1 – Periodontal Therapy"
          className="w-full h-8 px-3 text-[13px] rounded-lg border border-[#E4E7EE] bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-slate-800"
        />
      </div>

      <div>
        <label
          className="block text-[11px] font-medium text-slate-500 mb-1"
          style={{ fontFamily: 'var(--font-sora)' }}
        >
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Optional notes about this plan…"
          className="w-full px-3 py-2 text-[13px] rounded-lg border border-[#E4E7EE] bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-slate-800 resize-none"
        />
      </div>

      {error && <p className="text-[12px] text-red-500">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={submitting}
          className="h-7 px-3 text-[12px] font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
          style={{ fontFamily: 'var(--font-sora)' }}
        >
          {submitting ? 'Creating…' : 'Create Plan'}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="h-7 px-3 text-[12px] font-medium rounded-lg border border-[#E4E7EE] text-slate-500 hover:text-slate-700 transition-colors"
          style={{ fontFamily: 'var(--font-sora)' }}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function TreatmentPlansPanel({
  patientId,
  initialPlans,
}: {
  patientId: string
  initialPlans: TreatmentPlanWithItems[]
}) {
  const [showNewPlan, setShowNewPlan] = useState(false)

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h3
          className="text-[15px] font-semibold text-slate-900"
          style={{ fontFamily: 'var(--font-sora)' }}
        >
          Treatment Plans
        </h3>
        {!showNewPlan && (
          <button
            onClick={() => setShowNewPlan(true)}
            className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors"
            style={{ fontFamily: 'var(--font-sora)' }}
          >
            <Plus className="w-3.5 h-3.5" />
            New Plan
          </button>
        )}
      </div>

      {/* New plan form */}
      {showNewPlan && (
        <NewPlanForm patientId={patientId} onDone={() => setShowNewPlan(false)} />
      )}

      {/* Plans list */}
      {initialPlans.length === 0 && !showNewPlan ? (
        <div
          className="bg-white rounded-xl p-8 text-center border border-[#E4E7EE]"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          <p className="text-[13px] text-slate-400 italic">No treatment plans yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {initialPlans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}
    </div>
  )
}
