import React, { useState } from 'react';
import {
  Patient,
  LabResult,
  ImagingReport,
  InstitutionalProtocol,
  UserProfile
} from '../types';
import { ariaService, AriaResponse } from '../services/geminiService';
import {
  X,
  Sparkles,
  Send,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Shield,
  HelpCircle,
  Mic,
  MicOff,
  CornerDownRight
} from 'lucide-react';

interface AriaDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  labs: LabResult[];
  imaging: ImagingReport[];
  protocols: InstitutionalProtocol[];
  currentUser: UserProfile;
  initialQuery?: string;
}

interface Message {
  id: string;
  sender: 'user' | 'aria';
  text: string;
  citations?: AriaResponse['sourceCitations'];
  actionSuggestion?: string;
  timestamp: string;
}

export const AriaDrawer: React.FC<AriaDrawerProps> = ({
  isOpen,
  onClose,
  patient,
  labs,
  imaging,
  protocols,
  currentUser,
  initialQuery
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'INIT-01',
      sender: 'aria',
      text: `Hello ${currentUser.name}. I am ARIA, bound to ${patient.name} (${patient.mrn}). I am observing synthetic hospital records from EHR, LIS, and PACS. How can I assist?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<AriaResponse['sourceCitations'][0] | null>(null);

  // Suggested prompt pills
  const promptPills = [
    `Summarize previous admissions`,
    `Retrieve operative report from 2021`,
    `Compare today's hemoglobin with previous`,
    `Find relevant institutional protocol`,
    `Check OR readiness & missing items`
  ];

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
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, ariaMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleMic = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }
    // Real browser speech recognition or simulated fallback
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        setIsListening(true);
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputValue(transcript);
          setIsListening(false);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognition.start();
      } catch {
        setIsListening(false);
      }
    } else {
      // Fallback voice simulation
      setIsListening(true);
      setTimeout(() => {
        setInputValue(`Compare today's hemoglobin with previous value and verify DOAC protocol`);
        setIsListening(false);
      }, 1400);
    }
  };

  if (!isOpen) return null;

  return (
    <aside className="w-96 md:w-[440px] bg-navy-900 border-l border-slate-800 flex flex-col h-full shadow-2xl z-30 transition-all">
      {/* Drawer Header */}
      <div className="bg-navy-950 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-mono font-bold text-cyan-300">ARIA</span>
              <span className="text-[10px] text-slate-400 font-mono">Adaptive Intelligence</span>
            </div>
            <p className="text-[10px] text-slate-400 truncate max-w-[240px]">
              Bound: {patient.name} ({patient.mrn})
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[88%] rounded-lg p-3 leading-relaxed shadow-sm ${
                m.sender === 'user'
                  ? 'bg-cyan-600 text-white font-medium'
                  : 'bg-slate-850 text-slate-200 border border-slate-700/80'
              }`}
            >
              {m.sender === 'aria' && (
                <div className="flex items-center space-x-1 text-[10px] text-cyan-400 font-mono mb-1.5 font-semibold">
                  <Sparkles className="w-3 h-3" />
                  <span>ARIA VERIFIED SYNTHESIS</span>
                </div>
              )}
              <p className="whitespace-pre-wrap">{m.text}</p>

              {/* Source Provenance Citations */}
              {m.citations && m.citations.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 space-y-1">
                  <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                    <Shield className="w-3 h-3 text-cyan-400" />
                    <span>Authoritative Provenance:</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {m.citations.map((cite, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedCitation(cite)}
                        className="bg-slate-900 hover:bg-slate-800 border border-cyan-800/60 text-cyan-300 text-[10px] font-mono px-2 py-0.5 rounded flex items-center space-x-1 transition-colors"
                      >
                        <span>[{cite.system}]</span>
                        <span className="truncate max-w-[140px]">{cite.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Contextual Action */}
              {m.actionSuggestion && (
                <div className="mt-2 pt-1.5 flex items-center space-x-1.5 text-[10px] text-cyan-300 font-mono">
                  <CornerDownRight className="w-3 h-3 shrink-0" />
                  <span>Next Step: {m.actionSuggestion}</span>
                </div>
              )}
            </div>
            <span className="text-[9px] text-slate-500 font-mono mt-1 px-1">{m.timestamp}</span>
          </div>
        ))}

        {isProcessing && (
          <div className="flex items-center space-x-2 text-xs text-cyan-400 font-mono bg-slate-850 p-2.5 rounded-lg border border-slate-800 max-w-[70%]">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>Retrieving authoritative hospital records...</span>
          </div>
        )}
      </div>

      {/* Suggested Prompt Pills */}
      <div className="p-2 border-t border-slate-800 bg-navy-950 flex overflow-x-auto space-x-1.5 scrollbar-none">
        {promptPills.map((pill, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(pill)}
            className="whitespace-nowrap bg-slate-900 hover:bg-slate-850 border border-slate-700/80 text-slate-300 text-[11px] px-2.5 py-1 rounded-full transition-colors shrink-0"
          >
            {pill}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="p-3 bg-navy-950 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask ARIA about labs, history, or protocols..."
            className="flex-1 bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-md px-3 py-2 focus:outline-none focus:border-cyan-500"
          />

          <button
            type="button"
            onClick={toggleMic}
            title={isListening ? 'Listening...' : 'Voice Dictation'}
            className={`p-2 rounded-md border transition-colors ${
              isListening
                ? 'bg-red-600 text-white border-red-500 animate-pulse'
                : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-cyan-300'
            }`}
          >
            {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>

          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white p-2 rounded-md transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Clickable Citation Provenance Modal */}
      {selectedCitation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-md w-full p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-mono text-cyan-400 font-bold">INSPECTED SOURCE RECORD</span>
              <button
                onClick={() => setSelectedCitation(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] font-mono">SYSTEM OF RECORD</span>
                <p className="text-slate-200 font-mono font-medium">{selectedCitation.system}</p>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-mono">RECORD IDENTIFIER</span>
                <p className="text-slate-200 font-mono">{selectedCitation.recordId}</p>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-mono">TITLE / DESCRIPTION</span>
                <p className="text-slate-100">{selectedCitation.title}</p>
              </div>
              {selectedCitation.timestamp && (
                <div>
                  <span className="text-slate-400 block text-[10px] font-mono">TIMESTAMP</span>
                  <p className="text-slate-300 font-mono">{selectedCitation.timestamp}</p>
                </div>
              )}
            </div>
            <div className="pt-2">
              <button
                onClick={() => setSelectedCitation(null)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-1.5 rounded"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
