import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Play, FileText, Download, CheckCircle, Video, BookOpen, ChevronRight } from 'lucide-react';
import './CourseDetail.css';

const CourseDetail = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [curriculum, setCurriculum] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseRes, curriculumRes] = await Promise.all([
          fetch(`https://manshu-portfolio-frhd.vercel.app/api/courses/${id}`),
          fetch(`https://manshu-portfolio-frhd.vercel.app/api/courses/${id}/curriculum`)
        ]);
        
        const courseData = await courseRes.json();
        const curriculumData = await curriculumRes.json();
        
        setCourse(courseData);
        setCurriculum(curriculumData);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const getYouTubeID = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const isYouTube = (url) => !!getYouTubeID(url);

  if (loading) return <div className="loader-container"><div className="loader"></div></div>;
  if (!course) return <div className="error-container">Course not found</div>;

  const totalSessions = curriculum.reduce((acc, mod) => acc + (mod.videos?.length || 0), 0);

  return (
    <div className="course-detail-page fade-in">
      <div className="course-hero">
        <div className="container hero-split">
          <div className="course-info">
             <span className="category-badge">{course.category}</span>
             <h1>{course.title}</h1>
             
             
             <div className="course-stats-mini">
                <span className="stat-item"><Video size={16} /> {totalSessions} Sessions</span>
                <span className="stat-item"><BookOpen size={16} /> {curriculum.length} Modules</span>
             </div>

             <div className="actions">
                <Link to={`/play/${course._id}`} className="btn btn-primary btn-large start-btn">
                  <Play size={20} fill="currentColor" /> Start Learning
                </Link>
                
                {course.curriculum && !course.restrictDownloads && (
                  <a href={course.curriculum} target="_blank" rel="noopener noreferrer" className="btn btn-secondary curriculum-btn">
                    <Download size={18} /> Download Syllabus
                  </a>
                )}
             </div>
          </div>

          <div className="course-preview center">
            <div className="preview-card glass-panel">
                <div className="preview-img">
                  {course.demoVideo ? (
                    isYouTube(course.demoVideo) ? (
                      <iframe 
                        className="preview-video"
                        src={`https://www.youtube.com/embed/${getYouTubeID(course.demoVideo)}`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    ) : (
                      <video 
                        src={course.demoVideo} 
                        controls 
                        className="preview-video" 
                        poster={course.thumbnail}
                        controlsList={course.restrictDownloads ? "nodownload" : undefined}
                        onContextMenu={course.restrictDownloads ? (e) => e.preventDefault() : undefined}
                      />
                    )
                  ) : course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} />
                  ) : (
                    <div className="placeholder-img">No Preview</div>
                  )}
                </div>
               <div className="preview-body">
                  <Link to={`/play/${course._id}`} className="btn btn-primary btn-block">
                    Get Started
                  </Link>
               </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container detail-content-grid">
          <div className="main-content-column">
             {/* Description and Curriculum removed as per request */}
          </div>
          
          <aside className="side-content-column">
              <div className="instructor-card glass-panel">
                 <h4>Instructor</h4>
                 <div className="instructor-info">
                    <div className="avatar">M</div>
                    <div>
                      <p className="name">Manshu</p>
                      <p className="title">Lead Instructor</p>
                    </div>
                 </div>
              </div>
          </aside>
      </div>
    </div>
  );
};

export default CourseDetail;
