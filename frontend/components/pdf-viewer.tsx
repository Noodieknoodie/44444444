// Simple PDF viewer for the split screen
"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { documentsApi } from "@/lib/api";

interface Document {
  file_path: string;
  file_name: string;
}

interface PdfViewerProps {
  selectedClient: string | null;
  togglePdfViewer: () => void;
}

export function PdfViewer({ selectedClient, togglePdfViewer }: PdfViewerProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeDocumentIndex, setActiveDocumentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // This would normally fetch documents for the selected payment
  // For now, we're just showing a placeholder
  useEffect(() => {
    setLoading(true);

    // Placeholder for now - this would be replaced with actual document fetching
    const placeholderDoc: Document = {
      file_path: "/api/placeholder/400/320",
      file_name: "Sample Document.pdf"
    };

    setDocuments([placeholderDoc]);
    setLoading(false);
  }, [selectedClient]);

  if (loading) {
    return (
      <div className="h-full border-l bg-white p-4 flex flex-col overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Loading Document...</h2>
          <Button variant="ghost" size="sm" onClick={togglePdfViewer}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse h-80 w-full bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full border-l bg-white p-4 flex flex-col overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Error</h2>
          <Button variant="ghost" size="sm" onClick={togglePdfViewer}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center text-red-500">
          {error}
        </div>
      </div>
    );
  }

  const activeDocument = documents[activeDocumentIndex];

  return (
    <div className="h-full border-l bg-white p-4 flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold truncate">
          {activeDocument?.file_name || "Document Viewer"}
        </h2>
        <Button variant="ghost" size="sm" onClick={togglePdfViewer}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        {/* This would be replaced with a real PDF viewer in production */}
        <div className="bg-gray-100 rounded p-4 text-center">
          <p>This is a placeholder for the PDF viewer.</p>
          <p className="my-4">In production, this would display the actual document.</p>
          <p>Document path: {activeDocument?.file_path}</p>

          {/* Placeholder representation */}
          <div className="mt-4 border border-gray-300 p-8 bg-white rounded shadow-sm">
            <div className="border-b border-gray-300 pb-4 mb-4">
              <div className="h-6 w-3/4 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 w-1/2 bg-gray-300 rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full bg-gray-300 rounded"></div>
              <div className="h-3 w-full bg-gray-300 rounded"></div>
              <div className="h-3 w-2/3 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      {documents.length > 1 && (
        <div className="pt-4 border-t mt-4 flex justify-center gap-2">
          {documents.map((_, index) => (
            <Button
              key={index}
              variant={index === activeDocumentIndex ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveDocumentIndex(index)}
            >
              {index + 1}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}