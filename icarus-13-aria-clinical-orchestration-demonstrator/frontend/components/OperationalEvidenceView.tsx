import React, { useState, useEffect } from 'react';
import { AuditEvent, UserProfile, Patient } from '../types';
import { auditStore } from '../services/auditStore';
import { orchestrationEngine } from '../services/orchestrationEngine';
import { hospitalGateway } from '../services/hospitalAdapters';
import {
  Activity,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Layers,
  FileCheck
} from 'lucide-react';

interface OperationalEvidenceViewProps {
  currentPatient: Patient;
  currentUser: UserProfile;
}

export const OperationalEvidenceView: React.FC<OperationalEvidenceViewProps> = ({
  currentPatient,
  currentUser
}) => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const tasks = orchestrationEngine.getTasks();
  const receipts = hospitalGateway.getReceipts();

  useEffect(() => {
    const unsub = auditStore.subscribe((evts) => setEvents(evts));
    return () => unsub();
  }, []);

  const totalInteractions = events.length;
  const authorizedTasks = tasks.filter((t) => t.status === 'SENT' || t.status === 'ACKNOWLEDGED' || t.status === 'COMPLETED').length;
  const acknowledgedTasks = tasks.filter((t) => t.status === 'ACKNOWLEDGED' || t.status === 'COMPLETED').length;
  const deliverySuccesses = receipts.filter((r) => r.status === 'DELIVERED').length;

  return (
    <div className="flex-1 flex flex-col h-full bg-anthracite-950 text-slate-200 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-6">
      {/* Top Banner */}
      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
          <Activity className="w-4 h-4 text-pastel-300" />
          <span>Operational Evidence & Governance Telemetry</span>
        </h2>
        <p className="text-xs text-slate-400">
          Measured demonstrator activity bound to {currentPatient.name} ({currentPatient.mrn}). Reflects actual state transitions and audit logs.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-3 rounded-xl bg-anthracite-900 border border-anthracite-800 space-y-1">
          <span className="text-[10px] text-anthracite-500 uppercase">Audit Events Logged</span>
          <p className="text-xl font-bold text-slate-100">{totalInteractions}</p>
          <span className="text-[10px] text-slate-400">Append-only trail</span>
        </div>

        <div className="p-3 rounded-xl bg-anthracite-900 border border-anthracite-800 space-y-1">
          <span className="text-[10px] text-anthracite-500 uppercase">Tasks Authorized</span>
          <p className="text-xl font-bold text-pastel-200">{authorizedTasks} / {tasks.length}</p>
          <span className="text-[10px] text-slate-400">Physician signed</span>
        </div>

        <div className="p-3 rounded-xl bg-anthracite-900 border border-anthracite-800 space-y-1">
          <span className="text-[10px] text-anthracite-500 uppercase">Department Receipts</span>
          <p className="text-xl font-bold text-emerald-400">{acknowledgedTasks}</p>
          <span className="text-[10px] text-slate-400">Ward & Blood Bank</span>
        </div>

        <div className="p-3 rounded-xl bg-anthracite-900 border border-anthracite-800 space-y-1">
          <span className="text-[10px] text-anthracite-500 uppercase">EHR Deliveries</span>
          <p className="text-xl font-bold text-slate-100">{deliverySuccesses}</p>
          <span className="text-[10px] text-slate-400">HTTP 201 Created</span>
        </div>
      </div>

      {/* Interprofessional Coordination Status */}
      <div className="p-4 rounded-xl bg-anthracite-900 border border-anthracite-800 space-y-3 text-xs">
        <div className="flex items-center justify-between border-b border-anthracite-800 pb-2">
          <span className="font-semibold text-slate-100">Interprofessional Task State Progression</span>
          <span className="text-[10px] font-mono text-anthracite-500">Proposed → Authorized → Sent → Acknowledged</span>
        </div>

        <div className="space-y-2">
          {tasks.map((task) => (
            <div key={task.id} className="p-2.5 rounded-lg bg-anthracite-950 border border-anthracite-850 flex items-center justify-between text-xs">
              <div>
                <p className="font-medium text-slate-200">{task.title}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Assigned: {task.assigneeRole} ({task.targetDepartment})
                </p>
                {task.receiptNote && (
                  <p className="text-[11px] font-mono text-emerald-400 mt-1">
                    ✓ Acknowledged: "{task.receiptNote}"
                  </p>
                )}
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                  task.status === 'ACKNOWLEDGED'
                    ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/60'
                    : task.status === 'SENT'
                    ? 'bg-anthracite-800 text-pastel-300 border border-anthracite-750'
                    : 'bg-anthracite-900 text-slate-500'
                }`}
              >
                {task.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Log Stream */}
      <div className="p-4 rounded-xl bg-anthracite-900 border border-anthracite-800 space-y-3 text-xs">
        <div className="flex items-center justify-between border-b border-anthracite-800 pb-2">
          <span className="font-semibold text-slate-100">Reconstructable Governance Event Stream</span>
          <span className="text-[10px] font-mono text-anthracite-500">Live Demonstrator Log</span>
        </div>

        <div className="space-y-1.5 max-h-56 overflow-y-auto font-mono text-[11px]">
          {events.slice(0, 10).map((evt) => (
            <div key={evt.id} className="p-2 rounded bg-anthracite-950 border border-anthracite-850 flex items-start justify-between">
              <div>
                <span className="text-pastel-300 font-bold mr-2">[{evt.eventType}]</span>
                <span className="text-slate-300">{evt.details}</span>
              </div>
              <span className="text-anthracite-500 text-[10px] shrink-0 ml-3">{evt.timestamp.slice(11, 19)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
