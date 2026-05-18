import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import './VideoPreview.css';

const VideoPreview = () => {
  const [searchParams] = useSearchParams();
  const rawUrl = searchParams.get('url');
  const rawTitle = searchParams.get('title') || 'Course Demo';
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [loading, setLoading] = useState(true);

  // Parse and normalize the URL
  const getNormalizedUrl = (url) => {
    if (!url) return '';
    const decoded = decodeURIComponent(url);
    if (decoded.startsWith('http://') || decoded.startsWith('https://') || decoded.startsWith('/')) {
      return decoded;
    }
    return `https://${decoded}`;
  };

  const videoUrl = getNormalizedUrl(rawUrl);
  const title = decodeURIComponent(rawTitle);

  useEffect(() => {
    // Disable right-click globally on this page to prevent context menu download options
    const handleContextMenu = (e) => {
      e.preventDefault();
    };
    document.addEventListener('contextmenu', handleContextMenu);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      window.close();
    }
  };

  if (!rawUrl) {
    return (
      <div className="preview-error-container fade-in">
        <div className="glass-panel error-card">
          <Shield size={48} className="error-icon" />
          <h2>Invalid Preview URL</h2>
          <p>No video URL was provided or the link is broken.</p>
          <button onClick={handleBack} className="btn btn-primary">
            <ArrowLeft size={16} style={{ marginRight: '8px' }} /> Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="video-preview-page fade-in">
      <div className="preview-container">
        {/* Top Header Bar */}
        <div className="preview-header-bar glass-panel animate-slide-down">
          <button onClick={handleBack} className="back-button" title="Go Back">
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <div className="preview-title">
            <Shield size={16} className="secure-badge" />
            <h1>{title}</h1>
          </div>
          <div className="secure-badge-text">
            <span>Secure Stream</span>
          </div>
        </div>

        {/* Video Player Section */}
        <div className="video-stage-wrapper glass-panel">
          {loading && (
            <div className="player-loader-overlay">
              <div className="loader"></div>
              <p>Loading Secure Player...</p>
            </div>
          )}
          <video
            ref={videoRef}
            src={videoUrl}
            className="secured-video-player"
            controls
            autoPlay
            controlsList="nodownload"
            onCanPlay={() => setLoading(false)}
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>

        {/* Safety/Instructions footer */}
        <div className="preview-footer-note animate-fade-in">
          <Shield size={14} />
          <span>This player is protected against unauthorized copying. Downloads have been disabled.</span>
        </div>
      </div>
    </div>
  );
};

export default VideoPreview;
