import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bhissm-bg text-bhissm-dark font-sans antialiased flex flex-col">
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 px-4 md:px-8 py-6">
        <div className="max-w-[1400px] mx-auto space-y-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
