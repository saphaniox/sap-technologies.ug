const mongoose = require("mongoose");

// Session tracking model
const visitorSessionSchema = new mongoose.Schema({
  // Unique session identifier (generated client-side and stored in cookie)
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  
  // Visitor fingerprint for identifying returning visitors
  fingerprint: {
    type: String,
    index: true
  },
  
  // IP address
  ipAddress: {
    type: String,
    required: true
  },
  
  // User agent details
  userAgent: {
    browser: String,
    version: String,
    os: String,
    platform: String,
    device: String,
    raw: String
  },
  
  // Geographic location (can be enriched with IP geolocation service)
  location: {
    country: String,
    region: String,
    city: String,
    latitude: Number,
    longitude: Number,
    timezone: String
  },
  
  // Referrer information
  referrer: {
    url: String,
    domain: String,
    source: String // organic, direct, social, referral, etc.
  },
  
  // UTM parameters for marketing tracking
  utm: {
    source: String,
    medium: String,
    campaign: String,
    term: String,
    content: String
  },
  
  // Session timing
  firstSeen: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  lastSeen: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Session duration in seconds
  duration: {
    type: Number,
    default: 0
  },
  
  // Total page views in this session
  pageViews: {
    type: Number,
    default: 1
  },
  
  // Is this a unique visitor (first time)?
  isUnique: {
    type: Boolean,
    default: true
  },
  
  // Is this a returning visitor?
  isReturning: {
    type: Boolean,
    default: false
  },
  
  // Associated user ID if they log in
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  }
}, {
  timestamps: true
});

// Page view tracking model
const pageViewSchema = new mongoose.Schema({
  // Reference to session
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  
  // Reference to visitor session document
  visitorSessionRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "VisitorSession",
    index: true
  },
  
  // Page details
  page: {
    path: {
      type: String,
      required: true,
      index: true
    },
    title: String,
    url: String,
    query: String
  },
  
  // Timing
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Time spent on page (in seconds)
  timeOnPage: {
    type: Number,
    default: 0
  },
  
  // Scroll depth percentage
  scrollDepth: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Page performance metrics
  performance: {
    loadTime: Number, // Page load time in ms
    domReady: Number,
    timeToInteractive: Number
  },
  
  // Events triggered on this page
  events: [{
    name: String,
    value: String,
    timestamp: Date
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
visitorSessionSchema.index({ firstSeen: -1 });
visitorSessionSchema.index({ isUnique: 1, firstSeen: -1 });
visitorSessionSchema.index({ fingerprint: 1, firstSeen: -1 });
pageViewSchema.index({ timestamp: -1 });
pageViewSchema.index({ "page.path": 1, timestamp: -1 });

// Methods for VisitorSession
visitorSessionSchema.methods.updateLastSeen = function() {
  this.lastSeen = new Date();
  this.duration = Math.floor((this.lastSeen - this.firstSeen) / 1000);
  return this.save();
};

visitorSessionSchema.methods.incrementPageViews = function() {
  this.pageViews += 1;
  return this.updateLastSeen();
};

// Static methods for analytics
visitorSessionSchema.statics.getUniqueVisitors = async function(startDate, endDate) {
  return this.countDocuments({
    isUnique: true,
    firstSeen: { $gte: startDate, $lte: endDate }
  });
};

visitorSessionSchema.statics.getTotalSessions = async function(startDate, endDate) {
  return this.countDocuments({
    firstSeen: { $gte: startDate, $lte: endDate }
  });
};

visitorSessionSchema.statics.getTopCountries = async function(startDate, endDate, limit = 10) {
  return this.aggregate([
    {
      $match: {
        firstSeen: { $gte: startDate, $lte: endDate },
        "location.country": { $exists: true, $ne: null }
      }
    },
    {
      $group: {
        _id: "$location.country",
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: limit },
    {
      $project: {
        country: "$_id",
        count: 1,
        _id: 0
      }
    }
  ]);
};

pageViewSchema.statics.getTopPages = async function(startDate, endDate, limit = 10) {
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: "$page.path",
        views: { $sum: 1 },
        avgTimeOnPage: { $avg: "$timeOnPage" },
        avgScrollDepth: { $avg: "$scrollDepth" }
      }
    },
    { $sort: { views: -1 } },
    { $limit: limit },
    {
      $project: {
        path: "$_id",
        views: 1,
        avgTimeOnPage: { $round: ["$avgTimeOnPage", 0] },
        avgScrollDepth: { $round: ["$avgScrollDepth", 0] },
        _id: 0
      }
    }
  ]);
};

pageViewSchema.statics.getTotalPageViews = async function(startDate, endDate) {
  return this.countDocuments({
    timestamp: { $gte: startDate, $lte: endDate }
  });
};

const VisitorSession = mongoose.model("VisitorSession", visitorSessionSchema);
const PageView = mongoose.model("PageView", pageViewSchema);

module.exports = { VisitorSession, PageView };
