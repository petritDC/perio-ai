'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface JsonOutputModalProps {
  open: boolean
  onClose: () => void
  generatedJson: object | null
  finalJson: object | null
}

export function JsonOutputModal({ open, onClose, generatedJson, finalJson }: JsonOutputModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col bg-white">
        <DialogHeader>
          <DialogTitle className="text-[16px] font-semibold text-slate-900" style={{ fontFamily: 'var(--font-sora)' }}>
            Intake Output
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="generated" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="bg-slate-100 rounded-lg p-1 w-fit">
            <TabsTrigger value="generated" className="text-[12px] font-medium rounded-md data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm">
              Generated JSON
            </TabsTrigger>
            <TabsTrigger value="analysis" className="text-[12px] font-medium rounded-md data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm">
              Full Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generated" className="flex-1 overflow-auto mt-3">
            <pre className="text-[12px] bg-slate-50 rounded-xl p-4 overflow-auto max-h-[50vh] text-slate-700 leading-relaxed" style={{ fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace' }}>
              {generatedJson ? JSON.stringify(generatedJson, null, 2) : 'No data'}
            </pre>
          </TabsContent>

          <TabsContent value="analysis" className="flex-1 overflow-auto mt-3">
            <pre className="text-[12px] bg-slate-50 rounded-xl p-4 overflow-auto max-h-[50vh] text-slate-700 leading-relaxed" style={{ fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace' }}>
              {finalJson ? JSON.stringify(finalJson, null, 2) : 'Loading analysis…'}
            </pre>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
