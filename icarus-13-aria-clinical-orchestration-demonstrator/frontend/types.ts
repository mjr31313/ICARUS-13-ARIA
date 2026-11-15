export enum ClinicianRole {
  ATTENDING = 'ATTENDING_PHYSICIAN',
  RESIDENT = 'RESIDENT_PHYSICIAN',
  NURSE = 'CLINICAL_NURSE',
  COORDINATOR = 'CARE_COORDINATOR',
  SAFETY_OFFICER = 'CLINICAL_SAFETY_OFFICER',
  IT_AUDITOR = 'IT_SECURITY_AUDITOR'
}

export interface UserProfile {
  id: string;
  name: string;
  role: ClinicianRole;
  department: string;
  canSign: boolean;
  canExport: boolean;
  canAccessTrauma: boolean;
}

export enum EncounterLifecycleState {
  INACTIVE = 'INACTIVE',
  ACTIVE_CAPTURE = 'ACTIVE_CAPTURE',
  PAUSED = 'PAUSED',
  DRAFT = 'DRAFT',
  CLARIFICATION_REQUIRED = 'CLARIFICATION_REQUIRED',
  READY_FOR_REVIEW = 'READY_FOR_REVIEW',
  REVIEWED = 'REVIEWED',
  SIGNED = 'SIGNED',
  EXPORT_QUEUED = 'EXPORT_QUEUED',
  DELIVERED = 'DELIVERED',
  EXPORT_FAILED = 'EXPORT_FAILED',
  CANCELLED = 'CANCELLED'
}

export enum FindingClassification {
  EXTRACTED = 'EXTRACTED',
  NORMALIZED = 'NORMALIZED',
  INFERRED = 'INFERRED',
  FLAGGED = 'FLAGGED',
  UNRESOLVED = 'UNRESOLVED'
}

export enum Severity {
  GREEN = 'GREEN',
  AMBER = 'AMBER',
  RED = 'RED'
}

export interface Patient {
  id: string;
  mrn: string;
  name: string;
  age: number;
  gender: 'M' | 'F' | 'Other';
  dob: string;
  room: string;
  admissionDate: string;
  chiefComplaint: string;
  primaryDiagnosis: string;
  allergies: string[];
  department: string;
  clinicalSummary?: string;
}

export interface LabResult {
  id: string;
  patientId: string;
  testName: string;
  code: string;
  value: number;
  unit: string;
  referenceRange: string;
  timestamp: string;
  previousValue?: number;
  previousTimestamp?: string;
  status: 'normal' | 'abnormal' | 'critical';
  systemSource: 'LIS-SYSMEX-01' | 'LIS-ROCHE-02' | string;
}

export interface ImagingReport {
  id: string;
  patientId: string;
  modality: 'XR' | 'CT' | 'MRI' | 'ECHO' | 'US';
  studyDescription: string;
  findings: string;
  impression: string;
  performedDate: string;
  radiologist: string;
  pacsAccession: string;
  systemSource: 'PACS-GE-CENTRICITY' | 'RIS-AGFA-CORE' | string;
}

export interface PathologyReport {
  id: string;
  patientId: string;
  specimenType: string;
  histologicDiagnosis: string;
  pathologicStage: string;
  lymphNodeRatio: string;
  margins: string;
  synopticFindings: string;
  pathologist: string;
  signedDate: string;
  systemSource: string;
}

export interface PastEncounterRecord {
  id: string;
  patientId: string;
  date: string;
  type: string;
  summary: string;
  operativeReport?: string;
  dischargingPhysician: string;
  systemSource: 'EHR-EPIC-SYNTH' | 'PAS-CERNER-ARCHIVE' | string;
}

export interface ContributingRiskFactor {
  parameter: string;
  clinicalValue: string;
  pointsContribution: string;
  sourceSystem: string;
  sourceRecordId: string;
  timestamp: string;
  rationale: string;
}

export interface ClinicalRiskScore {
  id: 'SURGICAL_BLEEDING' | 'PERIOP_CARDIAC' | 'RENAL_TOXICITY';
  title: string;
  category: string;
  validatedScoringSystem: string;
  compositeLevel: 'LOW' | 'INTERMEDIATE' | 'HIGH' | 'CRITICAL';
  numericIndex: string;
  clinicalImplication: string;
  evidenceProtocolRef: string;
  contributingFactors: ContributingRiskFactor[];
}

export interface SbarTraumaHandoverRecord {
  id: string;
  patientId: string;
  timestamp: string;
  situation: string;
  background: string;
  assessment: {
    hemodynamics: string;
    extremityPerfusion: string;
    bloodGasSummary: string;
    mtpStatus: string;
  };
  recommendation: string;
  authorizedBy: string;
  authorizedAt?: string;
  status: 'DRAFT' | 'AUTHORIZED' | 'DISPATCHED_TO_OR' | 'ACKNOWLEDGED';
  receivingTeam?: {
    consultant: string;
    room: string;
    acknowledgedAt: string;
    receiptId: string;
    orReadinessNote: string;
  };
}

export interface InstitutionalProtocol {
  id: string;
  code: string;
  title: string;
  version: string;
  effectiveDate: string;
  category: 'Surgical Safety' | 'Anticoagulation' | 'Trauma Resuscitation' | 'Discharge Protocol' | 'Heart Failure' | 'Oncology MDT';
  summary: string;
  mandatoryCheckpoints: string[];
  passages: { section: string; text: string }[];
  isDemoCorpus: boolean;
}

export interface AcousticPhrase {
  id: string;
  phrase: string;
  confidence: number;
  isAcousticallyAmbiguous: boolean;
  clarifiedPhrase?: string;
  clarificationFlagged?: boolean;
}

export interface TranscriptSegment {
  id: string;
  timestamp: string;
  speaker: 'Physician' | 'Nurse' | 'Patient' | 'Paramedic' | 'Resident' | 'Fellow';
  text: string;
  isAmbiguous?: boolean;
  overallConfidence?: number;
  acousticPhrases?: AcousticPhrase[];
}

export interface ClinicalFinding {
  id: string;
  category: 'VITALS' | 'ANATOMY' | 'SURGERY' | 'MEDICATION' | 'RISK' | 'PLAN';
  text: string;
  classification: FindingClassification;
  sourceSegmentId?: string;
  confidence: number;
  humanConfirmed: boolean;
}

export interface UncertaintyFlag {
  id: string;
  originatingInfo: string;
  discrepancy: string;
  requiredAction: string;
  severity: Severity;
  isMandatoryCheckpoint: boolean;
  resolved: boolean;
  resolvedBy?: string;
  resolvedTimestamp?: string;
  resolutionNote?: string;
}

export interface DocumentVersion {
  versionId: string;
  versionNumber: number;
  createdAt: string;
  createdByRole: ClinicianRole;
  authorName: string;
  title: string;
  content: {
    chiefComplaint: string;
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
    criticalFindings: string[];
    pendingOrders: string[];
  };
  provenanceSourceIds: string[];
  predecessorVersionId?: string;
  isFinalized: boolean;
}

export interface SimulatedSignature {
  signerId: string;
  signerName: string;
  signerRole: ClinicianRole;
  timestamp: string;
  documentVersionId: string;
  patientId: string;
  encounterId: string;
  cryptographicToken: string;
}

export interface ExportReceipt {
  receiptId: string;
  timestamp: string;
  destinationSystem: 'EHR-CLINICAL-NOTES-FHIR' | 'PAS-DISCHARGE-FEED' | 'RIS-SBAR-OR' | string;
  documentVersionId: string;
  status: 'DELIVERED' | 'FAILED' | 'RETRY_QUEUED';
  fhirResourceId: string;
  httpStatusCode: number;
  acknowledgementPayload: string;
  attemptNumber: number;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  eventType:
    | 'ENCOUNTER_ACTIVATED'
    | 'TRANSCRIPT_SEGMENT_CAPTURED'
    | 'DRAFT_SYNTHESIZED'
    | 'CLARIFICATION_RAISED'
    | 'CLARIFICATION_RESOLVED'
    | 'DOCUMENT_CORRECTED_V2'
    | 'SIGNATURE_ATTEMPT_DENIED'
    | 'SIGNATURE_COMMITTED'
    | 'EXPORT_DISPATCHED'
    | 'EXPORT_FAILED'
    | 'EXPORT_RETRY_SUCCESS'
    | 'PATIENT_CONTEXT_SWITCHED'
    | 'PATIENT_MISMATCH_REJECTED'
    | 'EXTERNAL_ENDPOINT_TESTED'
    | 'EXTERNAL_EXPORT_COMMITTED'
    | 'TASK_PROPOSED'
    | 'TASK_AUTHORIZED'
    | 'TASK_DISPATCHED'
    | 'TASK_ACKNOWLEDGED'
    | 'TASK_COMPLETED'
    | 'CONTRADICTION_DETECTED'
    | 'CONTRADICTION_RESOLVED'
    | 'MTP_PROTOCOL_ACTIVATED'
    | 'TRAUMA_SBAR_DISPATCHED'
    | 'SURGICAL_OR_ACKNOWLEDGED'
    | 'VOICE_CALL_STARTED'
    | 'VOICE_CALL_ENDED';
  actor: string;
  role: ClinicianRole;
  patientId: string;
  encounterId: string;
  causationId?: string;
  correlationId: string;
  details: string;
  payloadSnapshot?: Record<string, unknown>;
}

export interface WorkflowTask {
  id: string;
  title: string;
  assigneeRole: string;
  targetDepartment: string;
  status: 'PROPOSED' | 'AUTHORIZED' | 'SENT' | 'ACKNOWLEDGED' | 'COMPLETED';
  priority: 'ROUTINE' | 'URGENT' | 'STAT';
  createdAt: string;
  authorizedBy?: string;
  authorizedAt?: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  completedAt?: string;
  receiptNote?: string;
}

export interface CrossSystemContradiction {
  id: string;
  patientId: string;
  category: 'MEDICATION' | 'CONSENT' | 'LABORATORY' | 'SURGICAL_HISTORY' | 'IMAGING_INDETERMINATE';
  summary: string;
  sourceA: {
    system: string;
    documentTitle: string;
    timestamp: string;
    statement: string;
  };
  sourceB: {
    system: string;
    documentTitle: string;
    timestamp: string;
    statement: string;
  };
  discrepancyDetail: string;
  verificationRequired: string;
  status: 'UNRESOLVED' | 'RESOLVED_BY_CLINICIAN';
  resolvedNote?: string;
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface TemporalComparisonItem {
  id: string;
  parameter: string;
  priorStatus: string;
  currentStatus: string;
  clinicalImpact: string;
  category: 'HEMODYNAMICS' | 'LABORATORY' | 'IMAGING' | 'MEDICATION' | 'SAFETY_GAP';
  sourceTitle: string;
  sourceSystem: string;
  sourceDate: string;
  sourceRecordId: string;
  isDiscrepancy?: boolean;
}

export interface OrchestrationProposal {
  id: string;
  summary: string;
  identifiedPatient: string;
  retrievedContext: {
    ehrNotesCount: number;
    labResultsCount: number;
    imagingCount: number;
    protocolsChecked: string[];
  };
  discrepancies: CrossSystemContradiction[];
  proposedDocumentation: {
    title: string;
    summary: string;
  };
  proposedTasks: WorkflowTask[];
  status: 'PENDING_PHYSICIAN_AUTHORIZATION' | 'AUTHORIZED_AND_DISPATCHED';
}

export interface ExternalIntegrationConfig {
  fhirBaseUrl: string;
  pacsDicomWebUrl: string;
  authBearerToken: string;
  clientCertHeader: string;
  smartOnFhirEnabled: boolean;
  activeMode: 'SYNTHETIC_OVERLAY' | 'LIVE_REMOTE_HYBRID';
  lastPingStatus?: 'CONNECTED' | 'REFUSED' | 'IDLE';
  lastPingTimestamp?: string;
  latencyMs?: number;
}
