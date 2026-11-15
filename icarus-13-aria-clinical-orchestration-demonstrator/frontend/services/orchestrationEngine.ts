import {
  Patient,
  WorkflowTask,
  CrossSystemContradiction,
  OrchestrationProposal,
  ClinicianRole
} from '../types';
import { SEEDED_CONTRADICTIONS, SEEDED_WORKFLOW_TASKS } from '../mockData';
import { auditStore } from './auditStore';
import { hospitalGateway } from './hospitalAdapters';

class OrchestrationEngine {
  private contradictions: CrossSystemContradiction[] = [...SEEDED_CONTRADICTIONS];
  private tasks: WorkflowTask[] = [...SEEDED_WORKFLOW_TASKS];
  private activeProposal: OrchestrationProposal | null = null;
  private currentPatientId: string = 'PAT-GR-6701';
  private subscribers: ((tasks: WorkflowTask[], contradictions: CrossSystemContradiction[]) => void)[] = [];

  constructor() {
    this.createOrchestrationProposal('PAT-GR-6701');
  }

  // Generate patient-specific multi-system orchestration proposal
  public createOrchestrationProposal(patientId: string): OrchestrationProposal {
    this.currentPatientId = patientId;
    const patient = hospitalGateway.getPatientById(patientId);
    const { labs, imaging, pastEncounters } = hospitalGateway.readPatientData(patientId, 'ARIA_ORCHESTRATOR', ClinicianRole.ATTENDING);
    const patientDiscrepancies = this.contradictions.filter((c) => c.patientId === patientId);

    let summaryText = `Complete preoperative synthesis and readiness coordination for ${patient?.name ?? patientId}`;
    let docTitle = 'Preoperative Clearance & Revision Arthroplasty Synthesis (Draft v1)';
    let docSummary = 'Aseptic mechanical loosening Left THA. Hemoglobin 9.8 g/dL; eGFR 53. Unconfirmed Apixaban cessation interval and missing electronic consent pending verification.';
    let protocolsChecked = ['SOP-ORTHO-REV-2024 (v4.2)'];

    if (patientId === 'PAT-AN-7204') {
      summaryText = 'Urgent heart failure decompensation synthesis, hyperkalemia escalation & loop diuretic reconciliation for Andreas Nikolaou (72y)';
      docTitle = 'Decompensated Heart Failure & Hyperkalemia SBAR Handover (Draft v1)';
      docSummary = 'HFrEF (LVEF 35%), AFib, Acute-on-Chronic Kidney Injury (Creatinine 2.1 mg/dL vs baseline 1.4). Critical hyperkalemia (K+ 5.7 mmol/L). Unresolved 40mg vs 80mg Furosemide dose discrepancy.';
      protocolsChecked = ['SOP-HF-HYPERK-2026 (v3.1)'];
    } else if (patientId === 'PAT-MK-5905') {
      summaryText = 'Multidisciplinary Oncology Board (MDT) staging synthesis & liver MRI coordination for Maria Konstantinou (59y)';
      docTitle = 'Colorectal Multidisciplinary Board (MDT) Staging Briefing (Draft v1)';
      docSummary = 'Status post laparoscopic sigmoid colectomy. Pathology: pT3N1a (1/18 LN+), R0 margins. Restaging CT: 8mm indeterminate hepatic segment VI lesion (unconfirmed metastasis; dedicated liver MRI required).';
      protocolsChecked = ['SOP-MDT-COLORECTAL-2026 (v5.0)'];
    }

    const patientTasks = this.getTasksForPatient(patientId);

    const proposal: OrchestrationProposal = {
      id: `PROP-${patientId}-${Date.now()}`,
      summary: summaryText,
      identifiedPatient: patient ? `${patient.name} (${patient.mrn})` : patientId,
      retrievedContext: {
        ehrNotesCount: pastEncounters.length + 1,
        labResultsCount: labs.length,
        imagingCount: imaging.length,
        protocolsChecked
      },
      discrepancies: patientDiscrepancies,
      proposedDocumentation: {
        title: docTitle,
        summary: docSummary
      },
      proposedTasks: patientTasks,
      status: 'PENDING_PHYSICIAN_AUTHORIZATION'
    };

    this.activeProposal = proposal;
    return proposal;
  }

  public getActiveProposal(): OrchestrationProposal | null {
    return this.activeProposal;
  }

  public getContradictions(patientId?: string): CrossSystemContradiction[] {
    if (!patientId) return [...this.contradictions];
    return this.contradictions.filter((c) => c.patientId === patientId);
  }

  public getTasks(): WorkflowTask[] {
    return [...this.tasks];
  }

  public getTasksForPatient(patientId: string): WorkflowTask[] {
    if (patientId === 'PAT-AN-7204') {
      return this.tasks.filter((t) => t.id.startsWith('TSK-AN'));
    }
    if (patientId === 'PAT-MK-5905') {
      return this.tasks.filter((t) => t.id.startsWith('TSK-MK'));
    }
    return this.tasks.filter((t) => !t.id.startsWith('TSK-AN') && !t.id.startsWith('TSK-MK'));
  }

  // Resolve cross-system contradiction
  public resolveContradiction(params: {
    id: string;
    note: string;
    actor: string;
    role: ClinicianRole;
  }) {
    this.contradictions = this.contradictions.map((c) =>
      c.id === params.id
        ? {
            ...c,
            status: 'RESOLVED_BY_CLINICIAN' as const,
            resolvedNote: params.note,
            resolvedBy: `${params.actor} (${params.role})`,
            resolvedAt: new Date().toISOString()
          }
        : c
    );

    auditStore.recordEvent({
      eventType: 'CONTRADICTION_RESOLVED',
      actor: params.actor,
      role: params.role,
      patientId: this.currentPatientId,
      encounterId: `ENC-${this.currentPatientId}`,
      correlationId: `CORR-DISC-${params.id}`,
      details: `Cross-system contradiction [${params.id}] verified and resolved: "${params.note}".`
    });

    this.notify();
  }

  // Authorize & dispatch workflow tasks with real simulated recipient receipts
  public authorizeAndDispatchTasks(params: {
    actor: string;
    role: ClinicianRole;
    patientId?: string;
  }): { success: boolean; dispatchedCount: number; error?: string } {
    if (params.role !== ClinicianRole.ATTENDING) {
      return {
        success: false,
        dispatchedCount: 0,
        error: 'Only an Attending Physician has authority to authorize and dispatch clinical coordination tasks.'
      };
    }

    const pId = params.patientId || this.currentPatientId;
    const now = new Date().toISOString();

    this.tasks = this.tasks.map((t) => {
      const belongsToActive =
        (pId === 'PAT-AN-7204' && t.id.startsWith('TSK-AN')) ||
        (pId === 'PAT-MK-5905' && t.id.startsWith('TSK-MK')) ||
        (pId !== 'PAT-AN-7204' && pId !== 'PAT-MK-5905' && !t.id.startsWith('TSK-AN') && !t.id.startsWith('TSK-MK'));

      if (belongsToActive) {
        return {
          ...t,
          status: 'SENT' as const,
          authorizedBy: `${params.actor} (${params.role})`,
          authorizedAt: now
        };
      }
      return t;
    });

    if (this.activeProposal) {
      this.activeProposal.status = 'AUTHORIZED_AND_DISPATCHED';
    }

    const dispatched = this.getTasksForPatient(pId);

    auditStore.recordEvent({
      eventType: 'TASK_AUTHORIZED',
      actor: params.actor,
      role: params.role,
      patientId: pId,
      encounterId: `ENC-${pId}`,
      correlationId: `CORR-TSK-AUTH-${Date.now()}`,
      details: `Attending physician authorized ${dispatched.length} coordinated clinical tasks for ${pId}.`
    });

    this.notify();

    // Simulate realistic asynchronous recipient acknowledgement
    setTimeout(() => {
      this.simulateRecipientAcknowledgements(pId);
    }, 1800);

    return { success: true, dispatchedCount: dispatched.length };
  }

  private simulateRecipientAcknowledgements(patientId: string) {
    const now = new Date().toLocaleTimeString();

    this.tasks = this.tasks.map((t) => {
      if (patientId === 'PAT-AN-7204') {
        if (t.id === 'TSK-AN-01') {
          return {
            ...t,
            status: 'ACKNOWLEDGED' as const,
            acknowledgedBy: 'N. Savva, RN (Cardiology Ward 2A)',
            acknowledgedAt: now,
            receiptNote: 'Stat 12-lead ECG completed: Rate 84 bpm irregular (AFib), narrow QRS, no acute peaked T waves.'
          };
        }
        if (t.id === 'TSK-AN-02') {
          return {
            ...t,
            status: 'ACKNOWLEDGED' as const,
            acknowledgedBy: 'E. Papas, PharmD (Pharmacy Reconcile)',
            acknowledgedAt: now,
            receiptNote: 'Pill count reconciled: Patient took 40mg daily until 2 days ago when self-doubled due to swelling. Clarified with patient.'
          };
        }
        if (t.id === 'TSK-AN-03') {
          return {
            ...t,
            status: 'ACKNOWLEDGED' as const,
            acknowledgedBy: 'Dr. C. Vasiliou, MD (Cardiology Registrar)',
            acknowledgedAt: now,
            receiptNote: 'SBAR handover received: Cardiology bed-side consult initiated; potassium binder (Lokelma) and renal ultrasound pending.'
          };
        }
      } else if (patientId === 'PAT-MK-5905') {
        if (t.id === 'TSK-MK-01') {
          return {
            ...t,
            status: 'ACKNOWLEDGED' as const,
            acknowledgedBy: 'K. Ioannou (MRI Scheduling Coordinator)',
            acknowledgedAt: now,
            receiptNote: 'Dedicated Liver MRI with Primovist confirmed for Thursday 13 Nov, 11:15.'
          };
        }
        if (t.id === 'TSK-MK-02') {
          return {
            ...t,
            status: 'ACKNOWLEDGED' as const,
            acknowledgedBy: 'M. Charalambous (Colorectal MDT Secretariat)',
            acknowledgedAt: now,
            receiptNote: 'Added to agenda as Case #3 for Multidisciplinary Colorectal Tumor Board on 11 Nov.'
          };
        }
        if (t.id === 'TSK-MK-03') {
          return {
            ...t,
            status: 'ACKNOWLEDGED' as const,
            acknowledgedBy: 'Dr. M. Petrou, MD (Medical Oncology)',
            acknowledgedAt: now,
            receiptNote: 'Pathology pT3N1a reviewed: Adjuvant CAPOX vs FOLFOX discussion scheduled pending MRI liver result.'
          };
        }
      } else {
        if (t.id === 'TSK-01') {
          return {
            ...t,
            status: 'ACKNOWLEDGED' as const,
            acknowledgedBy: 'Sister Hannah Brandt, RN (Ward B3)',
            acknowledgedAt: now,
            receiptNote: 'Blister pack inspected: confirmed last Apixaban intake was Wednesday 20:00 (>58 hours washout). Safe for spinal.'
          };
        }
        if (t.id === 'TSK-02') {
          return {
            ...t,
            status: 'ACKNOWLEDGED' as const,
            acknowledgedBy: 'M. Becker, MT (Blood Bank)',
            acknowledgedAt: now,
            receiptNote: 'Type & Screen verified. 2 units PRBC crossmatched and held in OR Satellite Fridge.'
          };
        }
        if (t.id === 'TSK-03') {
          return {
            ...t,
            status: 'ACKNOWLEDGED' as const,
            acknowledgedBy: 'Dr. Julian Morales, MD (Resident)',
            acknowledgedAt: now,
            receiptNote: 'Physical consent counter-signed with patient in Bay 04 and scanned to chart.'
          };
        }
      }
      return t;
    });

    auditStore.recordEvent({
      eventType: 'TASK_ACKNOWLEDGED',
      actor: 'SIMULATED_RECIPIENT_DEPARTMENTS',
      role: ClinicianRole.NURSE,
      patientId,
      encounterId: `ENC-${patientId}`,
      correlationId: `CORR-ACK-BATCH-${Date.now()}`,
      details: `Simulated recipient departments confirmed task execution for patient ${patientId}.`
    });

    this.notify();
  }

  public subscribe(fn: (tasks: WorkflowTask[], contradictions: CrossSystemContradiction[]) => void) {
    this.subscribers.push(fn);
    fn([...this.tasks], [...this.contradictions]);
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== fn);
    };
  }

  private notify() {
    this.subscribers.forEach((fn) => fn([...this.tasks], [...this.contradictions]));
  }
}

export const orchestrationEngine = new OrchestrationEngine();
