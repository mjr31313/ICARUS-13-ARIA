import React, { useState } from 'react';
import { Patient, LabResult, ImagingReport, ClinicalRiskScore, ContributingRiskFactor } from '../types';
import { computeClinicalRiskMatrix } from '../services/clinicalRiskEngine';
import {
  ShieldAlert,
  Heart,
  Droplet,
  Activity,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ExternalLink,
  BookOpen,
  X
} from 'lucide-react';

interface ClinicalRiskMatrixViewProps {
  patient: Patient;
  labs: LabResult[];
  imaging: ImagingReport[];
  onAskAria: (query: string) => void;
}

export const ClinicalRiskMatrixView: React.FC<ClinicalRiskMatrixViewProps> = ({
  patient,
  labs,
  imaging,
  onAskAria
}) => {
  const riskScores = computeClinicalRiskMatrix({ patient, labs, imaging });
  const [expandedScoreId, setExpandedScoreId] = useState<string | null>(riskScores[0]?.id || null);
  const [inspectedFactor, setInspectedFactor] = useState<ContributingRiskFactor | null>(null);

  const getLevelBadge = (level: ClinicalRiskScore['compositeLevel']) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-red-950/40 border-red-800 text-red-200';
      case 'HIGH':
        return 'bg-amber-950/30 border-amber-800 text-amber-200';
      case 'INTERMEDIATE':
        return 'bg-anthracite-800 border-anthracite-750 text-pastel-300';
      case 'LOW':
      default:
        return 'bg-anthracite-850 border-anthracite-800 text-slate-300';
    }
  };

  const getCategoryIcon = (id: ClinicalRiskScore['id']) => {
    switch (id) {
      case 'SURGICAL_BLEEDING':
        return <Droplet className="w-4 h-4 text-pastel-300" />;
      case 'PERIOP_CARDIAC':
        return <Heart className="w-4 h-4 text-pastel-300" />;
      case 'RENAL_TOXICITY':
        return <Activity className="w-4 h-4 text-pastel-300" />;
    }
  };

  return (
    <div className="space-y-4 text-xs select-none">
      {/* Non-Binding Clinical Advisory Banner */}
      <div className="bg-anthracite-900 border border-anthracite-800 rounded-xl p-3.5 flex items-start justify-between gap-3">
        <div className="flex items-start space-x-2.5">
          <div className="p-1.5 rounded-lg bg-anthracite-850 border border-anthracite-750 text-pastel-300 shrink-0 mt-0.5">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-100">Non-Binding Perioperative Risk Matrices</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-anthracite-800 text-anthracite-400 border border-anthracite-750">
                Decision Support Only
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              Synthesized by ICARUS from connected EHR, LIS, and PACS records. All scores remain provisional and non-binding; clinical judgment and explicit physician authorization remain authoritative.
            </p>
          </div>
        </div>

        <button
          onClick={() =>
            onAskAria(
              `Provide a clinical synthesis of the perioperative risk matrix for ${patient.name}, including bleeding risk, cardiac RCRI score, and renal vulnerability.`
            )
          }
          className="shrink-0 flex items-center space-x-1.5 bg-anthracite-850 hover:bg-anthracite-800 border border-anthracite-750 text-pastel-200 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-pastel-300" />
          <span>Ask ARIA to Synthesize</span>
        </button>
      </div>

      {/* Risk Cards */}
      <div className="space-y-3">
        {riskScores.map((score) => {
          const isExpanded = expandedScoreId === score.id;

          return (
            <div
              key={score.id}
              className="bg-anthracite-900 border border-anthracite-800 rounded-xl overflow-hidden transition-all duration-150"
            >
              {/* Card Header Accordion */}
              <div
                onClick={() => setExpandedScoreId(isExpanded ? null : score.id)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-anthracite-850/60 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-anthracite-950 border border-anthracite-800 shrink-0">
                    {getCategoryIcon(score.id)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold text-slate-100 text-xs md:text-sm">{score.title}</h4>
                      <span className="text-[10px] font-mono text-anthracite-500 hidden sm:inline">
                        • {score.validatedScoringSystem}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{score.category}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="font-mono text-slate-300 font-bold hidden sm:inline">{score.numericIndex}</span>
                  <span className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold border ${getLevelBadge(score.compositeLevel)}`}>
                    {score.compositeLevel} RISK
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-anthracite-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-anthracite-500" />
                  )}
                </div>
              </div>

              {/* Expanded Factor Breakdown */}
              {isExpanded && (
                <div className="p-4 bg-anthracite-950/70 border-t border-anthracite-800/80 space-y-4">
                  {/* Clinical Implication Summary */}
                  <div className="p-3 rounded-lg bg-anthracite-900 border border-anthracite-800 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-anthracite-500 tracking-wider">
                      Protocolized Clinical Implication
                    </span>
                    <p className="text-slate-200 text-xs leading-relaxed">{score.clinicalImplication}</p>
                    <p className="text-[10px] font-mono text-pastel-300 pt-0.5">
                      Referenced Rule: {score.evidenceProtocolRef}
                    </p>
                  </div>

                  {/* Contributing Parameters Table */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-anthracite-400">
                      <span>CONTRIBUTING CLINICAL PARAMETERS</span>
                      <span>Click parameter to inspect provenance</span>
                    </div>

                    <div className="border border-anthracite-800 rounded-lg overflow-hidden bg-anthracite-900">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-anthracite-850 text-slate-400 font-mono text-[10px] border-b border-anthracite-800">
                          <tr>
                            <th className="p-2.5">Parameter</th>
                            <th className="p-2.5">Measured Clinical Value</th>
                            <th className="p-2.5">Index Weight</th>
                            <th className="p-2.5">Source Provenance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-anthracite-800/80">
                          {score.contributingFactors.map((factor, idx) => (
                            <tr
                              key={idx}
                              onClick={() => setInspectedFactor(factor)}
                              className="hover:bg-anthracite-850/50 cursor-pointer transition-colors"
                            >
                              <td className="p-2.5 font-medium text-slate-200">
                                <span>{factor.parameter}</span>
                              </td>
                              <td className="p-2.5 font-mono text-slate-100">
                                <span>{factor.clinicalValue}</span>
                              </td>
                              <td className="p-2.5 font-mono text-pastel-300 font-bold">
                                <span>{factor.pointsContribution}</span>
                              </td>
                              <td className="p-2.5 font-mono text-[10px] text-slate-400">
                                <span className="px-1.5 py-0.5 rounded bg-anthracite-950 border border-anthracite-800">
                                  [{factor.sourceSystem}]
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Inspectable Parameter Provenance Modal */}
      {inspectedFactor && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-anthracite-900 border border-anthracite-750 rounded-xl max-w-md w-full p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-anthracite-800 pb-2">
              <span className="text-xs font-mono text-pastel-300 font-bold">PARAMETER EVIDENCE PROVENANCE</span>
              <button
                onClick={() => setInspectedFactor(null)}
                className="text-anthracite-500 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-anthracite-500 block text-[10px] font-mono">RISK FACTOR PARAMETER</span>
                <p className="text-slate-100 font-medium">{inspectedFactor.parameter}</p>
              </div>

              <div>
                <span className="text-anthracite-500 block text-[10px] font-mono">MEASURED CLINICAL VALUE</span>
                <p className="text-pastel-200 font-mono">{inspectedFactor.clinicalValue}</p>
              </div>

              <div>
                <span className="text-anthracite-500 block text-[10px] font-mono">SCORING RATIONALE</span>
                <p className="text-slate-300 leading-relaxed">{inspectedFactor.rationale}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-anthracite-800 text-[10px] font-mono">
                <div>
                  <span className="text-anthracite-500 block">SYSTEM SOURCE</span>
                  <p className="text-slate-300">{inspectedFactor.sourceSystem}</p>
                </div>
                <div>
                  <span className="text-anthracite-500 block">RECORD ID</span>
                  <p className="text-slate-300">{inspectedFactor.sourceRecordId}</p>
                </div>
              </div>

              <div>
                <span className="text-anthracite-500 block text-[10px] font-mono">MEASUREMENT TIMESTAMP</span>
                <p className="text-slate-400 font-mono text-[11px]">{inspectedFactor.timestamp}</p>
              </div>
            </div>

            <div className="pt-2 flex items-center space-x-2">
              <button
                onClick={() => {
                  const factorToAsk = inspectedFactor.parameter;
                  setInspectedFactor(null);
                  onAskAria(`Explain the clinical impact of ${factorToAsk} on ${patient.name}'s surgical risk`);
                }}
                className="flex-1 bg-anthracite-850 hover:bg-anthracite-800 border border-anthracite-700 text-pastel-200 text-xs py-1.5 rounded-lg flex items-center justify-center space-x-1 font-medium transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-pastel-300" />
                <span>Ask ARIA About This Factor</span>
              </button>

              <button
                onClick={() => setInspectedFactor(null)}
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
