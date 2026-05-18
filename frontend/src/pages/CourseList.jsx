import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Filter, X, ChevronRight } from 'lucide-react';
import './CourseList.css';

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(9);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('https://manshu-portfolio-frhd.vercel.app/api/courses');
        const data = await response.json();
        setCourses(data.filter(c => c.isPublic));
      } catch (err) {
        console.error(err);
      }
    };
    fetchCourses();
  }, []);

  const getCategories = () => {
    const categoryCounts = { 'All': courses.length };
    courses.forEach(course => {
      const cat = course.category || 'Uncategorized';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
    return Object.entries(categoryCounts).map(([name, count]) => ({ name, count }));
  };

  const categories = getCategories();

  const handleCategorySelect = (catName) => {
    setActiveCategory(catName);
    setIsSidebarOpen(false); // Universal close on select
    setVisibleCount(9); // Reset count on category change
  };

  const loadMore = () => {
    setVisibleCount(prev => prev + 9);
  };

  const filteredCourses = courses.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) || 
                          (c.category && c.category.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = activeCategory === 'All' || c.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className={`course-list-page fade-in`}>
      
      {/* Universal Sidebar Backdrop */}
      {isSidebarOpen && <div className="portfolio-backdrop" onClick={() => setIsSidebarOpen(false)}></div>}

      <div className="portfolio-layout">
        
        {/* UNIVERSAL DYNAMIC SIDEBAR */}
        <aside className={`portfolio-sidebar ${isSidebarOpen ? 'show' : ''}`}>
          <div className="sidebar-header-header">
            <span>Sections</span>
            <button onClick={() => setIsSidebarOpen(false)} className="close-sidebar-btn"><X size={20} /></button>
          </div>
          <ul className="sections-list">
            {categories.map((cat, idx) => (
              <li 
                key={idx} 
                className={activeCategory === cat.name ? 'active' : ''}
                onClick={() => handleCategorySelect(cat.name)}
              >
                {cat.name} <span className="portfolio-badge">{cat.count}</span>
              </li>
            ))}
          </ul>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="portfolio-main">
          {/* Search Header Area */}
          <div className="course-list-header">
            <div className="container header-content-container">
              <div className="header-top-row">
                <div className="title-area">
                    <h1>Explore Our Catalog</h1>
                    <p className="subtitle">Find the perfect course to level up your skills.</p>
                </div>
                <button className="filter-toggle-btn active-universal" onClick={() => setIsSidebarOpen(true)}>
                  <Filter size={18} /> Filters
                </button>
              </div>
              
              <div className="search-bar glass-panel">
                <input 
                  type="text" 
                  placeholder="Search courses..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="container">
            {/* Courses Grid */}
            <div className="portfolio-grid">
                {filteredCourses.slice(0, visibleCount).map((course, index) => (
                <motion.div 
                    key={course._id} 
                    className="portfolio-card"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: (index % 9) * 0.05 }}
                >
                    <div className="portfolio-thumb">
                    {course.thumbnail ? (
                        <img src={course.thumbnail} alt={course.title} />
                    ) : (
                        <div className="placeholder-img">No Image</div>
                    )}
                    <div className="course-tag">{course.category || 'Course'}</div>
                    </div>
                    <div className="portfolio-title">
                    {course.title}
                    </div>
                    <div className="portfolio-footer">
                        <Link to={`/course/${course._id}`} className="portfolio-btn">
                          View Course <ChevronRight size={14} />
                        </Link>
                    </div>
                </motion.div>
                ))}
            </div>

            {filteredCourses.length > visibleCount && (
                <div className="load-more-container">
                    <button className="load-more-btn" onClick={loadMore}>
                        See More
                    </button>
                </div>
            )}

            {filteredCourses.length === 0 && (
                <p className="no-results">No courses found matching your criteria.</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CourseList;
