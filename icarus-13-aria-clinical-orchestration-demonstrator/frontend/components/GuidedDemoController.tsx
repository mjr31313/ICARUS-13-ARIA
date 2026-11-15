import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  X,
  Play
} from 'lucide-react';

interface GuidedDemoControllerProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerScene: (sceneNumber: number) => void;
}

export const GuidedDemoController: React.FC<GuidedDemoControllerProps> = ({
  isOpen,
  onClose,
  onTriggerScene
}) => {
  const [currentScene, setCurrentScene] = useState<number>(1);

  const scenes = [
    {
      number: 1,
      title: "WHAT CHANGED SINCE LAST ADMISSION?",
      narrative: "Elena Papadopoulou (Orthopaedic THA Revision). Ask ARIA via text or Call ARIA voice: 'What changed since this patient's last admission, and what should the clinician verify before surgery?'"
    },
    {
      number: 2,
      title: "EVIDENCE VERIFICATION & DISCREPANCY",
      narrative: "Inspect the 5 changes: Hb drop to 9.8 g/dL, eGFR drop to 53, new AFib on Apixaban with conflicting washout times, Gruen zone loosening, and missing surgical consent."
    },
    {
      number: 3,
      title: "INTERPROFESSIONAL COORDINATION & CONFIRMATION",
      narrative: "Review the proposed interprofessional follow-ups (Ward Nursing blister check, Blood Bank 2 units PRBC, and Resident physical consent). Explicitly authorize the tasks as Attending Physician."
    },
    {
      number: 4,
      title: "AUDIT REPLAY & VERIFIED RECONSTRUCTION",
      narrative: "Open Audit Replay. Reconstruct the actual stored audit event showing the patient, action, acting clinician identity, timestamp, and linked source provenance."
    },
    {
      number: 5,
      title: "INDEPENDENT MULTI-CASE EXPLORATION",
      narrative: "Explore Andreas Nikolaou (Cardiology HFrEF / K+ 5.7 / Furosemide discrepancy) and Maria Konstantinou (Oncology MDT / pT3N1a / Indeterminate liver CT lesion)."
    }
  ];

  if (!isOpen) return null;

  const active = scenes[currentScene - 1];

  const handleNext = () => {
    if (currentScene < scenes.length) {
      const next = currentScene + 1;
      setCurrentScene(next);
      onTriggerScene(next);
    }
  };

  const handlePrev = () => {
    if (currentScene > 1) {
      const prev = currentScene - 1;
      setCurrentScene(prev);
      onTriggerScene(prev);
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-anthracite-900 border border-anthracite-750 rounded-xl p-3.5 shadow-2xl z-50 w-[92%] max-w-lg text-slate-200">
      <div className="flex items-center justify-between pb-1.5 border-b border-anthracite-800">
        <span className="text-[11px] font-mono font-bold text-pastel-300">
          INSTITUTIONAL TOUR — SCENE {active.number}/5
        </span>
        <button onClick={onClose} className="text-anthracite-500 hover:text-slate-200">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="py-2 space-y-0.5">
        <h3 className="text-xs font-semibold text-slate-100">{active.title}</h3>
        <p className="text-[11px] text-slate-300 leading-relaxed">{active.narrative}</p>
      </div>

      <div className="pt-2 flex items-center justify-between text-xs">
        <button
          onClick={handlePrev}
          disabled={currentScene === 1}
          className="text-slate-400 hover:text-slate-200 disabled:opacity-30 flex items-center space-x-1"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <button
          onClick={() => onTriggerScene(currentScene)}
          className="bg-anthracite-800 hover:bg-anthracite-750 text-pastel-200 border border-anthracite-700 px-3 py-1 rounded font-medium flex items-center space-x-1"
        >
          <Play className="w-3 h-3 fill-current text-pastel-300" />
          <span>Execute Scene {currentScene}</span>
        </button>

        <button
          onClick={handleNext}
          disabled={currentScene === scenes.length}
          className="text-slate-400 hover:text-slate-200 disabled:opacity-30 flex items-center space-x-1"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
