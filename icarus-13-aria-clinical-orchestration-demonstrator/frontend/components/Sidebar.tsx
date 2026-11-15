import React from 'react';
import { Patient, UserProfile, ClinicianRole } from '../types';
import { IcarusLogo } from './BrandLogos';
import {
  MessageSquare,
  FileText,
  Stethoscope,
  Layers,
  History,
  Play,
  RotateCcw,
  PanelLeftClose,
  Globe,
  Activity,
  Users
} from 'lucide-react';

interface SidebarProps {
  currentPatient: Patient;
  allPatients: Patient[];
  onSelectPatient: (p: Patient) => void;
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onSelectUser: (u: UserProfile) => void;
  activeView: 'chat' | 'ehr' | 'encounter' | 'inspector' | 'replay' | 'evidence';
  onSelectView: (view: 'chat' | 'ehr' | 'encounter' | 'inspector' | 'replay' | 'evidence') => void;
  onLaunchGuidedDemo: () => void;
  onResetDemo: () => void;
  isPartitioned: boolean;
  destinationUnavailable: boolean;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPatient,
  allPatients,
  onSelectPatient,
  currentUser,
  allUsers,
  onSelectUser,
  activeView,
  onSelectView,
  onLaunchGuidedDemo,
  onResetDemo,
  isPartitioned,
  destinationUnavailable,
  isOpen,
  onToggleOpen
}) => {
  return (
    <aside
      className={`${
        isOpen ? 'w-64 border-r border-anthracite-900' : 'w-0 border-none'
      } bg-anthracite-950 flex flex-col h-full transition-all duration-150 z-30 shrink-0 select-none text-slate-300 overflow-hidden`}
    >
      {/* Brand Top Bar with Official ICARUS Wing Emblem & Metallic Wordmark */}
      <div className="p-3 border-b border-anthracite-900 flex items-center justify-between shrink-0 bg-anthracite-950">
        <IcarusLogo size="sm" showSubtitle />

        <div className="flex items-center space-x-0.5">
          <button
            onClick={onResetDemo}
            title="Reset demonstrator"
            className="p-1.5 text-anthracite-500 hover:text-slate-200 hover:bg-anthracite-900 rounded transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
          <button
            onClick={onToggleOpen}
            title="Collapse sidebar"
            className="p-1.5 text-anthracite-500 hover:text-slate-200 hover:bg-anthracite-900 rounded transition-colors"
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Patient Selector */}
      <div className="p-2.5 border-b border-anthracite-900 bg-anthracite-950 shrink-0 space-y-1.5">
        <div className="flex items-center justify-between text-[10px] font-mono text-anthracite-500 px-0.5 gap-1.5">
          <span className="flex items-center space-x-1 min-w-0">
            <Users className="w-3 h-3 text-anthracite-400 shrink-0" />
            <span className="truncate uppercase">System of Record</span>
          </span>
          <span className="text-pastel-300 font-semibold shrink-0">{allPatients.length} (synthetic) Patients</span>
        </div>

        <select
          value={currentPatient.id}
          onChange={(e) => {
            const found = allPatients.find((p) => p.id === e.target.value);
            if (found) onSelectPatient(found);
          }}
          className="w-full bg-anthracite-900 border border-anthracite-800 text-slate-200 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-pastel-400 cursor-pointer font-medium"
        >
          {allPatients.map((p) => (
            <option key={p.id} value={p.id} className="bg-anthracite-900 text-slate-200">
              {p.name} ({p.age}y, {p.department.split('/')[0].trim()})
            </option>
          ))}
        </select>

        {/* Selected Patient Mini Card with seamless borderless styling */}
        <div className="bg-anthracite-900/60 border border-anthracite-850/80 rounded p-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-200 truncate">{currentPatient.name}</span>
            <span className="text-[10px] font-mono text-pastel-300 shrink-0 ml-1">{currentPatient.mrn}</span>
          </div>
          <p className="text-[11px] text-pastel-200/80 font-mono mt-0.5 truncate">
            {currentPatient.age}y {currentPatient.gender} • {currentPatient.department}
          </p>
          <div className="mt-1.5 pt-1.5 border-t border-anthracite-850/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="truncate">{currentPatient.room}</span>
            <span className="text-anthracite-500 shrink-0">Bound</span>
          </div>
        </div>
      </div>

      {/* Navigation Workspaces */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-4 text-xs">
        <div>
          <span className="text-[10px] font-mono text-anthracite-500 uppercase tracking-wider block px-1.5 mb-1">
            Clinical Workspaces
          </span>
          <nav className="space-y-0.5">
            <button
              onClick={() => onSelectView('chat')}
              className={`w-full text-left px-2.5 py-1.5 rounded flex items-center space-x-2.5 transition-colors ${
                activeView === 'chat'
                  ? 'bg-anthracite-900 text-pastel-200 font-medium border border-anthracite-800'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-anthracite-900/60'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-pastel-300 shrink-0" />
              <span>Ask ARIA Chat</span>
            </button>

            <button
              onClick={() => onSelectView('ehr')}
              className={`w-full text-left px-2.5 py-1.5 rounded flex items-center space-x-2.5 transition-colors ${
                activeView === 'ehr'
                  ? 'bg-anthracite-900 text-pastel-200 font-medium border border-anthracite-800'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-anthracite-900/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Chart & Flowsheets</span>
            </button>

            <button
              onClick={() => onSelectView('encounter')}
              className={`w-full text-left px-2.5 py-1.5 rounded flex items-center space-x-2.5 transition-colors ${
                activeView === 'encounter'
                  ? 'bg-anthracite-900 text-pastel-200 font-medium border border-anthracite-800'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-anthracite-900/60'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5 text-pastel-300 shrink-0" />
              <span>Encounter Capture & Sign</span>
            </button>
          </nav>
        </div>

        <div>
          <span className="text-[10px] font-mono text-anthracite-500 uppercase tracking-wider block px-1.5 mb-1">
            Governance & Standards
          </span>
          <nav className="space-y-0.5">
            <button
              onClick={() => onSelectView('evidence')}
              className={`w-full text-left px-2.5 py-1.5 rounded flex items-center space-x-2.5 transition-colors ${
                activeView === 'evidence'
                  ? 'bg-anthracite-900 text-pastel-200 font-medium border border-anthracite-800'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-anthracite-900/60'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-pastel-300 shrink-0" />
              <span>Operational Evidence</span>
            </button>

            <button
              onClick={() => onSelectView('inspector')}
              className={`w-full text-left px-2.5 py-1.5 rounded flex items-center space-x-2.5 transition-colors ${
                activeView === 'inspector'
                  ? 'bg-anthracite-900 text-pastel-200 font-medium border border-anthracite-800'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-anthracite-900/60'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-pastel-300 shrink-0" />
              <span>API Connectors & FHIR</span>
            </button>

            <button
              onClick={() => onSelectView('replay')}
              className={`w-full text-left px-2.5 py-1.5 rounded flex items-center space-x-2.5 transition-colors ${
                activeView === 'replay'
                  ? 'bg-anthracite-900 text-pastel-200 font-medium border border-anthracite-800'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-anthracite-900/60'
              }`}
            >
              <History className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Encounter Audit Replay</span>
            </button>
          </nav>
        </div>

        {/* Guided Walkthrough Card */}
        <div className="p-2.5 bg-anthracite-900/60 border border-anthracite-850 rounded space-y-1.5">
          <p className="text-[11px] font-medium text-slate-200">Institutional Walkthrough</p>
          <p className="text-[10px] text-slate-400 leading-snug">
            3-minute interactive sequence across clinical departments.
          </p>
          <button
            onClick={onLaunchGuidedDemo}
            className="w-full bg-anthracite-850 hover:bg-anthracite-800 text-pastel-200 border border-anthracite-750 text-xs font-medium py-1.5 px-2 rounded flex items-center justify-center space-x-1.5 transition-colors"
          >
            <Play className="w-3 h-3 fill-current text-pastel-300" />
            <span>Launch 3-Min Tour</span>
          </button>
        </div>
      </div>

      {/* Acting Clinician & Hospital Link Footer */}
      <div className="p-2.5 border-t border-anthracite-900 bg-anthracite-950 space-y-2 shrink-0">
        <div className="space-y-1">
          <span className="text-[10px] font-mono text-anthracite-500 uppercase tracking-wider block px-1">
            Acting Identity
          </span>
          <select
            value={currentUser.id}
            onChange={(e) => {
              const u = allUsers.find((usr) => usr.id === e.target.value);
              if (u) onSelectUser(u);
            }}
            className="w-full bg-anthracite-900 border border-anthracite-800 text-slate-200 text-xs rounded px-2 py-1 focus:outline-none focus:border-pastel-400 cursor-pointer font-medium"
          >
            {allUsers.map((u) => (
              <option key={u.id} value={u.id} className="bg-anthracite-900 text-slate-200">
                {u.name} ({u.role === ClinicianRole.ATTENDING ? 'Attending' : 'Resident'})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono pt-1 text-slate-400 px-1">
          <span className="flex items-center space-x-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                destinationUnavailable || isPartitioned ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
            ></span>
            <span>{isPartitioned ? 'Partitioned' : destinationUnavailable ? 'EHR 503' : 'EHR Online'}</span>
          </span>
          <span className="text-anthracite-500">Simulation · Synthetic</span>
        </div>
      </div>
    </aside>
  );
};
