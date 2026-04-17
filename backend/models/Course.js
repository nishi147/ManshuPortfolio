const mongoose = require('mongoose');

const courseSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    order: {
      type: Number,
      default: 0
    },
    category: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
    },
    demoVideo: {
      type: String,
    },

    isPublic: {
      type: Boolean,
      default: true,
    },
    shareableLink: {
      type: String,
    },
    password: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Course = mongoose.model('Course', courseSchema);
module.exports = Course;
