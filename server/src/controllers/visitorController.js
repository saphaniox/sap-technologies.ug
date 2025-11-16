const { VisitorSession, PageView } = require("../models/Visitor");

class VisitorController {
  // Get visitor analytics overview
  static async getAnalytics(req, res) {
    try {
      const { 
        startDate, 
        endDate, 
        period = '7d' // 24h, 7d, 30d, 90d, all
      } = req.query;
      
      // Calculate date range
      let start, end;
      end = endDate ? new Date(endDate) : new Date();
      
      if (startDate) {
        start = new Date(startDate);
      } else {
        switch (period) {
          case '24h':
            start = new Date(Date.now() - 24 * 60 * 60 * 1000);
            break;
          case '7d':
            start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '30d':
            start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            break;
          case '90d':
            start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
            break;
          default:
            start = new Date(0); // All time
        }
      }
      
      // Parallel queries for better performance
      const [
        totalSessions,
        uniqueVisitors,
        totalPageViews,
        topPages,
        topCountries,
        recentSessions,
        sessionsByDay
      ] = await Promise.all([
        VisitorSession.getTotalSessions(start, end),
        VisitorSession.getUniqueVisitors(start, end),
        PageView.getTotalPageViews(start, end),
        PageView.getTopPages(start, end, 10),
        VisitorSession.getTopCountries(start, end, 10),
        VisitorSession.find({ firstSeen: { $gte: start, $lte: end } })
          .sort({ firstSeen: -1 })
          .limit(20)
          .select('sessionId ipAddress userAgent location firstSeen lastSeen pageViews duration isUnique'),
        VisitorSession.aggregate([
          {
            $match: {
              firstSeen: { $gte: start, $lte: end }
            }
          },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$firstSeen" }
              },
              sessions: { $sum: 1 },
              uniqueVisitors: { 
                $sum: { $cond: ["$isUnique", 1, 0] } 
              }
            }
          },
          { $sort: { _id: 1 } },
          {
            $project: {
              date: "$_id",
              sessions: 1,
              uniqueVisitors: 1,
              _id: 0
            }
          }
        ])
      ]);
      
      // Calculate averages
      const avgSessionDuration = await VisitorSession.aggregate([
        { $match: { firstSeen: { $gte: start, $lte: end } } },
        { $group: { _id: null, avg: { $avg: "$duration" } } }
      ]);
      
      const avgPageViewsPerSession = totalSessions > 0 ? 
        Math.round(totalPageViews / totalSessions * 10) / 10 : 0;
      
      // Browser and OS statistics
      const browserStats = await VisitorSession.aggregate([
        { $match: { firstSeen: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: "$userAgent.browser",
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $project: {
            browser: "$_id",
            count: 1,
            _id: 0
          }
        }
      ]);
      
      const osStats = await VisitorSession.aggregate([
        { $match: { firstSeen: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: "$userAgent.os",
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $project: {
            os: "$_id",
            count: 1,
            _id: 0
          }
        }
      ]);
      
      const deviceStats = await VisitorSession.aggregate([
        { $match: { firstSeen: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: "$userAgent.device",
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        {
          $project: {
            device: "$_id",
            count: 1,
            _id: 0
          }
        }
      ]);
      
      // Referrer sources
      const referrerStats = await VisitorSession.aggregate([
        { 
          $match: { 
            firstSeen: { $gte: start, $lte: end },
            "referrer.source": { $exists: true, $ne: null }
          } 
        },
        {
          $group: {
            _id: "$referrer.source",
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        {
          $project: {
            source: "$_id",
            count: 1,
            _id: 0
          }
        }
      ]);
      
      res.json({
        success: true,
        data: {
          overview: {
            totalSessions,
            uniqueVisitors,
            totalPageViews,
            avgSessionDuration: Math.round(avgSessionDuration[0]?.avg || 0),
            avgPageViewsPerSession,
            bounceRate: totalSessions > 0 ? 
              Math.round((await VisitorSession.countDocuments({ 
                firstSeen: { $gte: start, $lte: end },
                pageViews: 1 
              }) / totalSessions) * 100) : 0
          },
          topPages,
          topCountries,
          browserStats,
          osStats,
          deviceStats,
          referrerStats,
          recentSessions,
          sessionsByDay,
          dateRange: {
            start,
            end,
            period
          }
        }
      });
    } catch (error) {
      console.error("Error fetching visitor analytics:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch visitor analytics",
        error: error.message
      });
    }
  }
  
  // Get live visitor count (active in last 5 minutes)
  static async getLiveVisitors(req, res) {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      const liveCount = await VisitorSession.countDocuments({
        lastSeen: { $gte: fiveMinutesAgo }
      });
      
      const liveSessions = await VisitorSession.find({
        lastSeen: { $gte: fiveMinutesAgo }
      })
      .sort({ lastSeen: -1 })
      .limit(50)
      .select('sessionId ipAddress userAgent location lastSeen pageViews');
      
      res.json({
        success: true,
        data: {
          count: liveCount,
          sessions: liveSessions
        }
      });
    } catch (error) {
      console.error("Error fetching live visitors:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch live visitors",
        error: error.message
      });
    }
  }
  
  // Get specific session details
  static async getSessionDetails(req, res) {
    try {
      const { sessionId } = req.params;
      
      const session = await VisitorSession.findOne({ sessionId });
      
      if (!session) {
        return res.status(404).json({
          success: false,
          message: "Session not found"
        });
      }
      
      const pageViews = await PageView.find({ sessionId })
        .sort({ timestamp: 1 })
        .select('page timestamp timeOnPage scrollDepth events');
      
      res.json({
        success: true,
        data: {
          session,
          pageViews
        }
      });
    } catch (error) {
      console.error("Error fetching session details:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch session details",
        error: error.message
      });
    }
  }
  
  // Track page view update (from client-side)
  static async updatePageView(req, res) {
    try {
      const { 
        sessionId, 
        path, 
        title, 
        timeOnPage, 
        scrollDepth,
        performance 
      } = req.body;
      
      if (!sessionId || !path) {
        return res.status(400).json({
          success: false,
          message: "sessionId and path are required"
        });
      }
      
      // Find the most recent page view for this session and path
      const pageView = await PageView.findOne({ 
        sessionId, 
        "page.path": path 
      }).sort({ timestamp: -1 });
      
      if (pageView) {
        if (title) pageView.page.title = title;
        if (timeOnPage !== undefined) pageView.timeOnPage = timeOnPage;
        if (scrollDepth !== undefined) pageView.scrollDepth = scrollDepth;
        if (performance) pageView.performance = performance;
        
        await pageView.save();
      }
      
      res.json({
        success: true,
        message: "Page view updated"
      });
    } catch (error) {
      console.error("Error updating page view:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update page view",
        error: error.message
      });
    }
  }
  
  // Export analytics data (CSV)
  static async exportAnalytics(req, res) {
    try {
      const { startDate, endDate, type = 'sessions' } = req.query;
      
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();
      
      let data, headers;
      
      if (type === 'sessions') {
        const sessions = await VisitorSession.find({
          firstSeen: { $gte: start, $lte: end }
        }).sort({ firstSeen: -1 });
        
        headers = ['Session ID', 'IP Address', 'Browser', 'OS', 'Country', 'First Seen', 'Last Seen', 'Page Views', 'Duration'];
        data = sessions.map(s => [
          s.sessionId,
          s.ipAddress,
          s.userAgent.browser,
          s.userAgent.os,
          s.location?.country || 'Unknown',
          s.firstSeen.toISOString(),
          s.lastSeen.toISOString(),
          s.pageViews,
          s.duration
        ]);
      } else if (type === 'pageviews') {
        const pageViews = await PageView.find({
          timestamp: { $gte: start, $lte: end }
        }).sort({ timestamp: -1 });
        
        headers = ['Session ID', 'Path', 'Title', 'Timestamp', 'Time on Page', 'Scroll Depth'];
        data = pageViews.map(pv => [
          pv.sessionId,
          pv.page.path,
          pv.page.title || '',
          pv.timestamp.toISOString(),
          pv.timeOnPage,
          pv.scrollDepth
        ]);
      }
      
      // Create CSV
      const csv = [headers.join(',')];
      data.forEach(row => {
        csv.push(row.map(cell => `"${cell}"`).join(','));
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=analytics-${type}-${Date.now()}.csv`);
      res.send(csv.join('\n'));
      
    } catch (error) {
      console.error("Error exporting analytics:", error);
      res.status(500).json({
        success: false,
        message: "Failed to export analytics",
        error: error.message
      });
    }
  }
}

module.exports = VisitorController;
