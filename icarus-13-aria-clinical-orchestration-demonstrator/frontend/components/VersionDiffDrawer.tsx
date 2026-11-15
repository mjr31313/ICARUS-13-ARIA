import React, { useState } from 'react';
import { DocumentVersion, TranscriptSegment } from '../types';
import {
  GitCompare,
  X,
  FileText,
  Shield,
  ArrowRight,
  Check,
  Sparkles,
  Layers,
  History,
  Tag
} from 'lucide-react';

interface VersionDiffDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  transcript: TranscriptSegment[];
  documentVersions: DocumentVersion[];
  activeVersionNumber: number;
}

// Minimal, fast word-level diff generator
interface DiffToken {
  type: 'unchanged' | 'added' | 'removed';
  text: string;
}

function computeWordDiff(oldStr: string, newStr: string): DiffToken[] {
  const oldWords = oldStr.split(/(\s+)/);
  const newWords = newStr.split(/(\s+)/);

  const diff: DiffToken[] = [];
  let i = 0;
  let j = 0;

  while (i < oldWords.length || j < newWords.length) {
    if (i < oldWords.length && j < newWords.length && oldWords[i] === newWords[j]) {
      diff.push({ type: 'unchanged', text: oldWords[i] });
      i++;
      j++;
    } else if (j < newWords.length && (!oldWords.includes(newWords[j]) || (i < oldWords.length && oldWords.indexOf(newWords[j]) > i))) {
      diff.push({ type: 'added', text: newWords[j] });
      j++;
    } else if (i < oldWords.length) {
      diff.push({ type: 'removed', text: oldWords[i] });
      i++;
    } else {
      diff.push({ type: 'added', text: newWords[j] });
      j++;
    }
  }

  return diff;
}

export const VersionDiffDrawer: React.FC<VersionDiffDrawerProps> = ({
  isOpen,
  onClose,
  transcript,
  documentVersions,
  activeVersionNumber
}) => {
  const [leftArtifact, setLeftArtifact] = useState<'transcript_v0' | 'v1'>('transcript_v0');
  const [rightArtifact, setRightArtifact] = useState<'v1' | 'v2'>('v2');

  if (!isOpen) return null;

  const v1 = documentVersions.find((v) => v.versionNumber === 1);
  const v2 = documentVersions.find((v) => v.versionNumber === 2) || v1;

  // Render text for transcript_v0
  const transcriptText = transcript.map((s) => `[${s.speaker} @ ${s.timestamp}]: ${s.text}`).join('\n\n');

  // Render text for v1
  const v1Text = v1
    ? `ASSESSMENT:\n${v1.content.assessment}\n\nPLAN:\n${v1.content.plan}\n\nCRITICAL FINDINGS:\n${v1.content.criticalFindings.join(', ')}`
    : 'No v1 generated yet.';

  // Render text for v2
  const v2Text = v2
    ? `ASSESSMENT:\n${v2.content.assessment}\n\nPLAN:\n${v2.content.plan}\n\nCRITICAL FINDINGS:\n${v2.content.criticalFindings.join(', ')}`
    : 'No v2 generated yet.';

  const leftContent = leftArtifact === 'transcript_v0' ? transcriptText : v1Text;
  const rightContent = rightArtifact === 'v1' ? v1Text : v2Text;

  const wordDiffs = computeWordDiff(leftContent, rightContent);

  // Compute stats
  const addedCount = wordDiffs.filter((d) => d.type === 'added' && d.text.trim().length > 0).length;
  const removedCount = wordDiffs.filter((d) => d.type === 'removed' && d.text.trim().length > 0).length;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-anthracite-950 border border-anthracite-800 rounded-xl w-full max-w-5xl h-[86vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        {/* Top Header */}
        <div className="bg-anthracite-900 border-b border-anthracite-800 px-5 py-3 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center space-x-2.5">
            <GitCompare className="w-4 h-4 text-pastel-300" />
            <span className="font-semibold text-slate-100">Clinical Report Version Diff & Provenance Inspector</span>
            <span className="text-anthracite-600 font-mono">•</span>
            <span className="font-mono text-anthracite-400 text-[11px]">
              Non-destructive Lineage (transcript_v0 → v1 → v2)
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-anthracite-500 hover:text-slate-200 hover:bg-anthracite-800 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Diff Control Bar */}
        <div className="bg-anthracite-900/60 border-b border-anthracite-800 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          {/* Comparison Pair Selector */}
          <div className="flex items-center space-x-2 font-mono text-[11px]">
            <span className="text-anthracite-500 uppercase">Compare:</span>
            <select
              value={leftArtifact}
              onChange={(e) => setLeftArtifact(e.target.value as 'transcript_v0' | 'v1')}
              className="bg-anthracite-950 border border-anthracite-800 text-pastel-200 text-xs rounded px-2 py-1 focus:outline-none focus:border-pastel-400 cursor-pointer"
            >
              <option value="transcript_v0">transcript_v0 (Acoustic Stream)</option>
              <option value="v1">Draft v1 (ARIA Synthesis)</option>
            </select>

            <ArrowRight className="w-3.5 h-3.5 text-anthracite-600" />

            <select
              value={rightArtifact}
              onChange={(e) => setRightArtifact(e.target.value as 'v1' | 'v2')}
              className="bg-anthracite-950 border border-anthracite-800 text-pastel-200 text-xs rounded px-2 py-1 focus:outline-none focus:border-pastel-400 cursor-pointer"
            >
              <option value="v2">Physician v2 (Signed / Corrected)</option>
              <option value="v1">Draft v1 (ARIA Synthesis)</option>
            </select>
          </div>

          {/* Telemetry Stats */}
          <div className="flex items-center space-x-3 font-mono text-[11px]">
            <span className="text-emerald-400">+{addedCount} additions</span>
            <span className="text-anthracite-600">•</span>
            <span className="text-red-400">-{removedCount} modifications</span>
            <span className="text-anthracite-600">•</span>
            <span className="text-slate-400">
              Provenance: {v2 ? v2.provenanceSourceIds.length : 0} Segments Linked
            </span>
          </div>
        </div>

        {/* Side-by-Side Viewport */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-anthracite-800 overflow-hidden text-xs">
          {/* Left Column (Baseline) */}
          <div className="p-4 flex flex-col overflow-hidden bg-anthracite-950">
            <div className="flex items-center justify-between pb-2 border-b border-anthracite-850 mb-3 shrink-0">
              <div className="flex items-center space-x-2">
                <FileText className="w-3.5 h-3.5 text-anthracite-400" />
                <span className="font-semibold text-slate-300 uppercase font-mono text-[11px]">
                  {leftArtifact === 'transcript_v0' ? 'Baseline: transcript_v0 (Raw Audio Stream)' : 'Baseline: Draft v1'}
                </span>
              </div>
              <span className="text-[10px] font-mono text-anthracite-500">Immutable Original</span>
            </div>

            <div className="flex-1 overflow-y-auto font-mono text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed bg-anthracite-900/40 p-3 rounded-lg border border-anthracite-850">
              {leftContent || <span className="text-anthracite-500 italic">No content in selected artifact.</span>}
            </div>
          </div>

          {/* Right Column (Highlight Diff) */}
          <div className="p-4 flex flex-col overflow-hidden bg-anthracite-950">
            <div className="flex items-center justify-between pb-2 border-b border-anthracite-850 mb-3 shrink-0">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-3.5 h-3.5 text-pastel-300" />
                <span className="font-semibold text-pastel-200 uppercase font-mono text-[11px]">
                  {rightArtifact === 'v2' ? 'Active: Physician Authorized v2 (Diff Applied)' : 'Active: Draft v1'}
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/60">
                Lineage Verified
              </span>
            </div>

            {/* Word-level Diff Highlighting Canvas */}
            <div className="flex-1 overflow-y-auto font-mono text-[11px] leading-relaxed bg-anthracite-900/40 p-3 rounded-lg border border-anthracite-850 space-y-1">
              <p className="whitespace-pre-wrap">
                {wordDiffs.map((token, idx) => {
                  if (token.type === 'added') {
                    return (
                      <span
                        key={idx}
                        className="bg-emerald-950/70 border border-emerald-700/80 text-emerald-200 px-1 py-0.2 rounded font-medium"
                      >
                        {token.text}
                      </span>
                    );
                  }
                  if (token.type === 'removed') {
                    return (
                      <span
                        key={idx}
                        className="bg-red-950/50 border border-red-800/80 text-red-300 line-through px-1 py-0.2 rounded opacity-75 mr-0.5"
                      >
                        {token.text}
                      </span>
                    );
                  }
                  return <span key={idx} className="text-slate-300">{token.text}</span>;
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Provenance Tags Footer */}
        <div className="p-3.5 bg-anthracite-900 border-t border-anthracite-800 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0 font-mono">
          <div className="flex items-center space-x-2 text-anthracite-400">
            <Tag className="w-3.5 h-3.5 text-pastel-300 shrink-0" />
            <span className="text-[11px]">Source Lineage:</span>
            <div className="flex flex-wrap gap-1.5">
              {(v2?.provenanceSourceIds || []).map((id, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 rounded bg-anthracite-950 border border-anthracite-800 text-[10px] text-pastel-300"
                >
                  {id}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-slate-400">
            <span>Predecessor: {v2?.predecessorVersionId || 'None (Genesis v1)'}</span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">Author: {v2?.authorName}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
