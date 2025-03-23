"use client"

import { XCircle, Download, Printer, ZoomIn, ZoomOut, RotateCcw, RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PdfViewerProps {
  onClose: () => void
  documentUrl?: string
  documentTitle?: string
}

export function PdfViewer({ onClose, documentUrl, documentTitle = "Payment Receipt" }: PdfViewerProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900">
        <div className="flex-1 text-white font-medium truncate">{documentTitle}</div>
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" className="text-white hover:bg-slate-800" title="Zoom In">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-white hover:bg-slate-800" title="Zoom Out">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-white hover:bg-slate-800" title="Rotate Left">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-white hover:bg-slate-800" title="Rotate Right">
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-white hover:bg-slate-800" title="Print">
            <Printer className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-white hover:bg-slate-800" title="Download">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-white hover:bg-slate-800" onClick={onClose} title="Close">
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Viewer Placeholder */}
      <div className="flex-1 flex items-center justify-center">
        <div className="bg-white p-10 rounded shadow-lg max-w-3xl text-center">
          <p className="text-lg font-medium">Document Viewer Placeholder</p>
          <p className="mt-2 text-slate-500">
            This is a placeholder for the PDF viewer functionality. In a real implementation, this would display the actual document.
          </p>
          <p className="mt-6 text-sm text-slate-400">
            Document ID: {documentUrl || "No document URL provided"}
          </p>
        </div>
      </div>
    </div>
  )
}
