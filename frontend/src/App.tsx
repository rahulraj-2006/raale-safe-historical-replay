import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { UserRole } from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Events } from './pages/Events';
import { EventDetails } from './pages/EventDetails';
import { DryRun } from './pages/DryRun';
import { ReplayOperations } from './pages/ReplayOperations';
import { AuditLogs } from './pages/AuditLogs';
import { Experiments } from './pages/Experiments';
import { Settings } from './pages/Settings';
import { SystemHealth } from './pages/SystemHealth';

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const [currentRole, setCurrentRole] = useState<UserRole>('Integration Engineer');

  const handleLaunchDemo = () => {
    navigate('/events/EVT-DEMO-001');
  };

  return (
    <div className="flex flex-col h-screen bg-[#0B0F17] text-slate-100 overflow-hidden">
      <Header
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        onDemoWorkflowClick={handleLaunchDemo}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetails currentRole={currentRole} />} />
            <Route path="/dry-run" element={<DryRun currentRole={currentRole} />} />
            <Route path="/replay" element={<ReplayOperations currentRole={currentRole} />} />
            <Route path="/audit" element={<AuditLogs />} />
            <Route path="/experiments" element={<Experiments />} />
            <Route path="/settings" element={<Settings currentRole={currentRole} />} />
            <Route path="/health" element={<SystemHealth />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
