const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middlewares/authMiddleware');
const Course = require('../models/Course');
const Module = require('../models/Module');
const Video = require('../models/Video');
const crypto = require('crypto');
const { upload, cloudinary } = require('../config/cloudinary');

// @desc    Get Cloudinary Signature for Direct Upload
// @route   GET /api/courses/signature
router.get('/signature', protect, admin, (req, res) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp: timestamp,
        folder: 'manshu_uploads',
      },
      process.env.CLOUDINARY_API_SECRET
    );
    res.json({
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Reorder courses
// @route   PUT /api/courses/reorder
router.put('/reorder', protect, admin, async (req, res) => {
  try {
    const { orderedIds } = req.body;
    // Iterate and update order
    for (let i = 0; i < orderedIds.length; i++) {
        await Course.findByIdAndUpdate(orderedIds[i], { order: i });
    }
    res.json({ message: 'Courses reordered successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update course
// @route   PUT /api/courses/:id
router.put('/:id', protect, admin, upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'demoVideoFile', maxCount: 1 }
]), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const { title, category, isPublic, password, demoVideo, thumbnail } = req.body;
    
    course.title = title || course.title;

    course.category = category || course.category;
    if (isPublic !== undefined) {
      course.isPublic = isPublic === 'true' || isPublic === true;
    }
    course.password = password !== undefined ? password : course.password;
    
    if (thumbnail) {
      course.thumbnail = thumbnail;
    }
    if (demoVideo) {
      course.demoVideo = demoVideo;
    }

    if (req.files) {
      if (req.files['thumbnail'] && req.files['thumbnail'][0]) {
        course.thumbnail = req.files['thumbnail'][0].path;
      }
      // Check for video file upload
      if (req.files['demoVideoFile'] && req.files['demoVideoFile'][0]) {
        course.demoVideo = req.files['demoVideoFile'][0].path;
      }
    }

    const updatedCourse = await course.save();
    res.json(updatedCourse);
  } catch (error) {
    console.error('Course Update Error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all courses (public or token-auth)
// @route   GET /api/courses
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find().sort({ order: 1, createdAt: -1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get single course by ID or link
// @route   GET /api/courses/:id
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create course
// @route   POST /api/courses
router.post('/', protect, admin, (req, res, next) => {
  console.log('--- Course Upload Request Started ---');
  console.log('Headers:', req.headers['content-type']);
  next();
}, upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'demoVideoFile', maxCount: 1 },
  { name: 'curriculum', maxCount: 1 }
]), async (req, res) => {
  console.log('Multer processing complete.');
  console.log('Body data received:', req.body);
  console.log('Files received:', req.files ? Object.keys(req.files) : 'None');
  
    const { title, category, isPublic, password, demoVideo: bodyDemoVideo, thumbnail: bodyThumbnail } = req.body;
    
    try {
      console.log('--- DB Save Process Started ---');
      const shareableLink = crypto.randomBytes(8).toString('hex');
      
      // Extract file paths safely
      let thumbnail = bodyThumbnail || '';
      let demoVideo = bodyDemoVideo || ''; // Use link from body if provided

      if (req.files) {
        if (req.files['thumbnail'] && req.files['thumbnail'][0]) {
          thumbnail = req.files['thumbnail'][0].path;
          console.log('Thumbnail path:', thumbnail);
        }
        if (req.files['demoVideoFile'] && req.files['demoVideoFile'][0]) {
          demoVideo = req.files['demoVideoFile'][0].path;
          console.log('Video file path:', demoVideo);
        }
      }

    console.log('Creating course document...');
    const course = new Course({
      title,
      category,
      thumbnail,
      demoVideo,
      isPublic: isPublic === 'true' || isPublic === true,
      password,
      shareableLink
    });
    
    console.log('Saving to MongoDB...');
    const createdCourse = await course.save();
    console.log('Course saved successfully:', createdCourse._id);
    res.status(201).json(createdCourse);
  } catch (error) {
    console.error('CRITICAL: Course Save Error:', error);
    res.status(500).json({ 
      message: 'Failed to save course to database',
      error: error.message 
    });
  }
});

// @desc    Delete course
// @route   DELETE /api/courses/:id
router.delete('/:id', protect, admin, async (req, res) => {
  console.log(`DELETE request received for ID: ${req.params.id}`);
  try {
    const course = await Course.findById(req.params.id);
    if (course) {
      await course.deleteOne();
      res.json({ message: 'Course removed' });
    } else {
      res.status(404).json({ message: 'Course not found' });
    }
  } catch (error) {
    console.error('Delete Error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get course curriculum (Modules + Videos)
// @route   GET /api/courses/:id/curriculum
router.get('/:id/curriculum', async (req, res) => {
  try {
    const modules = await Module.find({ courseId: req.params.id }).sort({ order: 1 }).lean();
    
    // Fetch videos for all modules in parallel
    const modulesWithVideos = await Promise.all(
      modules.map(async (mod) => {
        const videos = await Video.find({ moduleId: mod._id }).sort({ order: 1 }).lean();
        return { ...mod, videos };
      })
    );
    
    res.json(modulesWithVideos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
