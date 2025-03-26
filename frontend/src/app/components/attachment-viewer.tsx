"use client"

import { X, Download, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AttachmentViewerProps {
  url: string
  onClose: () => void
}

export function AttachmentViewer({ url, onClose }: AttachmentViewerProps) {
  const isPdf = url.endsWith(".pdf")
  const fileName = url.split("/").pop() || "attachment"

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-slate-600" />
          <h3 className="font-medium text-slate-900">{fileName}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => window.open(url, "_blank")}
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-slate-100 p-6">
        <div className="mx-auto max-w-3xl rounded-md bg-white p-2 shadow-sm">
          {isPdf ? (
            <iframe
              src={`${url}#toolbar=0&navpanes=0`}
              className="h-full w-full min-h-[calc(100vh-180px)] rounded-md border border-slate-200"
            />
          ) : (
            <div className="flex h-full min-h-[calc(100vh-180px)] items-center justify-center">
              <img
                src={url || "/placeholder.svg"}
                alt="Attachment"
                className="max-h-full max-w-full rounded-md object-contain"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
