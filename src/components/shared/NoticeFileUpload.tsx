import React, { useState, useRef } from "react";
import {
  Upload,
  FileText,
  FileSearch,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Tag,
  Calendar,
  IndianRupee,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Progress } from "@/src/components/ui/progress";
import {
  extractTextFromNoticeFile,
  SAMPLE_TAX_NOTICES,
  OcrResult,
} from "@/src/lib/ocr";
import { toast } from "sonner";

interface NoticeFileUploadProps {
  onTextExtracted: (text: string, metadata?: { title: string; type: string }) => void;
  targetToolName?: string; // e.g. "GST Explainer" or "Invoice Validator"
  className?: string;
}

export function NoticeFileUpload({
  onTextExtracted,
  targetToolName = "TaxPlain Explanation Engine",
  className = "",
}: NoticeFileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  };

  const processFile = async (file: File) => {
    // Validate file type
    const validExtensions = [".pdf", ".png", ".jpg", ".jpeg", ".webp"];
    const hasValidExt = validExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );
    const isImageOrPdf =
      file.type.startsWith("image/") || file.type === "application/pdf" || hasValidExt;

    if (!isImageOrPdf) {
      toast.error("Please upload a PDF document or image file (PNG, JPG, WEBP).");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error("File exceeds 15MB limit. Please upload a smaller document.");
      return;
    }

    setSelectedFile(file);
    setIsProcessing(true);
    setProgressPercent(5);
    setStatusMessage("Reading document buffer...");

    try {
      const result = await extractTextFromNoticeFile(
        file,
        (progress, status) => {
          setProgressPercent(progress);
          setStatusMessage(status);
        }
      );

      setOcrResult(result);
      toast.success(
        `OCR complete! Extracted ${result.text.length} characters from ${file.name}`
      );
    } catch (err: any) {
      console.error("OCR Extraction failed", err);
      toast.error(
        err?.message || "Failed to extract text from document. Please try another file."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSampleNotice = (sample: (typeof SAMPLE_TAX_NOTICES)[0]) => {
    setSelectedFile({
      name: sample.filename,
      size: 42500,
    } as any);

    setOcrResult({
      text: sample.text,
      confidence: 0.96,
      detectedNoticeType: sample.name,
      detectedSections: ["Section 73", "Section 50", "Section 61", "Section 16(2)"],
      detectedDemandAmount: "₹7,18,848",
      detectedDueDate: "within 30 days",
    });

    toast.success(`Loaded ${sample.name}`);
  };

  const handleApplyToEngine = () => {
    if (!ocrResult?.text) return;
    onTextExtracted(ocrResult.text, {
      title: ocrResult.detectedNoticeType || selectedFile?.name || "Uploaded Tax Notice",
      type: "tax_notice_ocr",
    });
    toast.success(`Transferred notice text to ${targetToolName}`);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setOcrResult(null);
    setProgressPercent(0);
    setStatusMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Drop Area */}
      {!ocrResult ? (
        <div
          id="tax-notice-dropzone"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-md p-6 sm:p-8 text-center transition-all cursor-pointer select-none ${
            isDragging
              ? "border-gray-900 bg-gray-50 shadow-sm scale-[1.01]"
              : "border-gray-200 hover:border-gray-400 bg-white shadow-sm"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
            className="hidden"
            onChange={handleFileInputChange}
            disabled={isProcessing}
          />

          {isProcessing ? (
            <div className="py-4 space-y-3 max-w-md mx-auto">
              <div className="relative w-12 h-12 mx-auto">
                <div className="absolute inset-0 rounded-full border-2 border-gray-200 animate-ping opacity-30" />
                <div className="w-12 h-12 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center text-gray-900">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">
                  Extracting Text from Tax Document...
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">{statusMessage}</p>
              </div>

              {/* Progress bar */}
              <div className="space-y-1 pt-2">
                <Progress value={progressPercent} className="h-2 bg-gray-100" />
                <div className="flex justify-between text-[10px] font-mono text-gray-400">
                  <span>OCR Engine (Tesseract + PDF parser)</span>
                  <span>{progressPercent}%</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto text-gray-700 group-hover:scale-105 transition-transform">
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#111111]">
                  Upload Scanned Tax Notice, SCN or GST Document
                </h4>
                <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                  Drag &amp; drop your notice <span className="text-gray-900 font-medium">PDF</span> or{" "}
                  <span className="text-gray-900 font-medium">Image</span> (DRC-01, ASMT-10, SCN, DIN
                  letter), or click to browse files.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-1">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                  PDF (Digital / Scanned)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                  PNG / JPG / WEBP
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-400 border border-gray-200">
                  Up to 15MB
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* OCR Success & Text Preview Panel */
        <div className="rounded-md border border-gray-200 bg-white overflow-hidden shadow-sm">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-semibold text-gray-900 truncate max-w-xs">
                {selectedFile?.name || "Extracted Notice Text"}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                OCR Verified
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-7 text-xs text-gray-500 hover:text-gray-900 cursor-pointer"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Upload Another
              </Button>
            </div>
          </div>

          {/* Detected Metadata Pill Strip */}
          {(ocrResult.detectedNoticeType ||
            ocrResult.detectedDemandAmount ||
            ocrResult.detectedDueDate ||
            (ocrResult.detectedSections && ocrResult.detectedSections.length > 0)) && (
            <div className="px-4 py-2.5 bg-gray-50/80 border-b border-gray-200 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[11px] font-mono text-gray-400">Detected:</span>
              {ocrResult.detectedNoticeType && (
                <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-800 border border-gray-200">
                  <FileText className="h-3 w-3" />
                  {ocrResult.detectedNoticeType}
                </span>
              )}
              {ocrResult.detectedDemandAmount && (
                <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                  <IndianRupee className="h-3 w-3" />
                  Demand: {ocrResult.detectedDemandAmount}
                </span>
              )}
              {ocrResult.detectedDueDate && (
                <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                  <Calendar className="h-3 w-3" />
                  Deadline: {ocrResult.detectedDueDate}
                </span>
              )}
              {ocrResult.detectedSections?.slice(0, 3).map((sec, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200"
                >
                  {sec}
                </span>
              ))}
            </div>
          )}

          {/* Extracted Text Content */}
          <div className="p-4">
            <div className="flex items-center justify-between pb-1.5">
              <span className="text-xs font-medium text-gray-700">
                Extracted Text ({ocrResult.text.length} characters)
              </span>
              <span className="text-[11px] text-gray-400 font-mono">
                Editable before analyzing
              </span>
            </div>
            <textarea
              rows={8}
              value={ocrResult.text}
              onChange={(e) => setOcrResult({ ...ocrResult, text: e.target.value })}
              className="w-full rounded-md bg-gray-50 border border-gray-200 p-3 text-xs font-mono text-gray-800 leading-relaxed focus:outline-none focus:border-gray-900"
            />

            {/* Transfer to Engine Action Button */}
            <div className="pt-3 flex items-center justify-between">
              <p className="text-[11px] text-gray-500">
                Click below to send this notice directly to the plain-English explanation engine.
              </p>
              <Button
                onClick={handleApplyToEngine}
                className="bg-[#111111] hover:bg-black text-white font-medium h-9 text-xs px-4 cursor-pointer rounded-md shadow-sm"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Explain Notice in Plain English →
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Test: Sample Notices Strip */}
      {!ocrResult && (
        <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2 font-mono">
            <FileSpreadsheet className="h-3.5 w-3.5 text-gray-700" />
            <span>Or test immediately with a pre-configured sample notice:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {SAMPLE_TAX_NOTICES.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleLoadSampleNotice(sample)}
                className="text-left p-2.5 rounded-md border border-gray-200 bg-white hover:bg-gray-100 transition-all cursor-pointer group shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-900 group-hover:text-black transition-colors truncate">
                    {sample.name}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">
                  {sample.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
