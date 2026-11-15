import React, { useState } from 'react';
import { Patient, UserProfile, ClinicianRole } from '../types';
import { AriaHeaderLogo } from './BrandLogos';
import { ZipExportModal } from './ZipExportModal';
import {
  PanelLeft,
  Play,
  Layers,
  History,
  FolderArchive
} from 'lucide-react';

interface HeaderProps {
  currentPatient: Patient;
  currentUser: UserProfile;
  onToggleSidebar: () => void;
  onLaunchGuidedDemo: () => void;
  onToggleInspector: () => void;
  onOpenReplay: () => void;
  onOpenVoiceCall: () => void;
  isInspectorActive: boolean;
  destinationUnavailable: boolean;
  isPartitioned: boolean;
  activeViewTitle: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentPatient,
  currentUser,
  onToggleSidebar,
  onLaunchGuidedDemo,
  onToggleInspector,
  onOpenReplay,
  isInspectorActive,
  destinationUnavailable,
  isPartitioned
}) => {
  const [isZipModalOpen, setIsZipModalOpen] = useState(false);

  return (
    <>
      <header className="h-11 min-w-0 w-full bg-anthracite-950 border-b border-anthracite-900 px-3 flex items-center justify-between z-20 shrink-0 text-slate-300 overflow-hidden">
        {/* Left: Sidebar toggle, Official ARIA Primary Brand & Clean Patient Tag */}
        <div className="flex items-center space-x-2.5 min-w-0 truncate">
          <button
            onClick={onToggleSidebar}
            title="Toggle sidebar"
            className="p-1.5 text-anthracite-500 hover:text-slate-200 hover:bg-anthracite-900 rounded transition-colors shrink-0"
          >
            <PanelLeft className="w-4 h-4" />
          </button>

          {/* ARIA Brand Logo in Header without harsh borders */}
          <div className="flex items-center pr-2.5 border-r border-anthracite-900 shrink-0">
            <AriaHeaderLogo size="sm" />
          </div>

          {/* Patient Context Tag */}
          <div className="flex items-center space-x-1.5 text-xs min-w-0 truncate">
            <span className="font-medium text-slate-200 truncate">{currentPatient.name}</span>
            <span className="text-anthracite-700 font-mono shrink-0">•</span>
            <span className="text-pastel-200/80 font-mono text-[11px] truncate">{currentPatient.department.split('/')[0].trim()}</span>
          </div>

          {/* Simulation Disclaimer Badge */}
          <div className="hidden xl:flex items-center space-x-1 px-2 py-0.5 rounded bg-anthracite-900/80 border border-anthracite-850 text-[10px] font-mono text-anthracite-500">
            <span>Simulation · Synthetic data</span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-1.5 text-xs shrink-0">
          {/* System Link Status */}
          <div
            className={`hidden sm:flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono border shrink-0 ${
              isPartitioned
                ? 'bg-amber-950/20 border-amber-800/60 text-amber-300'
                : destinationUnavailable
                ? 'bg-red-950/20 border-red-800/60 text-red-300'
                : 'bg-anthracite-900 border-anthracite-800 text-pastel-300'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
            <span>{isPartitioned ? 'Partitioned' : destinationUnavailable ? 'EHR Outage' : 'Online'}</span>
          </div>

          {/* Guided Demo Button */}
          <button
            onClick={onLaunchGuidedDemo}
            className="flex items-center space-x-1 bg-anthracite-900 hover:bg-anthracite-850 text-pastel-200 text-[11px] font-medium px-2 py-1 rounded border border-anthracite-800 transition-colors shrink-0"
          >
            <Play className="w-3 h-3 fill-current text-pastel-300" />
            <span className="hidden md:inline">Tour</span>
          </button>

          {/* Architecture Inspector */}
          <button
            onClick={onToggleInspector}
            title="Architecture, FHIR & Tests"
            className={`p-1.5 rounded transition-colors shrink-0 ${
              isInspectorActive
                ? 'bg-anthracite-850 text-pastel-200 border border-anthracite-750'
                : 'text-anthracite-500 hover:text-slate-200 hover:bg-anthracite-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          {/* Audit Replay */}
          <button
            onClick={onOpenReplay}
            title="Audit Trail Replay"
            className="p-1.5 text-anthracite-500 hover:text-slate-200 hover:bg-anthracite-900 rounded transition-colors shrink-0"
          >
            <History className="w-3.5 h-3.5" />
          </button>

          {/* 1-Click Download ZIP Button */}
          <button
            onClick={() => setIsZipModalOpen(true)}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-anthracite-850 hover:bg-anthracite-800 text-pastel-200 border border-anthracite-750 transition-colors font-medium text-[11px] shrink-0"
            title="Download complete code as a .zip file"
          >
            <FolderArchive className="w-3.5 h-3.5 text-pastel-300" />
            <span className="hidden sm:inline">.ZIP</span>
          </button>
        </div>
      </header>

      {/* Zip Export Modal */}
      <ZipExportModal
        isOpen={isZipModalOpen}
        onClose={() => setIsZipModalOpen(false)}
      />
    </>
  );
};
