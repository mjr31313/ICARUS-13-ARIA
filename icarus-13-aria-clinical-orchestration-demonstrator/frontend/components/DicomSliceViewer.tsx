import React, { useState } from 'react';
import { ImagingReport, Patient } from '../types';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Sliders,
  Crosshair,
  Sparkles,
  Info,
  Scan,
  Compass
} from 'lucide-react';

interface DicomSliceViewerProps {
  study: ImagingReport;
  patient: Patient;
  onAskAria: (query: string) => void;
}

export const DicomSliceViewer: React.FC<DicomSliceViewerProps> = ({
  study,
  patient,
  onAskAria
}) => {
  const isCT = study.modality === 'CT';
  const totalSlices = isCT ? 32 : 8;

  // Key findings target slice
  const targetSlice = patient.id === 'PAT-MK-5905' ? 14 : patient.id === 'PAT-GR-6701' ? 4 : 8;

  const [currentSlice, setCurrentSlice] = useState<number>(targetSlice);
  const [windowPreset, setWindowPreset] = useState<'bone' | 'softTissue' | 'lung'>('softTissue');
  const [contrastLevel, setContrastLevel] = useState<number>(100);
  const [showRuler, setShowRuler] = useState<boolean>(true);
  const [showKeyFindingOverlay, setShowKeyFindingOverlay] = useState<boolean>(true);

  const presets = {
    bone: { title: 'Bone (W:2000 L:350)', contrast: 140, brightness: 110 },
    softTissue: { title: 'Soft Tissue (W:400 L:40)', contrast: 100, brightness: 100 },
    lung: { title: 'Lung/Infiltration (W:1500 L:-600)', contrast: 125, brightness: 120 }
  };

  const handleNextSlice = () => {
    setCurrentSlice((prev) => Math.min(totalSlices, prev + 1));
  };

  const handlePrevSlice = () => {
    setCurrentSlice((prev) => Math.max(1, prev - 1));
  };

  // Determine key finding note and measurement for active patient
  const getKeyFindingDetails = () => {
    if (patient.id === 'PAT-MK-5905') {
      return {
        label: 'Segment VI Subcapsular Lesion',
        size: '8.2 mm',
        attenuation: '28 HU (Hypodense)',
        sliceMatched: currentSlice === 14,
        note: 'Small indeterminate hypodense lesion. Unconfirmed metastasis; dedicated Primovist MRI indicated.',
        citationId: study.pacsAccession
      };
    }
    if (patient.id === 'PAT-GR-6701') {
      return {
        label: 'Gruen Zone 1 & 7 Radiolucency',
        size: '2.8 mm',
        attenuation: 'Osteolytic resorption line',
        sliceMatched: currentSlice === 4,
        note: 'Well-demarcated circumferential radiolucency >2.5 mm surrounding femoral component; aseptic loosening.',
        citationId: study.pacsAccession
      };
    }
    if (patient.id === 'PAT-AN-7204') {
      return {
        label: 'Cardiothoracic Ratio & Effusion',
        size: 'CTR 0.64',
        attenuation: 'Perihilar haziness',
        sliceMatched: true,
        note: 'Marked cardiomegaly with upper lobe diversion and blunted costophrenic sulci.',
        citationId: study.pacsAccession
      };
    }
    return {
      label: 'Radiological Feature',
      size: 'Nominal',
      attenuation: 'Standard',
      sliceMatched: true,
      note: study.impression,
      citationId: study.pacsAccession
    };
  };

  const finding = getKeyFindingDetails();

  return (
    <div className="bg-anthracite-950 border border-anthracite-850 rounded-xl overflow-hidden text-slate-200 select-none">
      {/* Viewer Header / PACS HUD Bar */}
      <div className="bg-anthracite-900 border-b border-anthracite-850 px-3 py-2 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center space-x-2">
          <Scan className="w-3.5 h-3.5 text-pastel-300" />
          <span className="font-semibold text-slate-100">{study.modality} AXIAL SLICE VIEWER</span>
          <span className="text-anthracite-600">•</span>
          <span className="text-anthracite-400">{study.pacsAccession}</span>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center space-x-1.5 text-[11px]">
          {(['softTissue', 'bone', 'lung'] as const).map((preset) => (
            <button
              key={preset}
              onClick={() => {
                setWindowPreset(preset);
                setContrastLevel(presets[preset].contrast);
              }}
              className={`px-2 py-0.5 rounded transition-colors ${
                windowPreset === preset
                  ? 'bg-anthracite-800 text-pastel-200 border border-anthracite-700 font-bold'
                  : 'text-anthracite-400 hover:text-slate-200 hover:bg-anthracite-850'
              }`}
            >
              {preset === 'softTissue' ? 'Soft' : preset === 'bone' ? 'Bone' : 'Lung'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Viewport & Anatomical Crosshair Canvas */}
      <div className="relative aspect-square max-h-[380px] w-full bg-[#07080a] flex items-center justify-center overflow-hidden border-b border-anthracite-850">
        {/* Anatomical Grid / Calibration Crosshairs */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-400 border-dashed"></div>
          <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-400 border-dashed"></div>
        </div>

        {/* High-Precision Procedural Medical Geometry Canvas */}
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full max-w-[340px] max-h-[340px] transition-all duration-150"
          style={{
            filter: `contrast(${contrastLevel}%) brightness(${presets[windowPreset].brightness}%)`
          }}
        >
          <defs>
            <radialGradient id="dicom-body-gradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#242832" />
              <stop offset="60%" stop-color="#14171d" />
              <stop offset="90%" stop-color="#0c0e12" />
              <stop offset="100%" stop-color="#040507" />
            </radialGradient>
            <radialGradient id="lesion-highlight" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#111317" />
              <stop offset="70%" stop-color="#2c3340" />
              <stop offset="100%" stop-color="#1c212a" />
            </radialGradient>
          </defs>

          {/* Abdominal/Pelvic Axial Contour */}
          <ellipse cx="200" cy="200" rx="160" ry="145" fill="url(#dicom-body-gradient)" stroke="#2b313d" strokeWidth="2" />

          {/* Posterior Vertebral Body / Spine */}
          <path d="M185 300 Q 200 280 215 300 Q 200 325 185 300 Z" fill="#e2e8f0" opacity="0.85" />
          <circle cx="200" cy="302" r="7" fill="#07080a" />

          {/* Ribs / Iliac Wings */}
          <path d="M55 200 C 60 260, 120 310, 165 315" fill="none" stroke="#cfd6e1" strokeWidth="6" strokeLinecap="round" opacity="0.65" />
          <path d="M345 200 C 340 260, 280 310, 235 315" fill="none" stroke="#cfd6e1" strokeWidth="6" strokeLinecap="round" opacity="0.65" />

          {/* Liver Parenchyma (Right Upper Abdomen) */}
          <path d="M80 140 C 90 90, 200 95, 230 140 C 240 180, 210 240, 130 235 C 80 230, 75 180, 80 140 Z" fill="#1b2029" stroke="#28303d" strokeWidth="1.5" />

          {/* Spleen & Left Kidney */}
          <ellipse cx="295" cy="180" rx="28" ry="42" fill="#161a22" stroke="#222834" strokeWidth="1" />
          <ellipse cx="265" cy="245" rx="22" ry="28" fill="#181c25" stroke="#262c38" strokeWidth="1" />

          {/* Segment VI Subcapsular Lesion Overlay (For Maria Konstantinou) */}
          {patient.id === 'PAT-MK-5905' && (
            <g className="transition-opacity duration-150" opacity={currentSlice >= 12 && currentSlice <= 16 ? 1 : 0.2}>
              <circle
                cx="110"
                cy="195"
                r={currentSlice === 14 ? 11 : 6}
                fill="url(#lesion-highlight)"
                stroke="#60b0fc"
                strokeWidth={currentSlice === 14 ? "2" : "1"}
                strokeDasharray={currentSlice === 14 ? "none" : "2,2"}
              />

              {/* Target Caliper Annotation Box */}
              {currentSlice === 14 && showKeyFindingOverlay && (
                <g>
                  {/* Measurement Caliper Cross */}
                  <line x1="99" y1="195" x2="121" y2="195" stroke="#bae0fd" strokeWidth="1" />
                  <line x1="110" y1="184" x2="110" y2="206" stroke="#bae0fd" strokeWidth="1" />

                  {/* Leader Line to Callout */}
                  <polyline points="118,188 150,165 195,165" fill="none" stroke="#93cbfe" strokeWidth="1" />
                  <circle cx="118" cy="188" r="2" fill="#93cbfe" />

                  <rect x="195" y="152" width="125" height="26" rx="4" fill="#111215" stroke="#343a47" strokeWidth="1" />
                  <text x="202" y="165" fill="#bae0fd" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                    ROI: 8.2 mm
                  </text>
                  <text x="202" y="174" fill="#94a3b8" fontSize="8" fontFamily="monospace">
                    Seg VI Subcapsular
                  </text>
                </g>
              )}
            </g>
          )}

          {/* Orthopaedic Hip Stem Loosening Overlay (For Elena Papadopoulou) */}
          {patient.id === 'PAT-GR-6701' && (
            <g opacity={currentSlice >= 3 && currentSlice <= 6 ? 1 : 0.25}>
              {/* Femoral Stem Metal Core */}
              <path d="M120 180 L 135 270 L 115 270 Z" fill="#ffffff" opacity="0.95" />
              {/* Gruen Zone Radiolucency Line */}
              <path d="M112 178 L 111 274" stroke="#60b0fc" strokeWidth="2.5" strokeDasharray="3,2" />
              {currentSlice === 4 && showKeyFindingOverlay && (
                <g>
                  <polyline points="112,220 70,220 50,235" fill="none" stroke="#93cbfe" strokeWidth="1" />
                  <rect x="15" y="235" width="115" height="24" rx="4" fill="#111215" stroke="#343a47" strokeWidth="1" />
                  <text x="20" y="247" fill="#bae0fd" fontSize="9" fontFamily="monospace" fontWeight="bold">
                    Gruen 1: 2.8 mm
                  </text>
                  <text x="20" y="255" fill="#94a3b8" fontSize="7.5" fontFamily="monospace">
                    Periprosthetic Halo
                  </text>
                </g>
              )}
            </g>
          )}
        </svg>

        {/* Viewport Corner HUD Diagnostics */}
        <div className="absolute top-2 left-2 text-[10px] font-mono text-slate-400 space-y-0.5 pointer-events-none">
          <p className="text-slate-200 font-bold">{patient.name}</p>
          <p>MRN: {patient.mrn}</p>
          <p>DOB: {patient.dob}</p>
          <p className="text-pastel-300">{study.studyDescription.slice(0, 24)}...</p>
        </div>

        <div className="absolute top-2 right-2 text-right text-[10px] font-mono text-slate-400 space-y-0.5 pointer-events-none">
          <p className="text-slate-200 font-bold">{presets[windowPreset].title}</p>
          <p>KVp: 120 • mA: 240</p>
          <p>Slice Thick: 1.25 mm</p>
          <p className="text-pastel-200">FOV: 350 mm</p>
        </div>

        <div className="absolute bottom-2 left-2 text-[10px] font-mono text-slate-400 pointer-events-none">
          <span>Axial: {currentSlice} / {totalSlices}</span>
          <span className="mx-1.5">•</span>
          <span className="text-anthracite-500">DICOM R4 WADO-RS</span>
        </div>

        <div className="absolute bottom-2 right-2 text-[10px] font-mono text-slate-400 pointer-events-none">
          <span>ZOOM: 100%</span>
        </div>
      </div>

      {/* Interactive Controls & Axial Stepper Bar */}
      <div className="p-3 bg-anthracite-900 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Slice Stepper */}
        <div className="flex items-center space-x-2 font-mono">
          <button
            onClick={handlePrevSlice}
            disabled={currentSlice <= 1}
            className="p-1 rounded bg-anthracite-800 hover:bg-anthracite-750 disabled:opacity-30 border border-anthracite-700 text-slate-200 transition-colors"
            title="Previous Axial Slice"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-bold text-slate-100 min-w-[75px] text-center">
            Slice {currentSlice} of {totalSlices}
          </span>

          <button
            onClick={handleNextSlice}
            disabled={currentSlice >= totalSlices}
            className="p-1 rounded bg-anthracite-800 hover:bg-anthracite-750 disabled:opacity-30 border border-anthracite-700 text-slate-200 transition-colors"
            title="Next Axial Slice"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Slider */}
          <input
            type="range"
            min="1"
            max={totalSlices}
            value={currentSlice}
            onChange={(e) => setCurrentSlice(parseInt(e.target.value))}
            className="w-24 h-1.5 bg-anthracite-800 rounded-lg appearance-none cursor-pointer accent-pastel-300 ml-1"
          />
        </div>

        {/* Target Slice Quick Jump & Key Finding Toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentSlice(targetSlice)}
            className="px-2 py-1 rounded bg-anthracite-800 hover:bg-anthracite-750 border border-anthracite-700 text-[11px] font-mono text-pastel-300 transition-colors"
          >
            Jump to Key Finding (Slice {targetSlice})
          </button>

          <button
            onClick={() => setShowKeyFindingOverlay(!showKeyFindingOverlay)}
            className={`p-1 rounded border text-xs transition-colors ${
              showKeyFindingOverlay
                ? 'bg-anthracite-800 text-pastel-300 border-pastel-400/60'
                : 'text-anthracite-500 border-anthracite-800 hover:text-slate-300'
            }`}
            title="Toggle ROI Measurement Caliper"
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Linked ARIA Key Finding Footer Card */}
      <div className="p-3 bg-anthracite-950 border-t border-anthracite-850 flex items-start justify-between gap-3 text-xs">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-1.5 font-mono text-[11px]">
            <span className="text-pastel-300 font-bold">{finding.label}</span>
            <span className="text-anthracite-600">•</span>
            <span className="text-amber-300">{finding.size}</span>
            <span className="text-anthracite-600">•</span>
            <span className="text-slate-400">{finding.attenuation}</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed font-sans">{finding.note}</p>
        </div>

        <button
          onClick={() =>
            onAskAria(
              `Analyze the imaging findings of ${study.pacsAccession} for ${patient.name}, specifically the ${finding.label}`
            )
          }
          className="shrink-0 flex items-center space-x-1 bg-anthracite-900 hover:bg-anthracite-850 border border-anthracite-750 text-pastel-200 text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition-colors"
        >
          <Sparkles className="w-3 h-3 text-pastel-300" />
          <span>Cross-reference in ARIA</span>
        </button>
      </div>
    </div>
  );
};
