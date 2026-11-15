import React, { useState, useEffect, useRef } from 'react';
import { Patient, UserProfile } from '../types';
import { speechController } from '../services/speechService';
import { AriaWordmark } from './BrandLogos';
import {
  Mic,
  MicOff,
  PhoneOff,
  Square,
  X,
  Compass
} from 'lucide-react';

interface VoiceCallOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  currentUser: UserProfile;
  onSpokenTurn: (userQuestion: string) => Promise<string>;
}

export const VoiceCallOverlay: React.FC<VoiceCallOverlayProps> = ({
  isOpen,
  onClose,
  patient,
  currentUser,
  onSpokenTurn
}) => {
  const [callState, setCallState] = useState<'LISTENING' | 'THINKING' | 'SPEAKING' | 'MUTED'>('LISTENING');
  const [userTranscript, setUserTranscript] = useState<string>('');
  const [assistantReply, setAssistantReply] = useState<string>('');
  const [waveformHeights, setWaveformHeights] = useState<number[]>([15, 25, 45, 70, 90, 60, 35, 20]);

  const recognitionRef = useRef<any>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const isComponentMounted = useRef<boolean>(true);
  const isRecognitionActive = useRef<boolean>(false);

  useEffect(() => {
    isComponentMounted.current = true;

    if (isOpen) {
      startVoiceSession();
    } else {
      endVoiceSession();
    }

    return () => {
      isComponentMounted.current = false;
      endVoiceSession();
    };
  }, [isOpen]);

  // Waveform animation during speech
  useEffect(() => {
    let animInterval: NodeJS.Timeout;
    if (callState === 'SPEAKING' || callState === 'LISTENING') {
      animInterval = setInterval(() => {
        setWaveformHeights((prev) =>
          prev.map(() => Math.floor(Math.random() * (callState === 'SPEAKING' ? 85 : 55) + 15))
        );
      }, 100);
    } else {
      setWaveformHeights([10, 12, 14, 12, 10, 12, 14, 10]);
    }

    return () => clearInterval(animInterval);
  }, [callState]);

  const startVoiceSession = async () => {
    setUserTranscript('');
    setAssistantReply('');

    // Request microphone access quietly without intrusive error banners
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStreamRef.current = stream;
      }
    } catch {
      // Degrades gracefully to simulation without crashing
    }

    // Initialize Speech Recognition if supported by the browser
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'en-US';

        rec.onstart = () => {
          isRecognitionActive.current = true;
          if (isComponentMounted.current) setCallState('LISTENING');
        };

        rec.onresult = async (event: any) => {
          const results = event.results;
          if (!results || results.length === 0) return;
          const latestResult = results[results.length - 1];
          const transcriptText = latestResult[0]?.transcript;

          if (isComponentMounted.current && transcriptText) {
            setUserTranscript(transcriptText);
          }

          if (latestResult.isFinal && transcriptText && transcriptText.trim().length > 2) {
            try {
              rec.stop();
            } catch {
              // Ignore
            }
            isRecognitionActive.current = false;
            await processSpokenTurn(transcriptText.trim());
          }
        };

        rec.onerror = (e: any) => {
          // Benign recognition events like 'no-speech' or 'aborted' are ignored
          if (e.error === 'no-speech' || e.error === 'aborted') {
            return;
          }
          isRecognitionActive.current = false;
        };

        rec.onend = () => {
          isRecognitionActive.current = false;
          // Restart recognition if still in listening state and call is open
          if (isComponentMounted.current && callState === 'LISTENING' && !isRecognitionActive.current) {
            try {
              rec.start();
              isRecognitionActive.current = true;
            } catch {
              // Ignore
            }
          }
        };

        recognitionRef.current = rec;
        try {
          rec.start();
          isRecognitionActive.current = true;
        } catch {
          // Ignore
        }
      } catch (err) {
        console.warn('Speech recognition initialized in fallback mode:', err);
      }
    }
  };

  const processSpokenTurn = async (queryText: string) => {
    setCallState('THINKING');

    try {
      const replyText = await onSpokenTurn(queryText);
      if (!isComponentMounted.current) return;

      setAssistantReply(replyText);
      setCallState('SPEAKING');

      // Speak answer aloud
      speechController.speak(
        'VOICE_CALL_ACTIVE',
        replyText,
        () => {
          if (isComponentMounted.current) setCallState('SPEAKING');
        },
        () => {
          if (isComponentMounted.current) {
            setCallState('LISTENING');
            setUserTranscript('');
            if (recognitionRef.current && !isRecognitionActive.current) {
              try {
                recognitionRef.current.start();
                isRecognitionActive.current = true;
              } catch {
                // Ignore
              }
            }
          }
        }
      );
    } catch {
      if (isComponentMounted.current) setCallState('LISTENING');
    }
  };

  const handleInterrupt = () => {
    speechController.stopSpeaking();
    setCallState('LISTENING');
    setUserTranscript('');
    if (recognitionRef.current && !isRecognitionActive.current) {
      try {
        recognitionRef.current.start();
        isRecognitionActive.current = true;
      } catch {
        // Ignore
      }
    }
  };

  const handleToggleMute = () => {
    if (callState === 'MUTED') {
      setCallState('LISTENING');
      if (recognitionRef.current && !isRecognitionActive.current) {
        try {
          recognitionRef.current.start();
          isRecognitionActive.current = true;
        } catch {
          // Ignore
        }
      }
    } else {
      setCallState('MUTED');
      if (recognitionRef.current && isRecognitionActive.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore
        }
        isRecognitionActive.current = false;
      }
    }
  };

  const endVoiceSession = () => {
    speechController.stopSpeaking();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
      recognitionRef.current = null;
    }
    isRecognitionActive.current = false;

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
  };

  const handleClose = () => {
    endVoiceSession();
    onClose();
  };

  const handleQuickQuestion = (text: string) => {
    setUserTranscript(text);
    if (recognitionRef.current && isRecognitionActive.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
      isRecognitionActive.current = false;
    }
    processSpokenTurn(text);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-anthracite-950 border border-anthracite-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col items-center text-center space-y-5 text-slate-100 relative overflow-hidden">
        {/* Ambient Aura */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-pastel-400/5 blur-3xl pointer-events-none"></div>

        {/* Top Header */}
        <div className="w-full flex items-center justify-between border-b border-anthracite-900 pb-3">
          <div className="flex items-center space-x-2 text-left">
            <AriaWordmark size="sm" />
            <span className="text-[11px] font-mono text-anthracite-500">• Voice Session</span>
          </div>

          <button
            onClick={handleClose}
            aria-label="Close voice call"
            className="p-1 text-anthracite-500 hover:text-slate-200 hover:bg-anthracite-900 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Patient Badge */}
        <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-anthracite-900 border border-anthracite-800 text-[11px] font-mono text-slate-300">
          <span className="w-1.5 h-1.5 rounded-full bg-pastel-300 animate-pulse"></span>
          <span>{patient.name}</span>
          <span className="text-anthracite-600">•</span>
          <span className="text-anthracite-400">{patient.mrn}</span>
        </div>

        {/* Pulsing Visual Waveform Hub */}
        <div className="relative flex flex-col items-center justify-center py-2">
          <div
            className={`w-28 h-28 rounded-full border flex items-center justify-center transition-all duration-300 ${
              callState === 'SPEAKING'
                ? 'bg-pastel-400/10 border-pastel-300/60 shadow-[0_0_30px_rgba(147,203,254,0.2)]'
                : callState === 'THINKING'
                ? 'bg-amber-400/10 border-amber-300/40 animate-pulse'
                : callState === 'MUTED'
                ? 'bg-anthracite-900 border-red-800/60'
                : 'bg-anthracite-900/80 border-anthracite-750'
            }`}
          >
            {/* Waveform Bars */}
            <div className="flex items-center space-x-1 h-12">
              {waveformHeights.map((h, i) => (
                <div
                  key={i}
                  className="w-1.5 rounded-full transition-all duration-100"
                  style={{
                    height: `${h}%`,
                    backgroundColor:
                      callState === 'SPEAKING'
                        ? '#93cbfe'
                        : callState === 'THINKING'
                        ? '#f59e0b'
                        : callState === 'MUTED'
                        ? '#ef4444'
                        : '#485061'
                  }}
                ></div>
              ))}
            </div>
          </div>

          <p className="mt-3 text-xs font-mono font-medium tracking-wider uppercase text-pastel-200">
            {callState === 'SPEAKING'
              ? 'ARIA is speaking...'
              : callState === 'THINKING'
              ? 'Synthesizing verified clinical response...'
              : callState === 'MUTED'
              ? 'Microphone muted'
              : 'Listening to clinician...'}
          </p>
        </div>

        {/* Live Conversation Transcript Preview */}
        <div className="w-full bg-anthracite-900/80 border border-anthracite-850 rounded-xl p-3 text-xs text-left min-h-[64px] flex flex-col justify-center space-y-1">
          {userTranscript && (
            <p className="text-slate-400 text-[11px] font-mono">
              <span className="text-slate-200 font-semibold">Clinician:</span> "{userTranscript}"
            </p>
          )}

          {assistantReply ? (
            <p className="text-pastel-200 text-xs leading-relaxed line-clamp-3">
              <span className="text-slate-400 font-mono text-[10px]">ARIA:</span> {assistantReply}
            </p>
          ) : !userTranscript ? (
            <p className="text-anthracite-500 text-[11px] text-center italic">
              Speak naturally. Or tap a suggested inquiry below:
            </p>
          ) : null}
        </div>

        {/* Quick Spoken Inquiry Chips */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 w-full">
          <button
            onClick={() => handleQuickQuestion("What changed since this patient's last admission, and what should I verify before surgery?")}
            className="px-2.5 py-1 rounded-full bg-anthracite-900 hover:bg-anthracite-850 border border-anthracite-800 text-[10px] font-mono text-slate-300 hover:text-pastel-200 flex items-center space-x-1"
          >
            <Compass className="w-3 h-3 text-pastel-300/80" />
            <span>"What changed since last admission?"</span>
          </button>
          <button
            onClick={() => handleQuickQuestion("Reconcile the available medication history")}
            className="px-2.5 py-1 rounded-full bg-anthracite-900 hover:bg-anthracite-850 border border-anthracite-800 text-[10px] font-mono text-slate-300 hover:text-pastel-200 flex items-center space-x-1"
          >
            <Compass className="w-3 h-3 text-pastel-300/80" />
            <span>"Reconcile medication history"</span>
          </button>
        </div>

        {/* Control Buttons */}
        <div className="w-full flex items-center justify-center space-x-4 pt-1">
          {/* Mute Button */}
          <button
            onClick={handleToggleMute}
            aria-label={callState === 'MUTED' ? 'Unmute microphone' : 'Mute microphone'}
            className={`p-3 rounded-full border transition-all ${
              callState === 'MUTED'
                ? 'bg-red-950 border-red-700 text-red-300'
                : 'bg-anthracite-900 border-anthracite-800 text-slate-300 hover:text-white hover:bg-anthracite-850'
            }`}
          >
            {callState === 'MUTED' ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Interrupt Button */}
          <button
            onClick={handleInterrupt}
            disabled={callState !== 'SPEAKING'}
            aria-label="Interrupt ARIA"
            className="p-3 rounded-full bg-anthracite-900 disabled:opacity-30 border border-anthracite-800 text-slate-300 hover:text-white hover:bg-anthracite-850 transition-all"
            title="Interrupt ARIA"
          >
            <Square className="w-4 h-4 fill-current text-pastel-300" />
          </button>

          {/* End Call Button */}
          <button
            onClick={handleClose}
            aria-label="End call"
            className="px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-medium text-xs flex items-center space-x-1.5 transition-colors shadow-lg shadow-red-950/40"
          >
            <PhoneOff className="w-4 h-4" />
            <span>End Call</span>
          </button>
        </div>
      </div>
    </div>
  );
};
