'use client'

import { useState, useRef } from 'react'
import type { BLTooth } from '@/lib/services/bl-diagnosis.service'

function toPercent(value: number, total: number): string {
  return `${((value / total) * 100).toFixed(4)}%`
}

export function BLRadiologyOverlay({
  imageUrl,
  teeth,
}: {
  imageUrl: string | null
  teeth: BLTooth[]
}) {
  const [threshold, setThreshold] = useState(0.5)
  const [imgDims, setImgDims] = useState<{ w: number; h: number } | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  function handleImageLoad() {
    if (imgRef.current) {
      setImgDims({
        w: imgRef.current.naturalWidth,
        h: imgRef.current.naturalHeight,
      })
    }
  }

  const visibleTeeth = teeth.filter((t) => t.confidence >= threshold)

  return (
    <div
      className="bg-white rounded-2xl p-5 mb-4"
      style={{ boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-[13px] font-semibold text-slate-900"
          style={{ fontFamily: 'var(--font-sora)' }}
        >
          AI Bone Level Analysis
        </h3>
        <span className="text-[10px] text-slate-400 font-mono">mock_BL.JSON</span>
      </div>

      {/* Image + overlay */}
      {!imageUrl ? (
        <div className="h-40 flex items-center justify-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
          <p className="text-[12px] text-slate-400">
            No radiology image uploaded yet — upload one in the Radiology tab
          </p>
        </div>
      ) : (
        <>
          {/* Confidence slider — only shown when an image is present */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[11px] text-slate-500 whitespace-nowrap">
              Confidence threshold
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="flex-1 accent-teal-600"
              aria-label="Confidence threshold"
            />
            <span className="text-[12px] font-medium text-slate-700 tabular-nums w-10 text-right">
              {Math.round(threshold * 100)}%
            </span>
          </div>

          <div className="relative inline-block w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Dental X-ray"
              onLoad={handleImageLoad}
              className="w-full rounded-xl block"
            />

            {/* Bounding boxes — only rendered once image dimensions are known */}
            {imgDims &&
              visibleTeeth.map((tooth) => {
                const { x1, y1, x2, y2 } = tooth.bounding_box
                return (
                  <div
                    key={tooth.tooth_id}
                    // overflow-hidden prevents out-of-bounds keypoints from bleeding into
                    // adjacent boxes if live model output returns keypoints outside the box region
                    className="absolute border-2 border-teal-500 rounded overflow-hidden"
                    style={{
                      left: toPercent(x1, imgDims.w),
                      top: toPercent(y1, imgDims.h),
                      width: toPercent(x2 - x1, imgDims.w),
                      height: toPercent(y2 - y1, imgDims.h),
                    }}
                    aria-label={`Tooth ${tooth.tooth_id} bounding box`}
                  >
                    {/* Label */}
                    <span className="absolute -top-5 left-0 bg-teal-600 text-white text-[9px] font-semibold px-1 py-0.5 rounded whitespace-nowrap">
                      T{tooth.tooth_id} · {Math.round(tooth.confidence * 100)}%
                    </span>

                    {/* CEJ keypoints — teal dots */}
                    {(['CEJ_left', 'CEJ_right'] as const).map((kp) => {
                      const point = tooth.keypoints[kp]
                      if (point.confidence < threshold) return null
                      return (
                        <div
                          key={kp}
                          className="absolute w-2 h-2 rounded-full bg-teal-400 border border-white -translate-x-1/2 -translate-y-1/2"
                          style={{
                            left: toPercent(point.x - x1, x2 - x1),
                            top: toPercent(point.y - y1, y2 - y1),
                          }}
                          title={`${kp}: ${(point.confidence * 100).toFixed(0)}%`}
                        />
                      )
                    })}

                    {/* BL keypoints — amber dots */}
                    {(['BL_left', 'BL_right'] as const).map((kp) => {
                      const point = tooth.keypoints[kp]
                      if (point.confidence < threshold) return null
                      return (
                        <div
                          key={kp}
                          className="absolute w-2 h-2 rounded-full bg-amber-400 border border-white -translate-x-1/2 -translate-y-1/2"
                          style={{
                            left: toPercent(point.x - x1, x2 - x1),
                            top: toPercent(point.y - y1, y2 - y1),
                          }}
                          title={`${kp}: ${(point.confidence * 100).toFixed(0)}%`}
                        />
                      )
                    })}
                  </div>
                )
              })}
          </div>
        </>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-teal-400 border border-white ring-1 ring-teal-500" aria-hidden="true" />
          <span className="text-[11px] text-slate-500">CEJ</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-amber-400 border border-white ring-1 ring-amber-500" aria-hidden="true" />
          <span className="text-[11px] text-slate-500">Bone Level</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-3 border-2 border-teal-500 rounded" aria-hidden="true" />
          <span className="text-[11px] text-slate-500">Tooth bounding box</span>
        </div>
        <span className="ml-auto text-[11px] text-slate-400">
          {visibleTeeth.length} / {teeth.length} teeth shown
        </span>
      </div>
    </div>
  )
}
