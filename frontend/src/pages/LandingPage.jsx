import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { PlayCircle } from 'lucide-react';
import './LandingPage.css';

const isVideoUrl = (url) => {
  if (!url) return false;
  const lowercaseUrl = url.toLowerCase();
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.3gp', '.m4v'];
  return videoExtensions.some(ext => lowercaseUrl.includes(ext)) || 
         lowercaseUrl.includes('video/upload') || 
         (lowercaseUrl.includes('res.cloudinary.com') && lowercaseUrl.includes('/video/'));
};

const getBaseUrl = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5000';
  }
  return 'https://manshu-portfolio-frhd.vercel.app';
};

const BASE_URL = getBaseUrl();

const LandingPage = () => {
  const [featuredCourses, setFeaturedCourses] = useState([]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/courses`);
        const data = await response.json();
        // Just take public ones
        const publicCourses = data.filter(c => c.isPublic).slice(0, 3);
        setFeaturedCourses(publicCourses);
      } catch (error) {
        console.error("Error fetching courses", error);
      }
    };
    fetchCourses();
  }, []);

  return (
    <div className="landing-page fade-in">
      {/* Hero Section */}
      <section className="hero dark-hero">
        <div className="container hero-container">
          <motion.div 
            className="hero-content"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="hero-title">Master the Future with <span className="highlight">Manshu Learning</span></h1>
            <p className="hero-subtitle">High-end, premium educational content designed to elevate your skills to the next level.</p>
            <div className="hero-actions">
              <Link to="/courses" className="btn btn-primary btn-large">Explore Courses</Link>
            </div>
          </motion.div>
          
          <motion.div 
            className="hero-image-wrapper"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
             <div className="hero-floating-card">
                <div className="badge-teal">Professional Excellence</div>
                <div className="card-stats">
                   <div className="stat-item">
                      <span className="stat-num">10+</span>
                      <span className="stat-label">Years Exp.</span>
                   </div>
                   <div className="stat-item">
                      <span className="stat-num">95%</span>
                      <span className="stat-label">Satisfaction</span>
                   </div>
                   <div className="stat-item">
                      <span className="stat-num">50+</span>
                      <span className="stat-label">Clients</span>
                   </div>
                </div>
             </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="featured-courses">
        <div className="container">
          <Link to="/courses" className="section-header">
            <h2>Featured Courses</h2>
            <span className="view-all-link">View all</span>
          </Link>
          
          <div className="portfolio-grid">
            {featuredCourses.length > 0 ? (
              featuredCourses.map((course, index) => (
                <motion.div 
                  key={course._id} 
                  className="portfolio-card"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -10 }}
                >
                  <div className="portfolio-thumb">
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt={course.title} />
                    ) : (
                      <div className="placeholder-img">No Image</div>
                    )}
                  </div>
                  <div className="portfolio-title">
                    {course.title}
                  </div>
                  <div className="portfolio-footer">
                      {course.demoVideo ? (
                        <a 
                          href={isVideoUrl(course.demoVideo) 
                            ? `/preview?url=${encodeURIComponent(course.demoVideo)}&title=${encodeURIComponent(course.title)}` 
                            : (course.demoVideo.startsWith('http') || course.demoVideo.startsWith('/') ? course.demoVideo : `https://${course.demoVideo}`)} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="portfolio-btn"
                        >
                          View Course
                        </a>
                     ) : (
                       <Link to={`/course/${course._id}`} className="portfolio-btn">
                         View Details
                       </Link>
                     )}
                  </div>
                </motion.div>
              ))
            ) : (
              <p className="no-courses">No featured courses available yet.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
