import React, { useState } from 'react';
import {
  Patient,
  LabResult,
  ImagingReport,
  PastEncounterRecord,
  UserProfile,
  PathologyReport
} from '../types';
import { hospitalGateway } from '../services/hospitalAdapters';
import { DicomSliceViewer } from './DicomSliceViewer';
import { ClinicalRiskMatrixView } from './ClinicalRiskMatrixView';
import { SbarTraumaHandoverSimulator } from './SbarTraumaHandoverSimulator';
import {
  FileText,
  Activity,
  Layers,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ShieldCheck,
  Stethoscope,
  Microscope,
  Scan,
  List,
  ShieldAlert,
  Flame
} from 'lucide-react';

interface EHRViewProps {
  patient: Patient;
  labs: LabResult[];
  imaging: ImagingReport[];
  pastEncounters: PastEncounterRecord[];
  currentUser: UserProfile;
  onAskAriaAboutItem: (topic: string) => void;
  onOpenEncounterCapture: () => void;
}

export const EHRView: React.FC<EHRViewProps> = ({
  patient,
  labs,
  imaging,
  pastEncounters,
  currentUser,
  onAskAriaAboutItem,
  onOpenEncounterCapture
}) => {
  const isTrauma = patient.id === 'PAT-TR-3402';
  const [activeTab, setActiveTab] = useState<'summary' | 'traumaHandover' | 'labs' | 'imaging' | 'riskMatrix' | 'pathology' | 'history' | 'exported'>(
    isTrauma ? 'traumaHandover' : 'summary'
  );
  const [imagingViewMode, setImagingViewMode] = useState<'interactiveViewer' | 'reportList'>('interactiveViewer');
  const [selectedImagingStudyId, setSelectedImagingStudyId] = useState<string>(imaging[0]?.id || '');

  const { pathology } = hospitalGateway.readPatientData(patient.id, currentUser.name, currentUser.role);
  const exportedNotes = hospitalGateway.getExportedNotes(patient.id);

  const selectedStudy = imaging.find((img) => img.id === selectedImagingStudyId) || imaging[0];

  return (
    <div className="flex-1 flex flex-col bg-anthracite-950 overflow-hidden text-slate-200">
      {/* Patient Header Banner */}
      <div className="bg-anthracite-900 border-b border-anthracite-800 px-6 py-3 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-base font-semibold text-slate-100">{patient.name}</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-anthracite-800 text-slate-300 border border-anthracite-750">
              {patient.age}y {patient.gender} • DOB: {patient.dob}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-anthracite-800 text-pastel-300 border border-anthracite-700">
              {patient.department}
            </span>
            {isTrauma && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-950/60 text-red-300 border border-red-800 font-bold">
                TRAUMA LEVEL 1
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            <span className="font-medium text-slate-300">Diagnosis:</span> {patient.primaryDiagnosis}
          </p>
        </div>

        <button
          onClick={onOpenEncounterCapture}
          className="flex items-center space-x-1.5 bg-anthracite-800 hover:bg-anthracite-750 border border-anthracite-700 text-pastel-200 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
        >
          <Stethoscope className="w-3.5 h-3.5 text-pastel-300" />
          <span>Launch Encounter Studio</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-anthracite-950 border-b border-anthracite-800 px-6 flex items-center space-x-6 text-xs font-medium shrink-0 overflow-x-auto">
        <button
          onClick={() => setActiveTab('summary')}
          className={`py-2.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'summary' ? 'border-pastel-400 text-pastel-200' : 'border-transparent text-slate-400'
          }`}
        >
          Overview
        </button>

        {/* Dedicated SBAR Trauma Handover Simulator Tab for Marcus Vance */}
        {isTrauma && (
          <button
            onClick={() => setActiveTab('traumaHandover')}
            className={`py-2.5 border-b-2 whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
              activeTab === 'traumaHandover' ? 'border-red-400 text-red-200 font-semibold' : 'border-transparent text-slate-400'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-red-400" />
            <span>SBAR Trauma Handover (OR 3)</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('riskMatrix')}
          className={`py-2.5 border-b-2 whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
            activeTab === 'riskMatrix' ? 'border-pastel-400 text-pastel-200' : 'border-transparent text-slate-400'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-pastel-300" />
          <span>Clinical Risk Matrix</span>
        </button>
        <button
          onClick={() => setActiveTab('labs')}
          className={`py-2.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'labs' ? 'border-pastel-400 text-pastel-200' : 'border-transparent text-slate-400'
          }`}
        >
          Laboratory Flowsheet ({labs.length})
        </button>
        <button
          onClick={() => setActiveTab('imaging')}
          className={`py-2.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'imaging' ? 'border-pastel-400 text-pastel-200' : 'border-transparent text-slate-400'
          }`}
        >
          Imaging & DICOM ({imaging.length})
        </button>
        {pathology.length > 0 && (
          <button
            onClick={() => setActiveTab('pathology')}
            className={`py-2.5 border-b-2 whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
              activeTab === 'pathology' ? 'border-pastel-400 text-pastel-200' : 'border-transparent text-slate-400'
            }`}
          >
            <Microscope className="w-3.5 h-3.5" />
            <span>Pathology ({pathology.length})</span>
          </button>
        )}
        <button
          onClick={() => setActiveTab('history')}
          className={`py-2.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'history' ? 'border-pastel-400 text-pastel-200' : 'border-transparent text-slate-400'
          }`}
        >
          Prior Encounters ({pastEncounters.length})
        </button>
        <button
          onClick={() => setActiveTab('exported')}
          className={`py-2.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'exported' ? 'border-pastel-400 text-pastel-200' : 'border-transparent text-slate-400'
          }`}
        >
          Authoritative Notes ({exportedNotes.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-5xl">
        {/* SBAR TRAUMA HANDOVER TAB (FOR MARCUS VANCE) */}
        {activeTab === 'traumaHandover' && isTrauma && (
          <SbarTraumaHandoverSimulator
            patient={patient}
            currentUser={currentUser}
            labs={labs}
            onAskAria={onAskAriaAboutItem}
          />
        )}

        {/* CLINICAL RISK MATRIX TAB */}
        {activeTab === 'riskMatrix' && (
          <ClinicalRiskMatrixView
            patient={patient}
            labs={labs}
            imaging={imaging}
            onAskAria={onAskAriaAboutItem}
          />
        )}

        {/* OVERVIEW */}
        {activeTab === 'summary' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-5">
              <div className="bg-anthracite-900 border border-anthracite-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-mono uppercase text-slate-400">Chief Complaint & Presentation</h3>
                  <button
                    onClick={() => onAskAriaAboutItem(`Summarize ${patient.name}'s clinical background and active plan`)}
                    className="text-[11px] text-pastel-300 hover:text-pastel-200 flex items-center space-x-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Synthesize with ARIA</span>
                  </button>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">{patient.chiefComplaint}</p>
                <div className="mt-3 pt-2.5 border-t border-anthracite-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Admitted / Registered: {new Date(patient.admissionDate).toLocaleDateString()}</span>
                  <span>Bed / Suite: {patient.room}</span>
                </div>
              </div>

              {/* Lab Preview */}
              <div className="bg-anthracite-900 border border-anthracite-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono uppercase text-slate-400">Key Lab Results</h3>
                  <button onClick={() => setActiveTab('labs')} className="text-[11px] text-pastel-300 hover:underline">
                    All Labs Flowsheet →
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {labs.map((lab) => (
                    <div
                      key={lab.id}
                      onClick={() => onAskAriaAboutItem(`Compare today's ${lab.testName} with previous value`)}
                      className={`p-2.5 rounded-lg border cursor-pointer hover:border-pastel-400/40 transition-colors ${
                        lab.status === 'critical'
                          ? 'bg-red-950/20 border-red-800/80 text-red-200'
                          : lab.status === 'abnormal'
                          ? 'bg-amber-950/20 border-amber-800/60 text-amber-200'
                          : 'bg-anthracite-850 border-anthracite-750 text-slate-200'
                      }`}
                    >
                      <p className="text-[10px] text-slate-400 truncate">{lab.testName}</p>
                      <p className="text-base font-bold font-mono text-slate-100 mt-0.5">
                        {lab.value} <span className="text-xs font-normal text-slate-400">{lab.unit}</span>
                      </p>
                      {lab.previousValue && (
                        <p className="text-[9px] text-slate-500 font-mono">Prev: {lab.previousValue}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Trauma Handover Quick Launch Banner (For Marcus Vance) */}
              {isTrauma && (
                <div className="bg-red-950/30 border border-red-800/80 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Flame className="w-4 h-4 text-red-400" />
                      <span className="text-xs font-semibold text-red-200">
                        Emergency Shock-Room SBAR Handover Simulator
                      </span>
                    </div>
                    <button
                      onClick={() => setActiveTab('traumaHandover')}
                      className="text-[11px] font-mono text-red-300 hover:underline flex items-center space-x-1"
                    >
                      <span>Open Handover Console →</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Active hemorrhagic shock Class II/III and non-palpable pedal pulse. Direct telemetry bridge to Trauma OR 3 receiving team with auditable confirmation receipt.
                  </p>
                </div>
              )}

              {/* Risk Matrix Mini Preview */}
              <div className="bg-anthracite-900 border border-anthracite-800 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShieldAlert className="w-3.5 h-3.5 text-pastel-300" />
                    <span className="text-xs font-semibold text-slate-200">Perioperative Risk Assessment Preview</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('riskMatrix')}
                    className="text-[10px] font-mono text-pastel-300 hover:underline"
                  >
                    View Inspectable Matrix →
                  </button>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Composite evaluation of surgical hemostasis, revised cardiac risk (RCRI), and nephrotoxicity risk. Contributing factors reference exact LIS laboratory values and medication intake records.
                </p>
              </div>

              {/* Latest Imaging Preview */}
              {imaging[0] && (
                <div className="bg-anthracite-900 border border-anthracite-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200">{imaging[0].studyDescription}</span>
                    <button
                      onClick={() => {
                        setActiveTab('imaging');
                        setImagingViewMode('interactiveViewer');
                      }}
                      className="text-[10px] font-mono text-pastel-300 hover:underline flex items-center space-x-1"
                    >
                      <Scan className="w-3 h-3" />
                      <span>Launch DICOM Viewer →</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{imaging[0].impression}</p>
                </div>
              )}
            </div>

            {/* Sidebar Column */}
            <div className="space-y-4">
              <div className="bg-anthracite-900 border border-anthracite-800 rounded-xl p-4 space-y-2">
                <h3 className="text-xs font-mono uppercase text-slate-400">Documented Allergies</h3>
                {patient.allergies.map((a, i) => (
                  <div
                    key={i}
                    className="p-2 rounded bg-anthracite-850 border border-anthracite-750 text-xs text-amber-200 flex items-center space-x-2"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    <span>{a}</span>
                  </div>
                ))}
              </div>

              <div className="bg-anthracite-900 border border-anthracite-800 rounded-xl p-4 space-y-2">
                <h3 className="text-xs font-mono uppercase text-slate-400">Connected Systems</h3>
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="p-2 rounded bg-anthracite-850 border border-anthracite-800 flex justify-between">
                    <span className="text-slate-300">Epic EHR FHIR</span>
                    <span className="text-emerald-400 text-[10px]">CONNECTED</span>
                  </div>
                  <div className="p-2 rounded bg-anthracite-850 border border-anthracite-800 flex justify-between">
                    <span className="text-slate-300">Sysmex/Roche LIS</span>
                    <span className="text-emerald-400 text-[10px]">CONNECTED</span>
                  </div>
                  <div className="p-2 rounded bg-anthracite-850 border border-anthracite-800 flex justify-between">
                    <span className="text-slate-300">GE Centricity PACS</span>
                    <span className="text-emerald-400 text-[10px]">CONNECTED</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LABS TAB */}
        {activeTab === 'labs' && (
          <div className="space-y-3">
            <div className="border border-anthracite-800 rounded-xl overflow-hidden bg-anthracite-900">
              <table className="w-full text-left text-xs">
                <thead className="bg-anthracite-850 text-slate-400 font-mono text-[10px] border-b border-anthracite-800">
                  <tr>
                    <th className="p-3">Test & Code</th>
                    <th className="p-3">Recent Value</th>
                    <th className="p-3">Reference Range</th>
                    <th className="p-3">Previous Value</th>
                    <th className="p-3">Delta</th>
                    <th className="p-3">System Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-anthracite-800">
                  {labs.map((l) => (
                    <tr key={l.id} className="hover:bg-anthracite-850/50">
                      <td className="p-3 font-medium text-slate-200">
                        {l.testName}
                        <span className="block font-mono text-[10px] text-slate-500">{l.code}</span>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-100">
                        <span className={l.status === 'critical' ? 'text-red-400' : l.status === 'abnormal' ? 'text-amber-400' : 'text-slate-100'}>
                          {l.value} {l.unit}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-400">{l.referenceRange}</td>
                      <td className="p-3 font-mono text-slate-400">
                        {l.previousValue ? `${l.previousValue} ${l.unit}` : '—'}
                      </td>
                      <td className="p-3 font-mono">
                        {l.previousValue ? (
                          <span className={l.value < l.previousValue ? 'text-amber-300' : 'text-slate-300'}>
                            {(l.value - l.previousValue).toFixed(1)} {l.unit}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="p-3 font-mono text-[10px] text-slate-500">{l.systemSource}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* IMAGING TAB */}
        {activeTab === 'imaging' && (
          <div className="space-y-4">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-anthracite-900 border border-anthracite-800 p-2.5 rounded-xl text-xs">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-anthracite-500 text-[11px] uppercase">Active Study:</span>
                <select
                  value={selectedImagingStudyId}
                  onChange={(e) => setSelectedImagingStudyId(e.target.value)}
                  className="bg-anthracite-950 border border-anthracite-800 text-slate-200 text-xs rounded px-2.5 py-1 focus:outline-none focus:border-pastel-400 cursor-pointer font-medium"
                >
                  {imaging.map((img) => (
                    <option key={img.id} value={img.id}>
                      [{img.modality}] {img.studyDescription} ({img.performedDate.slice(0, 10)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Mode Toggle Buttons */}
              <div className="flex items-center space-x-1 bg-anthracite-950 p-1 rounded-lg border border-anthracite-850">
                <button
                  onClick={() => setImagingViewMode('interactiveViewer')}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs transition-colors ${
                    imagingViewMode === 'interactiveViewer'
                      ? 'bg-anthracite-800 text-pastel-200 font-semibold'
                      : 'text-anthracite-400 hover:text-slate-200'
                  }`}
                >
                  <Scan className="w-3.5 h-3.5" />
                  <span>DICOM Viewport</span>
                </button>

                <button
                  onClick={() => setImagingViewMode('reportList')}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs transition-colors ${
                    imagingViewMode === 'reportList'
                      ? 'bg-anthracite-800 text-pastel-200 font-semibold'
                      : 'text-anthracite-400 hover:text-slate-200'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Formal Reports</span>
                </button>
              </div>
            </div>

            {/* Viewport */}
            {imagingViewMode === 'interactiveViewer' && selectedStudy && (
              <DicomSliceViewer
                study={selectedStudy}
                patient={patient}
                onAskAria={onAskAriaAboutItem}
              />
            )}

            {/* Formal Text Reports Mode */}
            {imagingViewMode === 'reportList' && (
              <div className="space-y-4">
                {imaging.map((img) => (
                  <div key={img.id} className="bg-anthracite-900 border border-anthracite-800 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between border-b border-anthracite-800 pb-2 text-xs">
                      <span className="font-semibold text-slate-100">{img.studyDescription}</span>
                      <span className="font-mono text-slate-500 text-[10px]">{img.pacsAccession} ({img.performedDate.slice(0, 10)})</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 block uppercase">Findings</span>
                      <p className="text-xs text-slate-300 leading-relaxed mt-0.5">{img.findings}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-pastel-300 block uppercase">Impression</span>
                      <p className="text-xs text-slate-100 font-medium leading-relaxed mt-0.5">{img.impression}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PATHOLOGY TAB */}
        {activeTab === 'pathology' && (
          <div className="space-y-4">
            {pathology.map((path) => (
              <div key={path.id} className="bg-anthracite-900 border border-anthracite-800 rounded-xl p-4 space-y-3 text-xs leading-relaxed">
                <div className="flex items-center justify-between border-b border-anthracite-800 pb-2">
                  <div>
                    <span className="font-semibold text-slate-100 text-sm block">{path.histologicDiagnosis}</span>
                    <span className="text-[11px] text-pastel-300 font-mono">Stage: {path.pathologicStage}</span>
                  </div>
                  <span className="font-mono text-slate-500 text-[10px]">{path.systemSource}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px] bg-anthracite-950 p-2.5 rounded">
                  <div>
                    <span className="text-slate-500 block text-[10px]">LYMPH NODE STATUS</span>
                    <span className="text-amber-300">{path.lymphNodeRatio}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">SURGICAL MARGINS</span>
                    <span className="text-emerald-400">{path.margins}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Synoptic Histopathology</span>
                  <p className="text-slate-200 mt-0.5">{path.synopticFindings}</p>
                </div>
                <div className="pt-2 border-t border-anthracite-800 text-[10px] font-mono text-slate-500 flex justify-between">
                  <span>Reporting Pathologist: {path.pathologist}</span>
                  <span>Signed: {path.signedDate.slice(0, 10)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {pastEncounters.map((enc) => (
              <div key={enc.id} className="bg-anthracite-900 border border-anthracite-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-anthracite-800 pb-2 text-xs">
                  <span className="font-semibold text-slate-100">
                    {enc.type} ({enc.date})
                  </span>
                  <span className="font-mono text-slate-500 text-[10px]">{enc.systemSource}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{enc.summary}</p>
                {enc.operativeReport && (
                  <div className="p-2.5 rounded bg-anthracite-850 border border-anthracite-800 text-xs font-mono text-slate-300">
                    <span className="text-pastel-300 block text-[10px] font-bold mb-1">OPERATIVE REPORT:</span>
                    {enc.operativeReport}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* EXPORTED NOTES TAB */}
        {activeTab === 'exported' && (
          <div className="space-y-3">
            {exportedNotes.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-anthracite-900 border border-dashed border-anthracite-800 rounded-xl">
                No signed reports exported to hospital EHR yet. Sign a note in Encounter Studio to view delivery receipt here.
              </div>
            ) : (
              exportedNotes.map((note, idx) => (
                <div key={idx} className="bg-anthracite-900 border border-anthracite-750 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between border-b border-anthracite-800 pb-2 text-xs">
                    <div className="flex items-center space-x-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span className="font-semibold text-slate-100">{note.title}</span>
                    </div>
                    <span className="font-mono text-emerald-400 text-[10px]">DELIVERED TO EHR</span>
                  </div>
                  <pre className="text-xs font-mono text-slate-300 bg-anthracite-950 p-3 rounded-lg whitespace-pre-wrap">
                    {note.content}
                  </pre>
                  <p className="text-[10px] font-mono text-slate-500">
                    Signed by {note.signedBy} on {new Date(note.timestamp).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
