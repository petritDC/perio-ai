import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'
import type { ChartWithTeeth, ToothData } from '@/lib/types/charting'
import type { AIDiagnosis } from '@/lib/types/diagnosis'

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#1a1a2e' },
  header: { marginBottom: 24 },
  title: { fontSize: 20, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  subtitle: { fontSize: 10, color: '#717182' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginBottom: 8, borderBottom: '1px solid #E4E7EE', paddingBottom: 4 },
  row: { flexDirection: 'row', marginBottom: 4 },
  label: { width: 140, color: '#717182' },
  value: { flex: 1 },
  table: { marginTop: 8 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#F7F9FC', padding: '4 6', borderBottom: '1px solid #E4E7EE' },
  tableRow: { flexDirection: 'row', padding: '3 6', borderBottom: '1px solid #f0f0f0' },
  col1: { width: 50 }, col2: { width: 60 }, col3: { width: 60 }, col4: { width: 60 }, col5: { width: 60 }, col6: { flex: 1 },
  bold: { fontFamily: 'Helvetica-Bold' },
  badge: { backgroundColor: '#E9EBEF', padding: '2 6', borderRadius: 4, marginRight: 6, fontSize: 9 },
  diagSection: { backgroundColor: '#F7F9FC', padding: 12, borderRadius: 4, marginTop: 8 },
  stageText: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#0D9488' },
  recommendation: { marginBottom: 3 },
  statsRow: { flexDirection: 'row', marginTop: 8, marginBottom: 8 },
  statCell: { marginRight: 16 },
  statLabel: { color: '#717182', fontSize: 8 },
  recHeader: { fontFamily: 'Helvetica-Bold', marginBottom: 4, fontSize: 9 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40 },
  footerText: { fontSize: 8, color: '#717182', textAlign: 'center' },
})

// Hoisted to module level — static for the lifetime of the module (server-hoist-static-io)
const GENERATED_DATE = new Date().toLocaleDateString('en-GB')

function maxPD(tooth: ToothData): number {
  const vals = [tooth.pdDb, tooth.pdB, tooth.pdMb, tooth.pdDl, tooth.pdL, tooth.pdMl]
  return Math.max(...vals.filter((v): v is number => v !== null), 0)
}

function bopCount(tooth: ToothData): number {
  return [tooth.bopDb, tooth.bopB, tooth.bopMb, tooth.bopDl, tooth.bopL, tooth.bopMl].filter(Boolean).length
}

interface ReportDocumentProps {
  chart: ChartWithTeeth
  patientName: string
  providerName: string
  diagnosis: AIDiagnosis | null
}

export function ReportDocument({ chart, patientName, providerName, diagnosis }: ReportDocumentProps) {
  const recordedTeeth = chart.teeth.filter((t) => !t.missing).sort((a, b) => a.toothNumber - b.toothNumber)

  return (
    <Document title={`Periodontal Chart Report — ${patientName}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Periodontal Chart Report</Text>
          <Text style={styles.subtitle}>PerioAI Practice Management System</Text>
        </View>

        {/* Patient Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient Information</Text>
          <View style={styles.row}><Text style={styles.label}>Patient:</Text><Text style={styles.value}>{patientName}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Provider:</Text><Text style={styles.value}>{providerName}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Chart Date:</Text><Text style={styles.value}>{chart.chartDate}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Status:</Text><Text style={styles.value}>{chart.status.toUpperCase()}</Text></View>
          {chart.notes ? <View style={styles.row}><Text style={styles.label}>Notes:</Text><Text style={styles.value}>{chart.notes}</Text></View> : null}
        </View>

        {/* Diagnosis Summary */}
        {diagnosis ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Diagnosis Summary</Text>
            <View style={styles.diagSection}>
              <Text style={styles.stageText}>{diagnosis.stage} — {diagnosis.grade} — {diagnosis.extent}</Text>
              <View style={styles.statsRow}>
                <View style={styles.statCell}>
                  <Text style={styles.statLabel}>Mean Max PD</Text>
                  <Text style={styles.bold}>{diagnosis.findings.meanMaxPD}mm</Text>
                </View>
                <View style={styles.statCell}>
                  <Text style={styles.statLabel}>BOP%</Text>
                  <Text style={styles.bold}>{diagnosis.findings.bopPercent}%</Text>
                </View>
                <View>
                  <Text style={styles.statLabel}>Affected Teeth</Text>
                  <Text style={styles.bold}>{diagnosis.findings.affectedTeethCount}</Text>
                </View>
              </View>
              {diagnosis.findings.recommendations.length > 0 ? (
                <View>
                  <Text style={styles.recHeader}>Recommendations:</Text>
                  {diagnosis.findings.recommendations.map((r, i) => (
                    <Text key={i} style={styles.recommendation}>• {r}</Text>
                  ))}
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* Tooth Data Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tooth Measurements</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.col1}>Tooth</Text>
              <Text style={styles.col2}>Max PD</Text>
              <Text style={styles.col3}>BOP</Text>
              <Text style={styles.col4}>Furc.</Text>
              <Text style={styles.col5}>Mob.</Text>
              <Text style={styles.col6}>Flags</Text>
            </View>
            {recordedTeeth.map((tooth) => {
              // Compute once per tooth — avoid double-calling maxPD/bopCount (js-cache-function-results)
              const pd = maxPD(tooth)
              const bop = bopCount(tooth)
              const flags = [tooth.implant ? 'Impl.' : '', tooth.missing ? 'Miss.' : ''].filter(Boolean).join(' ') || '—'
              return (
                <View key={tooth.toothNumber} style={styles.tableRow}>
                  <Text style={styles.col1}>{tooth.toothNumber}</Text>
                  <Text style={styles.col2}>{pd > 0 ? `${pd}mm` : '—'}</Text>
                  <Text style={styles.col3}>{bop > 0 ? `${bop}/6` : '—'}</Text>
                  <Text style={styles.col4}>{tooth.furcation > 0 ? tooth.furcation : '—'}</Text>
                  <Text style={styles.col5}>{tooth.mobility > 0 ? tooth.mobility : '—'}</Text>
                  <Text style={styles.col6}>{flags}</Text>
                </View>
              )
            })}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated by PerioAI PMS on {GENERATED_DATE} — Confidential Patient Record
          </Text>
        </View>
      </Page>
    </Document>
  )
}
