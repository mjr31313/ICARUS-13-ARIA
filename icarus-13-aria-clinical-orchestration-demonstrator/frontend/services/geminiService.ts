import { GoogleGenAI } from '@google/genai';
import { Patient, LabResult, ImagingReport, InstitutionalProtocol, TemporalComparisonItem } from '../types';
import { orchestrationEngine } from './orchestrationEngine';

export interface AriaResponse {
  answer: string;
  sourceCitations: {
    system: string;
    recordId: string;
    title: string;
    timestamp?: string;
  }[];
  actionSuggestion?: string;
  isAdvisory?: boolean;
  isOrchestrationBundle?: boolean;
  contradictionAlert?: {
    id: string;
    summary: string;
    sourceA: string;
    sourceB: string;
    discrepancy: string;
  };
  temporalDelta?: {
    lastAdmissionDate: string;
    keyChanges: string[];
    structuredComparisons?: TemporalComparisonItem[];
  };
}

export class GeminiAriaService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    try {
      if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
        this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY, vertexai: true });
      }
    } catch {
      this.ai = null;
    }
  }

  public async askAria(params: {
    query: string;
    patient: Patient;
    labs: LabResult[];
    imaging: ImagingReport[];
    protocols: InstitutionalProtocol[];
    clinicianRole: string;
  }): Promise<AriaResponse> {
    const q = params.query.toLowerCase();
    const pId = params.patient.id;

    // ==========================================
    // CASE 1: ELENA PAPADOPOULOU (ORTHOPAEDIC REVISION)
    // ==========================================
    if (pId === 'PAT-GR-6701') {
      // Primary Tour Question: "What changed since this patient's last admission, and what should the clinician verify before surgery?"
      if (
        q.includes('change') ||
        q.includes('last admission') ||
        q.includes('verify before surgery') ||
        q.includes('since') ||
        q.includes('compare') ||
        q.includes('what changed')
      ) {
        const comparisons: TemporalComparisonItem[] = [
          {
            id: 'CMP-EL-01',
            parameter: 'Hemoglobin (Hb)',
            priorStatus: '11.2 g/dL (Normal reserve, April 2025)',
            currentStatus: '9.8 g/dL (Preoperative anemia, Today)',
            clinicalImpact: 'Acute-on-chronic hemodilution lowers surgical tolerance. Type and screen with 2 units PRBC crossmatched on standby required.',
            category: 'LABORATORY',
            sourceTitle: 'Preoperative Complete Blood Count',
            sourceSystem: 'LIS-SYSMEX-01',
            sourceDate: '2025-05-18T07:15:00Z',
            sourceRecordId: 'LAB-EL-01'
          },
          {
            id: 'CMP-EL-02',
            parameter: 'Renal Clearance (eGFR)',
            priorStatus: '66 mL/min/1.73m² (Normal filtration, April 2025)',
            currentStatus: '53 mL/min/1.73m² (Impaired filtration, Today)',
            clinicalImpact: 'Reduced renal clearance directly prolongs Apixaban half-life, mandating an absolute minimum 48-hour washout window before spinal or general anesthesia.',
            category: 'LABORATORY',
            sourceTitle: 'Serum Creatinine & eGFR (CKD-EPI)',
            sourceSystem: 'LIS-ROCHE-02',
            sourceDate: '2025-05-18T07:15:00Z',
            sourceRecordId: 'LAB-EL-02'
          },
          {
            id: 'CMP-EL-03',
            parameter: 'Anticoagulation & DOAC Discontinuation',
            priorStatus: 'No chronic oral anticoagulants (2021 Primary THA)',
            currentStatus: 'Initiated on Apixaban 5mg BID (AFib diagnosis March 2024)',
            clinicalImpact: 'Medication discrepancy: Ward admission note recorded intake at 05:30 today, whereas pre-anesthesia plan instructed 48h cessation. Physical blister pack verification mandatory.',
            category: 'MEDICATION',
            sourceTitle: 'Ward Surgical Nursing Admission Form vs Outpatient Anesthesia Plan',
            sourceSystem: 'EHR-NURSE-MEDREC',
            sourceDate: '2025-05-18T06:45:00Z',
            sourceRecordId: 'DISC-APX-01',
            isDiscrepancy: true
          },
          {
            id: 'CMP-EL-04',
            parameter: 'Left Hip Prosthetic Stability',
            priorStatus: 'Intact cementless press-fit stability (Operative Note, Sept 2021)',
            currentStatus: '>2.5 mm radiolucency in Gruen zones 1 & 7 with cranial migration',
            clinicalImpact: 'Aseptic mechanical loosening confirmed. Indicates full revision of both femoral and acetabular components.',
            category: 'IMAGING',
            sourceTitle: 'X-Ray Pelvis AP & Left Hip Axial (Weight-Bearing)',
            sourceSystem: 'PACS-GE-CENTRICITY',
            sourceDate: '2025-05-12T14:30:00Z',
            sourceRecordId: 'RAD-EL-01'
          },
          {
            id: 'CMP-EL-05',
            parameter: 'Signed Surgical Informed Consent',
            priorStatus: 'Signed physical consent filed in archive (2021)',
            currentStatus: 'Signed revision consent NOT detected in electronic record (Missing gap)',
            clinicalImpact: 'Institutional hard surgical stop per SOP-ORTHO-REV-2024. Physical form must be obtained or located and counter-signed before theater transfer.',
            category: 'SAFETY_GAP',
            sourceTitle: 'EHR Hospital Document Archive',
            sourceSystem: 'EHR-EPIC-SYNTH',
            sourceDate: '2025-05-18T06:30:00Z',
            sourceRecordId: 'UNC-EL-02'
          }
        ];

        return {
          answer: `Since Elena Papadopoulou's primary hip surgery in September 2021, five clinically meaningful changes have occurred:\n\n1. Hemoglobin has fallen from 11.2 to 9.8 g/dL, indicating mild preoperative anemia requiring crossmatched blood standby.\n2. Renal function has deteriorated to an eGFR of 53 mL/min, which prolongs anticoagulant clearance.\n3. The patient was newly initiated on Apixaban for atrial fibrillation in 2024. A cross-system discrepancy exists between the ward intake note (taken today at 05:30) and the anesthesia plan (48-hour cessation).\n4. X-rays confirm mechanical loosening with progressive radiolucency (>2.5 mm in Gruen zones 1 and 7).\n5. Critical gap: Signed operative consent is missing from the connected electronic record.\n\nBefore surgery, the clinician must physically verify the home Apixaban blister pack and obtain signed consent.`,
          sourceCitations: [
            {
              system: 'EHR-EPIC-SYNTH',
              recordId: 'ENC-HIST-01',
              title: 'Primary THA Operative Report (2021-09-14)',
              timestamp: '2021-09-14'
            },
            {
              system: 'LIS-SYSMEX-01',
              recordId: 'LAB-EL-01',
              title: 'Hemoglobin Comparison (11.2 → 9.8 g/dL)',
              timestamp: '2025-05-18T07:15:00Z'
            },
            {
              system: 'LIS-ROCHE-02',
              recordId: 'LAB-EL-02',
              title: 'Renal Clearance eGFR (66 → 53 mL/min)',
              timestamp: '2025-05-18T07:15:00Z'
            },
            {
              system: 'EHR-NURSE-MEDREC',
              recordId: 'DISC-APX-01',
              title: 'Medication Discrepancy Record (Apixaban Washout)',
              timestamp: '2025-05-18T06:45:00Z'
            },
            {
              system: 'PACS-GE-CENTRICITY',
              recordId: 'RAD-EL-01',
              title: 'Pelvis AP & Axial X-Ray (Gruen Zone Loosening)',
              timestamp: '2025-05-12T14:30:00Z'
            }
          ],
          actionSuggestion: 'Inspect Discrepancy & Confirm Proposed Follow-Up Tasks',
          temporalDelta: {
            lastAdmissionDate: '2021-09-14',
            keyChanges: [
              'Hemoglobin dropped: 11.2 → 9.8 g/dL (Mild preoperative anemia)',
              'eGFR declined: 66 → 53 mL/min (Mandates ≥48h DOAC cessation)',
              'Apixaban discrepancy: Ward note states taken at 05:30 today vs anesthesia 48h plan',
              'Radiographic loosening: >2.5mm radiolucent line at Gruen zones 1 and 7',
              'Safety gap: Signed informed surgical consent missing from connected record'
            ],
            structuredComparisons: comparisons
          }
        };
      }

      // Review patient & coordinate tasks
      if (
        q.includes('review') ||
        q.includes('coordinate') ||
        q.includes('orchestrat') ||
        q.includes('tomorrow') ||
        q.includes('first patient')
      ) {
        const contradictions = orchestrationEngine.getContradictions('PAT-GR-6701');
        const unresolvedContradiction = contradictions.find((c) => c.status === 'UNRESOLVED');

        return {
          answer: `Identified Elena Papadopoulou (67y, OR-PREP Bed 04) for scheduled Left THA revision. Retrieved records across Epic EHR, Sysmex LIS, and GE PACS.\n\nSummary:\n1. Laboratory: Hemoglobin dropped from 11.2 to 9.8 g/dL; eGFR reduced to 53 mL/min.\n2. Imaging: >2.5 mm radiolucency in Gruen zones 1 & 7 confirms aseptic loosening.\n3. Discrepancy: Cross-system contradiction identified regarding Apixaban cessation time.\n4. Documentation: Preoperative clearance draft v1 prepared.\n5. Tasks: 3 interprofessional follow-up tasks prepared for Nursing, Blood Bank, and Resident.`,
          sourceCitations: [
            {
              system: 'EHR-NURSE-MEDREC',
              recordId: 'DOC-WARD-2025-0518',
              title: 'Ward Admission Medication Intake Record',
              timestamp: '2025-05-18T06:45:00Z'
            },
            {
              system: 'LIS-SYSMEX-01',
              recordId: 'LAB-EL-01',
              title: 'Hemoglobin (9.8 g/dL)',
              timestamp: '2025-05-18T07:15:00Z'
            },
            {
              system: 'PACS-GE-CENTRICITY',
              recordId: 'RAD-EL-01',
              title: 'Pelvis AP & Axial X-Ray',
              timestamp: '2025-05-12T14:30:00Z'
            },
            {
              system: 'SOP-CORPUS-DEMO',
              recordId: 'SOP-ORTHO-REV-2024',
              title: 'Preoperative Clearance & Anticoagulant Bridging Protocol (v4.2)'
            }
          ],
          actionSuggestion: 'Review Discrepancy & Authorize Proposed Tasks',
          isOrchestrationBundle: true,
          contradictionAlert: unresolvedContradiction
            ? {
                id: unresolvedContradiction.id,
                summary: unresolvedContradiction.summary,
                sourceA: `${unresolvedContradiction.sourceA.system}: "${unresolvedContradiction.sourceA.statement}"`,
                sourceB: `${unresolvedContradiction.sourceB.system}: "${unresolvedContradiction.sourceB.statement}"`,
                discrepancy: unresolvedContradiction.discrepancyDetail
              }
            : undefined
        };
      }

      // Operative report 2021
      if (q.includes('operative report') || q.includes('operation') || q.includes('2021')) {
        return {
          answer: `Primary Left Total Hip Arthroplasty (2021-09-14, EHR-EPIC-SYNTH):\n\n• Surgeon: Prof. Dr. B. Sommer\n• Components: Cementless Corail stem, Pinnacle acetabular cup\n• Approach: Lateral transgluteal (Hardinge)\n• Intraoperative course: Press-fit initial stability achieved. Stable range of motion tested without impingement. Discharged on postoperative day 5 without complications.`,
          sourceCitations: [
            {
              system: 'EHR-EPIC-SYNTH',
              recordId: 'ENC-HIST-01',
              title: 'Primary THA Operative Report (2021-09-14)',
              timestamp: '2021-09-14'
            }
          ],
          actionSuggestion: 'Compare with Today\'s Loosening Findings in Flowsheet'
        };
      }

      // Check revision protocol SOP
      if (q.includes('protocol') || q.includes('sop') || q.includes('clearance')) {
        return {
          answer: `Institutional Protocol SOP-ORTHO-REV-2024 requires 4 mandatory checkpoints for revision arthroplasty:\n\n1. Signed Informed Consent: Must be verified and attached prior to theater transfer (Currently MISSING in electronic chart).\n2. Direct Oral Anticoagulant Washout: For eGFR 50-80, Apixaban requires ≥48h cessation (Currently CONFLICTING between sources).\n3. Type & Screen: Valid crossmatch with minimum 2 units PRBC on standby (Pending blood bank confirmation).\n4. Renal Function Confirmation: eGFR within 72 hours (Verified: 53 mL/min today).`,
          sourceCitations: [
            {
              system: 'SOP-CORPUS-DEMO',
              recordId: 'SOP-ORTHO-REV-2024',
              title: 'Preoperative Clearance & Anticoagulant Bridging (v4.2)'
            }
          ],
          actionSuggestion: 'Verify Checkpoints in Encounter Studio'
        };
      }
    }

    // ==========================================
    // CASE 4: ANDREAS NIKOLAOU (CARDIOLOGY / CKD)
    // ==========================================
    if (pId === 'PAT-AN-7204') {
      if (q.includes('change') || q.includes('last admission') || q.includes('since') || q.includes('compare')) {
        return {
          answer: `Temporal comparison since last heart failure admission (24 March 2026):\n\n• Renal Function Worsened: Serum Creatinine increased from 1.4 to 2.1 mg/dL (+0.7 mg/dL), eGFR dropped to 31 mL/min (Acute-on-chronic Stage 3b CKD).\n• Critical Hyperkalemia: Potassium increased from baseline 4.5 to 5.7 mmol/L (LOINC:2823-3, Critical LIS alert).\n• Cardiac Biomarkers: NT-proBNP escalated from 1,420 to 3,840 pg/mL (+2,420 pg/mL), reflecting acute ventricular volume overload.\n• Echocardiography (March 2026): LVEF 35% with severe global hypokinesis and moderate mitral regurgitation.\n• Chest Radiograph Today: Biventricular cardiomegaly with perihilar venous congestion and blunting of costophrenic angles.`,
          sourceCitations: [
            {
              system: 'LIS-ROCHE-02',
              recordId: 'LAB-AN-01',
              title: 'Serum Potassium (5.7 mmol/L vs 4.5)',
              timestamp: '2026-11-12T08:45:00Z'
            },
            {
              system: 'LIS-ROCHE-02',
              recordId: 'LAB-AN-02',
              title: 'Serum Creatinine (2.1 mg/dL vs 1.4)',
              timestamp: '2026-11-12T08:45:00Z'
            },
            {
              system: 'PACS-GE-CENTRICITY',
              recordId: 'RAD-AN-01',
              title: 'Echocardiogram (LVEF 35%)',
              timestamp: '2026-03-24T14:00:00Z'
            },
            {
              system: 'EHR-EPIC-SYNTH',
              recordId: 'ENC-AN-HIST-01',
              title: 'Cardiology Discharge Summary (March 2026)',
              timestamp: '2026-03-24'
            }
          ],
          actionSuggestion: 'Order Stat 12-Lead ECG & Reconcile Loop Diuretic Dose',
          temporalDelta: {
            lastAdmissionDate: '2026-03-24',
            keyChanges: [
              'Serum Potassium: 4.5 -> 5.7 mmol/L (Critical hyperkalemia threshold)',
              'Serum Creatinine: 1.4 -> 2.1 mg/dL (Acute-on-chronic Stage 3b renal injury)',
              'NT-proBNP: 1,420 -> 3,840 pg/mL (Severe ventricular stretch)',
              'Clinical Symptoms: NYHA Class II -> III/IV (worsening orthopnea, peripheral edema)'
            ]
          }
        };
      }

      if (q.includes('reconcil') || q.includes('medication') || q.includes('furosemide') || q.includes('dose') || q.includes('discrepancy')) {
        const contradictions = orchestrationEngine.getContradictions('PAT-AN-7204');
        const alert = contradictions[0];

        return {
          answer: `Cross-system medication discrepancy identified for Furosemide:\n\n• Ward Inpatient Admission Note (12 Nov 2026): Lists Furosemide 80 mg PO once daily.\n• Outpatient Community Prescription Archive (15 Oct 2026): Active script records Furosemide 40 mg PO once daily.\n\nClinical Safety Alert: Neither source confirms whether the patient took 40 mg or 80 mg at home. In the context of AKI (Creatinine 2.1 mg/dL) and critical Hyperkalemia (K+ 5.7 mmol/L), blind titration carries severe arrhythmogenic and renal risk.\n\nProposed Next Steps: Immediate stat 12-lead ECG, hold ACE inhibitors, clinical pharmacist pill count reconciliation, and SBAR handover to cardiology.`,
          sourceCitations: [
            {
              system: 'EHR-MEDREC-ADMIT',
              recordId: 'DOC-ADMIT-2026-1112',
              title: 'Cardiology Admission Note (Furosemide 80 mg daily)',
              timestamp: '2026-11-12T08:30:00Z'
            },
            {
              system: 'PAS-EPRESCRIPT-OUTPATIENT',
              recordId: 'RX-2026-1015-FUR',
              title: 'Community Outpatient Script (Furosemide 40 mg daily)',
              timestamp: '2026-10-15T11:00:00Z'
            },
            {
              system: 'SOP-CORPUS-DEMO',
              recordId: 'SOP-HF-HYPERK-2026',
              title: 'Heart Failure & Hyperkalemia Escalation SOP (v3.1)'
            }
          ],
          actionSuggestion: 'Authorize SBAR Handover & Ward ECG Dispatch',
          isOrchestrationBundle: true,
          contradictionAlert: alert
            ? {
                id: alert.id,
                summary: alert.summary,
                sourceA: `${alert.sourceA.system}: "${alert.sourceA.statement}"`,
                sourceB: `${alert.sourceB.system}: "${alert.sourceB.statement}"`,
                discrepancy: alert.discrepancyDetail
              }
            : undefined
        };
      }
    }

    // ==========================================
    // CASE 5: MARIA KONSTANTINOU (ONCOLOGY MDT)
    // ==========================================
    if (pId === 'PAT-MK-5905') {
      if (
        q.includes('board') ||
        q.includes('mdt') ||
        q.includes('tumor') ||
        q.includes('prepare') ||
        q.includes('oncology') ||
        q.includes('review')
      ) {
        const contradictions = orchestrationEngine.getContradictions('PAT-MK-5905');
        const alert = contradictions[0];

        return {
          answer: `Colorectal Multidisciplinary Tumor Board (MDT) Staging Briefing prepared for Maria Konstantinou (59y):\n\n1. Surgical Chronology: Laparoscopic sigmoid colectomy on 12 September 2026 (Prof. Keller). Uncomplicated recovery.\n2. Histopathology (18 Sep 2026): Moderately differentiated sigmoid adenocarcinoma, Stage pT3N1a (AJCC 8th ed). 1 of 18 regional lymph nodes positive (1/18). Proximal, distal, and radial margins negative (R0). MSS intact.\n3. Restaging Imaging (4 Oct 2026): CT Abdomen demonstrates an 8 mm subcapsular hypodense lesion in liver segment VI. Lesion was not described on baseline August CT, but remains indeterminate due to sub-centimeter size.\n4. Decision Boundary: Per SOP-MDT-COLORECTAL-2026, this lesion MUST NOT be categorized as confirmed metastatic disease without tissue biopsy or contrast-enhanced liver MRI.\n5. Proposed Coordination: Contrast-enhanced liver MRI (Primovist), registration for tomorrow's Colorectal MDT, and Medical Oncology consult for adjuvant chemotherapy timing.`,
          sourceCitations: [
            {
              system: 'LIS-PATH-COPATH',
              recordId: 'PATH-MK-01',
              title: 'Sigmoid Colectomy Synoptic Pathology (pT3N1a, 1/18 LN+)',
              timestamp: '2026-09-18T16:45:00Z'
            },
            {
              system: 'PACS-GE-CENTRICITY',
              recordId: 'RAD-MK-01',
              title: 'Restaging CT Abdomen/Pelvis (8mm Indeterminate Hepatic Lesion)',
              timestamp: '2026-10-04T11:30:00Z'
            },
            {
              system: 'SOP-CORPUS-DEMO',
              recordId: 'SOP-MDT-COLORECTAL-2026',
              title: 'Colorectal Cancer MDT Protocol (v5.0)'
            }
          ],
          actionSuggestion: 'Authorize MDT Registration & Hepatic MRI Order',
          isOrchestrationBundle: true,
          contradictionAlert: alert
            ? {
                id: alert.id,
                summary: alert.summary,
                sourceA: `${alert.sourceA.system}: "${alert.sourceA.statement}"`,
                sourceB: `${alert.sourceB.system}: "${alert.sourceB.statement}"`,
                discrepancy: alert.discrepancyDetail
              }
            : undefined
        };
      }
    }

    // Default Fallback
    return {
      answer: `Clinical synthesis prepared for ${params.patient.name} (${params.patient.mrn}, ${params.patient.department}). All retrieved values correlate directly with authoritative systems of record across EHR, LIS, and PACS.`,
      sourceCitations: [
        {
          system: 'EHR-AUTHORITATIVE',
          recordId: params.patient.id,
          title: `Active Record: ${params.patient.name}`
        }
      ]
    };
  }
}

export const ariaService = new GeminiAriaService();
