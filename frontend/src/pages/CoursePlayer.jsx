import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ChevronDown, ChevronUp, Check, Menu, X, BookOpen, Clock, CheckCircle, Play, Download, List } from 'lucide-react';
import './CoursePlayer.css';

const CoursePlayer = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const videoRef = useRef(null);
    
    const [curriculum, setCurriculum] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [completedLessons, setCompletedLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('MENU');
    const [expandedModules, setExpandedModules] = useState({});
    const [course, setCourse] = useState(null);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchData();
    }, [courseId, user]);

    const fetchData = async () => {
        try {
            const [curriculumRes, progressRes, courseRes] = await Promise.all([
                fetch(`https://manshu-portfolio-frhd.vercel.app/api/courses/${courseId}/curriculum`),
                fetch(`https://manshu-portfolio-frhd.vercel.app/api/progress/${courseId}`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                }),
                fetch(`https://manshu-portfolio-frhd.vercel.app/api/courses/${courseId}`)
            ]);
            
            const curriculumData = await curriculumRes.json();
            const progressData = await progressRes.json();
            const courseData = await courseRes.json();
            
            setCurriculum(curriculumData);
            setCompletedLessons(progressData.completedLessons || []);
            setCourse(courseData);
            
            // Auto-select first session
            if (curriculumData.length > 0 && curriculumData[0].videos?.length > 0) {
                setActiveSession(curriculumData[0].videos[0]);
                setExpandedModules({ [curriculumData[0]._id]: true });
            }
            
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const toggleComplete = async (lessonId) => {
        try {
            const res = await fetch('https://manshu-portfolio-frhd.vercel.app/api/progress/toggle', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                },
                body: JSON.stringify({ courseId, lessonId })
            });
            const data = await res.json();
            setCompletedLessons(data.completedLessons);
        } catch (err) {
            console.error('Failed to toggle progress:', err);
        }
    };

    const toggleModule = (modId) => {
        setExpandedModules(prev => ({ ...prev, [modId]: !prev[modId] }));
    };

    const handleSessionSelect = (session) => {
        setActiveSession(session);
        if (window.innerWidth < 1024) setSidebarOpen(false);
    };

    const handleTimestampClick = (seconds) => {
        if (videoRef.current) {
            videoRef.current.currentTime = seconds;
            videoRef.current.play();
        }
    };

    const isCompleted = (lessonId) => completedLessons.includes(lessonId);

    if (loading) return <div className="loader-container"><div className="loader"></div></div>;

    return (
        <div className={`articulate-player ${sidebarOpen ? 'sidebar-visible' : 'sidebar-hidden'}`}>
            
            {/* Sidebar Overlay Backdrop */}
            {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)}></div>}

            {/* Sidebar Pane (Articulate Style) */}
            <aside className="player-sidebar">
                <div className="sidebar-tabs">
                    <button 
                        className={`tab-btn ${activeTab === 'MENU' ? 'active' : ''}`}
                        onClick={() => setActiveTab('MENU')}
                    >
                        MENU
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'NOTES' ? 'active' : ''}`}
                        onClick={() => setActiveTab('NOTES')}
                    >
                        NOTES
                    </button>
                </div>

                <div className="sidebar-scroller">
                    {activeTab === 'MENU' ? (
                        <div className="menu-tree">
                            {curriculum.map(module => (
                                <div key={module._id} className="menu-section">
                                    <div 
                                        className="section-header" 
                                        onClick={() => toggleModule(module._id)}
                                    >
                                        {expandedModules[module._id] ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                                        <span className="section-title-text">{module.title}</span>
                                    </div>
                                    
                                    {expandedModules[module._id] && (
                                        <div className="session-items">
                                            {module.videos?.map(session => (
                                                <div 
                                                    key={session._id} 
                                                    className={`session-nav-link ${activeSession?._id === session._id ? 'active' : ''}`}
                                                    onClick={() => handleSessionSelect(session)}
                                                >
                                                    <span className="nav-text">{session.title}</span>
                                                    {isCompleted(session._id) && <Check size={14} className="completion-check" />}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="notes-pane">
                            <div className="empty-notes">
                                <BookOpen size={40} />
                                <p>No course-wide notes available.</p>
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Stage */}
            <main className="player-stage">
                <header className="stage-header">
                    <button className="stage-menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        <Menu size={20} />
                    </button>
                    <div className="stage-title">
                        {activeSession?.title}
                    </div>
                </header>

                <div className="viewport-scroller">
                    <div className="viewport">
                        {activeSession ? (
                            <div className="main-content-wrapper">
                                <div className="video-viewport-wrapper">
                                    <video 
                                        ref={videoRef}
                                        key={activeSession._id}
                                        src={activeSession.url} 
                                        poster={activeSession.thumbnail}
                                        controls 
                                        autoPlay
                                        className="articulate-video-element"
                                        onEnded={() => !isCompleted(activeSession._id) && toggleComplete(activeSession._id)}
                                        controlsList="nodownload"
                                        onContextMenu={(e) => e.preventDefault()}
                                    />
                                </div>

                                <div className="lesson-content-area">
                                    <div className="content-meta-grid">
                                        <div className="text-content">
                                            <h2 className="content-title">{activeSession.title}</h2>
                                            
                                            {/* Timestamps Section */}
                                            {activeSession.timestamps && activeSession.timestamps.length > 0 && (
                                                <div className="timestamps-block">
                                                    <h4 className="sub-title"><List size={14} /> Video Timestamps</h4>
                                                    <div className="timestamp-list">
                                                        {activeSession.timestamps.map((ts, i) => (
                                                            <button key={i} className="ts-btn" onClick={() => handleTimestampClick(ts.time)}>
                                                                <span className="ts-time">{Math.floor(ts.time / 60)}:{String(ts.time % 60).padStart(2, '0')}</span>
                                                                <span className="ts-label">{ts.label}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {activeSession.contentText ? (
                                                <div className="rich-text-body">
                                                    {activeSession.contentText.split('\n').map((para, i) => (
                                                        <p key={i}>{para}</p>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="no-content-msg">No additional text content for this lesson.</p>
                                            )}
                                        </div>

                                        <div className="lesson-side-actions">
                                            <button 
                                                className={`btn-complete-v2 ${isCompleted(activeSession._id) ? 'completed' : ''}`}
                                                onClick={() => toggleComplete(activeSession._id)}
                                            >
                                                {isCompleted(activeSession._id) ? <CheckCircle size={18} /> : <div className="circle-outline"></div>}
                                                {isCompleted(activeSession._id) ? 'Lesson Completed' : 'Mark as Complete'}
                                            </button>

                                            {activeSession.pdfUrl && !course?.restrictDownloads && (
                                                <a href={activeSession.pdfUrl} download target="_blank" rel="noopener noreferrer" className="btn-pdf">
                                                    <Download size={18} /> Download Curriculum
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="viewport-placeholder">
                                <Play size={64} />
                                <p>Loading course content...</p>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Footer Controls (Articulate Style) */}
                <footer className="player-controls-bar">
                    <div className="progress-minimal">
                        <div className="progress-line-bg">
                            <div 
                                className="progress-line-fill" 
                                style={{ width: `${(completedLessons.length / (curriculum.reduce((acc, m) => acc + (m.videos?.length || 0), 0)) * 100) || 0}%` }}
                            ></div>
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
};

export default CoursePlayer;
