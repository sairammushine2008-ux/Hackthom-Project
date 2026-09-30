import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Toast } from '../Toast';

export function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* Collateral Sidebar */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onSearchQuery={setGlobalSearch} />
        <main className="flex-1 p-6 overflow-y-auto">
          {children || <Outlet context={{ globalSearch }} />}
        </main>
      </div>

      {/* Global In-App Notifications Toast */}
      <Toast />
    </div>
  );
}
