import React, { useState } from 'react';
import { Patient, UserProfile, ClinicianRole } from './types';
import { PATIENTS, USERS } from './mockData';
import { hospitalGateway } from './services/hospitalAdapters';
import { auditStore } from './services/auditStore';
import { offlineReconciliation } from './services/offlineReconciliation';
import { orchestrationEngine } from './services/orchestrationEngine';
import { ariaService } from './services/geminiService';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { AriaChatView } from './components/AriaChatView';
import { EHRView } from './components/EHRView';
import { EncounterStudio } from './components/EncounterStudio';
import { ArchitectureInspector } from './components/ArchitectureInspector';
import { EncounterReplayModal } from './components/EncounterReplayModal';
import { OperationalEvidenceView } from './components/OperationalEvidenceView';
import { GuidedDemoController } from './components/GuidedDemoController';
import { VoiceCallOverlay } from './components/VoiceCallOverlay';

export const App: React.FC = () => {
  const [currentPatient, setCurrentPatient] = useState<Patient>(PATIENTS[0]);
  const [currentUser, setCurrentUser] = useState<UserProfile>(USERS[0]);
  const [activeView, setActiveView] = useState<'chat' | 'ehr' | 'encounter' | 'inspector' | 'replay' | 'evidence'>('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isGuidedDemoOpen, setIsGuidedDemoOpen] = useState(false);
  const [isVoiceCallOpen, setIsVoiceCallOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [destinationUnavailable, setDestinationUnavailable] = useState(false);
  const [chatInitialTopic, setChatInitialTopic] = useState<string | undefined>(undefined);

  // Read patient data for active patient from hospital adapters
  const { labs, imaging, pastEncounters } = hospitalGateway.readPatientData(
    currentPatient.id,
    currentUser.name,
    currentUser.role
  );
  const protocols = hospitalGateway.searchDemonstrationProtocols('Preoperative or Cardiology or Oncology');

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 3800);
  };

  const handleSelectPatient = (p: Patient) => {
    setCurrentPatient(p);
    orchestrationEngine.createOrchestrationProposal(p.id);

    // Align attending clinician to patient's clinical department
    if (p.id === 'PAT-AN-7204') {
      const cardiologist = USERS.find((u) => u.id === 'USR-ATH-02');
      if (cardiologist) setCurrentUser(cardiologist);
    } else {
      const surgeon = USERS.find((u) => u.id === 'USR-ATH-01');
      if (surgeon) setCurrentUser(surgeon);
    }

    auditStore.recordEvent({
      eventType: 'PATIENT_CONTEXT_SWITCHED',
      actor: currentUser.name,
      role: currentUser.role,
      patientId: p.id,
      encounterId: `ENC-${p.id}`,
      correlationId: `CORR-CTX-${Date.now()}`,
      details: `Switched active clinical context to ${p.name} (${p.mrn}). Previous patient context invalidated.`
    });

    showNotification(`Patient context bound to ${p.name} (${p.department}).`, 'info');
  };

  const handleResetDemo = () => {
    auditStore.reset();
    setCurrentPatient(PATIENTS[0]);
    setCurrentUser(USERS[0]);
    setActiveView('chat');
    setIsVoiceCallOpen(false);
    hospitalGateway.simulateDestinationUnavailable = false;
    setDestinationUnavailable(false);
    offlineReconciliation.setPartition(false, USERS[0].name, USERS[0].role);
    orchestrationEngine.createOrchestrationProposal(PATIENTS[0].id);
    showNotification('Demonstrator reset to baseline.', 'success');
  };

  const handleAskAriaFromEHR = (topic: string) => {
    setChatInitialTopic(topic);
    setActiveView('chat');
  };

  // Two-way voice turn handler: calls ARIA service and logs event
  const handleVoiceTurn = async (spokenQuestion: string): Promise<string> => {
    auditStore.recordEvent({
      eventType: 'TRANSCRIPT_SEGMENT_CAPTURED',
      actor: currentUser.name,
      role: currentUser.role,
      patientId: currentPatient.id,
      encounterId: `ENC-${currentPatient.id}`,
      correlationId: `CORR-VOICE-${Date.now()}`,
      details: `Spoken query via Call ARIA: "${spokenQuestion}"`
    });

    const res = await ariaService.askAria({
      query: spokenQuestion,
      patient: currentPatient,
      labs,
      imaging,
      protocols,
      clinicianRole: currentUser.role
    });

    // Also inject into text chat transcript so voice & text history remain synchronized
    setChatInitialTopic(spokenQuestion);

    return res.answer;
  };

  // 3-Minute Guided Tour Sequence
  const handleTriggerScene = (sceneNum: number) => {
    switch (sceneNum) {
      case 1:
        // Scene 1: Changes since last admission
        handleSelectPatient(PATIENTS[0]);
        setActiveView('chat');
        setChatInitialTopic("What has changed since this patient's last admission, and what should the clinician verify before surgery?");
        showNotification('Scene 1: Asked ARIA: What changed since last admission, and what to verify before surgery?', 'info');
        break;
      case 2:
        // Scene 2: Verify Evidence
        setActiveView('chat');
        showNotification('Scene 2: Inspecting prior vs current values, clinical impact, and source citations.', 'info');
        break;
      case 3:
        // Scene 3: Confirm Follow-Up Tasks
        setActiveView('chat');
        orchestrationEngine.authorizeAndDispatchTasks({
          actor: currentUser.name,
          role: currentUser.role,
          patientId: PATIENTS[0].id
        });
        showNotification('Scene 3: Attending Physician explicitly authorized interprofessional follow-up tasks.', 'success');
        break;
      case 4:
        // Scene 4: Reconstruct in Audit Replay
        setActiveView('replay');
        showNotification('Scene 4: Reconstructed actual stored audit event with patient, action, and linked source.', 'info');
        break;
      case 5:
        // Scene 5: Multi-case exploration
        handleSelectPatient(PATIENTS[3]);
        setActiveView('chat');
        setChatInitialTopic("ARIA, what has changed since this patient's last admission? Also reconcile the available medication history.");
        showNotification('Scene 5: Andreas Nikolaou (Cardiology) loaded for independent exploration.', 'success');
        break;
      default:
        break;
    }
  };

  const viewTitles = {
    chat: 'Ask ARIA Assistant',
    ehr: 'Authoritative Chart & Flowsheet',
    encounter: 'Encounter Studio',
    inspector: 'Architecture & FHIR R4 Inspector',
    replay: 'Encounter Audit Replay',
    evidence: 'Operational Evidence & Telemetry'
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-anthracite-950 font-sans text-slate-100">
      {/* Left Minimalist Sidebar with All 5 Patients */}
      <Sidebar
        currentPatient={currentPatient}
        allPatients={PATIENTS}
        onSelectPatient={handleSelectPatient}
        currentUser={currentUser}
        allUsers={USERS}
        onSelectUser={setCurrentUser}
        activeView={activeView}
        onSelectView={setActiveView}
        onLaunchGuidedDemo={() => setIsGuidedDemoOpen(true)}
        onResetDemo={handleResetDemo}
        isPartitioned={offlineReconciliation.isPartitioned}
        destinationUnavailable={destinationUnavailable}
        isOpen={isSidebarOpen}
        onToggleOpen={() => setIsSidebarOpen(false)}
      />

      {/* Main Workspace */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden bg-anthracite-950">
        <Header
          currentPatient={currentPatient}
          currentUser={currentUser}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onLaunchGuidedDemo={() => setIsGuidedDemoOpen(true)}
          onToggleInspector={() => setActiveView(activeView === 'inspector' ? 'chat' : 'inspector')}
          onOpenReplay={() => setActiveView('replay')}
          onOpenVoiceCall={() => setIsVoiceCallOpen(true)}
          isInspectorActive={activeView === 'inspector'}
          destinationUnavailable={destinationUnavailable}
          isPartitioned={offlineReconciliation.isPartitioned}
          activeViewTitle={viewTitles[activeView]}
        />

        <main className="flex-1 min-w-0 flex overflow-hidden relative">
          {activeView === 'chat' && (
            <AriaChatView
              patient={currentPatient}
              labs={labs}
              imaging={imaging}
              protocols={protocols}
              currentUser={currentUser}
              onOpenEHR={() => setActiveView('ehr')}
              onOpenEncounter={() => setActiveView('encounter')}
              onOpenVoiceCall={() => setIsVoiceCallOpen(true)}
              initialTopic={chatInitialTopic}
            />
          )}

          {activeView === 'ehr' && (
            <EHRView
              patient={currentPatient}
              labs={labs}
              imaging={imaging}
              pastEncounters={pastEncounters}
              currentUser={currentUser}
              onAskAriaAboutItem={handleAskAriaFromEHR}
              onOpenEncounterCapture={() => setActiveView('encounter')}
            />
          )}

          {activeView === 'encounter' && (
            <EncounterStudio
              patient={currentPatient}
              currentUser={currentUser}
              onClose={() => setActiveView('chat')}
              onNotify={showNotification}
            />
          )}

          {activeView === 'inspector' && (
            <ArchitectureInspector
              isOpen={true}
              onClose={() => setActiveView('chat')}
              currentPatient={currentPatient}
              currentUser={currentUser}
              onNotify={showNotification}
            />
          )}

          {activeView === 'replay' && (
            <EncounterReplayModal
              isOpen={true}
              onClose={() => setActiveView('chat')}
              currentPatient={currentPatient}
            />
          )}

          {activeView === 'evidence' && (
            <OperationalEvidenceView
              currentPatient={currentPatient}
              currentUser={currentUser}
            />
          )}
        </main>
      </div>

      {/* Floating Notification */}
      {notification && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-3.5 py-2 rounded-lg shadow-xl text-xs font-mono border flex items-center space-x-2 transition-all ${
            notification.type === 'error'
              ? 'bg-anthracite-900 border-red-800 text-red-200'
              : notification.type === 'success'
              ? 'bg-anthracite-900 border-emerald-800 text-emerald-200'
              : 'bg-anthracite-900 border-anthracite-750 text-pastel-200'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-pastel-300"></span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Two-Way ChatGPT Voice Modal */}
      <VoiceCallOverlay
        isOpen={isVoiceCallOpen}
        onClose={() => setIsVoiceCallOpen(false)}
        patient={currentPatient}
        currentUser={currentUser}
        onSpokenTurn={handleVoiceTurn}
      />

      {/* 3-Minute Guided Tour Controller */}
      {isGuidedDemoOpen && (
        <GuidedDemoController
          isOpen={isGuidedDemoOpen}
          onClose={() => setIsGuidedDemoOpen(false)}
          onTriggerScene={handleTriggerScene}
        />
      )}
    </div>
  );
};

export default App;
