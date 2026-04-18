import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Plus, Trash, Video, ChevronDown, ChevronUp, Loader, Play } from 'lucide-react';
import ConfirmModal from '../components/common/ConfirmModal';
import './AdminDashboard.css'; // Reusing some styles

const ManageContent = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [course, setCourse] = useState(null);
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Module Form
    const [moduleTitle, setModuleTitle] = useState('');
    
    // Video Form
    const [videoTitle, setVideoTitle] = useState('');
    const [videoDesc, setVideoDesc] = useState('');
    const [videoContent, setVideoContent] = useState('');
    const [videoFile, setVideoFile] = useState(null);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [pdfFile, setPdfFile] = useState(null);
    const [timestampText, setTimestampText] = useState('');
    const [activeModuleId, setActiveModuleId] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const [expandedModules, setExpandedModules] = useState({});

    // Modal State
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        type: '' // 'module' or 'video'
    });
    const [itemToDelete, setItemToDelete] = useState(null);

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/admin');
            return;
        }
        fetchCourseData();
    }, [id]);

    const fetchCourseData = async () => {
        try {
            const [courseRes, curriculumRes] = await Promise.all([
                fetch(`https://manshu-portfolio-frhd.vercel.app/api/courses/${id}`),
                fetch(`https://manshu-portfolio-frhd.vercel.app/api/courses/${id}/curriculum`)
            ]);
            const courseData = await courseRes.json();
            const curriculumData = await curriculumRes.json();
            
            setCourse(courseData);
            setModules(curriculumData);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch data');
            setLoading(false);
        }
    };

    const toggleModule = (modId) => {
        setExpandedModules(prev => ({
            ...prev,
            [modId]: !prev[modId]
        }));
    };

    const handleBack = () => navigate('/admin');

    const handleAddModule = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('https://manshu-portfolio-frhd.vercel.app/api/modules', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    courseId: id,
                    title: moduleTitle,
                    order: modules.length + 1
                })
            });
            if (res.ok) {
                setModuleTitle('');
                fetchCourseData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteModule = (modId) => {
        setItemToDelete(modId);
        setModalConfig({
            isOpen: true,
            title: 'Delete Module',
            message: 'Are you sure you want to delete this module and ALL its sessions? This cannot be undone.',
            type: 'module'
        });
    };

    const confirmDeleteModule = async (modId) => {
        try {
            const res = await fetch(`https://manshu-portfolio-frhd.vercel.app/api/modules/${modId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${user.token}` }
            });
            if (res.ok) {
                fetchCourseData();
                closeModal();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const closeModal = () => {
        setModalConfig({ ...modalConfig, isOpen: false });
        setItemToDelete(null);
    };

    const parseTimestamps = (text) => {
        if (!text) return [];
        return text.split('\n')
            .map(line => {
                const match = line.match(/^(\d{1,2}):(\d{2})\s+(.*)$/);
                if (match) {
                    const minutes = parseInt(match[1]);
                    const seconds = parseInt(match[2]);
                    return { time: minutes * 60 + seconds, label: match[3].trim() };
                }
                return null;
            })
            .filter(item => item !== null);
    };

    const handleUploadVideo = (e) => {
        e.preventDefault();
        if (!activeModuleId || !videoFile) return;

        setUploading(true);
        setProgress(0);
        setError('');

        const formData = new FormData();
        formData.append('moduleId', activeModuleId);
        formData.append('title', videoTitle);
        formData.append('description', videoDesc);
        formData.append('contentText', videoContent);
        formData.append('videoFile', videoFile);
        if (thumbnailFile) formData.append('thumbnailFile', thumbnailFile);
        if (pdfFile) formData.append('pdfFile', pdfFile);
        
        const parsedTimestamps = parseTimestamps(timestampText);
        formData.append('timestamps', JSON.stringify(parsedTimestamps));
        
        // Count existing videos in this module for order
        const mod = modules.find(m => m._id === activeModuleId);
        formData.append('order', (mod.videos?.length || 0) + 1);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://manshu-portfolio-frhd.vercel.app/api/videos', true);
        xhr.timeout = 120000; // 120 seconds for video
        xhr.setRequestHeader('Authorization', `Bearer ${user.token}`);

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percent = Math.round((event.loaded / event.total) * 100);
                setProgress(percent);
            }
        };

        xhr.onload = () => {
            setUploading(false);
            if (xhr.status >= 200 && xhr.status < 300) {
                setVideoTitle('');
                setVideoDesc('');
                setVideoContent('');
                setVideoFile(null);
                setThumbnailFile(null);
                setPdfFile(null);
                setTimestampText('');
                setActiveModuleId(null);
                fetchCourseData();
            } else {
                if (xhr.status === 504) {
                  setError('Server Timeout (Video is large or connection is slow).');
                } else if (xhr.status === 413) {
                  setError('Video file is too large for the server limits.');
                } else {
                  setError(`Upload failed (${xhr.status}): ${xhr.statusText || 'Unknown error'}`);
                }
            }
        };

        xhr.ontimeout = () => {
            setUploading(false);
            setError('Upload timed out. The video file might be too large for the server to process.');
        };

        xhr.onerror = () => {
            setUploading(false);
            setError('Network error during upload');
        };

        xhr.send(formData);
    };

    const handleDeleteVideo = (videoId) => {
        setItemToDelete(videoId);
        setModalConfig({
            isOpen: true,
            title: 'Delete Session',
            message: 'Are you sure you want to permanently delete this session?',
            type: 'video'
        });
    };

    const confirmDeleteVideo = async (videoId) => {
        try {
            const res = await fetch(`https://manshu-portfolio-frhd.vercel.app/api/videos/${videoId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${user.token}` }
            });
            if (res.ok) {
                fetchCourseData();
                closeModal();
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="loader-container"><Loader className="spinner" /></div>;

    return (
        <div className="manage-content-page fade-in">
            <div className="container">
                <div className="manage-header">
                    <button onClick={handleBack} className="btn btn-secondary btn-sm">← Back to Dashboard</button>
                    <h1>Manage Curriculum: {course?.title}</h1>
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="manage-grid">
                    {/* Left: Module Management */}
                    <div className="modules-management glass-panel">
                        <div className="section-header navy-bar">
                            <h3>Modules</h3>
                        </div>
                        
                        <form onSubmit={handleAddModule} className="add-module-form">
                            <input 
                                type="text" 
                                placeholder="New Module Title..." 
                                value={moduleTitle}
                                onChange={e => setModuleTitle(e.target.value)}
                                required
                            />
                            <button type="submit" className="btn btn-primary"><Plus size={18} /> Add Module</button>
                        </form>

                        <div className="modules-list">
                            {modules.map(mod => (
                                <div key={mod._id} className={`module-accordion ${expandedModules[mod._id] ? 'expanded' : ''}`}>
                                    <div className="module-header" onClick={() => toggleModule(mod._id)}>
                                        <div className="header-left">
                                            {expandedModules[mod._id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                            <span>{mod.title}</span>
                                            <span className="count-badge">{mod.videos?.length || 0} Sessions</span>
                                        </div>
                                        <div className="header-right">
                                            <button className="icon-btn delete" onClick={(e) => { e.stopPropagation(); handleDeleteModule(mod._id); }}>
                                                <Trash size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {expandedModules[mod._id] && (
                                        <div className="module-body">
                                            <button 
                                                className="btn btn-sm btn-outline" 
                                                onClick={() => setActiveModuleId(mod._id)}
                                            >
                                                <Plus size={14} /> Add Session
                                            </button>
                                            
                                            <ul className="sessions-list">
                                                {mod.videos?.map(vid => (
                                                    <li key={vid._id} className="session-item">
                                                        <div className="session-info">
                                                            <Video size={14} />
                                                            <span>{vid.title}</span>
                                                            <a href={vid.url ? ((vid.url.startsWith('http') || vid.url.startsWith('/')) ? vid.url : `https://${vid.url}`) : '#'} target="_blank" rel="noopener noreferrer" className="demo-link">
                                                                <Play size={12} /> Watch Demo
                                                            </a>
                                                        </div>
                                                        <button className="icon-btn delete sm" onClick={() => handleDeleteVideo(vid._id)}>
                                                            <Trash size={14} />
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Upload Section */}
                    <div className="upload-session-section glass-panel">
                        <div className="section-header navy-bar">
                            <h3>{activeModuleId ? 'Add Session to ' + (modules.find(m => m._id === activeModuleId)?.title) : 'Select a Module to add sessions'}</h3>
                        </div>
                        
                        {activeModuleId && (
                            <form onSubmit={handleUploadVideo} className="admin-form">
                                <div className="form-group">
                                    <label>Session Title</label>
                                    <input 
                                        type="text" 
                                        value={videoTitle} 
                                        onChange={e => setVideoTitle(e.target.value)} 
                                        required 
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Short Description</label>
                                    <textarea 
                                        value={videoDesc} 
                                        onChange={e => setVideoDesc(e.target.value)} 
                                        rows="2"
                                        required
                                    ></textarea>
                                </div>
                                <div className="form-group">
                                    <label>Lesson Content (Text/Lecture)</label>
                                    <textarea 
                                        value={videoContent} 
                                        onChange={e => setVideoContent(e.target.value)} 
                                        rows="6"
                                        placeholder="Add detailed lecture notes or text content here..."
                                    ></textarea>
                                </div>
                                <div className="form-group">
                                    <label>Timestamps (Format: MM:SS Title - one per line)</label>
                                    <textarea 
                                        value={timestampText} 
                                        onChange={e => setTimestampText(e.target.value)} 
                                        rows="3"
                                        placeholder="00:30 Introduction&#10;02:15 Demo Start"
                                    ></textarea>
                                </div>
                                <div className="form-row" style={{ display: 'flex', gap: '15px' }}>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label>Session Thumbnail (Optional)</label>
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            onChange={e => setThumbnailFile(e.target.files[0])} 
                                        />
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label>PDF Curriculum (Optional)</label>
                                        <input 
                                            type="file" 
                                            accept=".pdf" 
                                            onChange={e => setPdfFile(e.target.files[0])} 
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Video File (Required)</label>
                                    <input 
                                        type="file" 
                                        accept="video/*" 
                                        onChange={e => setVideoFile(e.target.files[0])} 
                                        required 
                                    />
                                </div>

                                <button type="submit" className="btn btn-primary" disabled={uploading}>
                                    {uploading ? 'Uploading...' : 'Upload Session'}
                                </button>

                                {uploading && (
                                    <div className="upload-progress-container">
                                        <div className="progress-bar-wrapper">
                                            <div 
                                                className="progress-bar-fill" 
                                                style={{ width: `${progress}%` }}
                                            ></div>
                                        </div>
                                        <div className="progress-status">Uploading Session: {progress}%</div>
                                    </div>
                                )}
                            </form>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmModal 
                isOpen={modalConfig.isOpen}
                title={modalConfig.title}
                message={modalConfig.message}
                onConfirm={() => {
                    if (modalConfig.type === 'module') confirmDeleteModule(itemToDelete);
                    if (modalConfig.type === 'video') confirmDeleteVideo(itemToDelete);
                }}
                onCancel={closeModal}
            />
        </div>
    );
};

export default ManageContent;
