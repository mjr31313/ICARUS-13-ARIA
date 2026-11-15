import React, { useState, useEffect } from 'react';
import {
  Patient,
  UserProfile,
  ClinicianRole,
  SbarTraumaHandoverRecord,
  LabResult
} from '../types';
import { auditStore } from '../services/auditStore';
import { hospitalGateway } from '../services/hospitalAdapters';
import {
  Activity,
  AlertTriangle,
  Droplet,
  Send,
  CheckCircle2,
  Clock,
  Shield,
  FileText,
  Radio,
  Sparkles,
  Check,
  RefreshCw,
  HeartPulse,
  Flame,
  Volume2
} from 'lucide-react';

interface SbarTraumaHandoverSimulatorProps {
  patient: Patient;
  currentUser: UserProfile;
  labs: LabResult[];
  onAskAria: (query: string) => void;
}

export const SbarTraumaHandoverSimulator: React.FC<SbarTraumaHandoverSimulatorProps> = ({
  patient,
  currentUser,
  labs,
  onAskAria
}) => {
  // Shock-room live telemetry state
  const [systolicBp, setSystolicBp] = useState<number>(82);
  const [diastolicBp, setDiastolicBp] = useState<number>(46);
  const [heartRate, setHeartRate] = useState<number>(126);
  const [oxygenSat, setOxygenSat] = useState<number>(94);
  const [pedalPulseStatus, setPedalPulseStatus] = useState<'ABSENT' | 'FAINT_QUESTIONABLE' | 'DOPPLER_VERIFIED'>('ABSENT');
  const [mtpActivated, setMtpActivated] = useState<boolean>(true);
  const [mtpUnitsDelivered, setMtpUnitsDelivered] = useState<{ prbc: number; ffp: number; platelets: number }>({
    prbc: 4,
    ffp: 4,
    platelets: 1
  });
  const [txaAdministered, setTxaAdministered] = useState<boolean>(true);

  // SBAR Handover Record lifecycle
  const [handoverStatus, setHandoverStatus] = useState<'DRAFT' | 'AUTHORIZED' | 'DISPATCHED_TO_OR' | 'ACKNOWLEDGED'>('DRAFT');
  const [isAuthorizing, setIsAuthorizing] = useState<boolean>(false);
  const [receiptRecord, setReceiptRecord] = useState<SbarTraumaHandoverRecord['receivingTeam'] | null>(null);

  // Periodic shock-room vitals micro-fluctuation
  useEffect(() => {
    const timer = setInterval(() => {
      setHeartRate((prev) => Math.min(134, Math.max(118, prev + Math.floor(Math.random() * 5 - 2))));
      setSystolicBp((prev) => Math.min(88, Math.max(76, prev + Math.floor(Math.random() * 5 - 2))));
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  const meanArterialPressure = Math.round((systolicBp + 2 * diastolicBp) / 3);

  const statHb = labs.find((l) => l.testName.toLowerCase().includes('hemoglobin'))?.value ?? 8.4;
  const statLactate = labs.find((l) => l.testName.toLowerCase().includes('lactate'))?.value ?? 4.8;

  // Toggle MTP (Massive Transfusion Protocol)
  const handleToggleMtp = () => {
    const next = !mtpActivated;
    setMtpActivated(next);

    auditStore.recordEvent({
      eventType: 'MTP_PROTOCOL_ACTIVATED',
      actor: currentUser.name,
      role: currentUser.role,
      patientId: patient.id,
      encounterId: `ENC-${patient.id}`,
      correlationId: `CORR-MTP-${Date.now()}`,
      details: next
        ? 'Massive Transfusion Protocol (MTP Pack 1: 4 PRBC, 4 FFP, 1 Plt, TXA 1g) triggered to Blood Bank.'
        : 'Massive Transfusion Protocol paused.'
    });
  };

  // Authorize & Dispatch SBAR to Trauma / Vascular OR
  const handleAuthorizeAndDispatchSbar = () => {
    setIsAuthorizing(true);
    setHandoverStatus('AUTHORIZED');

    auditStore.recordEvent({
      eventType: 'TRAUMA_SBAR_DISPATCHED',
      actor: currentUser.name,
      role: currentUser.role,
      patientId: patient.id,
      encounterId: `ENC-${patient.id}`,
      correlationId: `CORR-SBAR-${Date.now()}`,
      details: `Attending Physician authorized emergency damage-control SBAR handover for Marcus Vance. Dispatched to Trauma OR 3.`
    });

    // Simulate instant secure gateway transmission to OR
    setTimeout(() => {
      setHandoverStatus('DISPATCHED_TO_OR');
    }, 700);

    // Simulate realistic asynchronous acknowledgement from Receiving Trauma/Vascular OR Team
    setTimeout(() => {
      const receipt: SbarTraumaHandoverRecord['receivingTeam'] = {
        consultant: 'Prof. Dr. N. Vassiliades, MD (Vascular Surgery On-Call) & Dr. K. Thorne (Ortho Trauma)',
        room: 'Emergency Trauma Suite / OR 3 (Lead Angio Hybrid Bay)',
        acknowledgedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        receiptId: `RCPT-SBAR-${Date.now()}-${Math.floor(Math.random() * 8999 + 1000)}`,
        orReadinessNote: 'Trauma OR 3 hybrid bay primed. Perfusionist on standby. Fluoroscopy active. Rapid infuser loaded with MTP Pack 1. Surgical team scrubbed.'
      };

      setReceiptRecord(receipt);
      setHandoverStatus('ACKNOWLEDGED');

      hospitalGateway.exportSignedDocument({
        patientId: patient.id,
        documentVersionId: `DOC-TR-SBAR-${Date.now()}`,
        title: 'Emergency Damage-Control SBAR Trauma Handover (OR 3)',
        signerName: currentUser.name,
        signerRole: currentUser.role,
        destinationSystem: 'RIS-SBAR-OR',
        documentText: `SITUATION: 34yo male, high-speed motorcycle crash, Gustilo IIIB open left tibia/fibula fracture.\nASSESSMENT: Hemorrhagic Shock Class II/III (BP ${systolicBp}/${diastolicBp}, MAP ${meanArterialPressure}, HR ${heartRate}, Lactate ${statLactate}). Absent left dorsalis pedis pulse. MTP Active (4 PRBC : 4 FFP : 1 Plt).\nRECOMMENDATION: Immediate transfer to OR 3 for external fixation, vascular shunt/graft, and fasciotomy.`
      });

      auditStore.recordEvent({
        eventType: 'SURGICAL_OR_ACKNOWLEDGED',
        actor: 'Prof. Dr. N. Vassiliades (Vascular On-Call)',
        role: ClinicianRole.ATTENDING,
        patientId: patient.id,
        encounterId: `ENC-${patient.id}`,
        correlationId: `CORR-OR-ACK-${Date.now()}`,
        details: `Trauma OR 3 confirmed receipt of Marcus Vance SBAR: Team scrubbed, hybrid angiosuite ready.`
      });

      setIsAuthorizing(false);
    }, 2200);
  };

  return (
    <div className="space-y-4 text-xs select-none">
      {/* Shock-Room Real-Time Telemetry Ribbon */}
      <div className="bg-anthracite-900 border border-anthracite-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-anthracite-800 pb-2.5">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
            <span className="font-semibold text-slate-100 text-xs">Shock Room Bay 1 — Damage Control Telemetry</span>
            <span className="font-mono text-[10px] text-pastel-300 bg-anthracite-800 px-1.5 py-0.5 rounded border border-anthracite-750">
              Live Monitor
            </span>
          </div>

          <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400">
            <span className="text-anthracite-500">Resuscitation Target:</span>
            <span className="text-pastel-200">Permissive MAP 50–60 mmHg</span>
          </div>
        </div>

        {/* Live Parameters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
          <div className="p-2.5 rounded-lg bg-anthracite-950 border border-anthracite-800 space-y-0.5">
            <span className="text-[10px] text-anthracite-500 uppercase">Non-Invasive BP</span>
            <p className="text-base font-bold text-red-300">
              {systolicBp}/{diastolicBp}{' '}
              <span className="text-[11px] font-normal text-slate-400">mmHg</span>
            </p>
            <p className="text-[10px] text-pastel-300">MAP: {meanArterialPressure} mmHg</p>
          </div>

          <div className="p-2.5 rounded-lg bg-anthracite-950 border border-anthracite-800 space-y-0.5">
            <span className="text-[10px] text-anthracite-500 uppercase">Heart Rate</span>
            <p className="text-base font-bold text-amber-300">
              {heartRate} <span className="text-[11px] font-normal text-slate-400">bpm</span>
            </p>
            <p className="text-[10px] text-anthracite-400">Sinus Tachycardia</p>
          </div>

          <div className="p-2.5 rounded-lg bg-anthracite-950 border border-anthracite-800 space-y-0.5">
            <span className="text-[10px] text-anthracite-500 uppercase">Pulse Oximetry</span>
            <p className="text-base font-bold text-pastel-200">
              {oxygenSat}% <span className="text-[11px] font-normal text-slate-400">SpO2</span>
            </p>
            <p className="text-[10px] text-anthracite-400">15L Non-Rebreather</p>
          </div>

          <div className="p-2.5 rounded-lg bg-anthracite-950 border border-anthracite-800 space-y-0.5">
            <span className="text-[10px] text-anthracite-500 uppercase">Stat Blood Gas</span>
            <p className="text-base font-bold text-red-300">
              Hb {statHb} <span className="text-[11px] font-normal text-slate-400">g/dL</span>
            </p>
            <p className="text-[10px] text-red-400">Lactate: {statLactate} mmol/L</p>
          </div>
        </div>

        {/* Critical Neurovascular Alert: Absent Pedal Pulse */}
        <div className="p-3 rounded-lg bg-red-950/30 border border-red-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-start space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-red-200">CRITICAL NEUROVASCULAR ALERT</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-900/60 text-red-200 border border-red-700">
                  LIMB THREAT
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                Left dorsalis pedis pulse is <span className="text-red-300 font-bold">NOT PALPABLE</span>. Posterior tibial pulse is faint. Gustilo IIIB open tibial deformity with warm ischemia clock running (&lt;6 hours).
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 font-mono text-[11px]">
            <span className="text-anthracite-400">Pulse Status:</span>
            <span className="px-2 py-0.5 rounded bg-anthracite-900 border border-red-700/80 text-red-300 font-bold">
              {pedalPulseStatus}
            </span>
          </div>
        </div>

        {/* Massive Transfusion Protocol (MTP) & TXA Control Strip */}
        <div className="p-3 rounded-lg bg-anthracite-950 border border-anthracite-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2.5">
            <Droplet className={`w-4 h-4 ${mtpActivated ? 'text-red-400 animate-pulse' : 'text-slate-500'}`} />
            <div>
              <span className="font-semibold text-slate-100">Massive Transfusion Protocol (MTP Pack 1)</span>
              <p className="text-[11px] text-slate-400">
                1:1:1 Balanced Resuscitation (4 PRBC, 4 FFP, 1 Platelet) • TXA 1g IV loading dose
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 font-mono text-[11px]">
            <button
              onClick={handleToggleMtp}
              className={`px-3 py-1 rounded border transition-colors ${
                mtpActivated
                  ? 'bg-red-950/40 border-red-700 text-red-200 font-bold'
                  : 'bg-anthracite-850 border-anthracite-750 text-slate-400'
              }`}
            >
              {mtpActivated ? 'MTP ACTIVATED (Dispatched)' : 'MTP Disengaged'}
            </button>
          </div>
        </div>
      </div>

      {/* Structured Damage-Control SBAR Generator Card */}
      <div className="bg-anthracite-900 border border-anthracite-800 rounded-xl p-4 space-y-3.5">
        <div className="flex items-center justify-between border-b border-anthracite-800 pb-2">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-pastel-300" />
            <span className="font-semibold text-slate-100 text-xs">
              Structured SBAR Trauma Handover (Shock Room → Trauma OR 3)
            </span>
          </div>

          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              handoverStatus === 'ACKNOWLEDGED'
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                : handoverStatus === 'DISPATCHED_TO_OR'
                ? 'bg-anthracite-800 border-anthracite-700 text-pastel-300 animate-pulse'
                : 'bg-anthracite-950 border-anthracite-800 text-slate-400'
            }`}
          >
            {handoverStatus === 'ACKNOWLEDGED'
              ? 'OR 3 ACKNOWLEDGED'
              : handoverStatus === 'DISPATCHED_TO_OR'
              ? 'DISPATCHING TO OR 3...'
              : handoverStatus === 'AUTHORIZED'
              ? 'AUTHORIZED BY ATTENDING'
              : 'DRAFT AWAITING SIGNATURE'}
          </span>
        </div>

        {/* SBAR Sections */}
        <div className="space-y-2 text-xs leading-relaxed font-sans">
          <div className="p-2.5 rounded bg-anthracite-950 border border-anthracite-850 space-y-0.5">
            <span className="font-mono text-[10px] uppercase text-pastel-300 font-bold block">Situation (S)</span>
            <p className="text-slate-200">
              34-year-old male motorcyclist struck at ~60 km/h. Polytrauma, Gustilo-Anderson IIIB open left tibia/fibula fracture with severe contamination and active bleeding.
            </p>
          </div>

          <div className="p-2.5 rounded bg-anthracite-950 border border-anthracite-850 space-y-0.5">
            <span className="font-mono text-[10px] uppercase text-pastel-300 font-bold block">Background (B)</span>
            <p className="text-slate-200">
              No known medical history, NKDA. Airway secured with high-flow O2 (saturation 94-96%). Pelvic binder placed loosely. Stat trauma X-ray confirms comminuted displaced distal tibia/fibula fracture.
            </p>
          </div>

          <div className="p-2.5 rounded bg-anthracite-950 border border-anthracite-850 space-y-0.5">
            <span className="font-mono text-[10px] uppercase text-pastel-300 font-bold block">Assessment (A)</span>
            <p className="text-slate-200">
              Hemorrhagic Shock Class II/III (BP {systolicBp}/{diastolicBp}, MAP {meanArterialPressure}, HR {heartRate}, Lactate {statLactate} mmol/L, Base Deficit -6.5). Critical finding: <span className="text-red-300 font-semibold">Left dorsalis pedis pulse impalpable</span>; suspected acute popliteal/tibial arterial transection or occlusion. MTP Pack 1 active.
            </p>
          </div>

          <div className="p-2.5 rounded bg-anthracite-950 border border-anthracite-850 space-y-0.5">
            <span className="font-mono text-[10px] uppercase text-pastel-300 font-bold block">Recommendation (R)</span>
            <p className="text-slate-200">
              Immediate code trauma transfer to Hybrid OR 3 for urgent on-table on-call vascular exploration, temporary arterial shunt, knee-spanning external fixation, and four-compartment fasciotomy.
            </p>
          </div>
        </div>

        {/* Handover Action Toolbar */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-anthracite-800">
          <p className="text-[11px] text-slate-400 font-mono">
            Handover Author: <span className="text-slate-200">{currentUser.name}</span> ({currentUser.role})
          </p>

          <div className="flex items-center space-x-2">
            <button
              onClick={() =>
                onAskAria(
                  `Evaluate Marcus Vance's trauma bay resuscitation parameters, absent pedal pulse protocol, and OR 3 transfer readiness.`
                )
              }
              className="bg-anthracite-850 hover:bg-anthracite-800 border border-anthracite-750 text-pastel-200 text-xs px-2.5 py-1.5 rounded-lg flex items-center space-x-1 font-medium transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-pastel-300" />
              <span>Ask ARIA</span>
            </button>

            <button
              onClick={handleAuthorizeAndDispatchSbar}
              disabled={handoverStatus === 'ACKNOWLEDGED' || isAuthorizing || !currentUser.canSign}
              className="bg-anthracite-800 hover:bg-anthracite-750 disabled:opacity-40 text-pastel-200 border border-anthracite-700 text-xs px-3 py-1.5 rounded-lg font-medium flex items-center space-x-1.5 transition-colors shadow-sm"
            >
              <Send className="w-3.5 h-3.5 text-pastel-300" />
              <span>
                {handoverStatus === 'ACKNOWLEDGED'
                  ? 'OR Receipt Verified'
                  : isAuthorizing
                  ? 'Dispatching Handover...'
                  : 'Authorize & Dispatch to OR 3'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Auditable Receiving Surgical Team Receipt Box */}
      {receiptRecord && (
        <div className="p-4 rounded-xl bg-anthracite-900 border border-emerald-800/80 space-y-2.5 text-xs">
          <div className="flex items-center justify-between border-b border-anthracite-800 pb-2">
            <div className="flex items-center space-x-2 text-emerald-300 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>RECEIVING SURGICAL TEAM ACKNOWLEDGEMENT CONFIRMED</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800">
              AUDIT VERIFIED
            </span>
          </div>

          <div className="space-y-1.5 text-slate-300">
            <p>
              <span className="font-mono text-anthracite-500 text-[10px] uppercase block">Receiving Surgical Consultants:</span>
              <span className="text-slate-100 font-medium">{receiptRecord.consultant}</span>
            </p>
            <p>
              <span className="font-mono text-anthracite-500 text-[10px] uppercase block">Designated Suite:</span>
              <span className="text-slate-200 font-mono">{receiptRecord.room}</span>
            </p>
            <p>
              <span className="font-mono text-anthracite-500 text-[10px] uppercase block">OR Readiness & Confirmation Receipt:</span>
              <span className="text-emerald-300 font-mono leading-relaxed block bg-anthracite-950 p-2.5 rounded border border-anthracite-850 mt-0.5">
                "{receiptRecord.orReadinessNote}"
              </span>
            </p>
            <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-anthracite-500">
              <span>Receipt ID: {receiptRecord.receiptId}</span>
              <span>Acknowledged At: {receiptRecord.acknowledgedAt}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
