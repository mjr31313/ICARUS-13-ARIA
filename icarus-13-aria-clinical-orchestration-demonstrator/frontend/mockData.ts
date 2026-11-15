import {
  Patient,
  LabResult,
  ImagingReport,
  PathologyReport,
  PastEncounterRecord,
  InstitutionalProtocol,
  TranscriptSegment,
  UncertaintyFlag,
  Severity,
  UserProfile,
  ClinicianRole,
  CrossSystemContradiction,
  WorkflowTask
} from './types';

export const USERS: UserProfile[] = [
  {
    id: 'USR-ATH-01',
    name: 'Dr. Sarah Keller, MD',
    role: ClinicianRole.ATTENDING,
    department: 'Orthopaedic Surgery & Surgical Oncology',
    canSign: true,
    canExport: true,
    canAccessTrauma: true
  },
  {
    id: 'USR-ATH-02',
    name: 'Dr. C. Vasiliou, MD',
    role: ClinicianRole.ATTENDING,
    department: 'Cardiology / Internal Medicine',
    canSign: true,
    canExport: true,
    canAccessTrauma: true
  },
  {
    id: 'USR-RES-02',
    name: 'Dr. Julian Morales, MD',
    role: ClinicianRole.RESIDENT,
    department: 'Clinical Residency (PGY-2)',
    canSign: false,
    canExport: false,
    canAccessTrauma: true
  },
  {
    id: 'USR-NUR-03',
    name: 'Sister Hannah Brandt, RN',
    role: ClinicianRole.NURSE,
    department: 'Inpatient Clinical Ward / Step-down',
    canSign: false,
    canExport: false,
    canAccessTrauma: true
  },
  {
    id: 'USR-CSO-04',
    name: 'Dr. Ernst von Weber',
    role: ClinicianRole.SAFETY_OFFICER,
    department: 'Clinical Governance & Safety',
    canSign: false,
    canExport: true,
    canAccessTrauma: true
  }
];

// All 5 synthetic institutional patients
export const PATIENTS: Patient[] = [
  {
    id: 'PAT-GR-6701',
    mrn: 'EHR-902411',
    name: 'Elena Papadopoulou',
    age: 67,
    gender: 'F',
    dob: '1958-04-12',
    room: 'OR-PREP Bed 04',
    admissionDate: '2025-05-18T06:30:00Z',
    chiefComplaint: 'Planned revision of symptomatic aseptic loosening of left total hip arthroplasty (THA).',
    primaryDiagnosis: 'Aseptic loosening of left total hip prosthesis with acetabular osteolysis and groin pain on weight-bearing.',
    allergies: ['Penicillin (Rash)', 'Iodinated contrast (Mild urticaria)'],
    department: 'Orthopaedic Surgery'
  },
  {
    id: 'PAT-TR-3402',
    mrn: 'EHR-884102',
    name: 'Marcus Vance',
    age: 34,
    gender: 'M',
    dob: '1991-09-24',
    room: 'Trauma Bay 1 - Shock Room',
    admissionDate: '2025-05-18T10:15:00Z',
    chiefComplaint: 'High-speed motorcycle collision, Gustilo-Anderson IIIB open left tibial fracture.',
    primaryDiagnosis: 'Polytrauma, open distal left tibial shaft fracture, hemorrhagic shock class II/III.',
    allergies: ['No Known Drug Allergies (NKDA)'],
    department: 'Emergency & Trauma Surgery'
  },
  {
    id: 'PAT-GS-5203',
    mrn: 'EHR-773199',
    name: 'Sofia Lindqvist',
    age: 52,
    gender: 'F',
    dob: '1973-11-03',
    room: 'Ward 4B - Bed 12',
    admissionDate: '2025-05-14T08:00:00Z',
    chiefComplaint: 'Postoperative Day 4 status post laparoscopic right hemicolectomy for stage II adenocarcinoma.',
    primaryDiagnosis: 'Post-op right hemicolectomy, recovering well, bowel motility restored.',
    allergies: ['Codeine (Nausea / Dysphoria)'],
    department: 'General Visceral Surgery'
  },
  {
    id: 'PAT-AN-7204',
    mrn: 'EHR-614088',
    name: 'Andreas Nikolaou',
    age: 72,
    gender: 'M',
    dob: '1954-03-18',
    room: 'Cardiology Ward 2A - Bed 06',
    admissionDate: '2026-11-12T08:15:00Z',
    chiefComplaint: 'Worsening exertional dyspnea, orthopnea, and bilateral lower extremity edema over 5 days.',
    primaryDiagnosis: 'Decompensated Heart Failure with Reduced Ejection Fraction (HFrEF LVEF 35%), AFib, Acute-on-Chronic Kidney Disease (Stage 3b), Hyperkalemia (K 5.7).',
    allergies: ['ACE Inhibitor (Severe dry cough)'],
    department: 'Cardiology / Internal Medicine'
  },
  {
    id: 'PAT-MK-5905',
    mrn: 'EHR-552914',
    name: 'Maria Konstantinou',
    age: 59,
    gender: 'F',
    dob: '1967-08-04',
    room: 'Oncology Clinic Suite 3',
    admissionDate: '2026-11-10T09:30:00Z',
    chiefComplaint: 'Multidisciplinary tumor board preparation following laparoscopic sigmoid colectomy (Pathology: pT3N1a).',
    primaryDiagnosis: 'Sigmoid colon adenocarcinoma (pT3N1a R0, 1/18 LN+), status-post resection; indeterminate 8mm hepatic segment VI lesion on restaging CT.',
    allergies: ['Sulfa antibiotics (Pruritus)'],
    department: 'General Surgery / Surgical Oncology'
  }
];

export const SINGLE_PATIENT = PATIENTS[0];

export const LAB_RESULTS: LabResult[] = [
  // Elena Papadopoulou
  {
    id: 'LAB-EL-01',
    patientId: 'PAT-GR-6701',
    testName: 'Hemoglobin (Hb)',
    code: 'LOINC:718-7',
    value: 9.8,
    unit: 'g/dL',
    referenceRange: '12.0 - 15.5',
    timestamp: '2025-05-18T07:15:00Z',
    previousValue: 11.2,
    previousTimestamp: '2025-04-10T09:00:00Z',
    status: 'abnormal',
    systemSource: 'LIS-SYSMEX-01'
  },
  {
    id: 'LAB-EL-02',
    patientId: 'PAT-GR-6701',
    testName: 'eGFR (CKD-EPI)',
    code: 'LOINC:33914-3',
    value: 53,
    unit: 'mL/min/1.73m²',
    referenceRange: '> 60',
    timestamp: '2025-05-18T07:15:00Z',
    previousValue: 66,
    previousTimestamp: '2025-04-10T09:00:00Z',
    status: 'abnormal',
    systemSource: 'LIS-ROCHE-02'
  },
  {
    id: 'LAB-EL-03',
    patientId: 'PAT-GR-6701',
    testName: 'Serum Creatinine',
    code: 'LOINC:2160-0',
    value: 1.22,
    unit: 'mg/dL',
    referenceRange: '0.50 - 1.10',
    timestamp: '2025-05-18T07:15:00Z',
    previousValue: 1.01,
    previousTimestamp: '2025-04-10T09:00:00Z',
    status: 'abnormal',
    systemSource: 'LIS-ROCHE-02'
  },
  {
    id: 'LAB-EL-04',
    patientId: 'PAT-GR-6701',
    testName: 'Platelet Count',
    code: 'LOINC:777-3',
    value: 210,
    unit: 'x10³/µL',
    referenceRange: '150 - 400',
    timestamp: '2025-05-18T07:15:00Z',
    previousValue: 224,
    previousTimestamp: '2025-04-10T09:00:00Z',
    status: 'normal',
    systemSource: 'LIS-SYSMEX-01'
  },

  // Marcus Vance (Trauma)
  {
    id: 'LAB-TR-01',
    patientId: 'PAT-TR-3402',
    testName: 'Hemoglobin (Stat Blood Gas)',
    code: 'LOINC:718-7',
    value: 8.4,
    unit: 'g/dL',
    referenceRange: '13.5 - 17.5',
    timestamp: '2025-05-18T10:22:00Z',
    status: 'critical',
    systemSource: 'LIS-ROCHE-02'
  },
  {
    id: 'LAB-TR-02',
    patientId: 'PAT-TR-3402',
    testName: 'Serum Lactate (Stat)',
    code: 'LOINC:2524-7',
    value: 4.8,
    unit: 'mmol/L',
    referenceRange: '0.5 - 2.0',
    timestamp: '2025-05-18T10:22:00Z',
    status: 'critical',
    systemSource: 'LIS-ROCHE-02'
  },

  // Sofia Lindqvist (General Surgery)
  {
    id: 'LAB-GS-01',
    patientId: 'PAT-GS-5203',
    testName: 'C-Reactive Protein (CRP)',
    code: 'LOINC:1988-5',
    value: 18.2,
    unit: 'mg/L',
    referenceRange: '< 5.0',
    timestamp: '2025-05-18T06:00:00Z',
    previousValue: 74.0,
    previousTimestamp: '2025-05-15T06:00:00Z',
    status: 'normal',
    systemSource: 'LIS-ROCHE-02'
  },

  // Case 4: Andreas Nikolaou (Cardiology / Nephrology)
  {
    id: 'LAB-AN-01',
    patientId: 'PAT-AN-7204',
    testName: 'Serum Potassium (K+)',
    code: 'LOINC:2823-3',
    value: 5.7,
    unit: 'mmol/L',
    referenceRange: '3.5 - 5.1',
    timestamp: '2026-11-12T08:45:00Z',
    previousValue: 4.5,
    previousTimestamp: '2026-10-05T09:15:00Z',
    status: 'critical',
    systemSource: 'LIS-ROCHE-02'
  },
  {
    id: 'LAB-AN-02',
    patientId: 'PAT-AN-7204',
    testName: 'Serum Creatinine',
    code: 'LOINC:2160-0',
    value: 2.1,
    unit: 'mg/dL',
    referenceRange: '0.70 - 1.20',
    timestamp: '2026-11-12T08:45:00Z',
    previousValue: 1.4,
    previousTimestamp: '2026-10-05T09:15:00Z',
    status: 'abnormal',
    systemSource: 'LIS-ROCHE-02'
  },
  {
    id: 'LAB-AN-03',
    patientId: 'PAT-AN-7204',
    testName: 'eGFR (CKD-EPI)',
    code: 'LOINC:33914-3',
    value: 31,
    unit: 'mL/min/1.73m²',
    referenceRange: '> 60',
    timestamp: '2026-11-12T08:45:00Z',
    previousValue: 51,
    previousTimestamp: '2026-10-05T09:15:00Z',
    status: 'abnormal',
    systemSource: 'LIS-ROCHE-02'
  },
  {
    id: 'LAB-AN-04',
    patientId: 'PAT-AN-7204',
    testName: 'NT-proBNP (Cardiology)',
    code: 'LOINC:33762-6',
    value: 3840,
    unit: 'pg/mL',
    referenceRange: '< 300',
    timestamp: '2026-11-12T08:45:00Z',
    previousValue: 1420,
    previousTimestamp: '2026-03-24T11:00:00Z',
    status: 'critical',
    systemSource: 'LIS-SYSMEX-01'
  },

  // Case 5: Maria Konstantinou (Oncology / Colorectal)
  {
    id: 'LAB-MK-01',
    patientId: 'PAT-MK-5905',
    testName: 'Carcinoembryonic Antigen (CEA)',
    code: 'LOINC:2039-6',
    value: 4.2,
    unit: 'ng/mL',
    referenceRange: '< 3.0',
    timestamp: '2026-11-08T09:00:00Z',
    previousValue: 8.6,
    previousTimestamp: '2026-09-02T08:30:00Z',
    status: 'abnormal',
    systemSource: 'LIS-ROCHE-02'
  },
  {
    id: 'LAB-MK-02',
    patientId: 'PAT-MK-5905',
    testName: 'Hemoglobin (Hb)',
    code: 'LOINC:718-7',
    value: 12.1,
    unit: 'g/dL',
    referenceRange: '12.0 - 15.5',
    timestamp: '2026-11-08T09:00:00Z',
    previousValue: 10.4,
    previousTimestamp: '2026-09-12T06:00:00Z',
    status: 'normal',
    systemSource: 'LIS-SYSMEX-01'
  },
  {
    id: 'LAB-MK-03',
    patientId: 'PAT-MK-5905',
    testName: 'Alkaline Phosphatase',
    code: 'LOINC:6768-6',
    value: 84,
    unit: 'U/L',
    referenceRange: '35 - 105',
    timestamp: '2026-11-08T09:00:00Z',
    previousValue: 79,
    previousTimestamp: '2026-09-02T08:30:00Z',
    status: 'normal',
    systemSource: 'LIS-ROCHE-02'
  }
];

export const IMAGING_REPORTS: ImagingReport[] = [
  // Elena
  {
    id: 'RAD-EL-01',
    patientId: 'PAT-GR-6701',
    modality: 'XR',
    studyDescription: 'X-Ray Pelvis AP & Left Hip Axial (Weight-Bearing)',
    findings: 'Well-demarcated radiolucent line (>2.5 mm) at Gruen zones 1 and 7 around the femoral stem. Mild cranial migration of the acetabular cup with periacetabular osteolysis in Charnley zone II.',
    impression: 'Aseptic mechanical loosening of left total hip arthroplasty components. No peri-prosthetic fracture.',
    performedDate: '2025-05-12T14:30:00Z',
    radiologist: 'Prof. Dr. K. Meier, Musculoskeletal Radiology',
    pacsAccession: 'PACS-2025-0512-XR-8812',
    systemSource: 'PACS-GE-CENTRICITY'
  },
  {
    id: 'RAD-EL-02',
    patientId: 'PAT-GR-6701',
    modality: 'ECHO',
    studyDescription: 'Transthoracic Echocardiogram (TTE)',
    findings: 'Preserved LVEF 58%. Mild biatrial enlargement. Normal RV function. Mild mitral regurgitation. Moderate tricuspid regurgitation (PASP 32 mmHg).',
    impression: 'Preserved systolic function. Known atrial fibrillation with rate control. No regional wall motion abnormalities.',
    performedDate: '2024-11-20T11:15:00Z',
    radiologist: 'Dr. M. Lindemann, Cardiology',
    pacsAccession: 'PACS-2024-1120-ECHO-4011',
    systemSource: 'PACS-GE-CENTRICITY'
  },

  // Andreas Nikolaou (Case 4)
  {
    id: 'RAD-AN-01',
    patientId: 'PAT-AN-7204',
    modality: 'ECHO',
    studyDescription: 'Transthoracic Echocardiogram (TTE)',
    findings: 'Severely dilated left ventricle (LVEDD 64 mm). Severe global hypokinesis with calculated LVEF 35%. Left atrial enlargement (LAVI 44 mL/m²). Moderate mitral regurgitation with tethered leaflets. Estimated PASP 42 mmHg.',
    impression: 'Ischemic/dilated cardiomyopathy with severely reduced systolic function (LVEF 35%). Mild pulmonary hypertension secondary to elevated left-sided filling pressures.',
    performedDate: '2026-03-24T14:00:00Z',
    radiologist: 'Dr. C. Vasiliou, Dept of Non-Invasive Cardiology',
    pacsAccession: 'PACS-2026-0324-ECHO-1920',
    systemSource: 'PACS-GE-CENTRICITY'
  },
  {
    id: 'RAD-AN-02',
    patientId: 'PAT-AN-7204',
    modality: 'XR',
    studyDescription: 'Chest Radiograph AP Bedside',
    findings: 'Marked cardiomegaly (cardiothoracic ratio > 0.60). Perihilar vascular haziness and upper lobe venous diversion. Mild bilateral pleural effusions with blunted costophrenic sulci. No focal consolidation.',
    impression: 'Biventricular decompensation with pulmonary venous congestion and interstitial fluid overload.',
    performedDate: '2026-11-12T09:10:00Z',
    radiologist: 'Dr. P. Georgiou, Thoracic Radiology',
    pacsAccession: 'PACS-2026-1112-XR-3301',
    systemSource: 'PACS-GE-CENTRICITY'
  },

  // Maria Konstantinou (Case 5)
  {
    id: 'RAD-MK-01',
    patientId: 'PAT-MK-5905',
    modality: 'CT',
    studyDescription: 'Restaging Contrast CT Abdomen & Pelvis (Post-Colectomy)',
    findings: 'Colorectal anastomosis intact in pelvis without perianastomotic fluid collection or local recurrence. Liver demonstrates a subtle, small 8 mm hypodense subcapsular lesion in segment VI. Lesion is too small to characterize definitively on single-portal venous phase.',
    impression: 'Colonic primary resection intact. Indeterminate 8 mm hepatic segment VI lesion. Radiologist recommendation: Correlation with prior imaging and contrast-enhanced hepatic MRI with hepatobiliary agent (Primovist) as clinically indicated.',
    performedDate: '2026-10-04T11:30:00Z',
    radiologist: 'Prof. Dr. A. Demetriou, Abdominal Imaging',
    pacsAccession: 'PACS-2026-1004-CT-7741',
    systemSource: 'PACS-GE-CENTRICITY'
  },
  {
    id: 'RAD-MK-02',
    patientId: 'PAT-MK-5905',
    modality: 'CT',
    studyDescription: 'Initial Preoperative Staging CT Chest/Abdomen/Pelvis',
    findings: 'Circumferential mass lesion in sigmoid colon. Mesenteric fat stranding and 2 regional lymph nodes measuring 7mm. Liver demonstrates homogeneous parenchymal enhancement without focal subcapsular abnormalities reported.',
    impression: 'cT3 cN1 cM0 primary sigmoid neoplasm. No distant metastatic disease detected on baseline evaluation.',
    performedDate: '2026-08-12T15:20:00Z',
    radiologist: 'Dr. T. Stylianou, Body CT',
    pacsAccession: 'PACS-2026-0812-CT-1092',
    systemSource: 'PACS-GE-CENTRICITY'
  }
];

export const PATHOLOGY_REPORTS: PathologyReport[] = [
  {
    id: 'PATH-MK-01',
    patientId: 'PAT-MK-5905',
    specimenType: 'Sigmoid Colectomy Specimen (Laparoscopic)',
    histologicDiagnosis: 'Invasive moderately differentiated adenocarcinoma of sigmoid colon',
    pathologicStage: 'pT3 N1a (AJCC/UICC 8th Edition)',
    lymphNodeRatio: '1 of 18 regional lymph nodes positive for metastatic adenocarcinoma (1/18)',
    margins: 'Proximal (12 cm), distal (6.5 cm), and radial/circumferential (>1 mm) resection margins NEGATIVE for tumor (R0)',
    synopticFindings: 'Tumor invades through muscularis propria into subserosal adipose tissue. Extramural venous invasion: Absent. Perineural invasion: Absent. Mismatch repair (MMR) proteins: Intact (MSS).',
    pathologist: 'Dr. E. Constantinou, FRCPath, Surgical Pathology',
    signedDate: '2026-09-18T16:45:00Z',
    systemSource: 'LIS-PATH-COPATH'
  }
];

export const PAST_ENCOUNTERS: PastEncounterRecord[] = [
  // Elena
  {
    id: 'ENC-HIST-01',
    patientId: 'PAT-GR-6701',
    date: '2021-09-14',
    type: 'Primary Inpatient Hip Surgery',
    summary: 'Primary cementless Left Total Hip Arthroplasty (Corail stem, Pinnacle cup). Uncomplicated postoperative course. Discharged POD 5.',
    operativeReport: 'SURGEON: Prof. Dr. B. Sommer. Lateral Hardinge approach. Excellent initial press-fit stability. Stable range of motion.',
    dischargingPhysician: 'Dr. F. Weber, MD',
    systemSource: 'EHR-EPIC-SYNTH'
  },
  {
    id: 'ENC-HIST-02',
    patientId: 'PAT-GR-6701',
    date: '2024-03-22',
    type: 'Cardiology Outpatient Clinic',
    summary: 'Atrial Fibrillation (CHA2DS2-VASc = 3). Initiated on Apixaban (Eliquis) 5mg BID and Metoprolol succinate 47.5mg daily.',
    dischargingPhysician: 'Dr. M. Lindemann, MD',
    systemSource: 'PAS-CERNER-ARCHIVE'
  },

  // Andreas Nikolaou (Case 4)
  {
    id: 'ENC-AN-HIST-01',
    patientId: 'PAT-AN-7204',
    date: '2026-03-24',
    type: 'Cardiology Inpatient Admission',
    summary: 'Admission for acute decompensated heart failure with bilateral lower extremity edema and dyspnea NYHA class III. Echocardiography demonstrated LVEF 35%. Stabilized with IV diuresis. Discharged on Furosemide 40 mg PO daily, Bisoprolol 5 mg daily, Ramipril 2.5 mg daily, Metformin 500 mg BID.',
    dischargingPhysician: 'Dr. C. Vasiliou, MD',
    systemSource: 'EHR-EPIC-SYNTH'
  },

  // Maria Konstantinou (Case 5)
  {
    id: 'ENC-MK-HIST-01',
    patientId: 'PAT-MK-5905',
    date: '2026-09-12',
    type: 'Inpatient Surgical Colorectal Resection',
    summary: 'Laparoscopic sigmoid colectomy with primary end-to-end stapled anastomosis and high mesenteric vessel ligation for clinical stage II/III adenocarcinoma. Uncomplicated recovery; tolerated low residue diet on POD 3.',
    operativeReport: 'SURGEON: Prof. Dr. S. Keller. Laparoscopic mobilization of left colon and splenic flexure. High ligation of inferior mesenteric artery. No peritoneal carcinomatosis. Clean specimen with intact mesorectal/mesocolic envelope. Air leak test negative.',
    dischargingPhysician: 'Dr. Sarah Keller, MD',
    systemSource: 'EHR-EPIC-SYNTH'
  },
  {
    id: 'ENC-MK-HIST-02',
    patientId: 'PAT-MK-5905',
    date: '2026-10-20',
    type: 'Oncology Outpatient Clinic',
    summary: 'Postoperative review following sigmoid colectomy. Histopathology reviewed: pT3N1a (Stage III). Discussed indication for adjuvant chemotherapy (FOLFOX vs CAPOX). Pending multidisciplinary tumor board review and resolution of restaging CT indeterminate liver findings.',
    dischargingPhysician: 'Dr. M. Petrou, MD, Medical Oncology',
    systemSource: 'PAS-CERNER-ARCHIVE'
  }
];

export const INSTITUTIONAL_PROTOCOLS: InstitutionalProtocol[] = [
  {
    id: 'PROT-SURG-001',
    code: 'SOP-ORTHO-REV-2024',
    title: 'Preoperative Clearance & Anticoagulant Bridging in Arthroplasty Revision',
    version: '4.2.1 (Institutional Validated)',
    effectiveDate: '2024-01-15',
    category: 'Surgical Safety',
    summary: 'Prerequisites for revision arthroplasty: signed informed consent within 30 days, DOAC discontinuation window (minimum 48 hours for Apixaban if eGFR 50-80), valid blood crossmatch (2 PRBC units), and renal function evaluation.',
    mandatoryCheckpoints: [
      'Documented and signed informed surgical consent in electronic record',
      'Confirmed last intake timestamp of direct oral anticoagulant (Apixaban ≥ 48h prior to anesthesia)',
      'Preoperative hemoglobin evaluated; type & screen confirmed valid',
      'Renal function confirmation (eGFR determination within 72h)'
    ],
    passages: [
      {
        section: 'Section 3.2: Direct Oral Anticoagulants (DOACs)',
        text: 'For patients with eGFR between 50 and 80 mL/min, Apixaban must be suspended at least 48 hours before high-bleeding-risk orthopaedic operations. If interval is uncertain or <48h, surgery must NOT proceed under neuraxial block.'
      }
    ],
    isDemoCorpus: true
  },
  {
    id: 'PROT-CARD-002',
    code: 'SOP-HF-HYPERK-2026',
    title: 'Decompensated Heart Failure & Urgent Hyperkalemia Escalation SOP',
    version: '3.1.0 (Valid: 2026-01 to 2027-12)',
    effectiveDate: '2026-01-10',
    category: 'Heart Failure',
    summary: 'Clinical pathway for acute decompensation with hyperkalemia: Potassium ≥ 5.5 mmol/L mandates immediate 12-lead ECG, suspension of RAAS inhibitors/potassium-sparing agents, and urgent cardiology/nephrology review. Furosemide titration requires verified home dose reconciliation.',
    mandatoryCheckpoints: [
      'Immediate 12-lead ECG for cardiac conduction/peaked T waves (K+ ≥ 5.5 mmol/L)',
      'Medication reconciliation verifying actual daily loop diuretic dose (outpatient prescription vs inpatient intake)',
      'Serial renal function and electrolyte re-evaluation within 4 hours',
      'SBAR handover to Inpatient Cardiology Attending'
    ],
    passages: [
      {
        section: 'Section 2.1: Hyperkalemia Safety Thresholds',
        text: 'Serum potassium > 5.5 mmol/L in patients with CKD and reduced ejection fraction is a high-risk condition. Autonomous medication adjustments are prohibited; immediate ECG verification and attending authorization of potassium-lowering therapy are mandatory.'
      }
    ],
    isDemoCorpus: true
  },
  {
    id: 'PROT-ONC-003',
    code: 'SOP-MDT-COLORECTAL-2026',
    title: 'Colorectal Cancer Multidisciplinary Tumor Board (MDT) Staging & Management',
    version: '5.0.2 (Valid: 2026-03 to 2028-03)',
    effectiveDate: '2026-03-01',
    category: 'Oncology MDT',
    summary: 'Standard operating procedure for Stage III (pT3N1a) colorectal cancer: Adjuvant fluoropyrimidine + oxaliplatin (FOLFOX/CAPOX) within 8 weeks of surgery. Any indeterminate hepatic lesion must be characterized prior to adjuvant therapy initiation via dedicated MRI liver or contrast ultrasound.',
    mandatoryCheckpoints: [
      'Complete synoptic histopathology report (pTNM stage, lymph node count ≥ 12, margin status)',
      'Characterization of indeterminate liver lesions via hepatobiliary-contrast MRI prior to chemotherapy finalization',
      'Formal MDT multidisciplinary consensus documented and counter-signed by Board Chair',
      'Patient informed discussion regarding 3 vs 6 months adjuvant chemotherapy'
    ],
    passages: [
      {
        section: 'Section 4.3: Management of Indeterminate Hepatic Lesions',
        text: 'Small (<1 cm) hepatic lesions detected post-resection must not be presumed metastatic without tissue confirmation or contrast-enhanced MRI. Premature declaration of metastatic disease alters intent of care; dedicated imaging review is required.'
      }
    ],
    isDemoCorpus: true
  }
];

// Concrete cross-system contradictions
export const SEEDED_CONTRADICTIONS: CrossSystemContradiction[] = [
  // Elena
  {
    id: 'DISC-APX-01',
    patientId: 'PAT-GR-6701',
    category: 'MEDICATION',
    summary: 'Anticoagulation Discontinuation Discrepancy',
    sourceA: {
      system: 'EHR-NURSE-MEDREC',
      documentTitle: 'Ward Surgical Nursing Admission Form',
      timestamp: '2025-05-18T06:45:00Z',
      statement: 'Patient reported routine morning home medication intake: "Took Apixaban 5mg with a sip of water at 05:30 today."'
    },
    sourceB: {
      system: 'ANESTHESIA-PAS-EVAL',
      documentTitle: 'Pre-Anesthesia Outpatient Clearance Sheet',
      timestamp: '2025-05-16T14:15:00Z',
      statement: 'Instructed patient: Apixaban discontinued 48h prior to procedure (last dose taken Wednesday evening, May 15).'
    },
    discrepancyDetail: 'Conflicting cessation intervals. If taken today at 05:30, neuraxial spinal block and high-bleeding surgery carry major hemorrhage risk. Verification of blister pack and patient re-interview required.',
    verificationRequired: 'Attending surgeon or nurse must physically confirm home medication blister pack or administer reversal / reschedule spinal block.',
    status: 'UNRESOLVED'
  },

  // Andreas Nikolaou (Case 4)
  {
    id: 'DISC-FUR-02',
    patientId: 'PAT-AN-7204',
    category: 'MEDICATION',
    summary: 'Furosemide Loop Diuretic Dose Discrepancy',
    sourceA: {
      system: 'EHR-MEDREC-ADMIT',
      documentTitle: 'Cardiology Ward Admission Note (12 Nov 2026)',
      timestamp: '2026-11-12T08:30:00Z',
      statement: 'Current documented medication intake: Furosemide 80 mg PO once daily in morning.'
    },
    sourceB: {
      system: 'PAS-EPRESCRIPT-OUTPATIENT',
      documentTitle: 'Community Electronic Prescription Archive',
      timestamp: '2026-10-15T11:00:00Z',
      statement: 'Active outpatient prescription: Furosemide 40 mg PO once daily (Dispensed 30 tablets).'
    },
    discrepancyDetail: 'Inpatient admission list records 80 mg daily, but community pharmacy prescription records 40 mg daily. Neither source confirms whether patient actually doubled their dose or remained on 40 mg, while Creatinine rose from 1.4 to 2.1 mg/dL.',
    verificationRequired: 'Clinician must verify actual home pill count with patient or family before adjusting IV or oral diuretic therapy.',
    status: 'UNRESOLVED'
  },

  // Maria Konstantinou (Case 5)
  {
    id: 'DISC-HEP-03',
    patientId: 'PAT-MK-5905',
    category: 'IMAGING_INDETERMINATE',
    summary: 'Indeterminate Hepatic Lesion (8mm) on Restaging CT',
    sourceA: {
      system: 'PACS-GE-CENTRICITY',
      documentTitle: 'Restaging CT Abdomen/Pelvis (4 Oct 2026)',
      timestamp: '2026-10-04T11:30:00Z',
      statement: 'Small 8 mm hypodense subcapsular lesion in segment VI of liver. Indeterminate; recommend correlation with prior imaging or MRI.'
    },
    sourceB: {
      system: 'PACS-GE-CENTRICITY',
      documentTitle: 'Baseline Staging CT Chest/Abdomen (12 Aug 2026)',
      timestamp: '2026-08-12T15:20:00Z',
      statement: 'Liver parenchymal enhancement homogeneous. No focal hepatic metastases reported.'
    },
    discrepancyDetail: 'CT findings are indeterminate. Records do not establish whether this represents a new occult metastasis or a benign sub-centimeter biliary cyst. Per SOP-MDT-COLORECTAL-2026, it must not be presumed metastatic without dedicated liver MRI.',
    verificationRequired: 'Order dedicated contrast-enhanced hepatic MRI with Primovist and place on agenda for Colorectal MDT Tumor Board review.',
    status: 'UNRESOLVED'
  }
];

// Pre-seeded proposed interprofessional workflow tasks
export const SEEDED_WORKFLOW_TASKS: WorkflowTask[] = [
  // Elena
  {
    id: 'TSK-01',
    title: 'Verify physical Apixaban blister pack & clarify 05:30 intake statement',
    assigneeRole: 'Ward Nurse (Sister Hannah Brandt)',
    targetDepartment: 'Ward B3 / Pre-Op Holding',
    status: 'PROPOSED',
    priority: 'URGENT',
    createdAt: '2025-05-18T07:20:00Z'
  },
  {
    id: 'TSK-02',
    title: 'Confirm blood bank crossmatch availability for 2 units PRBC (Hb 9.8 g/dL)',
    assigneeRole: 'Transfusion Coordinator',
    targetDepartment: 'Immunohematology / Blood Bank',
    status: 'PROPOSED',
    priority: 'URGENT',
    createdAt: '2025-05-18T07:20:00Z'
  },
  {
    id: 'TSK-03',
    title: 'Locate and counter-sign physical surgical consent form prior to OR bay transfer',
    assigneeRole: 'Orthopaedic Resident (Dr. Julian Morales)',
    targetDepartment: 'Operating Theater Holding Bay 04',
    status: 'PROPOSED',
    priority: 'STAT',
    createdAt: '2025-05-18T07:20:00Z'
  },

  // Andreas Nikolaou (Case 4)
  {
    id: 'TSK-AN-01',
    title: 'Order immediate stat 12-lead ECG to evaluate cardiac conduction for K+ 5.7 mmol/L',
    assigneeRole: 'Cardiology Ward Nurse',
    targetDepartment: 'Cardiology Ward 2A',
    status: 'PROPOSED',
    priority: 'STAT',
    createdAt: '2026-11-12T09:15:00Z'
  },
  {
    id: 'TSK-AN-02',
    title: 'Perform medication pill count verification to resolve 40mg vs 80mg Furosemide intake',
    assigneeRole: 'Clinical Pharmacist',
    targetDepartment: 'Pharmacy Reconcile Unit',
    status: 'PROPOSED',
    priority: 'URGENT',
    createdAt: '2026-11-12T09:15:00Z'
  },
  {
    id: 'TSK-AN-03',
    title: 'Dispatch SBAR Handover summary to Inpatient Cardiology Attending Consultant',
    assigneeRole: 'Medical Registrar',
    targetDepartment: 'Department of Cardiology',
    status: 'PROPOSED',
    priority: 'URGENT',
    createdAt: '2026-11-12T09:15:00Z'
  },

  // Maria Konstantinou (Case 5)
  {
    id: 'TSK-MK-01',
    title: 'Schedule Contrast-Enhanced Hepatic MRI (Primovist) for indeterminate 8mm liver lesion',
    assigneeRole: 'Radiology Scheduler',
    targetDepartment: 'Department of MRI Imaging',
    status: 'PROPOSED',
    priority: 'URGENT',
    createdAt: '2026-11-10T10:00:00Z'
  },
  {
    id: 'TSK-MK-02',
    title: 'Register patient and upload pT3N1a synoptic pathology for Colorectal MDT Tumor Board',
    assigneeRole: 'MDT Board Coordinator',
    targetDepartment: 'Multidisciplinary Oncology Board',
    status: 'PROPOSED',
    priority: 'ROUTINE',
    createdAt: '2026-11-10T10:00:00Z'
  },
  {
    id: 'TSK-MK-03',
    title: 'Request Medical Oncology consultation for Adjuvant FOLFOX/CAPOX chemotherapy timing',
    assigneeRole: 'Oncology Fellow',
    targetDepartment: 'Medical Oncology Clinic',
    status: 'PROPOSED',
    priority: 'ROUTINE',
    createdAt: '2026-11-10T10:00:00Z'
  }
];

export const SCRIPTED_ENCOUNTERS: Record<string, TranscriptSegment[]> = {
  // Elena
  'PAT-GR-6701': [
    {
      id: 'EL-SEG-01',
      timestamp: '07:30:15',
      speaker: 'Resident',
      text: 'Elena Papadopoulou, 67, admitted for elective revision of her left total hip arthroplasty due to aseptic loosening. Groin pain on weight-bearing has intensified over the last 3 months.',
      overallConfidence: 0.96,
      acousticPhrases: [
        { id: 'PHR-01', phrase: 'Elena Papadopoulou, 67', confidence: 0.98, isAcousticallyAmbiguous: false },
        { id: 'PHR-02', phrase: 'elective revision of left THA', confidence: 0.97, isAcousticallyAmbiguous: false },
        { id: 'PHR-03', phrase: 'aseptic loosening', confidence: 0.94, isAcousticallyAmbiguous: false }
      ]
    },
    {
      id: 'EL-SEG-02',
      timestamp: '07:30:45',
      speaker: 'Physician',
      text: 'Understood. Primary survey: vitals are stable, BP 132/78, HR 74 in controlled Afib. Current hemoglobin came back at 9.8 g/dL, down from 11.2 last month. eGFR is 53 mL/min. Has blood bank crossmatched 2 units PRBC?',
      overallConfidence: 0.92,
      acousticPhrases: [
        { id: 'PHR-05', phrase: 'vitals stable, BP 132/78, HR 74 in Afib', confidence: 0.95, isAcousticallyAmbiguous: false },
        { id: 'PHR-06', phrase: 'hemoglobin 9.8 g/dL (prev 11.2)', confidence: 0.94, isAcousticallyAmbiguous: false }
      ]
    },
    {
      id: 'EL-SEG-03',
      timestamp: '07:31:20',
      speaker: 'Nurse',
      text: 'Type and screen is active. However, two critical items remain unverified: the signed informed consent is not yet attached to her electronic chart, and the exact timestamp of her last dose of Apixaban was not confirmed on the ward.',
      overallConfidence: 0.74,
      acousticPhrases: [
        { id: 'PHR-09', phrase: 'Type and screen active', confidence: 0.96, isAcousticallyAmbiguous: false },
        { id: 'PHR-10', phrase: 'signed consent NOT attached to chart', confidence: 0.72, isAcousticallyAmbiguous: true },
        { id: 'PHR-11', phrase: 'last dose of Apixaban not confirmed', confidence: 0.67, isAcousticallyAmbiguous: true }
      ]
    },
    {
      id: 'EL-SEG-04',
      timestamp: '07:31:55',
      speaker: 'Physician',
      text: 'Hold OR transfer. Per SOP-ORTHO-REV-2024, Apixaban requires a minimum 48-hour washout for her eGFR of 53. Nurse Brandt, please verify her home blister pack right away. I will obtain and counter-sign physical consent now.',
      overallConfidence: 0.88,
      acousticPhrases: [
        { id: 'PHR-12', phrase: 'Hold OR transfer', confidence: 0.98, isAcousticallyAmbiguous: false },
        { id: 'PHR-14', phrase: 'Apixaban 48-hour washout (eGFR 53)', confidence: 0.78, isAcousticallyAmbiguous: true }
      ]
    }
  ],

  // Andreas Nikolaou (Case 4)
  'PAT-AN-7204': [
    {
      id: 'AN-SEG-01',
      timestamp: '08:20:10',
      speaker: 'Resident',
      text: 'Andreas Nikolaou, 72, known ischemic cardiomyopathy LVEF 35% and CKD, admitted with 5-day worsening dyspnea, orthopnea, and bilateral lower leg edema. Current BP 108/68, HR 82 in atrial fibrillation.',
      overallConfidence: 0.95,
      acousticPhrases: [
        { id: 'AN-P1', phrase: 'Andreas Nikolaou, 72', confidence: 0.98, isAcousticallyAmbiguous: false },
        { id: 'AN-P2', phrase: 'HFrEF LVEF 35% and CKD', confidence: 0.96, isAcousticallyAmbiguous: false },
        { id: 'AN-P3', phrase: 'worsening dyspnea and leg edema', confidence: 0.94, isAcousticallyAmbiguous: false }
      ]
    },
    {
      id: 'AN-SEG-02',
      timestamp: '08:21:05',
      speaker: 'Physician',
      text: 'Stat lab values just posted to LIS. Serum creatinine has worsened from baseline 1.4 up to 2.1 mg/dL, and potassium is critically elevated at 5.7 mmol/L. Let us immediately get a 12-lead ECG to rule out peaked T waves or widened QRS.',
      overallConfidence: 0.94,
      acousticPhrases: [
        { id: 'AN-P4', phrase: 'creatinine 2.1 mg/dL (baseline 1.4)', confidence: 0.96, isAcousticallyAmbiguous: false },
        { id: 'AN-P5', phrase: 'potassium critically elevated at 5.7 mmol/L', confidence: 0.92, isAcousticallyAmbiguous: true },
        { id: 'AN-P6', phrase: 'stat 12-lead ECG', confidence: 0.95, isAcousticallyAmbiguous: false }
      ]
    },
    {
      id: 'AN-SEG-03',
      timestamp: '08:21:40',
      speaker: 'Nurse',
      text: 'Regarding his loop diuretics, the admission medication reconciliation lists Furosemide 80 mg daily, but our outpatient pharmacy archive shows his prescription was 40 mg daily. The patient is unsure whether he increased the dose at home.',
      overallConfidence: 0.79,
      acousticPhrases: [
        { id: 'AN-P7', phrase: 'admission medrec lists Furosemide 80 mg daily', confidence: 0.82, isAcousticallyAmbiguous: false },
        { id: 'AN-P8', phrase: 'outpatient script records Furosemide 40 mg daily', confidence: 0.78, isAcousticallyAmbiguous: true },
        { id: 'AN-P9', phrase: 'patient unsure of actual home dose', confidence: 0.71, isAcousticallyAmbiguous: true }
      ]
    },
    {
      id: 'AN-SEG-04',
      timestamp: '08:22:25',
      speaker: 'Physician',
      text: 'We must not administer further high-dose potassium-sparing or diuretic therapy blindly until we clarify that dose. Order the stat ECG, hold ACE inhibitors, initiate clinical pharmacist pill count reconciliation, and dispatch an SBAR handover to cardiology.',
      overallConfidence: 0.91,
      acousticPhrases: [
        { id: 'AN-P10', phrase: 'hold ACE inhibitors', confidence: 0.95, isAcousticallyAmbiguous: false },
        { id: 'AN-P11', phrase: 'pharmacist pill count reconciliation', confidence: 0.89, isAcousticallyAmbiguous: false },
        { id: 'AN-P12', phrase: 'SBAR handover to cardiology', confidence: 0.93, isAcousticallyAmbiguous: false }
      ]
    }
  ],

  // Maria Konstantinou (Case 5)
  'PAT-MK-5905': [
    {
      id: 'MK-SEG-01',
      timestamp: '09:40:15',
      speaker: 'Fellow',
      text: 'Maria Konstantinou, 59, status post laparoscopic sigmoid colectomy on 12 September. Synoptic histopathology confirms pT3N1a adenocarcinoma, with 1 of 18 regional lymph nodes positive and R0 clean margins.',
      overallConfidence: 0.97,
      acousticPhrases: [
        { id: 'MK-P1', phrase: 'Maria Konstantinou, 59', confidence: 0.98, isAcousticallyAmbiguous: false },
        { id: 'MK-P2', phrase: 'pT3N1a sigmoid adenocarcinoma', confidence: 0.96, isAcousticallyAmbiguous: false },
        { id: 'MK-P3', phrase: '1 of 18 lymph nodes positive (R0 margins)', confidence: 0.95, isAcousticallyAmbiguous: false }
      ]
    },
    {
      id: 'MK-SEG-02',
      timestamp: '09:41:00',
      speaker: 'Physician',
      text: 'Reviewed. Because of the nodal metastasis, she qualifies for adjuvant chemotherapy. However, we must review the 4 October restaging CT, which noted a small 8 millimeter hypodense lesion in liver segment VI.',
      overallConfidence: 0.93,
      acousticPhrases: [
        { id: 'MK-P4', phrase: 'qualifies for adjuvant chemotherapy', confidence: 0.94, isAcousticallyAmbiguous: false },
        { id: 'MK-P5', phrase: '8 mm hypodense lesion in liver segment VI', confidence: 0.91, isAcousticallyAmbiguous: true }
      ]
    },
    {
      id: 'MK-SEG-03',
      timestamp: '09:41:40',
      speaker: 'Fellow',
      text: 'Correct. The baseline staging CT from August did not report this lesion, but the radiologist notes it remains indeterminate due to small size. It cannot be confirmed as a metastasis without further imaging.',
      overallConfidence: 0.82,
      acousticPhrases: [
        { id: 'MK-P6', phrase: 'baseline CT did not report lesion', confidence: 0.88, isAcousticallyAmbiguous: false },
        { id: 'MK-P7', phrase: 'remains indeterminate (not confirmed metastasis)', confidence: 0.77, isAcousticallyAmbiguous: true }
      ]
    },
    {
      id: 'MK-SEG-04',
      timestamp: '09:42:20',
      speaker: 'Physician',
      text: 'Exactly. We cannot prematurely categorize this as stage IV M1 disease. We must schedule a dedicated liver MRI with Primovist, register her for tomorrow\'s Colorectal MDT Tumor Board, and consult Medical Oncology for adjuvant timing.',
      overallConfidence: 0.92,
      acousticPhrases: [
        { id: 'MK-P8', phrase: 'dedicated liver MRI with Primovist', confidence: 0.94, isAcousticallyAmbiguous: false },
        { id: 'MK-P9', phrase: 'tomorrow\'s Colorectal MDT Tumor Board', confidence: 0.93, isAcousticallyAmbiguous: false },
        { id: 'MK-P10', phrase: 'consult Medical Oncology for adjuvant timing', confidence: 0.91, isAcousticallyAmbiguous: false }
      ]
    }
  ]
};

export const SCRIPTED_ENCOUNTER_ELENA = SCRIPTED_ENCOUNTERS['PAT-GR-6701'];

export const INITIAL_UNCERTAINTIES: Record<string, UncertaintyFlag[]> = {
  // Elena
  'PAT-GR-6701': [
    {
      id: 'UNC-EL-01',
      originatingInfo: 'Pre-Op Medication Reconciliation',
      discrepancy: 'Patient takes Apixaban 5mg BID. Exact timestamp of last dose is unconfirmed in connected records.',
      requiredAction: 'Clinician must verify and document exact time of last DOAC intake (≥48h required for eGFR 53).',
      severity: Severity.RED,
      isMandatoryCheckpoint: true,
      resolved: false
    },
    {
      id: 'UNC-EL-02',
      originatingInfo: 'EHR Document Repository & Consent Registry',
      discrepancy: 'Signed informed surgical consent for left THA revision is NOT found in connected hospital systems.',
      requiredAction: 'Signed consent document must be uploaded and verified before OR transfer.',
      severity: Severity.RED,
      isMandatoryCheckpoint: true,
      resolved: false
    },
    {
      id: 'UNC-EL-03',
      originatingInfo: 'LIS Laboratory Feed (2025-05-18)',
      discrepancy: 'Preoperative hemoglobin dropped to 9.8 g/dL (down from 11.2 g/dL); eGFR is 53 mL/min.',
      requiredAction: 'Attending physician must confirm blood bank crossmatch (2 units PRBC on standby).',
      severity: Severity.AMBER,
      isMandatoryCheckpoint: false,
      resolved: false
    }
  ],

  // Andreas Nikolaou (Case 4)
  'PAT-AN-7204': [
    {
      id: 'UNC-AN-01',
      originatingInfo: 'LIS Critical Laboratory Alert (12 Nov 2026)',
      discrepancy: 'Serum potassium critically elevated at 5.7 mmol/L with worsening renal function (Creatinine 2.1 mg/dL, baseline 1.4 mg/dL).',
      requiredAction: 'Immediate 12-lead ECG required to evaluate cardiac conduction; suspend potassium-sparing medications and obtain attending cardiology authorization.',
      severity: Severity.RED,
      isMandatoryCheckpoint: true,
      resolved: false
    },
    {
      id: 'UNC-AN-02',
      originatingInfo: 'Cross-System Medication Reconciliation',
      discrepancy: 'EHR admission note lists Furosemide 80 mg daily, whereas outpatient electronic prescription records 40 mg daily. Actual home intake unverified.',
      requiredAction: 'Clinical pharmacist or attending must verify actual home pill count before titrating loop diuretics.',
      severity: Severity.RED,
      isMandatoryCheckpoint: true,
      resolved: false
    }
  ],

  // Maria Konstantinou (Case 5)
  'PAT-MK-5905': [
    {
      id: 'UNC-MK-01',
      originatingInfo: 'Restaging CT Abdomen/Pelvis (PACS)',
      discrepancy: 'Indeterminate 8 mm hypodense liver segment VI lesion. Must NOT be categorized as confirmed metastatic disease without tissue or MRI verification.',
      requiredAction: 'Schedule dedicated hepatobiliary contrast MRI and submit to Colorectal Multidisciplinary Tumor Board.',
      severity: Severity.AMBER,
      isMandatoryCheckpoint: true,
      resolved: false
    },
    {
      id: 'UNC-MK-02',
      originatingInfo: 'Multidisciplinary Oncology Board Registry',
      discrepancy: 'Formal MDT consensus decision pending review of synoptic pathology (pT3N1a) and adjuvant chemotherapy timing.',
      requiredAction: 'Attending surgical oncologist must present case and record final counter-signed MDT consensus decision.',
      severity: Severity.AMBER,
      isMandatoryCheckpoint: false,
      resolved: false
    }
  ]
};

export const INITIAL_UNCERTAINTIES_ELENA = INITIAL_UNCERTAINTIES['PAT-GR-6701'];
