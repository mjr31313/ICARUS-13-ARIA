import React, { useState } from 'react';
import { Download, CheckCircle2, X, FolderArchive, FileCheck } from 'lucide-react';
import { createZipArchive } from '../services/zipService';
import { getEmbeddedCodebaseFiles, ProjectFile } from '../services/codebaseManifest';

interface ZipExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ZipExportModal: React.FC<ZipExportModalProps> = ({ isOpen, onClose }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  // Active files inventory
  const activeFileList = [
    'metadata.json',
    'index.html',
    'index.tsx',
    'App.tsx',
    'types.ts',
    'mockData.ts',
    'public/brand.svg',
    'components/BrandLogos.tsx',
    'components/Header.tsx',
    'components/Sidebar.tsx',
    'components/AriaChatView.tsx',
    'components/AriaDrawer.tsx',
    'components/EHRView.tsx',
    'components/DicomSliceViewer.tsx',
    'components/ClinicalRiskMatrixView.tsx',
    'components/SbarTraumaHandoverSimulator.tsx',
    'components/EncounterStudio.tsx',
    'components/VersionDiffDrawer.tsx',
    'components/ArchitectureInspector.tsx',
    'components/EncounterReplayModal.tsx',
    'components/OperationalEvidenceView.tsx',
    'components/GuidedDemoController.tsx',
    'components/ZipExportModal.tsx',
    'services/auditStore.ts',
    'services/hospitalAdapters.ts',
    'services/clinicalRiskEngine.ts',
    'services/orchestrationEngine.ts',
    'services/geminiService.ts',
    'services/fhirTransformer.ts',
    'services/offlineReconciliation.ts',
    'services/acceptanceTestSuite.ts',
    'services/zipService.ts',
    'services/codebaseManifest.ts'
  ];

  const handleDownloadZip = async () => {
    setIsExporting(true);

    try {
      // 1. Gather baseline project configuration files
      const files: ProjectFile[] = [...getEmbeddedCodebaseFiles()];

      // 2. Fetch live file contents from the running app where available
      for (const path of activeFileList) {
        try {
          const res = await fetch(path);
          if (res.ok) {
            const content = await res.text();
            // Avoid duplicate entries
            const existingIdx = files.findIndex((f) => f.path === path);
            if (existingIdx >= 0) {
              files[existingIdx].content = content;
            } else {
              files.push({ path, content });
            }
          }
        } catch {
          // If relative fetch is restricted, the manifest ensures standard files exist
        }
      }

      // 3. Generate genuine binary PKZIP archive
      const zipBlob = createZipArchive(files);

      // 4. Trigger direct browser download
      const fileName = 'icarus-aria-codebase.zip';
      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4500);
    } catch (err) {
      console.error('ZIP packaging error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-anthracite-950 border border-anthracite-800 rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4 text-xs text-slate-200">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-anthracite-800 pb-2.5">
          <div className="flex items-center space-x-2">
            <FolderArchive className="w-4 h-4 text-pastel-300" />
            <span className="font-semibold text-slate-100 text-xs">Download Project Codebase (.ZIP)</span>
          </div>
          <button onClick={onClose} className="text-anthracite-500 hover:text-slate-200 p-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-slate-300 text-[11px] leading-relaxed">
          Packages all components, clinical engines, FHIR transformers, and synthetic records into a standard <span className="font-mono text-pastel-200 font-semibold">.zip</span> archive ready for GitHub or local execution.
        </p>

        {/* File Inventory Summary */}
        <div className="p-3 bg-anthracite-900 border border-anthracite-850 rounded-lg space-y-1.5 font-mono text-[11px]">
          <div className="flex justify-between text-slate-300">
            <span>Archive Filename:</span>
            <span className="text-pastel-200 font-bold">icarus-aria-codebase.zip</span>
          </div>
          <div className="flex justify-between text-slate-400 text-[10px]">
            <span>Included Files:</span>
            <span>{activeFileList.length} Source Modules + Config</span>
          </div>
          <div className="flex justify-between text-slate-400 text-[10px]">
            <span>Structure:</span>
            <span>components/ • services/ • public/</span>
          </div>
          <div className="flex justify-between text-slate-400 text-[10px]">
            <span>Status:</span>
            <span className="text-emerald-400">Ready for instant export</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center space-x-2">
          <button
            onClick={handleDownloadZip}
            disabled={isExporting}
            className="flex-1 bg-anthracite-850 hover:bg-anthracite-800 border border-anthracite-700 text-pastel-200 py-2.5 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors shadow-sm"
          >
            {downloadSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300 font-semibold">icarus-aria-codebase.zip Downloaded!</span>
              </>
            ) : (
              <>
                <Download className={`w-4 h-4 text-pastel-300 ${isExporting ? 'animate-bounce' : ''}`} />
                <span className="font-semibold">
                  {isExporting ? 'Creating ZIP File...' : 'Download .ZIP File'}
                </span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="bg-anthracite-900 hover:bg-anthracite-850 text-slate-400 px-3 py-2.5 rounded-lg border border-anthracite-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
