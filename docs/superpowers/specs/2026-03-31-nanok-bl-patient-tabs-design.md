# Design: Nanok BL Diagnosis — Patient Page Tabs

**Date:** 2026-03-31
**Project:** perio-ai
**Scope:** Diagnostics, Charting, and Radiology tabs on the patient profile page (`/patients/[id]`)

---

## 1. Goal

Wire the existing `mock_BL.JSON` bone-level data through the existing periodontitis classification service and display the results in three tabs of the patient profile page:

| Tab | What to add |
|-----|------------|
| Diagnostics | `BLDiagnosisPanel` — Nanok-derived stage/grade/extent + per-tooth measurements |
| Charting | `AITeethDataPanel` — Per-tooth confidence, CEJ→BL distances |
| Radiology | `BLRadiologyOverlay` — X-ray image with bounding box + keypoint overlay + confidence slider |

No new API routes. No database changes. Mock data only for now.

---

## 2. Data Source

**File:** `lib/json/mock_BL.JSON`

Structure:
```json
{
  "input_dicom": "BW01.dcm",
  "pixel_spacing_mm": { "row": 0.08, "col": 0.08 },
  "teeth": [
    {
      "tooth_id": 21,
      "confidence": 0.92,
      "bounding_box": { "x1": 360, "y1": 280, "x2": 520, "y2": 460 },
      "keypoints": {
        "CEJ_left":  { "x": 380, "y": 310, "confidence": 0.91 },
        "CEJ_right": { "x": 500, "y": 312, "confidence": 0.89 },
        "BL_left":   { "x": 385, "y": 420, "confidence": 0.87 },
        "BL_right":  { "x": 495, "y": 425, "confidence": 0.90 }
      },
      "measurements_mm": { "left": { "CEJ_to_BL": 8.84 }, "right": { "CEJ_to_BL": 9.05 } }
    },
    { "tooth_id": 22, ... }
  ]
}
```

**Reference:** `lib/json/Staging_and_Grading_Periodontitis.json` (AAP/EFP 2017)

---

## 3. Data Flow

```
page.tsx (server component)
  ├── import blRaw from '@/lib/json/mock_BL.JSON'
  ├── const blDiagnosis = computeBLDiagnosis(blRaw, intake?.risk_factors)
  └── <PatientProfileTabs blData={blRaw} blDiagnosis={blDiagnosis} ... />
```

`computeBLDiagnosis` is a pure synchronous function — no network calls, executes at render time on the server.

---

## 4. New Service: `lib/services/bl-diagnosis.service.ts`

**Function:** `computeBLDiagnosis(blData, riskFactors?)`

Steps:
1. For each tooth, average `left.CEJ_to_BL` and `right.CEJ_to_BL`
2. Compute bone loss % = `(avg_CEJ_to_BL / 13.0) * 100` (13mm = assumed avg root length)
3. `maxBoneLossPct` = max across all teeth
4. Call existing `determineStage(maxBoneLossPct)` → Stage I/II/III
5. Call existing `determineGrade(riskFactors)` → Grade A/B/C + modifiers
6. Call existing `determineExtent(measurements)` → Localized / Generalized
7. Compose `fullDiagnosis` string: `"${extent} Periodontitis, ${stage}, ${grade}"`

Return type:
```ts
interface BLDiagnosis {
  stage: string
  grade: string
  extent: string
  fullDiagnosis: string
  maxBoneLossPct: number
  gradeModifiers: string[]
  teeth: BLTooth[]  // pass-through from blData.teeth
}
```

---

## 5. Component: `BLDiagnosisPanel` (Diagnostics tab)

**File:** `components/patients/BLDiagnosisPanel.tsx`
**Type:** Server component (pure display, no interactivity)

Renders above existing `PatientDiagnosisHistory`.

Layout:
```
┌─ Nanok AI Diagnosis ──────────────────────────────────┐
│  [Stage II]  [Grade B]  [Generalized]                 │
│  "Generalized Periodontitis, Stage II, Grade B"       │
│  Max bone loss: 69.6%                                 │
│  ──────────────────────────────────────────────────   │
│  Grade modifiers: Controlled diabetes (HbA1c < 7%)   │
│  Tooth 21: Left 8.84 mm · Right 9.05 mm              │
│  Tooth 22: Left 9.20 mm · Right 8.96 mm              │
└───────────────────────────────────────────────────────┘
```

Badges follow existing color convention:
- Stage: blue
- Grade: purple
- Extent: teal

---

## 6. Component: `AITeethDataPanel` (Charting tab)

**File:** `components/patients/AITeethDataPanel.tsx`
**Type:** Server component (pure display)

Renders below existing `ChartSummaryCard`.

Layout — table with one row per tooth:
```
┌─ AI Teeth Data (Nanok) ──────────────────────────────┐
│  Tooth │ Confidence │ CEJ→BL Left │ CEJ→BL Right     │
│  ──────┼────────────┼─────────────┼──────────────    │
│  21    │ ████░ 92%  │ 8.84 mm     │ 9.05 mm          │
│  22    │ ███░░ 88%  │ 9.20 mm     │ 8.96 mm          │
└──────────────────────────────────────────────────────┘
```

Confidence shown as a mini progress bar + percentage text.

---

## 7. Component: `BLRadiologyOverlay` (Radiology tab)

**File:** `components/radiology/BLRadiologyOverlay.tsx`
**Type:** `'use client'` (confidence slider requires `useState`)

Props:
```ts
{
  imageUrl: string        // first image from initialImages (Supabase signed URL)
  teeth: BLTooth[]        // from blData.teeth
  imageWidth: number      // from blData pixel dimensions (derived from bounding_box coords)
  imageHeight: number
}
```

Renders above existing `RadiologyViewer` upload/gallery.

Behavior:
- Confidence slider (0–100%) filters teeth whose `confidence >= threshold`
- Each visible tooth: teal border bounding box, tooth ID label, confidence %
- CEJ keypoints: small teal dots (4px circles)
- BL keypoints: small amber dots (4px circles)
- Bounding box positions are percentage-based (relative to rendered image size, not pixel coords)
- If `imageUrl` is empty/null: shows "No radiology image uploaded yet" placeholder

---

## 8. Changes to Existing Files

### `app/(dashboard)/patients/[id]/page.tsx`
- Add import: `blRaw` from `@/lib/json/mock_BL.JSON`
- Add import: `computeBLDiagnosis` from `@/lib/services/bl-diagnosis.service`
- Add import: `BLRadiologyOverlay`
- Compute `blDiagnosis` after existing fetches
- Extract `firstImageUrl` from `radiologyImages[0]` (signed URL)
- Pass `blData`, `blDiagnosis`, `firstImageUrl` as new props to `PatientProfileTabs`
- Charting tab: add `<AITeethDataPanel teeth={blRaw.teeth} />` below `ChartSummaryCard`
- Diagnostics tab: add `<BLDiagnosisPanel diagnosis={blDiagnosis} />` above `PatientDiagnosisHistory`
- Radiology tab: add `<BLRadiologyOverlay ... />` above `<RadiologyViewer />`

### `components/patients/PatientProfileTabs.tsx`
- Add `blData`, `blDiagnosis`, `firstImageUrl` to props interface
- Pass to charting, diagnostics, and radiology tab content

---

## 9. New Files Summary

| File | Purpose |
|------|---------|
| `lib/services/bl-diagnosis.service.ts` | Pure function: BL → Stage/Grade/Extent |
| `components/patients/BLDiagnosisPanel.tsx` | Diagnostics tab: diagnosis card |
| `components/patients/AITeethDataPanel.tsx` | Charting tab: per-tooth table |
| `components/radiology/BLRadiologyOverlay.tsx` | Radiology tab: image + boxes + slider |

---

## 10. Out of Scope

- Persisting BL data to Supabase
- Real nanok API integration (replace mock file)
- Editing/updating BL measurements in the UI
- PDF export of BL diagnosis
- Multi-image overlay (only first uploaded image used)
