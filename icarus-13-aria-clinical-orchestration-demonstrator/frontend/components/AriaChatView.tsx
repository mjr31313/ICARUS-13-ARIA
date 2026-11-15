import React, { useState, useRef, useEffect } from 'react';
import {
  Patient,
  LabResult,
  ImagingReport,
  InstitutionalProtocol,
  UserProfile,
  CrossSystemContradiction,
  WorkflowTask,
  TemporalComparisonItem
} from '../types';
import { ariaService, AriaResponse } from '../services/geminiService';
import { orchestrationEngine } from '../services/orchestrationEngine';
import { speechController } from '../services/speechService';
import { AriaWordmark } from './BrandLogos';
import {
  ArrowUp,
  Mic,
  MicOff,
  Shield,
  CornerDownRight,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Check,
  ArrowRight,
  Sparkles,
  Volume2,
  VolumeX,
  Headphones,
  ExternalLink
} from 'lucide-react';

interface AriaChatViewProps {
  patient: Patient;
  labs: LabResult[];
  imaging: ImagingReport[];
  protocols: InstitutionalProtocol[];
  currentUser: UserProfile;
  onOpenEHR: () => void;
  onOpenEncounter: () => void;
  onOpenVoiceCall: () => void;
  initialTopic?: string;
}

interface Message {
  id: string;
  sender: 'user' | 'aria';
  text: string;
  citations?: AriaResponse['sourceCitations'];
  actionSuggestion?: string;
  isOrchestrationBundle?: boolean;
  contradictionAlert?: AriaResponse['contradictionAlert'];
  temporalDelta?: AriaResponse['temporalDelta'];
  timestamp: string;
}

interface StarterCard {
  title: string;
  subtitle: string;
  query: string;
  primary?: boolean;
}

export const AriaChatView: React.FC<AriaChatViewProps> = ({
  patient,
  labs,
  imaging,
  protocols,
  currentUser,
  onOpenEHR,
  onOpenEncounter,
  onOpenVoiceCall,
  initialTopic
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDictating, setIsDictating] = useState(false);
  const [activeSpeakingMsgId, setActiveSpeakingMsgId] = useState<string | null>(null);
  const [selectedCitation, setSelectedCitation] = useState<AriaResponse['sourceCitations'][0] | null>(null);

  // Orchestration & Contradiction state
  const [tasks, setTasks] = useState<WorkflowTask[]>(orchestrationEngine.getTasks());
  const [contradictions, setContradictions] = useState<CrossSystemContradiction[]>(orchestrationEngine.getContradictions());
  const [isAuthorizingTasks, setIsAuthorizingTasks] = useState(false);
  const [resolvingContradictionId, setResolvingContradictionId] = useState<string | null>(null);
  const [resolutionInput, setResolutionInput] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset message stream cleanly when switching patient context
  useEffect(() => {
    speechController.stopSpeaking();
    setMessages([]);
    setInputValue('');
    setResolvingContradictionId(null);
    setResolutionInput('');
  }, [patient.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing, tasks]);

  useEffect(() => {
    const unsub = orchestrationEngine.subscribe((updatedTasks, updatedContradictions) => {
      setTasks(updatedTasks);
      setContradictions(updatedContradictions);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsubPlayback = speechController.subscribePlayback((id, isSpeaking) => {
      setActiveSpeakingMsgId(isSpeaking ? id : null);
    });
    return () => unsubPlayback();
  }, []);

  useEffect(() => {
    if (initialTopic) {
      handleSend(initialTopic);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTopic]);

  // Adjust textarea height like ChatGPT
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  const getStarterCards = (): StarterCard[] => {
    switch (patient.id) {
      case 'PAT-AN-7204':
        return [
          {
            title: "Changes since last admission",
            subtitle: "Compare Creatinine (1.4 → 2.1), K+ (4.5 → 5.7), and NT-proBNP",
            query: "What has changed since this patient's last admission?",
            primary: true
          },
          {
            title: "Reconcile Furosemide history",
            subtitle: "Inspect discrepancy between 40 mg script and 80 mg admission note",
            query: "Reconcile the available medication history for Furosemide"
          },
          {
            title: "Evaluate critical potassium",
            subtitle: "Check K+ 5.7 mmol/L alert and stat 12-lead ECG protocol",
            query: "Evaluate current potassium level and ECG requirements"
          },
          {
            title: "Prepare SBAR handover",
            subtitle: "Synthesize cardiology handover and coordinate follow-up tasks",
            query: "Prepare SBAR handover and cardiology follow-up tasks"
          }
        ];
      case 'PAT-MK-5905':
        return [
          {
            title: "Prepare oncology tumor board",
            subtitle: "Assemble pT3N1a pathology, colectomy summary, and CT findings",
            query: "ARIA, prepare this patient for tomorrow's oncology board",
            primary: true
          },
          {
            title: "Evaluate 8mm liver lesion",
            subtitle: "Inspect restaging CT subcapsular lesion and indeterminate status",
            query: "Evaluate the restaging CT liver lesion findings and metastasis status"
          },
          {
            title: "Review synoptic pathology",
            subtitle: "1 of 18 lymph nodes positive, R0 resection margins, MSS intact",
            query: "Review synoptic histopathology and pT3N1a staging"
          },
          {
            title: "Coordinate MDT tasks",
            subtitle: "Propose Primovist MRI, board agenda registration, and med-onc consult",
            query: "Prepare the outstanding coordination tasks for the MDT"
          }
        ];
      case 'PAT-TR-3402':
        return [
          {
            title: "Trauma survey & pulse check",
            subtitle: "Review Gustilo IIIB tibial fracture and dorsalis pedis perfusion",
            query: "Summarize trauma bay findings and dorsalis pedis pulse status",
            primary: true
          },
          {
            title: "Open fracture protocol",
            subtitle: "Check vascular Doppler and antibiotic prophylaxis guidelines",
            query: "Review open fracture vascular protocol and required actions"
          },
          {
            title: "Emergency OR SBAR",
            subtitle: "Coordinate emergency trauma theater handover",
            query: "Prepare SBAR handover for emergency vascular and trauma surgery"
          },
          {
            title: "Stat lab telemetry",
            subtitle: "Inspect blood gas Hb (8.4 g/dL) and lactate (4.8 mmol/L)",
            query: "Review stat trauma blood gas and resuscitation parameters"
          }
        ];
      case 'PAT-GS-5203':
        return [
          {
            title: "Post-op recovery trajectory",
            subtitle: "Evaluate POD 4 status post laparoscopic hemicolectomy",
            query: "Summarize post-op recovery and bowel function progress",
            primary: true
          },
          {
            title: "CRP inflammatory trend",
            subtitle: "Compare post-op downward trend (74 → 18.2 mg/L)",
            query: "Compare CRP trajectory with pre-op values"
          },
          {
            title: "Fast-track discharge criteria",
            subtitle: "Check solid food tolerance, oral analgesics, and GP handover",
            query: "Check fast-track discharge readiness and follow-up requirements"
          },
          {
            title: "Discharge SBAR note",
            subtitle: "Draft discharge summary and outpatient wound surveillance",
            query: "Prepare discharge summary draft and follow-up tasks"
          }
        ];
      case 'PAT-GR-6701':
      default:
        return [
          {
            title: "Changes since last admission",
            subtitle: "Compare Hb drop (11.2 → 9.8 g/dL), eGFR (66 → 53), and new AFib on Apixaban",
            query: "What has changed since this patient's last admission, and what should the clinician verify before surgery?",
            primary: true
          },
          {
            title: "Review patient & coordinate tasks",
            subtitle: "Identify pre-op requirements, check consent, and organize workflow",
            query: "ARIA, review tomorrow's first patient, identify outstanding requirements, prepare documentation, and coordinate follow-ups"
          },
          {
            title: "Retrieve 2021 operative report",
            subtitle: "Inspect primary Corail/Pinnacle THA surgical note and Gruen loosening",
            query: "Retrieve the 2021 primary total hip operative report"
          },
          {
            title: "Check revision protocol SOP",
            subtitle: "Verify Apixaban 48h cessation window and 2 units PRBC crossmatch",
            query: "Check revision protocol requirements and missing safety items"
          }
        ];
    }
  };

  const handleSend = async (queryText?: string) => {
    const q = (queryText ?? inputValue).trim();
    if (!q) return;

    const userMsg: Message = {
      id: `USR-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsProcessing(true);

    try {
      const response = await ariaService.askAria({
        query: q,
        patient,
        labs,
        imaging,
        protocols,
        clinicianRole: currentUser.role
      });

      const ariaMsg: Message = {
        id: `ARIA-${Date.now()}`,
        sender: 'aria',
        text: response.answer,
        citations: response.sourceCitations,
        actionSuggestion: response.actionSuggestion,
        isOrchestrationBundle: response.isOrchestrationBundle,
        contradictionAlert: response.contradictionAlert,
        temporalDelta: response.temporalDelta,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, ariaMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleReadAloud = (msg: Message) => {
    if (activeSpeakingMsgId === msg.id) {
      speechController.stopSpeaking();
    } else {
      speechController.speak(msg.id, msg.text);
    }
  };

  const handleAuthorizeWorkflow = () => {
    setIsAuthorizingTasks(true);
    setTimeout(() => {
      orchestrationEngine.authorizeAndDispatchTasks({
        actor: currentUser.name,
        role: currentUser.role,
        patientId: patient.id
      });
      setIsAuthorizingTasks(false);
    }, 400);
  };

  const handleResolveContradiction = (contradictionId: string) => {
    if (!resolutionInput.trim()) return;
    orchestrationEngine.resolveContradiction({
      id: contradictionId,
      note: resolutionInput.trim(),
      actor: currentUser.name,
      role: currentUser.role
    });
    setResolvingContradictionId(null);
    setResolutionInput('');
  };

  const toggleDictation = () => {
    if (isDictating) {
      setIsDictating(false);
      return;
    }
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        setIsDictating(true);
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputValue((prev) => (prev ? `${prev} ${transcript}` : transcript));
          setIsDictating(false);
        };
        recognition.onerror = () => setIsDictating(false);
        recognition.onend = () => setIsDictating(false);
        recognition.start();
      } catch {
        setIsDictating(false);
      }
    } else {
      setIsDictating(true);
      setTimeout(() => {
        setInputValue("What changed since this patient's last admission, and what should I verify before surgery?");
        setIsDictating(false);
      }, 1000);
    }
  };

  const unresolvedContradiction = contradictions.find((c) => c.status === 'UNRESOLVED' && c.patientId === patient.id);
  const patientTasks = orchestrationEngine.getTasksForPatient(patient.id);
  const allTasksSent = patientTasks.length > 0 && patientTasks.every((t) => t.status === 'SENT' || t.status === 'ACKNOWLEDGED' || t.status === 'COMPLETED');
  const isFreshConversation = messages.length === 0;

  return (
    <div className="flex-1 min-w-0 w-full flex flex-col h-full bg-anthracite-950 text-slate-100 overflow-hidden relative">
      {/* Upper-Half Opening Screen: Minimal, Uncluttered, Restrained */}
      {isFreshConversation ? (
        <div className="flex-1 min-w-0 w-full overflow-y-auto px-4 md:px-8 py-5 max-w-2xl mx-auto flex flex-col justify-start space-y-4">
          {/* Subtle Context Header (Compact, no giant containers) */}
          <div className="flex items-center justify-between text-xs py-1 border-b border-anthracite-900/80">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-200">{patient.name}</span>
              <span className="text-anthracite-700 font-mono">•</span>
              <span className="text-pastel-200 font-mono text-[11px]">{patient.department}</span>
              <span className="text-anthracite-700 font-mono">•</span>
              <span className="text-anthracite-400 font-mono text-[11px]">{patient.mrn}</span>
            </div>
            <span className="text-[10px] font-mono text-anthracite-500">{patient.room}</span>
          </div>

          {/* High-Contrast Suggested Actions */}
          <div className="space-y-2 pt-1">
            <p className="text-[10px] font-mono uppercase tracking-wider text-anthracite-500">
              Suggested Clinical Inquiries
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full min-w-0">
              {getStarterCards().map((card, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(card.query)}
                  className={`p-3 text-left rounded-xl border transition-all space-y-1 group min-w-0 ${
                    card.primary
                      ? 'bg-anthracite-900/90 border-pastel-400/40 hover:border-pastel-300'
                      : 'bg-anthracite-900/50 hover:bg-anthracite-850 border-anthracite-850 hover:border-anthracite-750'
                  }`}
                >
                  <div className="flex items-center justify-between min-w-0">
                    <span
                      className={`text-xs font-semibold truncate pr-2 ${
                        card.primary ? 'text-pastel-200' : 'text-slate-200 group-hover:text-pastel-200'
                      }`}
                    >
                      {card.title}
                    </span>
                    {card.primary ? (
                      <span className="px-1.5 py-0.2 rounded text-[8.5px] font-mono bg-pastel-400/20 text-pastel-200 border border-pastel-300/30 shrink-0">
                        Primary
                      </span>
                    ) : (
                      <ArrowRight className="w-3 h-3 shrink-0 text-anthracite-600 group-hover:text-pastel-300 transition-colors" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug break-words">
                    {card.subtitle}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Conversation Mode: Main Chat Message Stream (Clean, no redundant avatar boxes) */
        <div className="flex-1 min-w-0 w-full overflow-y-auto px-4 md:px-6 py-4 space-y-3.5 max-w-3xl mx-auto flex flex-col">
          <div className="mt-auto"></div>

          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex w-full min-w-0 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[88%] min-w-0 rounded-2xl p-3.5 leading-relaxed text-xs md:text-sm break-words [overflow-wrap:anywhere] ${
                  m.sender === 'user'
                    ? 'bg-anthracite-850 text-slate-100 rounded-br-sm'
                    : 'bg-anthracite-900 text-slate-200 border border-anthracite-800/80 rounded-bl-sm shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="whitespace-pre-wrap leading-relaxed break-words [overflow-wrap:anywhere] flex-1">
                    {m.text}
                  </p>

                  {/* Read Aloud Button on Every ARIA Reply */}
                  {m.sender === 'aria' && (
                    <button
                      onClick={() => handleToggleReadAloud(m)}
                      aria-label={activeSpeakingMsgId === m.id ? 'Stop reading' : 'Read aloud'}
                      title={activeSpeakingMsgId === m.id ? 'Stop reading' : 'Read reply aloud'}
                      className={`p-1 rounded text-xs transition-colors shrink-0 ml-1 ${
                        activeSpeakingMsgId === m.id
                          ? 'bg-pastel-400/20 text-pastel-200 border border-pastel-300/40 animate-pulse'
                          : 'text-anthracite-500 hover:text-slate-200 hover:bg-anthracite-800'
                      }`}
                    >
                      {activeSpeakingMsgId === m.id ? (
                        <VolumeX className="w-3.5 h-3.5" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>

                {/* Structured Prior vs Current vs Clinical Impact Comparison Cards */}
                {m.temporalDelta?.structuredComparisons && m.temporalDelta.structuredComparisons.length > 0 && (
                  <div className="mt-3.5 space-y-2">
                    <p className="text-[11px] font-mono uppercase tracking-wider text-pastel-300 font-semibold flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Verifiable Temporal Evolution (Prior vs Current vs Impact)</span>
                    </p>

                    <div className="space-y-2">
                      {m.temporalDelta.structuredComparisons.map((item) => (
                        <div
                          key={item.id}
                          className={`p-3 rounded-lg bg-anthracite-950 border space-y-2 transition-all ${
                            item.isDiscrepancy
                              ? 'border-amber-900/80 ring-1 ring-amber-500/20'
                              : 'border-anthracite-850 hover:border-anthracite-750'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-100 text-xs">{item.parameter}</span>
                            {item.isDiscrepancy && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-950/60 text-amber-300 border border-amber-800">
                                Needs Clinician Review
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                            <div className="p-2 rounded bg-anthracite-900 border border-anthracite-800">
                              <span className="text-anthracite-500 text-[10px] block uppercase">Prior Status</span>
                              <span className="text-slate-300">{item.priorStatus}</span>
                            </div>
                            <div className="p-2 rounded bg-anthracite-900 border border-anthracite-800">
                              <span className="text-pastel-300 text-[10px] block uppercase">Current Status</span>
                              <span className="text-slate-100 font-semibold">{item.currentStatus}</span>
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                            <span className="text-pastel-200 font-medium">Why it matters:</span> {item.clinicalImpact}
                          </p>

                          {/* Clickable Source Link */}
                          <div className="pt-1.5 border-t border-anthracite-850 flex items-center justify-between text-[10px] font-mono">
                            <button
                              onClick={() =>
                                setSelectedCitation({
                                  system: item.sourceSystem,
                                  recordId: item.sourceRecordId,
                                  title: item.sourceTitle,
                                  timestamp: item.sourceDate
                                })
                              }
                              className="text-pastel-300 hover:text-white flex items-center space-x-1 underline decoration-pastel-400/40"
                            >
                              <span>[{item.sourceSystem}] {item.sourceTitle}</span>
                              <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                            </button>
                            <span className="text-anthracite-500">{item.sourceDate.slice(0, 10)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cross-System Contradiction Callout */}
                {m.contradictionAlert && (
                  <div className="mt-3 p-3 rounded-lg bg-anthracite-950 border border-amber-900/60 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 text-amber-300 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{m.contradictionAlert.summary}</span>
                      </div>
                      <span className="text-[10px] font-mono text-amber-400/80 uppercase">Needs Clinician Review</span>
                    </div>

                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {m.contradictionAlert.discrepancy}
                    </p>

                    <div className="p-2 rounded bg-anthracite-900 border border-anthracite-800 text-[11px] font-mono space-y-1 text-slate-300">
                      <p className="text-anthracite-400">Source A: {m.contradictionAlert.sourceA}</p>
                      <p className="text-anthracite-400">Source B: {m.contradictionAlert.sourceB}</p>
                    </div>

                    {unresolvedContradiction ? (
                      resolvingContradictionId === m.contradictionAlert.id ? (
                        <div className="pt-1.5 space-y-2">
                          <input
                            type="text"
                            value={resolutionInput}
                            onChange={(e) => setResolutionInput(e.target.value)}
                            placeholder="Enter verified clinician clarification note..."
                            className="w-full bg-anthracite-900 border border-anthracite-750 text-slate-100 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-pastel-400"
                          />
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => setResolvingContradictionId(null)}
                              className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleResolveContradiction(m.contradictionAlert!.id)}
                              className="bg-anthracite-800 hover:bg-anthracite-750 text-pastel-200 border border-anthracite-700 text-xs px-3 py-1 rounded font-medium"
                            >
                              Commit Clarification
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setResolvingContradictionId(m.contradictionAlert.id)}
                          className="text-xs text-pastel-200 bg-anthracite-900 hover:bg-anthracite-850 border border-anthracite-750 px-2.5 py-1 rounded font-medium transition-colors"
                        >
                          Clarify Contradiction
                        </button>
                      )
                    ) : (
                      <div className="text-[11px] text-emerald-400 font-mono flex items-center space-x-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Verified & Resolved by Care Team</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Closed-Loop Orchestration Plan Card */}
                {m.isOrchestrationBundle && (
                  <div className="mt-3.5 p-3.5 rounded-xl bg-anthracite-950 border border-anthracite-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-anthracite-800/80 pb-2">
                      <div className="flex items-center space-x-2">
                        <Layers className="w-3.5 h-3.5 text-pastel-300" />
                        <span className="font-semibold text-slate-100 text-xs">
                          Interprofessional Coordination Plan
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-pastel-300 bg-anthracite-900 px-2 py-0.5 rounded border border-anthracite-800">
                        {allTasksSent ? 'DISPATCHED & ACKNOWLEDGED' : 'AWAITING PHYSICIAN AUTHORIZATION'}
                      </span>
                    </div>

                    {/* Tasks List */}
                    <div className="space-y-2">
                      {patientTasks.map((task) => (
                        <div
                          key={task.id}
                          className="p-2.5 rounded-lg bg-anthracite-900 border border-anthracite-850 flex flex-col space-y-1 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-200">{task.title}</span>
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                task.status === 'ACKNOWLEDGED'
                                  ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/60'
                                  : task.status === 'SENT'
                                  ? 'bg-anthracite-800 text-pastel-300 border border-anthracite-750'
                                  : 'bg-anthracite-850 text-slate-400'
                              }`}
                            >
                              {task.status}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>Recipient: {task.assigneeRole}</span>
                            <span className="text-anthracite-500 font-mono">{task.targetDepartment}</span>
                          </div>

                          {task.receiptNote && (
                            <div className="mt-1 pt-1 border-t border-anthracite-800/80 text-[11px] font-mono text-emerald-400">
                              ✓ {task.acknowledgedBy}: "{task.receiptNote}"
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Physician Authorization Gate */}
                    <div className="pt-2 flex items-center justify-between border-t border-anthracite-800/80">
                      <p className="text-[11px] text-slate-400">
                        Signer: <span className="text-slate-200">{currentUser.name}</span>
                      </p>

                      <button
                        onClick={handleAuthorizeWorkflow}
                        disabled={allTasksSent || isAuthorizingTasks || !currentUser.canSign}
                        className="bg-anthracite-850 hover:bg-anthracite-800 disabled:opacity-40 text-pastel-200 border border-anthracite-750 text-xs px-3.5 py-1.5 rounded-lg font-medium flex items-center space-x-1.5 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-pastel-300" />
                        <span>
                          {allTasksSent
                            ? 'Tasks Dispatched & Confirmed'
                            : isAuthorizingTasks
                            ? 'Dispatching Tasks...'
                            : 'Authorize & Dispatch Tasks'}
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Source Provenance */}
                {m.citations && m.citations.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-anthracite-800/80 space-y-1">
                    <div className="flex items-center space-x-1 text-[10px] font-mono text-slate-400">
                      <Shield className="w-3 h-3 text-pastel-300" />
                      <span>Authoritative Sources:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {m.citations.map((cite, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedCitation(cite)}
                          className="bg-anthracite-950 hover:bg-anthracite-850 border border-anthracite-800 text-pastel-200 text-[10px] font-mono px-2 py-0.5 rounded flex items-center space-x-1 transition-colors"
                        >
                          <span className="text-anthracite-500">[{cite.system}]</span>
                          <span className="truncate max-w-[180px]">{cite.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Action */}
                {m.actionSuggestion && (
                  <div className="mt-2 pt-1.5 flex items-center space-x-1.5 text-[11px] text-pastel-300 font-mono">
                    <CornerDownRight className="w-3 h-3 shrink-0" />
                    <span>Action: {m.actionSuggestion}</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex items-center space-x-2 text-xs text-pastel-300 font-mono bg-anthracite-900/80 p-2 rounded-lg border border-anthracite-800 max-w-xs">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-pastel-300" />
              <span>Coordinating records...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* ChatGPT-Style Input Composer */}
      <div className="p-3 md:p-4 max-w-3xl w-full mx-auto shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative bg-anthracite-900 border border-anthracite-800 focus-within:border-anthracite-700 rounded-2xl flex flex-col p-2.5 transition-all shadow-xl"
        >
          {/* Main Textarea Input */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={`Message ARIA regarding ${patient.name}...`}
            className="w-full bg-transparent px-2 text-xs md:text-sm text-slate-100 placeholder-anthracite-500 focus:outline-none resize-none max-h-28 overflow-y-auto leading-relaxed"
          />

          {/* Bottom Bar with Voice & Send Controls */}
          <div className="flex items-center justify-between pt-2 px-1">
            <div className="flex items-center space-x-1.5 text-anthracite-400">
              <button
                type="button"
                onClick={onOpenVoiceCall}
                title="Start voice session with ARIA"
                className="flex items-center space-x-1 text-xs px-2 py-1 rounded-full bg-anthracite-850 hover:bg-anthracite-800 text-slate-300 hover:text-white transition-colors"
              >
                <Headphones className="w-3.5 h-3.5 text-pastel-300" />
                <span className="text-[11px] font-medium hidden sm:inline">Voice</span>
              </button>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={toggleDictation}
                title={isDictating ? 'Listening...' : 'Voice Dictation'}
                className={`p-1.5 rounded-full transition-colors ${
                  isDictating
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'text-anthracite-400 hover:text-slate-200 hover:bg-anthracite-800'
                }`}
              >
                {isDictating ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>

              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-white disabled:bg-anthracite-800 disabled:text-anthracite-600 text-anthracite-950 flex items-center justify-center transition-all disabled:cursor-not-allowed"
                title="Send inquiry"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </form>

        <p className="text-center text-[10px] text-anthracite-500 mt-2 font-mono">
          ARIA Clinical Intelligence Overlay • Systems of record remain authoritative • Physician authorization required
        </p>
      </div>

      {/* Inspectable Source Record Modal */}
      {selectedCitation && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-anthracite-900 border border-anthracite-750 rounded-xl max-w-md w-full p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-anthracite-800 pb-2">
              <span className="text-xs font-mono text-pastel-300 font-bold">SOURCE RECORD PROVENANCE</span>
              <button onClick={() => setSelectedCitation(null)} className="text-anthracite-500 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-anthracite-500 block text-[10px] font-mono">SYSTEM OF RECORD</span>
                <p className="text-slate-200 font-mono font-medium">{selectedCitation.system}</p>
              </div>
              <div>
                <span className="text-anthracite-500 block text-[10px] font-mono">RECORD ID</span>
                <p className="text-slate-300 font-mono">{selectedCitation.recordId}</p>
              </div>
              <div>
                <span className="text-anthracite-500 block text-[10px] font-mono">TITLE</span>
                <p className="text-slate-100">{selectedCitation.title}</p>
              </div>
              {selectedCitation.timestamp && (
                <div>
                  <span className="text-anthracite-500 block text-[10px] font-mono">TIMESTAMP</span>
                  <p className="text-slate-300 font-mono">{selectedCitation.timestamp}</p>
                </div>
              )}
            </div>
            <div className="pt-2 flex items-center space-x-2">
              <button
                onClick={() => {
                  setSelectedCitation(null);
                  onOpenEHR();
                }}
                className="flex-1 bg-anthracite-850 hover:bg-anthracite-800 text-pastel-200 text-xs py-1.5 rounded-lg border border-anthracite-700 font-medium"
              >
                Inspect in Hospital Records
              </button>
              <button
                onClick={() => setSelectedCitation(null)}
                className="bg-anthracite-800 hover:bg-anthracite-750 text-slate-300 text-xs px-3 py-1.5 rounded-lg border border-anthracite-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
