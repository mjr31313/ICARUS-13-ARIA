import { AuditEvent, ClinicianRole } from '../types';

class AuditStore {
  private events: AuditEvent[] = [];
  private subscribers: ((events: AuditEvent[]) => void)[] = [];

  constructor() {
    // Seed initial system boot event
    this.recordEvent({
      eventType: 'ENCOUNTER_ACTIVATED',
      actor: 'SYSTEM_BOOT',
      role: ClinicianRole.IT_AUDITOR,
      patientId: 'PAT-GR-6701',
      encounterId: 'ENC-2025-0518-01',
      correlationId: 'CORR-SYS-INIT',
      details: 'ICARUS / ARIA Clinical Orchestration Overlay initialized above simulated hospital systems.'
    });
  }

  public recordEvent(params: {
    eventType: AuditEvent['eventType'];
    actor: string;
    role: ClinicianRole;
    patientId: string;
    encounterId: string;
    causationId?: string;
    correlationId: string;
    details: string;
    payloadSnapshot?: Record<string, unknown>;
  }): AuditEvent {
    const event: AuditEvent = {
      id: `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      ...params
    };

    this.events = [event, ...this.events];
    this.notify();
    return event;
  }

  public getEvents(patientId?: string): AuditEvent[] {
    if (!patientId) return [...this.events];
    return this.events.filter((e) => e.patientId === patientId);
  }

  public subscribe(fn: (events: AuditEvent[]) => void) {
    this.subscribers.push(fn);
    fn([...this.events]);
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== fn);
    };
  }

  private notify() {
    const snapshot = [...this.events];
    this.subscribers.forEach((fn) => fn(snapshot));
  }

  public reset() {
    this.events = [];
    this.recordEvent({
      eventType: 'ENCOUNTER_ACTIVATED',
      actor: 'SYSTEM_RESET',
      role: ClinicianRole.IT_AUDITOR,
      patientId: 'PAT-GR-6701',
      encounterId: 'ENC-2025-RESET',
      correlationId: 'CORR-RESET',
      details: 'Synthetic demonstration state restored to baseline.'
    });
  }
}

export const auditStore = new AuditStore();
