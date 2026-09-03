import React, { useState, useEffect, useCallback } from 'react';
import { PKModule, User, ToastNotification } from './types';
import { DB } from './lib/storage';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { PKContentView } from './components/PKContentView';
import { PengaturanView } from './components/PengaturanView';
import { ActivityLogView } from './components/ActivityLogView';
import { UserManagementView } from './components/UserManagementView';
import { LoginView } from './components/LoginView';
import { ToastContainer } from './components/Toast';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>(() => DB.getCurrentUser());
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [modules, setModules] = useState<PKModule[]>(() => DB.getModules());
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedPkId, setSelectedPkId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Refresh modules & sync state
  const refreshData = useCallback(() => {
    const updatedModules = DB.getModules();
    setModules(updatedModules);

    // If current selected PK was deleted, fallback to dashboard
    if (selectedPkId && !updatedModules.some((m) => m.id === selectedPkId)) {
      setSelectedPkId(null);
      setCurrentView('dashboard');
    }
  }, [selectedPkId]);

  // Listen to DB updates
  useEffect(() => {
    const handleDbUpdate = () => {
      refreshData();
    };
    const handleAuthUpdate = () => {
      setCurrentUser(DB.getCurrentUser());
    };

    window.addEventListener('pk_database_updated', handleDbUpdate);
    window.addEventListener('pk_auth_updated', handleAuthUpdate);

    return () => {
      window.removeEventListener('pk_database_updated', handleDbUpdate);
      window.removeEventListener('pk_auth_updated', handleAuthUpdate);
    };
  }, [refreshData]);

  // Toast notification trigger
  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Navigation handler
  const handleNavigate = (view: string, pkId?: string) => {
    if (view === 'pk-module' && pkId) {
      setSelectedPkId(pkId);
      setCurrentView('pk-module');
    } else {
      setSelectedPkId(null);
      setCurrentView(view);
    }
  };

  // Selected module
  const activeModule = selectedPkId
    ? modules.find((m) => m.id === selectedPkId)
    : null;

  // Derive Navbar title
  const getNavTitle = () => {
    if (currentView === 'dashboard') return 'Dashboard Utama';
    if (currentView === 'pk-module' && activeModule) return activeModule.name_pk;
    if (currentView === 'pengaturan') return 'Pengaturan & Manajemen PK';
    if (currentView === 'activity-log') return 'Activity Log';
    if (currentView === 'users') return 'User Management';
    return 'Dashboard PK AYU EKLIN SIHIITE';
  };

  if (!isLoggedIn) {
    return (
      <>
        <LoginView
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setIsLoggedIn(true);
          }}
          showToast={showToast}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#FFFFFF] flex flex-col antialiased">
      <div className="flex flex-1 min-h-screen">
        {/* 1. Sidebar (No "Tambah PK" in main sidebar, dynamic modules from DB) */}
        <Sidebar
          currentView={currentView}
          selectedPkId={selectedPkId}
          modules={modules}
          currentUser={currentUser}
          isOpen={sidebarOpen}
          onCloseMobile={() => setSidebarOpen(false)}
          onNavigate={handleNavigate}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#050505]">
          {/* Topbar / Navbar */}
          <Navbar
            currentUser={currentUser}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            onUserChange={(updatedUser) => {
              setCurrentUser(updatedUser);
              showToast('info', `Beralih ke akun ${updatedUser.name} (${updatedUser.role})`);
            }}
            onLogout={() => {
              setIsLoggedIn(false);
              showToast('info', 'Anda telah keluar dari sistem.');
            }}
            currentTitle={getNavTitle()}
            onNavigateSettings={() => handleNavigate('pengaturan')}
          />

          {/* Page Content Body */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full">
            {currentView === 'dashboard' && (
              <DashboardView
                modules={modules}
                currentUser={currentUser}
                onNavigateToPk={(pkId) => handleNavigate('pk-module', pkId)}
                onNavigate={handleNavigate}
              />
            )}

            {currentView === 'pk-module' && activeModule && (
              <PKContentView
                key={activeModule.id}
                module={activeModule}
                currentUser={currentUser}
                onRefresh={refreshData}
                showToast={showToast}
              />
            )}

            {currentView === 'pengaturan' && (
              <PengaturanView
                modules={modules}
                currentUser={currentUser}
                onRefresh={refreshData}
                showToast={showToast}
              />
            )}

            {currentView === 'activity-log' && (
              <ActivityLogView
                currentUser={currentUser}
                onRefresh={refreshData}
                showToast={showToast}
              />
            )}

            {currentView === 'users' && (
              <UserManagementView
                currentUser={currentUser}
                onRefresh={refreshData}
                showToast={showToast}
              />
            )}
          </main>
        </div>
      </div>

      {/* Floating Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
