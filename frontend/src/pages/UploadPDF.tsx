import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle, AlertCircle, RefreshCw, ArrowRight, ChevronRight } from 'lucide-react';
import { api } from '../api';
import { Report } from '../types';
import { formatDate, getBiomarkerStatus, formatReferenceRange } from '../utils';

export default function UploadPDF() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedReport, setParsedReport] = useState<Report | null>(null);

  // Drag-and-drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
      } else {
        setError('Unsupported file type. Please upload a PDF file.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
      } else {
        setError('Unsupported file type. Please upload a PDF file.');
      }
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;
    
    setUploading(true);
    setError(null);
    setParsedReport(null);

    try {
      const report = await api.uploadPdf(selectedFile);
      setParsedReport(report);
    } catch (err: any) {
      setError(err.message || 'PDF parsing failed. Please check the file and try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setParsedReport(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6" id="upload-pdf-root">
      <div>
        <h3 className="text-2xl font-bold text-slate-900 leading-tight">Upload Lab Report PDF</h3>
        <p className="text-base text-slate-500 mt-1">
          Our secure parser automatically extracts clinical biomarkers, dates, and reference bounds from your lab result documents.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-start gap-3" id="upload-error-banner">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Upload Failed</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Main interactive upload container */}
      {!parsedReport ? (
        <div className="max-w-xl mx-auto" id="upload-stage-wrapper">
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 py-12 text-center transition-all cursor-pointer min-h-[220px] ${
              dragActive
                ? 'border-teal-700 bg-teal-50/30'
                : selectedFile
                ? 'border-teal-600 bg-teal-50/10'
                : 'border-slate-300 bg-white hover:border-teal-600 hover:bg-slate-50/50'
            }`}
            id="drag-drop-zone"
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="application/pdf"
              onChange={handleFileChange}
              disabled={uploading}
            />

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 border border-teal-100 mb-4 shadow-sm">
              <Upload className="h-7 w-7" />
            </div>

            {selectedFile ? (
              <div className="space-y-2">
                <p className="text-lg font-bold text-slate-950 truncate max-w-sm">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-slate-500">
                  Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to Parse
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-lg font-bold text-slate-900">
                  Drag and drop your PDF report here
                </p>
                <p className="text-base text-slate-500">
                  or <span className="font-bold text-teal-700 hover:underline">browse your local files</span>
                </p>
                <p className="text-xs text-slate-400 font-medium">
                  Supports standard laboratory PDF scan formats (Max size 10MB)
                </p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          {selectedFile && (
            <div className="mt-5 flex justify-end gap-3" id="upload-actions">
              <button
                type="button"
                onClick={handleReset}
                disabled={uploading}
                className="flex min-h-[44px] items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-base font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                id="reset-upload-btn"
              >
                Clear Selection
              </button>
              <button
                type="button"
                onClick={handleUploadSubmit}
                disabled={uploading}
                className="flex flex-1 min-h-[44px] items-center justify-center gap-2 rounded-lg bg-teal-700 px-6 text-base font-bold text-white hover:bg-teal-800 active:bg-teal-900 disabled:bg-slate-200 disabled:text-slate-400 transition-colors shadow-sm"
                id="submit-parse-btn"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span>Analyzing Document...</span>
                  </>
                ) : (
                  <>
                    <span>Extract Biomarkers</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Review Screen State - Show parsed results preview, do not auto-navigate away */
        <div className="space-y-6" id="parsing-review-screen">
          <div className="rounded-xl border border-teal-200 bg-teal-50/55 p-5 flex items-start gap-4 shadow-sm" id="parse-success-banner">
            <CheckCircle className="h-6 w-6 text-teal-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-teal-950">PDF Scanned & Extracted Successfully!</h4>
              <p className="text-base text-teal-900">
                Please review the parsed results below. We detected <strong>{parsedReport.report_data.length} biomarkers</strong>. 
                Before adding these values to your clinical historical trends, you must verify the details.
              </p>
            </div>
          </div>

          {/* Parsed Metadata Summary */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4" id="review-meta-summary">
            <h5 className="text-base font-bold text-slate-400 uppercase tracking-wider">Extracted Laboratory Metadata</h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <p className="text-sm font-semibold text-slate-500">Document Label</p>
                <p className="text-lg font-bold text-slate-900">{parsedReport.report_metadata.file_name || 'Lab Report'}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">Collection Date</p>
                <p className="text-lg font-bold text-slate-900">{formatDate(parsedReport.report_metadata.collection_date)}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">Laboratory Facility</p>
                <p className="text-lg font-bold text-slate-900">{parsedReport.report_metadata.lab_name || 'Not Recorded'}</p>
              </div>
            </div>
          </div>

          {/* Parsed Values Preview Table */}
          <div className="space-y-3">
            <h5 className="text-lg font-bold text-slate-900 px-1">Biomarker Values Preview</h5>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white" id="preview-table-wrapper">
              <table className="w-full text-left border-collapse" id="preview-table">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-6">Biomarker</th>
                    <th className="py-3.5 px-6 text-right">Extracted Value</th>
                    <th className="py-3.5 px-6">Unit</th>
                    <th className="py-3.5 px-6 text-center">Status</th>
                    <th className="py-3.5 px-6">Normal reference range</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-base text-slate-700">
                  {parsedReport.report_data.map((item, idx) => {
                    const statusDetails = getBiomarkerStatus(item);
                    return (
                      <tr key={`${item.test_name}-${idx}`} className="bg-white" id={`preview-row-${idx}`}>
                        <td className="py-3 px-6 font-bold text-slate-900">{item.test_name}</td>
                        <td className="py-3 px-6 text-right font-bold text-slate-900 tabular-nums">{item.value}</td>
                        <td className="py-3 px-6 text-slate-500">{item.unit || '—'}</td>
                        <td className="py-3 px-6 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${statusDetails.colorClass}`}>
                            {statusDetails.status}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-sm font-semibold text-slate-500 tabular-nums">
                          {formatReferenceRange(item.lower_bound, item.upper_bound, item.unit)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action buttons to go verify */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-100/70 border border-slate-200 p-5 rounded-xl" id="review-cta-bar">
            <div>
              <p className="text-base font-bold text-slate-900">Are these values correct?</p>
              <p className="text-sm text-slate-500">Go to the detail page to finalize verification and update your charts.</p>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleReset}
                className="flex flex-1 sm:flex-none min-h-[44px] items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-base font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors"
                id="parse-upload-another-btn"
              >
                Scan Another PDF
              </button>
              <button
                type="button"
                onClick={() => navigate(`/reports/${parsedReport.report_id}`)}
                className="flex flex-1 sm:flex-none min-h-[44px] items-center justify-center gap-2 rounded-lg bg-teal-700 px-6 text-base font-bold text-white hover:bg-teal-800 active:bg-teal-900 transition-colors"
                id="review-verify-cta-btn"
              >
                <span>Verify and Log Report</span>
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
