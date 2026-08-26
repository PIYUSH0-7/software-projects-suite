import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import InternalMarks from './pages/InternalMarks';
import GPACalculator from './pages/GPACalculator';
import ProgressTracker from './pages/ProgressTracker';
import Auth from './pages/Auth';
import ConnectionMaker from './pages/ConnectionMaker';
import Profile from './pages/Profile';
import AITutor from './pages/AITutor';
import Grievances from './pages/Grievances';
import Assignments from './pages/Assignments';
import UsersManagement from './pages/UsersManagement';
import LectureProcessor from './pages/LectureProcessor';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/ai-tutor" element={
          <ProtectedRoute>
            <Layout>
              <AITutor />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/lectures" element={
          <ProtectedRoute>
            <Layout>
              <LectureProcessor />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/attendance" element={
          <ProtectedRoute>
            <Layout>
              <Attendance />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/internal-marks" element={
          <ProtectedRoute>
            <Layout>
              <InternalMarks />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/gpa" element={
          <ProtectedRoute>
            <Layout>
              <GPACalculator />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/progress" element={
          <ProtectedRoute>
            <Layout>
              <ProgressTracker />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/connections" element={
          <ProtectedRoute>
            <Layout>
              <ConnectionMaker />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute>
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/grievances" element={
          <ProtectedRoute>
            <Layout>
              <Grievances />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/assignments" element={
          <ProtectedRoute>
            <Layout>
              <Assignments />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/users-management" element={
          <ProtectedRoute>
            <Layout>
              <UsersManagement />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;