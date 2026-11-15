import { Patient, LabResult, DocumentVersion, UserProfile, ClinicianRole } from '../types';

export interface FhirBundleResources {
  patient: Record<string, unknown>;
  encounter: Record<string, unknown>;
  documentReference: Record<string, unknown>;
  provenance: Record<string, unknown>;
  observations: Record<string, unknown>[];
}

export function generateFhirResources(params: {
  patient: Patient;
  currentUser: UserProfile;
  activeDoc?: DocumentVersion;
  labs: LabResult[];
  encounterState: string;
}): FhirBundleResources {
  const { patient, currentUser, activeDoc, labs, encounterState } = params;

  // 1. FHIR R4 Patient Resource
  const patientResource = {
    resourceType: 'Patient',
    id: patient.id,
    identifier: [
      {
        use: 'official',
        system: 'urn:oid:2.16.840.1.113883.19.5',
        value: patient.mrn,
        type: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
              code: 'MR',
              display: 'Medical Record Number'
            }
          ]
        }
      }
    ],
    active: true,
    name: [
      {
        use: 'official',
        text: patient.name,
        family: patient.name.split(' ').slice(-1)[0],
        given: patient.name.split(' ').slice(0, -1)
      }
    ],
    gender: patient.gender === 'M' ? 'male' : patient.gender === 'F' ? 'female' : 'other',
    birthDate: patient.dob,
    managingOrganization: {
      display: 'Simulated Institutional Hospital Center (EHR-EPIC-SYNTH)'
    }
  };

  // 2. FHIR R4 Encounter Resource
  const encounterResource = {
    resourceType: 'Encounter',
    id: `ENC-${patient.id}`,
    status: encounterState.toLowerCase() === 'delivered' ? 'finished' : 'in-progress',
    class: {
      system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
      code: 'IMP',
      display: 'inpatient encounter'
    },
    subject: {
      reference: `Patient/${patient.id}`,
      display: patient.name
    },
    period: {
      start: patient.admissionDate
    },
    serviceType: {
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: '394801008',
          display: patient.department
        }
      ]
    },
    location: [
      {
        location: {
          display: patient.room
        },
        status: 'active'
      }
    ],
    reasonCode: [
      {
        text: patient.chiefComplaint
      }
    ]
  };

  // 3. FHIR R4 DocumentReference Resource
  const documentReferenceResource = {
    resourceType: 'DocumentReference',
    id: activeDoc ? activeDoc.versionId : `DOC-${patient.id}-PROVISIONAL`,
    status: activeDoc?.isFinalized ? 'current' : 'preliminary',
    docStatus: activeDoc?.isFinalized ? 'final' : 'preliminary',
    type: {
      coding: [
        {
          system: 'http://loinc.org',
          code: '11488-4',
          display: 'Consultation note'
        }
      ],
      text: activeDoc ? activeDoc.title : `${patient.department} Clinical Note`
    },
    category: [
      {
        coding: [
          {
            system: 'http://hl7.org/fhir/us/core/CodeSystem/us-core-documentreference-category',
            code: 'clinical-note',
            display: 'Clinical Note'
          }
        ]
      }
    ],
    subject: {
      reference: `Patient/${patient.id}`,
      display: patient.name
    },
    date: activeDoc ? activeDoc.createdAt : new Date().toISOString(),
    author: [
      {
        display: activeDoc ? activeDoc.authorName : currentUser.name
      }
    ],
    authenticator: activeDoc?.isFinalized
      ? {
          display: `${currentUser.name} (${currentUser.role})`
        }
      : undefined,
    custodian: {
      display: 'ICARUS Clinical Orchestration Infrastructure'
    },
    content: [
      {
        attachment: {
          contentType: 'text/plain',
          language: 'en',
          data: activeDoc
            ? btoa(
                unescape(
                  encodeURIComponent(
                    `ASSESSMENT:\n${activeDoc.content.assessment}\n\nPLAN:\n${activeDoc.content.plan}`
                  )
                )
              )
            : 'W1Byb3Zpc2lvbmFsIERyYWZ0XQ==',
          title: activeDoc ? activeDoc.title : 'Provisional Clinical Synthesis'
        }
      }
    ],
    context: {
      encounter: [
        {
          reference: `Encounter/ENC-${patient.id}`
        }
      ]
    }
  };

  // 4. FHIR R4 Provenance Resource (Layer 5 Governance)
  const provenanceResource = {
    resourceType: 'Provenance',
    id: `PROV-${activeDoc ? activeDoc.versionId : 'INITIAL'}`,
    target: [
      {
        reference: `DocumentReference/${activeDoc ? activeDoc.versionId : `DOC-${patient.id}`}`
      }
    ],
    recorded: new Date().toISOString(),
    activity: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/v3-DataOperation',
          code: activeDoc?.isFinalized ? 'APPEND' : 'CREATE',
          display: activeDoc?.isFinalized ? 'Authorized Document Sign-Off' : 'Progressive Draft Synthesis'
        }
      ]
    },
    agent: [
      {
        type: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/provenance-participant-type',
              code: 'author',
              display: 'Author'
            }
          ]
        },
        who: {
          display: activeDoc ? activeDoc.authorName : currentUser.name
        }
      },
      {
        type: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/provenance-participant-type',
              code: 'verifier',
              display: 'Sign-off Verifier'
            }
          ]
        },
        who: {
          display: `${currentUser.name} (${currentUser.role})`
        }
      }
    ],
    entity: (activeDoc?.provenanceSourceIds ?? []).map((sourceId) => ({
      role: 'source',
      what: {
        identifier: {
          system: 'urn:icarus:provenance:source',
          value: sourceId
        },
        display: `Transcript Statement or Source Record: ${sourceId}`
      }
    }))
  };

  // 5. Associated Observations (LIS Labs)
  const observationResources = labs.map((l) => ({
    resourceType: 'Observation',
    id: l.id,
    status: 'final',
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: l.code.replace('LOINC:', ''),
          display: l.testName
        }
      ],
      text: l.testName
    },
    subject: {
      reference: `Patient/${patient.id}`,
      display: patient.name
    },
    effectiveDateTime: l.timestamp,
    valueQuantity: {
      value: l.value,
      unit: l.unit,
      system: 'http://unitsofmeasure.org'
    },
    referenceRange: [
      {
        text: l.referenceRange
      }
    ],
    interpretation: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
            code: l.status === 'critical' ? 'AA' : l.status === 'abnormal' ? 'A' : 'N',
            display: l.status.toUpperCase()
          }
        ]
      }
    ]
  }));

  return {
    patient: patientResource,
    encounter: encounterResource,
    documentReference: documentReferenceResource,
    provenance: provenanceResource,
    observations: observationResources
  };
}
