import React, { useState, useEffect } from 'react';
import { Patient, UserProfile, ClinicianRole } from '../types';
import { hospitalGateway } from '../services/hospitalAdapters';
import { generateFhirResources, FhirBundleResources } from '../services/fhirTransformer';
import { offlineReconciliation, ReconciliationLogEntry } from '../services/offlineReconciliation';
import { acceptanceTestRunner, AcceptanceTestResult } from '../services/acceptanceTestSuite';
import {
  Layers,
  X,
  Code2,
  Copy,
  WifiOff,
  Wifi,
  Play,
  ShieldCheck,
  Globe,
  Radio,
  Server,
  Lock,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface ArchitectureInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  currentPatient: Patient;
  currentUser: UserProfile;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ArchitectureInspector: React.FC<ArchitectureInspectorProps> = ({
  isOpen,
  onClose,
  currentPatient,
  currentUser,
  onNotify
}) => {
  const [activeTab, setActiveTab] = useState<'externalApis' | 'fhir' | 'tests' | 'partition' | 'layers'>('externalApis');
  const [activeFhirResource, setActiveFhirResource] = useState<'documentReference' | 'provenance' | 'patient' | 'encounter'>('documentReference');
  const [isCopied, setIsCopied] = useState(false);

  const [isPartitioned, setIsPartitioned] = useState(offlineReconciliation.isPartitioned);
  const [reconciliationLogs, setReconciliationLogs] = useState<ReconciliationLogEntry[]>([]);
  const [testResults, setTestResults] = useState<AcceptanceTestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // Live External Connectors form state
  const [fhirUrl, setFhirUrl] = useState(hospitalGateway.externalConfig.fhirBaseUrl);
  const [pacsUrl, setPacsUrl] = useState(hospitalGateway.externalConfig.pacsDicomWebUrl);
  const [bearerToken, setBearerToken] = useState(hospitalGateway.externalConfig.authBearerToken);
  const [activeMode, setActiveMode] = useState<'SYNTHETIC_OVERLAY' | 'LIVE_REMOTE_HYBRID'>(hospitalGateway.externalConfig.activeMode);
  const [isTestingEndpoint, setIsTestingEndpoint] = useState(false);
  const [testEndpointResult, setTestEndpointResult] = useState<{ success: boolean; details: string; latencyMs?: number } | null>(null);

  const { labs } = hospitalGateway.readPatientData(currentPatient.id, currentUser.name, currentUser.role);

  const fhirBundle: FhirBundleResources = generateFhirResources({
    patient: currentPatient,
    currentUser,
    labs,
    encounterState: 'DRAFT'
  });

  useEffect(() => {
    if (!isOpen) return;
    const unsub = offlineReconciliation.subscribe((logs) => setReconciliationLogs(logs));
    return () => unsub();
  }, [isOpen]);

  const handleCopyFhirJson = () => {
    const content = JSON.stringify(fhirBundle[activeFhirResource], null, 2);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1800);
      onNotify('FHIR R4 JSON copied to clipboard.', 'info');
    }
  };

  const handleTestLiveEndpoint = async () => {
    setIsTestingEndpoint(true);
    setTestEndpointResult(null);

    // Save inputs into gateway
    hospitalGateway.externalConfig.fhirBaseUrl = fhirUrl.trim();
    hospitalGateway.externalConfig.pacsDicomWebUrl = pacsUrl.trim();
    hospitalGateway.externalConfig.authBearerToken = bearerToken.trim();
    hospitalGateway.externalConfig.activeMode = activeMode;

    const res = await hospitalGateway.testLiveExternalEndpoint(fhirUrl.trim());
    setTestEndpointResult(res);
    setIsTestingEndpoint(false);

    if (res.success) {
      onNotify(`Live Handshake Connected (${res.latencyMs}ms)`, 'success');
    } else {
      onNotify(`Live Handshake Failed: ${res.details}`, 'error');
    }
  };

  const handleTogglePartition = () => {
    const next = !isPartitioned;
    setIsPartitioned(next);
    offlineReconciliation.setPartition(next, currentUser.name, currentUser.role);
    onNotify(
      next
        ? 'NETWORK PARTITION FORCED: Outbound hospital link severed. Local buffer engaged.'
        : 'NETWORK RESTORED: Asynchronous reconciliation completed.',
      next ? 'error' : 'success'
    );
  };

  const handleRunAcceptanceTests = async () => {
    setIsRunningTests(true);
    onNotify('Running Acceptance Test Suite...', 'info');
    try {
      const results = await acceptanceTestRunner.runAllTests();
      setTestResults(results);
      const passedCount = results.filter((r) => r.status === 'PASS').length;
      onNotify(`All ${passedCount}/${results.length} institutional assertions verified.`, 'success');
    } finally {
      setIsRunningTests(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="h-full flex flex-col bg-anthracite-950 text-slate-100 overflow-hidden">
      {/* Top Header */}
      <div className="bg-anthracite-900 border-b border-anthracite-800 px-6 py-2.5 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center space-x-2">
          <Layers className="w-3.5 h-3.5 text-pastel-300" />
          <span className="font-semibold text-slate-100">Architecture & API Gateways</span>
          <span className="text-anthracite-600 font-mono">•</span>
          <span className="text-pastel-200 font-mono text-[11px]">{currentPatient.name}</span>
        </div>

        <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1 rounded hover:bg-anthracite-800">
          Exit to Chat
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-anthracite-950 border-b border-anthracite-800 px-6 flex items-center space-x-6 text-xs font-medium shrink-0 overflow-x-auto">
        <button
          onClick={() => setActiveTab('externalApis')}
          className={`py-2.5 border-b-2 whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
            activeTab === 'externalApis' ? 'border-pastel-400 text-pastel-200 font-semibold' : 'border-transparent text-slate-400'
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-pastel-300" />
          <span>External API Connectors</span>
        </button>
        <button
          onClick={() => setActiveTab('fhir')}
          className={`py-2.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'fhir' ? 'border-pastel-400 text-pastel-200' : 'border-transparent text-slate-400'
          }`}
        >
          FHIR R4 Payloads
        </button>
        <button
          onClick={() => setActiveTab('tests')}
          className={`py-2.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'tests' ? 'border-pastel-400 text-pastel-200' : 'border-transparent text-slate-400'
          }`}
        >
          Acceptance Test Suite ({testResults.length})
        </button>
        <button
          onClick={() => setActiveTab('partition')}
          className={`py-2.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'partition' ? 'border-pastel-400 text-pastel-200' : 'border-transparent text-slate-400'
          }`}
        >
          Network Partition & Resilience
        </button>
        <button
          onClick={() => setActiveTab('layers')}
          className={`py-2.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'layers' ? 'border-pastel-400 text-pastel-200' : 'border-transparent text-slate-400'
          }`}
        >
          5-Layer Architecture
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-4 text-xs">
        {/* TAB 0: EXTERNAL APIS (NEW) */}
        {activeTab === 'externalApis' && (
          <div className="space-y-4">
            {/* Status & Architectural Directive Box */}
            <div className="bg-anthracite-900 border border-anthracite-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-pastel-300"></span>
                  <span className="font-semibold text-slate-100 text-xs">External EHR / EMR & PACS Integration Status</span>
                </div>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-anthracite-800 text-pastel-200 border border-anthracite-750">
                  HL7 FHIR R4 & DICOMweb WADO-RS
                </span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                <span className="text-pastel-200 font-medium">Yes, you can connect external APIs right now.</span> ICARUS operates strictly via the <span className="font-mono text-pastel-300">Overlay Model</span>: hospital systems of record remain authoritative. Configure live remote endpoints below to query capabilities, validate FHIR conformance, and dispatch authorized DocumentReference bundles over HTTPS.
              </p>
            </div>

            {/* Live Gateway Endpoints Config Form */}
            <div className="bg-anthracite-900 border border-anthracite-800 rounded-xl p-4 space-y-3.5">
              <div className="flex items-center justify-between border-b border-anthracite-800 pb-2">
                <span className="font-semibold text-slate-100">Live Hospital Gateway Endpoints</span>
                <span className="text-[10px] font-mono text-anthracite-500">Standards-aligned RESTful Connectors</span>
              </div>

              {/* Endpoint Mode */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400 uppercase">Gateway Operating Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setActiveMode('SYNTHETIC_OVERLAY');
                      hospitalGateway.externalConfig.activeMode = 'SYNTHETIC_OVERLAY';
                    }}
                    className={`p-2 rounded-lg text-left border transition-colors ${
                      activeMode === 'SYNTHETIC_OVERLAY'
                        ? 'bg-anthracite-850 border-pastel-400/60 text-pastel-200'
                        : 'bg-anthracite-950 border-anthracite-800 text-slate-400 hover:border-anthracite-750'
                    }`}
                  >
                    <p className="font-semibold text-xs text-slate-200">Self-Contained Overlay</p>
                    <p className="text-[10px] text-anthracite-500">Simulated Epic FHIR, Sysmex LIS & GE PACS (Zero setup required)</p>
                  </button>

                  <button
                    onClick={() => {
                      setActiveMode('LIVE_REMOTE_HYBRID');
                      hospitalGateway.externalConfig.activeMode = 'LIVE_REMOTE_HYBRID';
                    }}
                    className={`p-2 rounded-lg text-left border transition-colors ${
                      activeMode === 'LIVE_REMOTE_HYBRID'
                        ? 'bg-anthracite-850 border-pastel-400/60 text-pastel-200'
                        : 'bg-anthracite-950 border-anthracite-800 text-slate-400 hover:border-anthracite-750'
                    }`}
                  >
                    <p className="font-semibold text-xs text-slate-200">Live Remote Hybrid</p>
                    <p className="text-[10px] text-anthracite-500">Live outbound REST requests to external FHIR/DICOM endpoints</p>
                  </button>
                </div>
              </div>

              {/* FHIR Server Base URL */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono text-slate-400 uppercase">
                    EHR / EMR FHIR R4 Base URL
                  </label>
                  <span className="text-[10px] font-mono text-anthracite-500">e.g., Epic on FHIR, Cerner Millennium, or HAPI</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="url"
                    value={fhirUrl}
                    onChange={(e) => setFhirUrl(e.target.value)}
                    placeholder="https://fhir-server.hospital.org/baseR4"
                    className="flex-1 bg-anthracite-950 border border-anthracite-750 text-slate-100 text-xs rounded px-2.5 py-1.5 font-mono focus:outline-none focus:border-pastel-400"
                  />
                  <button
                    onClick={handleTestLiveEndpoint}
                    disabled={isTestingEndpoint}
                    className="bg-anthracite-800 hover:bg-anthracite-750 text-pastel-200 border border-anthracite-700 px-3 py-1.5 rounded text-xs font-medium flex items-center space-x-1.5 transition-colors shrink-0"
                  >
                    <Radio className={`w-3.5 h-3.5 text-pastel-300 ${isTestingEndpoint ? 'animate-pulse' : ''}`} />
                    <span>{isTestingEndpoint ? 'Pinging /metadata...' : 'Test Connection'}</span>
                  </button>
                </div>
              </div>

              {/* PACS DICOMweb URL */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono text-slate-400 uppercase">
                    PACS DICOMweb WADO-RS Endpoint
                  </label>
                  <span className="text-[10px] font-mono text-anthracite-500">e.g., Orthanc, dcm4chee, GE AW Server</span>
                </div>
                <input
                  type="url"
                  value={pacsUrl}
                  onChange={(e) => setPacsUrl(e.target.value)}
                  placeholder="https://pacs.hospital.org/dicomweb/studies"
                  className="w-full bg-anthracite-950 border border-anthracite-750 text-slate-100 text-xs rounded px-2.5 py-1.5 font-mono focus:outline-none focus:border-pastel-400"
                />
              </div>

              {/* Authentication Bearer Token */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono text-slate-400 uppercase">
                    SMART-on-FHIR / OAuth2 Bearer Token (Optional)
                  </label>
                  <span className="text-[10px] font-mono text-anthracite-500">Sent as `Authorization: Bearer ...`</span>
                </div>
                <input
                  type="password"
                  value={bearerToken}
                  onChange={(e) => setBearerToken(e.target.value)}
                  placeholder="eyJhbGciOiJSUzI1NiIsImtpZCI6..."
                  className="w-full bg-anthracite-950 border border-anthracite-750 text-slate-100 text-xs rounded px-2.5 py-1.5 font-mono focus:outline-none focus:border-pastel-400"
                />
              </div>

              {/* Connection Test Output Result */}
              {testEndpointResult && (
                <div
                  className={`p-3 rounded-lg border text-xs font-mono space-y-1 ${
                    testEndpointResult.success
                      ? 'bg-emerald-950/20 border-emerald-800 text-emerald-200'
                      : 'bg-anthracite-950 border-red-800/80 text-red-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold flex items-center space-x-1.5">
                      {testEndpointResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      )}
                      <span>
                        {testEndpointResult.success ? 'REMOTE FHIR HANDSHAKE VERIFIED' : 'REMOTE HANDSHAKE BLOCKED'}
                      </span>
                    </span>
                    {testEndpointResult.latencyMs !== undefined && (
                      <span className="text-anthracite-500 text-[10px]">{testEndpointResult.latencyMs} ms</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300">{testEndpointResult.details}</p>
                </div>
              )}
            </div>

            {/* Real-world Deployment Guide */}
            <div className="bg-anthracite-900 border border-anthracite-800 rounded-xl p-4 space-y-2 text-xs">
              <span className="font-semibold text-slate-100 block">External Hospital API Deployment Invariants</span>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                In an institutional deployment, hospital reverse proxies (e.g. Apigee, Kong, or Azure API for FHIR) manage mutual TLS and mTLS client certificates. Inside this demonstration container, browser security prevents cross-origin requests unless the target server enables CORS headers (`Access-Control-Allow-Origin: *`). The public HAPI test server (`https://hapi.fhir.org/baseR4`) is pre-configured and supports open CORS pinging.
              </p>
            </div>
          </div>
        )}

        {/* TAB 1: FHIR */}
        {activeTab === 'fhir' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 font-mono text-xs">
                {(['documentReference', 'provenance', 'patient', 'encounter'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setActiveFhirResource(r)}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      activeFhirResource === r
                        ? 'bg-anthracite-800 text-pastel-200 border border-anthracite-700 font-bold'
                        : 'bg-anthracite-900 text-slate-400 border border-anthracite-800'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <button
                onClick={handleCopyFhirJson}
                className="bg-anthracite-850 hover:bg-anthracite-800 border border-anthracite-750 text-slate-200 text-xs px-2.5 py-1 rounded flex items-center space-x-1"
              >
                <Copy className="w-3 h-3" />
                <span>{isCopied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="bg-anthracite-900 border border-anthracite-800 rounded-xl p-4 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-[60vh] leading-relaxed">
              <pre>{JSON.stringify(fhirBundle[activeFhirResource], null, 2)}</pre>
            </div>
          </div>
        )}

        {/* TAB 2: ACCEPTANCE TESTS */}
        {activeTab === 'tests' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-anthracite-900 border border-anthracite-800 p-3.5 rounded-xl">
              <p className="text-slate-300 font-medium">Self-executing boundary and authorization test runner</p>
              <button
                onClick={handleRunAcceptanceTests}
                disabled={isRunningTests}
                className="bg-anthracite-800 hover:bg-anthracite-750 text-pastel-200 border border-anthracite-700 px-3 py-1.5 rounded-lg font-medium flex items-center space-x-1.5"
              >
                <Play className="w-3 h-3 fill-current text-pastel-300" />
                <span>{isRunningTests ? 'Running...' : 'Run All Tests'}</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {testResults.map((t) => (
                <div key={t.id} className="p-3 rounded-lg bg-anthracite-900 border border-anthracite-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">
                      {t.id}: {t.name}
                    </span>
                    <span className="font-mono text-emerald-400 font-bold">{t.status}</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{t.description}</p>
                  <p className="text-pastel-200 font-mono text-[10px] mt-1">{t.observedResult}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: PARTITION */}
        {activeTab === 'partition' && (
          <div className="space-y-4">
            <div className="bg-anthracite-900 border border-anthracite-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-100">Network Partition Simulation</p>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Sever hospital integration link to verify local browser buffer and idempotent reconciliation.
                </p>
              </div>

              <button
                onClick={handleTogglePartition}
                className="bg-anthracite-800 hover:bg-anthracite-750 text-pastel-200 border border-anthracite-700 px-3 py-1.5 rounded-lg flex items-center space-x-1.5"
              >
                {isPartitioned ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                <span>{isPartitioned ? 'Restore Connection' : 'Sever Link'}</span>
              </button>
            </div>

            <div className="bg-anthracite-900 border border-anthracite-800 rounded-xl p-3 max-h-48 overflow-y-auto space-y-1.5 font-mono text-[10px]">
              {reconciliationLogs.map((l) => (
                <div key={l.id} className="flex justify-between border-b border-anthracite-800/60 pb-1 last:border-none">
                  <span className="text-pastel-300">
                    [{l.action}] {l.summary}
                  </span>
                  <span className="text-anthracite-500">{l.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: LAYERS */}
        {activeTab === 'layers' && (
          <div className="space-y-3">
            {[
              { num: 'L1', title: 'Clinical Environment', desc: 'Hospital EHR, OR prep, and surgical wards.' },
              { num: 'L2', title: 'ICARUS Orchestration & ARIA Overlay', desc: 'Ambient audio capture, live drafting, and protocol retrieval.' },
              { num: 'L3', title: 'Human Verification & Authority', desc: 'Physician review, non-destructive versioning (v1 -> v2), and signature gates.' },
              { num: 'L4', title: 'Systems of Record', desc: 'Simulated and external Epic EHR, Sysmex LIS, and GE PACS.' },
              { num: 'L5', title: 'Auditability & Safety', desc: 'Append-only event bus, causation IDs, and encounter replay.' }
            ].map((layer) => (
              <div key={layer.num} className="p-3 rounded-xl bg-anthracite-900 border border-anthracite-800 flex space-x-3">
                <span className="font-mono font-bold text-pastel-300 bg-anthracite-800 px-2 py-1 rounded text-xs shrink-0">
                  {layer.num}
                </span>
                <div>
                  <p className="font-semibold text-slate-100">{layer.title}</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">{layer.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
