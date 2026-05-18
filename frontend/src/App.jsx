import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import WhatsAppButton from './components/common/WhatsAppButton';
import LandingPage from './pages/LandingPage';
import AdminDashboard from './pages/AdminDashboard';
import CourseList from './pages/CourseList';
import CourseDetail from './pages/CourseDetail';
import CoursePlayer from './pages/CoursePlayer';
import ManageContent from './pages/ManageContent';
import VideoPreview from './pages/VideoPreview';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/courses" element={<CourseList />} />
            <Route path="/course/:id" element={<CourseDetail />} />
            <Route path="/admin/course/:id/content" element={<ManageContent />} />
            <Route path="/play/:courseId" element={<CoursePlayer />} />
            <Route path="/preview" element={<VideoPreview />} />
          </Routes>
        </main>
        <Footer />
        <WhatsAppButton />
      </div>
    </Router>
  );
}

export default App;
