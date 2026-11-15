import React, { useState, useEffect, useRef } from 'react';
import {
  Patient,
  UserProfile,
  EncounterLifecycleState,
  TranscriptSegment,
  AcousticPhrase,
  DocumentVersion,
  UncertaintyFlag,
  Severity,
  ClinicianRole
} from '../types';
import { SCRIPTED_ENCOUNTERS, INITIAL_UNCERTAINTIES } from '../mockData';
import { auditStore } from '../services/auditStore';
import { hospitalGateway } from '../services/hospitalAdapters';
import { VersionDiffDrawer } from './VersionDiffDrawer';
import {
  Play,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  Send,
  Shield,
  Sparkles,
  Edit3,
  RefreshCw,
  X,
  Volume2,
  Sliders,
  Flag,
  Check,
  Radio,
  Activity,
  GitCompare
} from 'lucide-react';

interface EncounterStudioProps {
  patient: Patient;
  currentUser: UserProfile;
  onClose: () => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const EncounterStudio: React.FC<EncounterStudioProps> = ({
  patient,
  currentUser,
  onClose,
  onNotify
}) => {
  const [lifecycleState, setLifecycleState] = useState<EncounterLifecycleState>(EncounterLifecycleState.INACTIVE);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [scriptIndex, setScriptIndex] = useState(0);
  const [documentVersions, setDocumentVersions] = useState<DocumentVersion[]>([]);
  const [activeVersionNumber, setActiveVersionNumber] = useState<number>(1);
  const [uncertainties, setUncertainties] = useState<UncertaintyFlag[]>([]);
  const [physicianCorrectionText, setPhysicianCorrectionText] = useState('');
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [isDiffDrawerOpen, setIsDiffDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'capture' | 'draft' | 'uncertainties' | 'export'>('capture');

  // Audio Waveform & STT Scrubber states
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.85);
  const [decibelLevel, setDecibelLevel] = useState<number>(-24.5);
  const [waveformBars, setWaveformBars] = useState<number[]>([12, 18, 28, 42, 65, 84, 55, 38, 22, 14, 25, 48, 70, 92, 60, 32, 18, 12]);
  const [isMicStreaming, setIsMicStreaming] = useState<boolean>(false);
  const [clarifyingPhraseId, setClarifyingPhraseId] = useState<string | null>(null);
  const [clarificationInput, setClarificationInput] = useState<string>('');

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Load patient-specific scripted dialogue & uncertainties
  const activeScript = SCRIPTED_ENCOUNTERS[patient.id] ?? SCRIPTED_ENCOUNTERS['PAT-GR-6701'];
  
  useEffect(() => {
    const seed = INITIAL_UNCERTAINTIES[patient.id] ?? INITIAL_UNCERTAINTIES['PAT-GR-6701'];
    setUncertainties([...seed]);
    setTranscript([]);
    setScriptIndex(0);
    setDocumentVersions([]);
    setLifecycleState(EncounterLifecycleState.INACTIVE);
  }, [patient.id]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (lifecycleState === EncounterLifecycleState.ACTIVE_CAPTURE) {
      interval = setInterval(() => {
        const baseRms = -22 + (Math.random() * 8 - 4);
        setDecibelLevel(parseFloat(baseRms.toFixed(1)));

        setWaveformBars((prev) =>
          prev.map(() => {
            const h = Math.floor(Math.random() * 80 + 15);
            return Math.min(100, Math.max(10, h));
          })
        );
      }, 90);
    } else {
      setDecibelLevel(-48.0);
      setWaveformBars([8, 10, 12, 14, 12, 10, 8, 12, 14, 12, 10, 8, 10, 12, 14, 10, 8, 6]);
    }

    return () => {
      clearInterval(interval);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [lifecycleState]);

  useEffect(() => {
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  const handleStartCapture = async () => {
    setLifecycleState(EncounterLifecycleState.ACTIVE_CAPTURE);

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        audioContextRef.current = ctx;
        analyserRef.current = analyser;
        setIsMicStreaming(true);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateRealAudio = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          const bars: number[] = [];
          for (let i = 0; i < 18; i++) {
            const val = dataArray[i] || 0;
            sum += val;
            bars.push(Math.max(10, Math.min(100, Math.round((val / 255) * 100))));
          }
          const avg = sum / (dataArray.length || 1);
          const computedDb = Math.max(-60, Math.min(-6, Math.round((avg / 255) * 54 - 60)));
          setDecibelLevel(computedDb);
          setWaveformBars(bars);
          animFrameRef.current = requestAnimationFrame(updateRealAudio);
        };
        updateRealAudio();
      }
    } catch {
      setIsMicStreaming(false);
    }

    auditStore.recordEvent({
      eventType: 'ENCOUNTER_ACTIVATED',
      actor: currentUser.name,
      role: currentUser.role,
      patientId: patient.id,
      encounterId: `ENC-${patient.id}`,
      correlationId: `CORR-ACT-${Date.now()}`,
      details: `Encounter capture activated for ${patient.name}. Ambient buffer engaged.`
    });

    if (scriptIndex === 0 && activeScript.length > 0) {
      advanceTranscriptSegment(0);
    }
  };

  const advanceTranscriptSegment = (idx: number) => {
    const segment = activeScript[idx];
    if (!segment) return;

    setTranscript((prev) => [...prev, segment]);
    setScriptIndex(idx + 1);

    auditStore.recordEvent({
      eventType: 'TRANSCRIPT_SEGMENT_CAPTURED',
      actor: segment.speaker,
      role: currentUser.role,
      patientId: patient.id,
      encounterId: `ENC-${patient.id}`,
      correlationId: `CORR-TRANS-${segment.id}`,
      details: `${segment.speaker}: "${segment.text.slice(0, 50)}..."`
    });

    if (idx === 1 || idx === 3) {
      synthesizeDraftV1(idx);
    }
  };

  const synthesizeDraftV1 = (currentIdx: number) => {
    let title = `${patient.department} Clinical Progress Note (Draft v1)`;
    let subj = patient.chiefComplaint;
    let obj = `Admission vitals recorded. Review of systems completed for ${patient.name}.`;
    let assess = patient.primaryDiagnosis;
    let plan = '1. Monitor vitals and serial laboratory telemetry.\n2. Multidisciplinary coordination and verified physician sign-off.';
    let crit = ['Clinical evaluation in progress'];
    let orders = ['Routine nursing surveillance'];

    if (patient.id === 'PAT-AN-7204') {
      title = 'Cardiology & Nephrology Decompensation Note (Draft v1)';
      subj = 'Patient presents with worsening dyspnea, orthopnea, and lower extremity edema over 5 days.';
      obj = 'BP 108/68, HR 82 in AFib. LIS: Creatinine 2.1 mg/dL (baseline 1.4), Potassium 5.7 mmol/L (Critical), NT-proBNP 3,840 pg/mL.';
      assess = 'Acute decompensated HFrEF (LVEF 35%), AFib, Acute-on-chronic CKD Stage 3b, Critical Hyperkalemia (K 5.7). Discrepant Furosemide dose (40mg vs 80mg).';
      plan = '1. Immediate 12-lead ECG to rule out conduction delay.\n2. Hold ACE inhibitors & potassium-sparing drugs.\n3. Verify home blister pack / pharmacist pill count.\n4. SBAR handover to cardiology attending.';
      crit = ['Potassium 5.7 mmol/L (Critical)', 'Furosemide dose conflict (40mg vs 80mg)'];
      orders = ['Stat 12-lead ECG', 'Serum potassium re-check in 4h', 'Cardiology Consult'];
    } else if (patient.id === 'PAT-MK-5905') {
      title = 'Colorectal Surgical Oncology MDT Briefing (Draft v1)';
      subj = 'Patient evaluated following laparoscopic sigmoid colectomy for multidisciplinary board staging.';
      obj = 'Pathology pT3N1a (1/18 LN+), R0 margins. Restaging CT: 8mm indeterminate hepatic segment VI lesion. CEA 4.2 ng/mL (down from 8.6).';
      assess = 'Sigmoid colon adenocarcinoma Stage III (pT3N1a). Indeterminate 8mm liver lesion (must NOT be categorized as M1 without MRI verification).';
      plan = '1. Dedicated hepatic MRI with Primovist for segment VI lesion.\n2. Register case for Colorectal MDT Tumor Board review.\n3. Medical oncology consult for adjuvant chemotherapy timing (FOLFOX vs CAPOX).';
      crit = ['Indeterminate liver lesion requires MRI confirmation before staging finalization', 'pT3N1a nodal involvement'];
      orders = ['Liver MRI with Primovist', 'MDT Tumor Board Agenda Slot', 'Medical Oncology Consult'];
    } else if (patient.id === 'PAT-GR-6701') {
      title = 'Preoperative Assessment & THA Revision Clearance (Draft v1)';
      subj = 'Patient presents for scheduled revision of left total hip arthroplasty due to aseptic loosening. Groin pain on weight-bearing.';
      obj = 'Afib controlled (HR 74). Hb 9.8 g/dL (down from 11.2). eGFR 53 mL/min. X-ray confirms >2.5mm Gruen zone 1 & 7 radiolucency.';
      assess = 'Aseptic mechanical loosening of left THA. Anemia of chronic disease/pre-op hemodilution. Impaired renal function (Stage 3a CKD).';
      plan = '1. Hold OR transfer pending consent and Apixaban 48h confirmation.\n2. Confirm 2 units PRBC crossmatch.\n3. Physical consent countersignature by attending surgeon.';
      crit = ['eGFR 53 requires 48h Apixaban cessation', 'Signed consent not attached in EHR'];
      orders = ['Blood Bank 2 units PRBC', 'Upload signed consent form'];
    }

    const v1: DocumentVersion = {
      versionId: `DOC-${patient.id}-V1`,
      versionNumber: 1,
      createdAt: new Date().toISOString(),
      createdByRole: currentUser.role,
      authorName: 'ARIA Synthesizer (Draft)',
      title,
      content: {
        chiefComplaint: patient.chiefComplaint,
        subjective: subj,
        objective: obj,
        assessment: assess,
        plan,
        criticalFindings: crit,
        pendingOrders: orders
      },
      provenanceSourceIds: activeScript.slice(0, currentIdx + 1).map((s) => s.id),
      isFinalized: false
    };

    setDocumentVersions([v1]);
    setActiveVersionNumber(1);
    setLifecycleState(EncounterLifecycleState.CLARIFICATION_REQUIRED);

    auditStore.recordEvent({
      eventType: 'DRAFT_SYNTHESIZED',
      actor: 'ARIA_SYNTHESIZER',
      role: ClinicianRole.ATTENDING,
      patientId: patient.id,
      encounterId: `ENC-${patient.id}`,
      correlationId: `CORR-V1`,
      details: `Draft Version 1 generated continuously for ${patient.name}.`
    });
  };

  const handleFlagAcousticClarification = (phrase: AcousticPhrase, segId: string) => {
    const newFlag: UncertaintyFlag = {
      id: `UNC-AC-${Date.now()}`,
      originatingInfo: `Acoustic STT Flag [Confidence: ${Math.round(phrase.confidence * 100)}%]`,
      discrepancy: `Acoustically ambiguous phrase: "${phrase.phrase}". Requires clinician verification.`,
      requiredAction: 'Clinician must confirm or clarify exact clinical intent before final sign-off.',
      severity: Severity.AMBER,
      isMandatoryCheckpoint: true,
      resolved: false
    };

    setUncertainties((prev) => [newFlag, ...prev]);

    setTranscript((prev) =>
      prev.map((seg) => {
        if (seg.id !== segId) return seg;
        return {
          ...seg,
          acousticPhrases: seg.acousticPhrases?.map((p) =>
            p.id === phrase.id ? { ...p, clarificationFlagged: true } : p
          )
        };
      })
    );

    auditStore.recordEvent({
      eventType: 'CLARIFICATION_RAISED',
      actor: currentUser.name,
      role: currentUser.role,
      patientId: patient.id,
      encounterId: `ENC-${patient.id}`,
      correlationId: `CORR-AC-${phrase.id}`,
      details: `Clinician flagged ambiguous acoustic phrase "${phrase.phrase}". Added checkpoint.`
    });

    onNotify(`Acoustic phrase "${phrase.phrase}" flagged for verification.`, 'info');
  };

  const handleCommitClarifiedPhrase = (phrase: AcousticPhrase, segId: string) => {
    if (!clarificationInput.trim()) return;

    setTranscript((prev) =>
      prev.map((seg) => {
        if (seg.id !== segId) return seg;
        return {
          ...seg,
          acousticPhrases: seg.acousticPhrases?.map((p) =>
            p.id === phrase.id
              ? { ...p, clarifiedPhrase: clarificationInput.trim(), clarificationFlagged: false }
              : p
          )
        };
      })
    );

    auditStore.recordEvent({
      eventType: 'CLARIFICATION_RESOLVED',
      actor: currentUser.name,
      role: currentUser.role,
      patientId: patient.id,
      encounterId: `ENC-${patient.id}`,
      correlationId: `CORR-AC-RES-${phrase.id}`,
      details: `Acoustic phrase clarified: "${phrase.phrase}" corrected to "${clarificationInput.trim()}".`
    });

    onNotify(`Phrase clarified: "${clarificationInput.trim()}"`, 'success');
    setClarifyingPhraseId(null);
    setClarificationInput('');
  };

  const handleApplyPhysicianCorrection = () => {
    if (!physicianCorrectionText.trim()) return;

    const currentV = documentVersions.find((v) => v.versionNumber === activeVersionNumber) ?? documentVersions[0];
    if (!currentV) return;

    const v2: DocumentVersion = {
      versionId: `DOC-${patient.id}-V2`,
      versionNumber: 2,
      createdAt: new Date().toISOString(),
      createdByRole: currentUser.role,
      authorName: currentUser.name,
      title: `${currentV.title.replace('(Draft v1)', '(Physician v2)')}`,
      content: {
        ...currentV.content,
        assessment: `${currentV.content.assessment}\n[PHYSICIAN AMENDMENT]: ${physicianCorrectionText}`,
        plan: `${currentV.content.plan}\n[PHYSICIAN DIRECTIVE]: ${physicianCorrectionText}`
      },
      provenanceSourceIds: [...currentV.provenanceSourceIds, `CORR-${currentUser.id}`],
      predecessorVersionId: currentV.versionId,
      isFinalized: false
    };

    setDocumentVersions((prev) => [v2, ...prev]);
    setActiveVersionNumber(2);
    setPhysicianCorrectionText('');
    setIsEditingDraft(false);
    onNotify('Physician correction committed as Version 2. Version 1 preserved.', 'success');

    auditStore.recordEvent({
      eventType: 'DOCUMENT_CORRECTED_V2',
      actor: currentUser.name,
      role: currentUser.role,
      patientId: patient.id,
      encounterId: `ENC-${patient.id}`,
      correlationId: `CORR-V2-${Date.now()}`,
      details: `Physician created Version 2 for ${patient.name}. Predecessor preserved.`
    });
  };

  const handleResolveUncertainty = (uncId: string, note: string) => {
    setUncertainties((prev) =>
      prev.map((u) =>
        u.id === uncId
          ? {
              ...u,
              resolved: true,
              resolvedBy: currentUser.name,
              resolvedTimestamp: new Date().toISOString(),
              resolutionNote: note
            }
          : u
      )
    );

    auditStore.recordEvent({
      eventType: 'CLARIFICATION_RESOLVED',
      actor: currentUser.name,
      role: currentUser.role,
      patientId: patient.id,
      encounterId: `ENC-${patient.id}`,
      correlationId: `CORR-RES-${uncId}`,
      details: `Checkpoint resolved: "${note}".`
    });

    onNotify('Safety checkpoint verified and resolved.', 'success');
  };

  const handleSignDocument = () => {
    if (!currentUser.canSign) {
      auditStore.recordEvent({
        eventType: 'SIGNATURE_ATTEMPT_DENIED',
        actor: currentUser.name,
        role: currentUser.role,
        patientId: patient.id,
        encounterId: `ENC-${patient.id}`,
        correlationId: `CORR-DENIED-${Date.now()}`,
        details: `Signature denied: User role ${currentUser.role} lacks digital signature authority.`
      });
      onNotify(`AUTHORIZATION DENIED: Only an Attending Physician can sign this report. Current role: ${currentUser.role}.`, 'error');
      return;
    }

    const mandatoryUnresolved = uncertainties.filter((u) => u.isMandatoryCheckpoint && !u.resolved);
    if (mandatoryUnresolved.length > 0) {
      auditStore.recordEvent({
        eventType: 'SIGNATURE_ATTEMPT_DENIED',
        actor: currentUser.name,
        role: currentUser.role,
        patientId: patient.id,
        encounterId: `ENC-${patient.id}`,
        correlationId: `CORR-GATE-FAIL-${Date.now()}`,
        details: `Signature blocked: Mandatory checkpoint "${mandatoryUnresolved[0].discrepancy}" unresolved.`
      });
      onNotify(`SIGN-OFF BLOCKED: ${mandatoryUnresolved[0].discrepancy}`, 'error');
      return;
    }

    const activeDoc = documentVersions.find((v) => v.versionNumber === activeVersionNumber) ?? documentVersions[0];
    if (!activeDoc) return;

    activeDoc.isFinalized = true;
    setLifecycleState(EncounterLifecycleState.SIGNED);

    auditStore.recordEvent({
      eventType: 'SIGNATURE_COMMITTED',
      actor: currentUser.name,
      role: currentUser.role,
      patientId: patient.id,
      encounterId: `ENC-${patient.id}`,
      correlationId: `CORR-SIGN-${activeDoc.versionId}`,
      details: `Attending physician signature committed for Version ${activeDoc.versionId}.`
    });

    onNotify(`Document Version ${activeDoc.versionId} signed. Ready for EHR export.`, 'success');
    setActiveTab('export');
  };

  const handleExportToEHR = () => {
    const activeDoc = documentVersions.find((v) => v.versionNumber === activeVersionNumber) ?? documentVersions[0];
    if (!activeDoc) return;

    const noteText = `FINAL AUTHORIZED CLINICAL REPORT:\n${activeDoc.content.assessment}\n\nPLAN:\n${activeDoc.content.plan}`;

    const res = hospitalGateway.exportSignedDocument({
      patientId: patient.id,
      documentVersionId: activeDoc.versionId,
      title: activeDoc.title,
      signerName: currentUser.name,
      signerRole: currentUser.role,
      documentText: noteText
    });

    if (res.success && res.receipt) {
      setLifecycleState(EncounterLifecycleState.DELIVERED);
      onNotify(`EXPORT SUCCESSFUL: Receipt ${res.receipt.receiptId} confirmed by simulated EHR (HTTP 201).`, 'success');
    } else {
      setLifecycleState(EncounterLifecycleState.EXPORT_FAILED);
      onNotify(`EXPORT FAILED: ${res.error}`, 'error');
    }
  };

  const activeDoc = documentVersions.find((v) => v.versionNumber === activeVersionNumber);
  const mandatoryUnresolvedCount = uncertainties.filter((u) => u.isMandatoryCheckpoint && !u.resolved).length;

  return (
    <div className="h-full flex flex-col bg-anthracite-950 text-slate-100 overflow-hidden">
      {/* Top Bar */}
      <div className="bg-anthracite-900 border-b border-anthracite-800 px-6 py-2.5 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-100">Encounter Studio</span>
          <span className="text-anthracite-600 font-mono">•</span>
          <span className="text-pastel-200 font-mono">{patient.name}</span>
          <span className="text-anthracite-600 font-mono">•</span>
          <span className="text-anthracite-400 font-mono">State: {lifecycleState}</span>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1 rounded hover:bg-anthracite-800"
        >
          Exit to Chat
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-anthracite-950 border-b border-anthracite-800 px-6 flex items-center space-x-6 text-xs font-medium shrink-0">
        <button
          onClick={() => setActiveTab('capture')}
          className={`py-2.5 border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'capture' ? 'border-pastel-400 text-pastel-200' : 'border-transparent text-slate-400'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Ambient Capture & Waveform ({transcript.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('draft')}
          className={`py-2.5 border-b-2 transition-colors ${
            activeTab === 'draft' ? 'border-pastel-400 text-pastel-200' : 'border-transparent text-slate-400'
          }`}
        >
          Report Drafts ({documentVersions.length})
        </button>
        <button
          onClick={() => setActiveTab('uncertainties')}
          className={`py-2.5 border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'uncertainties' ? 'border-pastel-400 text-pastel-200' : 'border-transparent text-slate-400'
          }`}
        >
          <span>Safety Checkpoints</span>
          {mandatoryUnresolvedCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-900/60 text-amber-300 font-mono">
              {mandatoryUnresolvedCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('export')}
          className={`py-2.5 border-b-2 transition-colors ${
            activeTab === 'export' ? 'border-pastel-400 text-pastel-200' : 'border-transparent text-slate-400'
          }`}
        >
          Sign & Export
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-4xl mx-auto w-full">
        {/* TAB 1: CAPTURE WITH WAVEFORM & CONFIDENCE SCRUBBER */}
        {activeTab === 'capture' && (
          <div className="space-y-4">
            <div className="bg-anthracite-900 border border-anthracite-800 rounded-xl p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        lifecycleState === EncounterLifecycleState.ACTIVE_CAPTURE
                          ? 'bg-pastel-300 animate-pulse'
                          : 'bg-anthracite-600'
                      }`}
                    ></span>
                    <p className="text-xs font-semibold text-slate-100">Ambient Acoustic Stream Buffer</p>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-anthracite-800 text-anthracite-400 border border-anthracite-750">
                      {isMicStreaming ? 'WebAudio Live Mic' : 'Simulated Ambient Stream'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Real-time decibel analysis and acoustic uncertainty scrubber for speech-to-text synthesis.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  {lifecycleState === EncounterLifecycleState.INACTIVE ? (
                    <button
                      onClick={handleStartCapture}
                      className="bg-anthracite-800 hover:bg-anthracite-750 text-pastel-200 border border-anthracite-700 text-xs px-3.5 py-1.5 rounded-lg flex items-center space-x-1.5 font-medium transition-colors shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5 fill-current text-pastel-300" />
                      <span>Activate Capture</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => advanceTranscriptSegment(scriptIndex)}
                      disabled={scriptIndex >= activeScript.length}
                      className="bg-anthracite-800 hover:bg-anthracite-750 disabled:opacity-40 text-pastel-200 border border-anthracite-700 text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1.5 font-medium transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-pastel-300" />
                      <span>
                        Advance Dialogue ({scriptIndex}/{activeScript.length})
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Minimalist Waveform Visualizer & Decibel Meter */}
              <div className="bg-anthracite-950 border border-anthracite-800/80 rounded-lg p-3 flex items-center justify-between gap-4">
                <div className="flex-1 flex items-center justify-start space-x-1 h-9 overflow-hidden px-2">
                  {waveformBars.map((heightPercent, idx) => (
                    <div
                      key={idx}
                      className="w-1.5 rounded-full transition-all duration-75 bg-anthracite-750"
                      style={{
                        height: `${heightPercent}%`,
                        backgroundColor:
                          lifecycleState === EncounterLifecycleState.ACTIVE_CAPTURE
                            ? idx % 3 === 0
                              ? '#93cbfe'
                              : '#343a47'
                            : '#232730'
                      }}
                    ></div>
                  ))}
                </div>

                <div className="flex items-center space-x-3 shrink-0 border-l border-anthracite-800/80 pl-4 font-mono text-[11px]">
                  <div className="text-right">
                    <span className="text-[9px] text-anthracite-500 uppercase tracking-wider block">Input Level</span>
                    <span className="text-slate-200 font-bold">{decibelLevel} dBFS</span>
                  </div>

                  <div className="w-16 h-2 bg-anthracite-800 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-pastel-300 transition-all duration-75"
                      style={{
                        width: `${Math.min(100, Math.max(8, ((decibelLevel + 60) / 54) * 100))}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Live Speech-to-Text Confidence Scrubber */}
              <div className="pt-2 border-t border-anthracite-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-2 text-slate-300">
                  <Sliders className="w-3.5 h-3.5 text-pastel-300" />
                  <span className="font-medium text-[11px]">STT Confidence Threshold:</span>
                  <span className="font-mono text-pastel-200 font-semibold">{Math.round(confidenceThreshold * 100)}%</span>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="0.50"
                    max="0.95"
                    step="0.05"
                    value={confidenceThreshold}
                    onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                    className="w-32 h-1.5 bg-anthracite-800 rounded-lg appearance-none cursor-pointer accent-pastel-300"
                  />
                  <span className="text-[10px] font-mono text-anthracite-400">
                    Filter &lt; {Math.round(confidenceThreshold * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Transcript Feed with Interactive Acoustic Phrase Clarifications */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1 text-[11px] font-mono text-anthracite-400">
                <span>CAPTURED AMBIENT TRANSCRIPT ({patient.name})</span>
                <span>Click phrase to flag or clarify</span>
              </div>

              {transcript.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 bg-anthracite-900 border border-dashed border-anthracite-800 rounded-xl">
                  Tap "Activate Capture" to begin streaming clinical statements for {patient.name}.
                </div>
              ) : (
                transcript.map((seg) => {
                  const segConfidence = seg.overallConfidence ?? 0.92;
                  const isLowConfidenceSeg = segConfidence < confidenceThreshold;

                  return (
                    <div
                      key={seg.id}
                      className="p-3.5 rounded-xl bg-anthracite-900 border border-anthracite-800 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between border-b border-anthracite-800/80 pb-1.5 text-[11px]">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-[10px] text-pastel-300 bg-anthracite-800 px-1.5 py-0.5 rounded border border-anthracite-750">
                            {seg.speaker}
                          </span>
                          <span className="text-anthracite-500 font-mono text-[10px]">{seg.timestamp}</span>
                        </div>

                        <div className="flex items-center space-x-1.5 font-mono text-[10px]">
                          <span className="text-anthracite-500">Confidence:</span>
                          <span
                            className={
                              isLowConfidenceSeg
                                ? 'text-amber-300 font-bold bg-amber-950/30 px-1.5 py-0.5 rounded border border-amber-800/60'
                                : 'text-slate-300'
                            }
                          >
                            {Math.round(segConfidence * 100)}%
                          </span>
                        </div>
                      </div>

                      {seg.acousticPhrases && seg.acousticPhrases.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1.5 text-slate-200 leading-relaxed">
                          {seg.acousticPhrases.map((phrase) => {
                            const isBelowThreshold = phrase.confidence < confidenceThreshold;
                            const isSelected = clarifyingPhraseId === phrase.id;

                            return (
                              <span key={phrase.id} className="inline-flex items-center">
                                <span
                                  onClick={() => {
                                    if (phrase.isAcousticallyAmbiguous || isBelowThreshold) {
                                      setClarifyingPhraseId(isSelected ? null : phrase.id);
                                      setClarificationInput(phrase.clarifiedPhrase || phrase.phrase);
                                    }
                                  }}
                                  className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                                    phrase.clarifiedPhrase
                                      ? 'bg-emerald-950/40 border border-emerald-700/80 text-emerald-200 font-medium'
                                      : phrase.clarificationFlagged
                                      ? 'bg-amber-950/50 border border-amber-700 text-amber-200 font-medium ring-1 ring-amber-500/30'
                                      : isBelowThreshold || phrase.isAcousticallyAmbiguous
                                      ? 'bg-anthracite-850 border border-amber-800/80 text-amber-200 underline decoration-amber-400/60 decoration-dashed underline-offset-2'
                                      : 'hover:bg-anthracite-800'
                                  }`}
                                  title={`Confidence: ${Math.round(phrase.confidence * 100)}%. Click to clarify.`}
                                >
                                  {phrase.clarifiedPhrase ? (
                                    <span className="flex items-center space-x-1">
                                      <span>{phrase.clarifiedPhrase}</span>
                                      <span className="text-[9px] text-emerald-400 font-mono">(Clarified)</span>
                                    </span>
                                  ) : (
                                    phrase.phrase
                                  )}
                                </span>

                                {(isBelowThreshold || phrase.isAcousticallyAmbiguous) && !phrase.clarifiedPhrase && (
                                  <span className="text-[9px] font-mono text-amber-400/80 ml-1">
                                    [{Math.round(phrase.confidence * 100)}%]
                                  </span>
                                )}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-slate-200 leading-relaxed">{seg.text}</p>
                      )}

                      {seg.acousticPhrases?.map((phrase) => {
                        if (clarifyingPhraseId !== phrase.id) return null;

                        return (
                          <div
                            key={`clarify-${phrase.id}`}
                            className="mt-2.5 p-3 rounded-lg bg-anthracite-950 border border-anthracite-750 space-y-2.5 text-xs"
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <div className="flex items-center space-x-1.5">
                                <Flag className="w-3.5 h-3.5 text-amber-300" />
                                <span className="font-semibold text-slate-200">
                                  Acoustic Clarification: "{phrase.phrase}"
                                </span>
                              </div>
                              <button
                                onClick={() => setClarifyingPhraseId(null)}
                                className="text-anthracite-500 hover:text-slate-200 p-0.5"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={clarificationInput}
                                onChange={(e) => setClarificationInput(e.target.value)}
                                placeholder="Enter verified clinician clarification..."
                                className="flex-1 bg-anthracite-900 border border-anthracite-700 text-slate-100 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-pastel-400"
                              />

                              <button
                                onClick={() => handleCommitClarifiedPhrase(phrase, seg.id)}
                                className="bg-anthracite-800 hover:bg-anthracite-750 text-pastel-200 border border-anthracite-700 px-3 py-1.5 rounded flex items-center space-x-1 text-xs font-medium"
                              >
                                <Check className="w-3.5 h-3.5 text-pastel-300" />
                                <span>Save Clarification</span>
                              </button>

                              {!phrase.clarificationFlagged && (
                                <button
                                  onClick={() => handleFlagAcousticClarification(phrase, seg.id)}
                                  className="bg-amber-950/60 hover:bg-amber-900/60 text-amber-200 border border-amber-800/80 px-2.5 py-1.5 rounded flex items-center space-x-1 text-xs"
                                >
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                                  <span>Flag Checkpoint</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: DRAFTS & PHYSICIAN CORRECTIONS */}
        {activeTab === 'draft' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {documentVersions.map((v) => (
                  <button
                    key={v.versionId}
                    onClick={() => setActiveVersionNumber(v.versionNumber)}
                    className={`px-2.5 py-1 rounded text-xs font-mono border transition-colors ${
                      activeVersionNumber === v.versionNumber
                        ? 'bg-anthracite-800 text-pastel-200 border-anthracite-700 font-bold'
                        : 'bg-anthracite-900 text-slate-400 border-anthracite-800'
                    }`}
                  >
                    Version {v.versionNumber}
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsDiffDrawerOpen(true)}
                  className="text-xs text-pastel-200 bg-anthracite-900 hover:bg-anthracite-850 border border-anthracite-750 px-2.5 py-1 rounded flex items-center space-x-1.5 font-medium transition-colors"
                >
                  <GitCompare className="w-3.5 h-3.5 text-pastel-300" />
                  <span>Version Diff Drawer</span>
                </button>

                <button
                  onClick={() => setIsEditingDraft(!isEditingDraft)}
                  className="text-xs text-pastel-200 bg-anthracite-800 hover:bg-anthracite-750 border border-anthracite-700 px-2.5 py-1 rounded flex items-center space-x-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Physician Correction</span>
                </button>
              </div>
            </div>

            {isEditingDraft && (
              <div className="bg-anthracite-900 border border-anthracite-750 rounded-xl p-4 space-y-2.5">
                <span className="text-xs font-semibold text-pastel-200 block">
                  Physician Amendment (Generates Version 2)
                </span>
                <textarea
                  rows={2}
                  value={physicianCorrectionText}
                  onChange={(e) => setPhysicianCorrectionText(e.target.value)}
                  placeholder="Enter physician correction or directive..."
                  className="w-full bg-anthracite-950 border border-anthracite-750 text-slate-100 text-xs rounded p-2 focus:outline-none focus:border-pastel-400"
                />
                <div className="flex justify-end space-x-2">
                  <button onClick={() => setIsEditingDraft(false)} className="text-xs text-slate-400 px-2 py-1">
                    Cancel
                  </button>
                  <button
                    onClick={handleApplyPhysicianCorrection}
                    className="bg-anthracite-800 hover:bg-anthracite-750 text-pastel-200 border border-anthracite-700 text-xs px-3 py-1 rounded font-medium"
                  >
                    Commit Version 2
                  </button>
                </div>
              </div>
            )}

            {activeDoc ? (
              <div className="bg-anthracite-900 border border-anthracite-800 rounded-xl p-4 space-y-3 text-xs leading-relaxed">
                <div className="border-b border-anthracite-800 pb-2">
                  <h4 className="font-semibold text-slate-100">{activeDoc.title}</h4>
                  <p className="text-[10px] font-mono text-slate-500 mt-0.5">Author: {activeDoc.authorName}</p>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Assessment</span>
                  <p className="text-slate-200 whitespace-pre-line mt-0.5">{activeDoc.content.assessment}</p>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-pastel-300 uppercase block">Plan</span>
                  <p className="text-slate-200 whitespace-pre-line mt-0.5">{activeDoc.content.plan}</p>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 bg-anthracite-900 border border-dashed border-anthracite-800 rounded-xl">
                No draft generated yet. Advance dialogue in Ambient Dialogue tab.
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SAFETY CHECKPOINTS */}
        {activeTab === 'uncertainties' && (
          <div className="space-y-3">
            {uncertainties.map((unc) => (
              <div
                key={unc.id}
                className="bg-anthracite-900 border border-anthracite-800 rounded-xl p-3.5 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">{unc.originatingInfo}</span>
                  {unc.resolved ? (
                    <span className="text-emerald-400 font-mono text-[11px] flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Resolved by {unc.resolvedBy}</span>
                    </span>
                  ) : (
                    <span className="text-amber-300 font-mono text-[11px] font-semibold">BLOCKING SIGN-OFF</span>
                  )}
                </div>
                <p className="text-slate-300">{unc.discrepancy}</p>
                <p className="text-pastel-200 text-[11px]">Action: {unc.requiredAction}</p>

                {!unc.resolved && (
                  <button
                    onClick={() =>
                      handleResolveUncertainty(
                        unc.id,
                        `Verified and resolved by ${currentUser.name}.`
                      )
                    }
                    className="bg-anthracite-800 hover:bg-anthracite-750 text-pastel-200 border border-anthracite-700 text-xs px-2.5 py-1 rounded"
                  >
                    Verify & Resolve
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: SIGN & EXPORT */}
        {activeTab === 'export' && (
          <div className="bg-anthracite-900 border border-anthracite-800 rounded-xl p-4 space-y-4 text-xs">
            <div>
              <p className="font-semibold text-slate-100">Physician Digital Signature & Authoritative Export</p>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Acting Signer: {currentUser.name} ({currentUser.role})
              </p>
            </div>

            <div className="p-3 rounded-lg bg-anthracite-850 border border-anthracite-750 space-y-1 text-[11px]">
              <p>• Role Gate: {currentUser.canSign ? 'PERMITTED (Attending)' : 'DENIED (Non-attending cannot sign)'}</p>
              <p>
                • Checkpoints:{' '}
                {mandatoryUnresolvedCount === 0 ? 'All Cleared' : `${mandatoryUnresolvedCount} Unresolved Blocker(s)`}
              </p>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={handleSignDocument}
                disabled={lifecycleState === EncounterLifecycleState.SIGNED || lifecycleState === EncounterLifecycleState.DELIVERED}
                className="bg-anthracite-800 hover:bg-anthracite-750 disabled:opacity-30 text-pastel-200 border border-anthracite-700 text-xs px-3.5 py-1.5 rounded-lg flex items-center space-x-1.5 font-medium transition-colors"
              >
                <FileCheck className="w-3.5 h-3.5 text-pastel-300" />
                <span>
                  {lifecycleState === EncounterLifecycleState.SIGNED || lifecycleState === EncounterLifecycleState.DELIVERED
                    ? 'Signature Committed'
                    : 'Commit Attending Signature'}
                </span>
              </button>

              <button
                onClick={handleExportToEHR}
                disabled={lifecycleState !== EncounterLifecycleState.SIGNED}
                className="bg-anthracite-800 hover:bg-anthracite-750 disabled:opacity-30 text-pastel-200 border border-anthracite-700 text-xs px-3.5 py-1.5 rounded-lg flex items-center space-x-1.5 font-medium transition-colors"
              >
                <Send className="w-3.5 h-3.5 text-pastel-300" />
                <span>Export to Hospital EHR</span>
              </button>
            </div>

            {lifecycleState === EncounterLifecycleState.DELIVERED && (
              <div className="p-3 rounded-lg bg-anthracite-950 border border-emerald-800/60 text-emerald-300 text-xs">
                Delivered and indexed in authoritative hospital EHR (HTTP 201 Created).
              </div>
            )}
          </div>
        )}
      </div>

      {/* Side-by-Side Version Diff & Provenance Drawer Modal */}
      <VersionDiffDrawer
        isOpen={isDiffDrawerOpen}
        onClose={() => setIsDiffDrawerOpen(false)}
        transcript={transcript}
        documentVersions={documentVersions}
        activeVersionNumber={activeVersionNumber}
      />
    </div>
  );
};
