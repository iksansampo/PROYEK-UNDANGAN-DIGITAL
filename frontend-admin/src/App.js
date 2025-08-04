import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EditInvitationPage from './pages/EditInvitationPage';

// Komponen untuk melindungi rute yang hanya bisa diakses setelah login
const PrivateRoute = ({ children }) => {
    // Untuk pengembangan, kita anggap sudah login.
    // Dalam produksi, ini akan memeriksa token atau sesi.
    const isAuthenticated = sessionStorage.getItem('isAuthenticated');
    return isAuthenticated ? children : <Navigate to="/" />;
};


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/edit/:id" 
          element={
            <PrivateRoute>
              <EditInvitationPage />
            </PrivateRoute>
          } 
        />
         <Route 
          path="/create" 
          element={
            <PrivateRoute>
              {/* Menggunakan kembali komponen EditInvitationPage untuk membuat undangan baru */}
              <EditInvitationPage />
            </PrivateRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;