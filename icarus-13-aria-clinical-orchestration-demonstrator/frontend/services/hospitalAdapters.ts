import {
  Patient,
  LabResult,
  ImagingReport,
  PathologyReport,
  PastEncounterRecord,
  InstitutionalProtocol,
  ExportReceipt,
  ClinicianRole,
  ExternalIntegrationConfig
} from '../types';
import {
  PATIENTS,
  LAB_RESULTS,
  IMAGING_REPORTS,
  PATHOLOGY_REPORTS,
  PAST_ENCOUNTERS,
  INSTITUTIONAL_PROTOCOLS
} from '../mockData';
import { auditStore } from './auditStore';

export interface DataBusMovement {
  id: string;
  timestamp: string;
  source: string;
  destination: string;
  protocol: 'HL7-v2.5' | 'FHIR-R4-REST' | 'DICOM-DIMSE' | 'ICARUS-GATEWAY' | 'DICOMWEB-WADO-RS';
  operation: 'READ' | 'PREPARE' | 'AUTHORIZE' | 'EXPORT' | 'VERIFY';
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  summary: string;
}

class HospitalIntegrationGateway {
  private patients: Patient[] = [...PATIENTS];
  private labs: LabResult[] = [...LAB_RESULTS];
  private imaging: ImagingReport[] = [...IMAGING_REPORTS];
  private pathology: PathologyReport[] = [...PATHOLOGY_REPORTS];
  private pastEncounters: PastEncounterRecord[] = [...PAST_ENCOUNTERS];
  private protocols: InstitutionalProtocol[] = [...INSTITUTIONAL_PROTOCOLS];
  private receipts: ExportReceipt[] = [];
  private dataBusLogs: DataBusMovement[] = [];
  private subscribers: ((logs: DataBusMovement[]) => void)[] = [];
  private exportedClinicalNotes: {
    patientId: string;
    versionId: string;
    title: string;
    signedBy: string;
    timestamp: string;
    content: string;
    signatureToken: string;
  }[] = [];

  // External live API connection config
  public externalConfig: ExternalIntegrationConfig = {
    fhirBaseUrl: 'https://hapi.fhir.org/baseR4',
    pacsDicomWebUrl: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs',
    authBearerToken: '',
    clientCertHeader: '',
    smartOnFhirEnabled: false,
    activeMode: 'SYNTHETIC_OVERLAY',
    lastPingStatus: 'IDLE'
  };

  // Failure scenario toggle
  public simulateDestinationUnavailable = false;

  constructor() {
    this.logBus({
      source: 'HOSPITAL-INTEGRATION-GATEWAY',
      destination: 'ICARUS-ORCHESTRATION',
      protocol: 'FHIR-R4-REST',
      operation: 'READ',
      status: 'SUCCESS',
      summary: `Connected synthetic adapters for Epic EHR, Sysmex/Roche LIS, GE PACS & CoPath Pathology. Loaded 5 longitudinal synthetic patient cases.`
    });
  }

  // Live External Connector: Ping/Query remote FHIR R4 server metadata
  public async testLiveExternalEndpoint(urlToTest?: string): Promise<{ success: boolean; latencyMs: number; details: string }> {
    const targetUrl = urlToTest || this.externalConfig.fhirBaseUrl;
    let validatedUrl = '';

    try {
      const parsed = new URL(targetUrl.endsWith('/metadata') ? targetUrl : `${targetUrl.replace(/\/$/, '')}/metadata`);
      validatedUrl = parsed.toString();
    } catch {
      this.externalConfig.lastPingStatus = 'REFUSED';
      this.logBus({
        source: 'ICARUS-GATEWAY',
        destination: targetUrl,
        protocol: 'FHIR-R4-REST',
        operation: 'VERIFY',
        status: 'FAILED',
        summary: `Invalid URL format: "${targetUrl}". Expected format: https://fhir-server.hospital.org/baseR4`
      });
      return { success: false, latencyMs: 0, details: 'Malformed endpoint URL syntax.' };
    }

    const start = performance.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const headers: Record<string, string> = {
        'Accept': 'application/fhir+json, application/json'
      };
      if (this.externalConfig.authBearerToken.trim()) {
        headers['Authorization'] = `Bearer ${this.externalConfig.authBearerToken.trim()}`;
      }

      const res = await fetch(validatedUrl, {
        method: 'GET',
        headers,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const latencyMs = Math.round(performance.now() - start);

      if (res.ok) {
        const capabilityStatement = await res.json().catch(() => ({}));
        const fhirVersion = capabilityStatement.fhirVersion || 'R4';
        const software = capabilityStatement.software?.name || 'HL7 FHIR Server';

        this.externalConfig.lastPingStatus = 'CONNECTED';
        this.externalConfig.latencyMs = latencyMs;
        this.externalConfig.lastPingTimestamp = new Date().toISOString();

        this.logBus({
          source: 'ICARUS-GATEWAY',
          destination: validatedUrl,
          protocol: 'FHIR-R4-REST',
          operation: 'VERIFY',
          status: 'SUCCESS',
          summary: `HTTP ${res.status}: Connected to live ${software} (FHIR ${fhirVersion}) in ${latencyMs}ms.`
        });

        auditStore.recordEvent({
          eventType: 'EXTERNAL_ENDPOINT_TESTED',
          actor: 'ICARUS_INTEGRATION_GATEWAY',
          role: ClinicianRole.IT_AUDITOR,
          patientId: 'SYS_INTEGRATION',
          encounterId: 'LIVE_FHIR_PING',
          correlationId: `CORR-PING-${Date.now()}`,
          details: `Live FHIR test handshake successful: ${validatedUrl} (HTTP ${res.status}, ${latencyMs}ms).`
        });

        return {
          success: true,
          latencyMs,
          details: `Connected to ${software} (FHIR ${fhirVersion}) • HTTP ${res.status}`
        };
      } else {
        this.externalConfig.lastPingStatus = 'REFUSED';
        return {
          success: false,
          latencyMs,
          details: `Remote endpoint returned HTTP ${res.status} ${res.statusText}. Check authorization token or CORS restrictions.`
        };
      }
    } catch (err) {
      const latencyMs = Math.round(performance.now() - start);
      this.externalConfig.lastPingStatus = 'REFUSED';
      this.logBus({
        source: 'ICARUS-GATEWAY',
        destination: validatedUrl,
        protocol: 'FHIR-R4-REST',
        operation: 'VERIFY',
        status: 'FAILED',
        summary: `Network connection failed or CORS blocked: ${String(err)}`
      });

      return {
        success: false,
        latencyMs,
        details: 'Failed to reach remote server (Network timeout or CORS preflight blocked).'
      };
    }
  }

  public getPatients(): Patient[] {
    return this.patients;
  }

  public getPatientById(id: string): Patient | undefined {
    return this.patients.find((p) => p.id === id);
  }

  // READ Operation
  public readPatientData(patientId: string, actor: string, role: ClinicianRole) {
    const patient = this.patients.find((p) => p.id === patientId) ?? this.patients[0];
    const labs = this.labs.filter((l) => l.patientId === patientId);
    const rad = this.imaging.filter((r) => r.patientId === patientId);
    const path = this.pathology.filter((p) => p.patientId === patientId);
    const past = this.pastEncounters.filter((e) => e.patientId === patientId);

    this.logBus({
      source: 'SIMULATED-EHR / LIS / PACS',
      destination: 'ICARUS-ORCHESTRATION',
      protocol: 'FHIR-R4-REST',
      operation: 'READ',
      status: 'SUCCESS',
      summary: `Retrieved context for ${patient.name} (${patient.mrn}): ${labs.length} labs, ${rad.length} imaging, ${path.length} pathology, ${past.length} past encounters.`
    });

    auditStore.recordEvent({
      eventType: 'ENCOUNTER_ACTIVATED',
      actor,
      role,
      patientId,
      encounterId: `ENC-${patientId}`,
      correlationId: `CORR-READ-${Date.now()}`,
      details: `Authorized read of patient records across EHR, LIS, and PACS.`
    });

    return { patient, labs, imaging: rad, pathology: path, pastEncounters: past };
  }

  // Evidence Protocol Retrieval
  public searchDemonstrationProtocols(query: string): InstitutionalProtocol[] {
    const q = query.toLowerCase();
    const hits = this.protocols.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );

    this.logBus({
      source: 'INSTITUTIONAL-PROTOCOL-REPOSITORY',
      destination: 'ARIA-INTELLIGENCE',
      protocol: 'FHIR-R4-REST',
      operation: 'READ',
      status: 'SUCCESS',
      summary: `Retrieved ${hits.length} versioned protocol(s) matching query: "${query}".`
    });

    return hits.length > 0 ? hits : this.protocols;
  }

  // EXPORT Operation
  public exportSignedDocument(params: {
    patientId: string;
    documentVersionId: string;
    title: string;
    signerName: string;
    signerRole: ClinicianRole;
    documentText: string;
    signatureToken?: string;
    isFinalized?: boolean;
    destinationSystem?: 'EHR-CLINICAL-NOTES-FHIR' | 'PAS-DISCHARGE-FEED' | 'RIS-SBAR-OR' | string;
    attemptNumber?: number;
  }): { success: boolean; receipt?: ExportReceipt; error?: string } {
    const dest = params.destinationSystem ?? 'EHR-CLINICAL-NOTES-FHIR';
    const attempt = params.attemptNumber ?? 1;

    // Boundary Invariant: Non-attending cannot commit
    if (params.signerRole !== ClinicianRole.ATTENDING) {
      this.logBus({
        source: 'ICARUS-INTEGRATION-GATEWAY',
        destination: dest,
        protocol: 'FHIR-R4-REST',
        operation: 'EXPORT',
        status: 'FAILED',
        summary: `Export gate blocked: Signer role ${params.signerRole} lacks Attending Physician signature authority.`
      });

      return {
        success: false,
        error: `Export Gate Invariant Violated: Non-attending role (${params.signerRole}) cannot commit records to authoritative EHR.`
      };
    }

    if (this.simulateDestinationUnavailable) {
      this.logBus({
        source: 'ICARUS-INTEGRATION-GATEWAY',
        destination: dest,
        protocol: 'FHIR-R4-REST',
        operation: 'EXPORT',
        status: 'FAILED',
        summary: `HTTP 503 Service Unavailable: Target endpoint ${dest} unreachable. Artifact preserved in export queue.`
      });

      auditStore.recordEvent({
        eventType: 'EXPORT_FAILED',
        actor: params.signerName,
        role: params.signerRole,
        patientId: params.patientId,
        encounterId: `ENC-${params.patientId}`,
        correlationId: `CORR-EXP-FAIL-${Date.now()}`,
        details: `Export failed for Version ${params.documentVersionId}. Host EHR endpoint returned HTTP 503.`
      });

      return {
        success: false,
        error: 'Simulated EHR endpoint returned 503 Service Unavailable. Document preserved in local queue.'
      };
    }

    const token = params.signatureToken || `SHA256-SIM-${params.documentVersionId}-${Date.now()}`;

    const existingNote = this.exportedClinicalNotes.find(
      (n) => n.patientId === params.patientId && n.versionId === params.documentVersionId
    );

    const receipt: ExportReceipt = {
      receiptId: `RCPT-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`,
      timestamp: new Date().toISOString(),
      destinationSystem: dest,
      documentVersionId: params.documentVersionId,
      status: 'DELIVERED',
      fhirResourceId: `DocumentReference/EHR-${Math.floor(Math.random() * 800000 + 100000)}`,
      httpStatusCode: 201,
      acknowledgementPayload: JSON.stringify({
        resourceType: 'OperationOutcome',
        issue: [
          {
            severity: 'information',
            code: 'informational',
            diagnostics: `Authoritative hospital EHR successfully indexed clinical note version ${params.documentVersionId} with digital signature commitment ${token}.`
          }
        ]
      }),
      attemptNumber: attempt
    };

    this.receipts.push(receipt);

    if (!existingNote) {
      this.exportedClinicalNotes.push({
        patientId: params.patientId,
        versionId: params.documentVersionId,
        title: params.title,
        signedBy: `${params.signerName} (${params.signerRole})`,
        timestamp: receipt.timestamp,
        content: params.documentText,
        signatureToken: token
      });
    }

    this.logBus({
      source: 'ICARUS-GATEWAY',
      destination: dest,
      protocol: 'FHIR-R4-REST',
      operation: 'EXPORT',
      status: 'SUCCESS',
      summary: `Document version ${params.documentVersionId} delivered to ${dest}. Receipt ${receipt.receiptId} generated (HTTP 201 Created).`
    });

    auditStore.recordEvent({
      eventType: attempt > 1 ? 'EXPORT_RETRY_SUCCESS' : 'EXPORT_DISPATCHED',
      actor: params.signerName,
      role: params.signerRole,
      patientId: params.patientId,
      encounterId: `ENC-${params.patientId}`,
      correlationId: `CORR-EXP-${receipt.receiptId}`,
      details: `Exported signed document to ${dest}. FHIR ID: ${receipt.fhirResourceId} (Attempt #${attempt}).`
    });

    return { success: true, receipt };
  }

  public getExportedNotes(patientId: string) {
    return this.exportedClinicalNotes.filter((n) => n.patientId === patientId);
  }

  public getReceipts(patientId?: string): ExportReceipt[] {
    return this.receipts;
  }

  public getDataBusLogs(): DataBusMovement[] {
    return this.dataBusLogs;
  }

  public subscribeDataBus(fn: (logs: DataBusMovement[]) => void) {
    this.subscribers.push(fn);
    fn([...this.dataBusLogs]);
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== fn);
    };
  }

  private logBus(entry: Omit<DataBusMovement, 'id' | 'timestamp'>) {
    const item: DataBusMovement = {
      id: `BUS-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString(),
      ...entry
    };
    this.dataBusLogs = [item, ...this.dataBusLogs.slice(0, 49)];
    this.subscribers.forEach((fn) => fn([...this.dataBusLogs]));
  }
}

export const hospitalGateway = new HospitalIntegrationGateway();
