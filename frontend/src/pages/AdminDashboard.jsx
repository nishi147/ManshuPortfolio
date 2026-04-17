import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Edit, Trash, X, Plus, ChevronUp, ChevronDown } from 'lucide-react';
import ConfirmModal from '../components/common/ConfirmModal';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user, login } = useContext(AuthContext);
const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const [courses, setCourses] = useState([]);
  // Form stats
  const [courseFormData, setCourseFormData] = useState({
    title: '', category: '', isPublic: true, demoVideo: ''
  });
  const [thumbnail, setThumbnail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [isNewCategory, setIsNewCategory] = useState(false);
  
  // Custom Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);

  // Password Change States
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Get unique categories for dropdown
  const uniqueCategories = [...new Set(courses.map(c => c.category))].filter(Boolean);

  const FILE_SIZE_LIMITS = {
    thumbnail: 5 * 1024 * 1024, // 5MB
    video: 100 * 1024 * 1024,   // 100MB
    doc: 20 * 1024 * 1024       // 20MB
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchCourses();
    }
  }, [user]);

  const fetchCourses = async () => {
    try {
      const response = await fetch('https://manshu-portfolio-frhd.vercel.app/api/courses');
      const data = await response.json();
      setCourses(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCourse = (id) => {
    setCourseToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteCourse = async () => {
    if (!courseToDelete) return;
    try {
      const response = await fetch(`https://manshu-portfolio-frhd.vercel.app/api/courses/${courseToDelete}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      if (response.ok) {
        fetchCourses();
        setIsDeleteModalOpen(false);
        setCourseToDelete(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReorder = async (index, direction) => {
    const newCourses = [...courses];
    
    if (direction === 'up' && index > 0) {
      [newCourses[index - 1], newCourses[index]] = [newCourses[index], newCourses[index - 1]];
    } else if (direction === 'down' && index < newCourses.length - 1) {
      [newCourses[index], newCourses[index + 1]] = [newCourses[index + 1], newCourses[index]];
    } else {
      return;
    }

    setCourses(newCourses);

    const orderedIds = newCourses.map(c => c._id);

    try {
      await fetch('https://manshu-portfolio-frhd.vercel.app/api/courses/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ orderedIds })
      });
    } catch (err) {
      console.error('Failed to reorder', err);
    }
  };

  const handleEdit = (course) => {
    setIsEditing(true);
    setEditingCourseId(course._id);
    setCourseFormData({
      title: course.title,
      category: course.category,
      isPublic: course.isPublic,
      demoVideo: course.demoVideo || ''
    });
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditingCourseId(null);
    setCourseFormData({ title: '', category: '', isPublic: true, demoVideo: '' });
    setThumbnail(null);
    setIsNewCategory(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setError('');
    
    // File Size Validation
    if (thumbnail && thumbnail.size > FILE_SIZE_LIMITS.thumbnail) {
      return setError('Thumbnail size should be less than 5MB');
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('title', courseFormData.title);
      formData.append('category', courseFormData.category);
      formData.append('isPublic', courseFormData.isPublic);
      formData.append('demoVideo', courseFormData.demoVideo);
      if (thumbnail) formData.append('thumbnail', thumbnail);

      const xhr = new XMLHttpRequest();
      const method = isEditing ? 'PUT' : 'POST';
      const cleanId = String(editingCourseId).trim();
      const url = isEditing ? `/api/courses/${cleanId}` : '/api/courses';
      
      console.log(`Starting Upload: ${method} ${url}`);
      xhr.open(method, url, true);
      xhr.setRequestHeader('Authorization', `Bearer ${user.token}`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        setLoading(false);
        if (xhr.status >= 200 && xhr.status < 300) {
          setCourseFormData({ title: '', category: '', isPublic: true, demoVideo: '' });
          setThumbnail(null);
          setIsEditing(false);
          setEditingCourseId(null);
          setUploadProgress(0);
          fetchCourses();
        } else {
          console.error(`XHR Error Status: ${xhr.status}`);
          console.error(`XHR Error Response: ${xhr.responseText}`);
          try {
            const errorData = JSON.parse(xhr.responseText);
            setError(errorData.message || 'Failed to process request');
          } catch (e) {
            setError(`Server Error (${xhr.status}): ${xhr.statusText}`);
          }
        }
      };

      xhr.onerror = () => {
        setLoading(false);
        setError('Network error during upload');
      };

      xhr.send(formData);
    } catch (err) {
      console.error(err);
      setError('An error occurred while creating the course');
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      return setPasswordError('New passwords do not match');
    }

    if (passwordFormData.newPassword.length < 6) {
      return setPasswordError('Password must be at least 6 characters');
    }

    setPasswordLoading(true);

    try {
      const response = await fetch('https://manshu-portfolio-frhd.vercel.app/api/auth/update-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordFormData.currentPassword,
          newPassword: passwordFormData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordSuccess('Password updated successfully');
        setPasswordFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setTimeout(() => {
          setIsPasswordModalOpen(false);
          setPasswordSuccess('');
        }, 2000);
      } else {
        setPasswordError(data.message || 'Failed to update password');
      }
    } catch (err) {
      console.error(err);
      setPasswordError('An error occurred. Please try again.');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="admin-login-container fade-in">
        <form className="glass-panel login-form" onSubmit={handleLogin}>
          <h2>Admin Access</h2>
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary">Login</button>
        </form>
      </div>
    );
  }

  return (
    <>
      <div className="admin-dashboard fade-in">
        <div className="container">
          <div className="admin-header-flex">
            <h1>Admin Dashboard</h1>
            <div className="header-actions">
              <div className="password-popup-wrapper">
                <button 
                  className="btn btn-secondary btn-sm" 
                  onClick={() => setIsPasswordModalOpen(true)}
                >
                  Change Password
                </button>
                
                {isPasswordModalOpen && (
                  <div className="password-popup-content glass-panel fade-in">
                    <div className="modal-header">
                      <h3>Change Admin Password</h3>
                      <button className="close-btn" onClick={() => setIsPasswordModalOpen(false)}>
                        <X size={20} />
                      </button>
                    </div>
                    
                    <form onSubmit={handleUpdatePassword} className="admin-form">
                      {passwordError && <div className="error-message">{passwordError}</div>}
                      {passwordSuccess && <div className="success-message">{passwordSuccess}</div>}
                      
                      <div className="form-group">
                        <label>Current Password</label>
                        <input 
                          type="password" 
                          value={passwordFormData.currentPassword} 
                          onChange={e => setPasswordFormData({...passwordFormData, currentPassword: e.target.value})} 
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>New Password</label>
                        <input 
                          type="password" 
                          value={passwordFormData.newPassword} 
                          onChange={e => setPasswordFormData({...passwordFormData, newPassword: e.target.value})} 
                          required
                          placeholder="Min 6 characters"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Confirm New Password</label>
                        <input 
                          type="password" 
                          value={passwordFormData.confirmPassword} 
                          onChange={e => setPasswordFormData({...passwordFormData, confirmPassword: e.target.value})} 
                          required
                        />
                      </div>
                      
                      <div className="modal-footer">
                        <button 
                          type="button" 
                          className="btn btn-secondary" 
                          onClick={() => setIsPasswordModalOpen(false)}
                          disabled={passwordLoading}
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          className="btn btn-primary" 
                          disabled={passwordLoading}
                        >
                          {passwordLoading ? 'Updating...' : 'Update Password'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
              <div className="stats-badge">
                <span className="label">Total Courses</span>
                <span className="count">{courses.length}</span>
              </div>
            </div>
          </div>

          <div className="dashboard-content">
            <div className="create-section glass-panel">
              <div className="section-header navy-bar">
                <h3>{isEditing ? 'EDIT COURSE' : 'CREATE COURSE'}</h3>
                {isEditing && (
                  <button className="btn btn-sm btn-secondary" onClick={cancelEdit}>
                    <Plus size={16} /> New Course
                  </button>
                )}
              </div>
               <form onSubmit={handleCreateCourse} className="admin-form">
                 <div className="form-group">
                   <label>Title</label>
                   <input type="text" value={courseFormData.title} onChange={e => setCourseFormData({...courseFormData, title: e.target.value})} required/>
                 </div>
                 <div className="form-group">
                   <label>Category</label>
                   {!isNewCategory ? (
                     <select 
                       value={courseFormData.category} 
                       onChange={(e) => {
                         if (e.target.value === 'ADD_NEW') {
                           setIsNewCategory(true);
                           setCourseFormData({...courseFormData, category: ''});
                         } else {
                           setCourseFormData({...courseFormData, category: e.target.value});
                         }
                       }}
                       required
                     >
                       <option value="">Select Category</option>
                       {uniqueCategories.map(cat => (
                         <option key={cat} value={cat}>{cat}</option>
                       ))}
                       <option value="ADD_NEW">+ Add New Category</option>
                     </select>
                   ) : (
                     <div className="new-category-input">
                       <input 
                         type="text" 
                         value={courseFormData.category} 
                         placeholder="Enter new category name"
                         onChange={e => setCourseFormData({...courseFormData, category: e.target.value})} 
                         required
                         autoFocus
                       />
                       <button 
                         type="button" 
                         className="btn-text" 
                         onClick={() => {
                           setIsNewCategory(false);
                           setCourseFormData({...courseFormData, category: ''});
                         }}
                       >
                         <X size={14} /> Cancel
                       </button>
                     </div>
                   )}
                 </div>
                  <div className="form-group">
                    <label>Demo Video (Paste Link)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. https://www.youtube.com/watch?v=..." 
                      value={courseFormData.demoVideo} 
                      onChange={e => setCourseFormData({...courseFormData, demoVideo: e.target.value})} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Thumbnail (Image)</label>
                    <input type="file" accept="image/*" onChange={e => setThumbnail(e.target.files[0])} />
                  </div>
                  <div className="form-group checkbox-group">
                    <label>
                      <input type="checkbox" checked={courseFormData.isPublic} onChange={e => setCourseFormData({...courseFormData, isPublic: e.target.checked})}/>
                      Public Course
                    </label>
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Processing...' : (isEditing ? 'Update Course' : 'Create Course')}
                  </button>
                  
                  {loading && (
                    <div className="upload-progress-container">
                      <div className="progress-bar-wrapper">
                        <div 
                          className="progress-bar-fill" 
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <div className="progress-status">
                        {uploadProgress < 100 
                          ? `Uploading: ${uploadProgress}%` 
                          : 'Finalizing course (Cloudinary)...'}
                      </div>
                    </div>
                  )}
               </form>
            </div>

            <div className="courses-list glass-panel">
              <h3>Manage Courses</h3>
              {courses.length > 0 ? (
                <ul className="admin-list">
                  {courses.map((course, index) => (
                    <li key={course._id} className="admin-list-item">
                      <div className="course-item-info">
                        <strong>{course.title}</strong>
                        <span className="badge">{course.isPublic ? 'Public' : 'Private'}</span>
                      </div>
                      <div className="course-item-actions">
                        <button className="icon-btn" disabled={index === 0} onClick={() => handleReorder(index, 'up')} title="Move Up">
                          <ChevronUp size={18} />
                        </button>
                        <button className="icon-btn" disabled={index === courses.length - 1} onClick={() => handleReorder(index, 'down')} title="Move Down">
                          <ChevronDown size={18} />
                        </button>
                        <button className="icon-btn" title="Edit" onClick={() => handleEdit(course)}>
                          <Edit size={18} />
                        </button>
                        <button className="icon-btn delete" title="Delete" onClick={() => handleDeleteCourse(course._id)}>
                          <Trash size={18} />
                        </button>
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => navigate(`/admin/course/${course._id}/content`)}
                        >
                          Manage Content
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                 <p>No courses created yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        title="Delete Course"
        message="Are you sure you want to permanently delete this course and all its data? This action cannot be undone."
        onConfirm={confirmDeleteCourse}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setCourseToDelete(null);
        }}
      />
    </>
  );
};

export default AdminDashboard;

