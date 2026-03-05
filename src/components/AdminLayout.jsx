import React from 'react';

const AdminLayout = ({ children }) => {
  return (
    <div className="app-container admin-layout">
      {/* Admin Header */}
      <header className="app-header admin-header">
        <div className="logo-area">
          <img src="/logo white.png" alt="Vergo Logo" className="app-logo" />
          <h4>Admin</h4>
        </div>
        <button 
          className="btn-logout"
          onClick={() => {
            localStorage.removeItem('adminToken');
            window.location.href = '/login';
          }}
        >
          Logout
        </button>
      </header>

      {/* Main Admin Content */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
