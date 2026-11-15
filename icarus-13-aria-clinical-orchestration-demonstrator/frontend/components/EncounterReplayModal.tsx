import React, { useState, useEffect } from 'react';
import { AuditEvent, Patient } from '../types';
import { auditStore } from '../services/auditStore';
import { History, Play, RotateCcw } from 'lucide-react';

interface EncounterReplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPatient: Patient;
}

export const EncounterReplayModal: React.FC<EncounterReplayModalProps> = ({
  isOpen,
  onClose,
  currentPatient
}) => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    const all = auditStore.getEvents();
    const chronological = [...all].reverse();
    setEvents(chronological);
    setActiveStepIndex(chronological.length - 1);
  }, [isOpen]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && activeStepIndex < events.length - 1) {
      timer = setTimeout(() => {
        setActiveStepIndex((prev) => prev + 1);
      }, 1100);
    } else if (isPlaying && activeStepIndex >= events.length - 1) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, activeStepIndex, events.length]);

  if (!isOpen) return null;

  const currentEvent = events[activeStepIndex];

  return (
    <div className="h-full flex flex-col bg-anthracite-950 text-slate-100 overflow-hidden">
      {/* Top Header */}
      <div className="bg-anthracite-900 border-b border-anthracite-800 px-6 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <History className="w-3.5 h-3.5 text-pastel-300" />
          <span className="font-semibold text-slate-100">Deterministic Encounter Replay</span>
          <span className="text-anthracite-600 font-mono">•</span>
          <span className="text-pastel-200 font-mono text-[11px]">{currentPatient.name}</span>
        </div>

        <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1 rounded hover:bg-anthracite-800">
          Exit to Chat
        </button>
      </div>

      {/* Player Controls */}
      <div className="bg-anthracite-950 border-b border-anthracite-800 px-6 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="bg-anthracite-800 hover:bg-anthracite-750 text-pastel-200 border border-anthracite-700 px-3 py-1 rounded font-medium flex items-center space-x-1"
          >
            <Play className="w-3 h-3 fill-current text-pastel-300" />
            <span>{isPlaying ? 'Pause' : 'Play Timeline'}</span>
          </button>
          <button
            onClick={() => {
              setActiveStepIndex(0);
              setIsPlaying(false);
            }}
            className="bg-anthracite-900 text-slate-400 hover:text-slate-200 px-2 py-1 rounded border border-anthracite-800"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>

        <span className="text-anthracite-500 font-mono text-[11px]">
          Event {activeStepIndex + 1} of {events.length}
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
        {/* Left: Active Event Details */}
        <div className="p-6 border-r border-anthracite-800 overflow-y-auto space-y-4">
          {currentEvent ? (
            <div className="bg-anthracite-900 border border-anthracite-800 rounded-xl p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-anthracite-800 pb-2">
                <span className="font-mono text-pastel-300 font-bold">{currentEvent.eventType}</span>
                <span className="font-mono text-slate-500 text-[10px]">{currentEvent.timestamp}</span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-500 block uppercase">Actor</span>
                <p className="text-slate-200">
                  {currentEvent.actor} ({currentEvent.role})
                </p>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-500 block uppercase">Details</span>
                <p className="text-slate-100 leading-relaxed mt-0.5">{currentEvent.details}</p>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-500 block uppercase">Correlation ID</span>
                <p className="text-pastel-200 font-mono text-[11px] mt-0.5">{currentEvent.correlationId}</p>
              </div>
            </div>
          ) : (
            <p className="text-slate-500 text-xs">No events logged yet.</p>
          )}
        </div>

        {/* Right: Sequence Feed */}
        <div className="p-4 overflow-y-auto space-y-1.5 bg-anthracite-950">
          {events.map((evt, idx) => (
            <div
              key={evt.id}
              onClick={() => {
                setActiveStepIndex(idx);
                setIsPlaying(false);
              }}
              className={`p-2.5 rounded-lg cursor-pointer border text-xs transition-colors ${
                idx === activeStepIndex
                  ? 'bg-anthracite-850 border-anthracite-700 text-pastel-200'
                  : 'bg-anthracite-900 border-anthracite-800 text-slate-400 hover:border-anthracite-750'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="font-semibold text-slate-200">{evt.eventType}</span>
                <span className="text-anthracite-500 text-[10px]">{evt.timestamp.slice(11, 19)}</span>
              </div>
              <p className="text-[11px] text-slate-300 truncate mt-0.5">{evt.details}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
