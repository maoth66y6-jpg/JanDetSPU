/**
 * SPU Canteen System - Analytics & Visitor Controller
 * จัดการการนับจำนวนคนเข้าชมเว็บไซต์และสถิติภาพรวม
 */

const StorageModel = require('../models/storage');

class AnalyticsController {
  static getStats(req, res) {
    const analytics = StorageModel.read('analytics', { pageViews: 1, uniqueVisitors: 1, dailyVisits: {} });
    const restaurants = StorageModel.read('restaurants', []);
    const users = StorageModel.read('users', []);

    return {
      status: 'success',
      data: {
        pageViews: analytics.pageViews || 1,
        uniqueVisitors: analytics.uniqueVisitors || 1,
        dailyVisits: analytics.dailyVisits || {},
        totalRestaurants: restaurants.length,
        totalUsers: users.length,
        lastUpdated: new Date().toISOString()
      }
    };
  }

  static recordHit(payload = {}) {
    const analytics = StorageModel.read('analytics', {
      pageViews: 0,
      uniqueVisitors: 0,
      dailyVisits: {},
      recentHits: []
    });

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    analytics.pageViews = (analytics.pageViews || 0) + 1;
    if (payload.isNewVisitor) {
      analytics.uniqueVisitors = (analytics.uniqueVisitors || 0) + 1;
    }

    if (!analytics.dailyVisits) analytics.dailyVisits = {};
    analytics.dailyVisits[todayStr] = (analytics.dailyVisits[todayStr] || 0) + 1;
    analytics.lastHit = now.toISOString();

    if (!Array.isArray(analytics.recentHits)) analytics.recentHits = [];
    analytics.recentHits.unshift({
      visitorUuid: payload.visitorUuid || 'anonymous',
      timestamp: now.toISOString(),
      page: payload.page || '/',
      referrer: payload.referrer || 'direct'
    });

    // Keep only last 100 hits
    if (analytics.recentHits.length > 100) {
      analytics.recentHits = analytics.recentHits.slice(0, 100);
    }

    StorageModel.write('analytics', analytics);

    return {
      status: 'success',
      pageViews: analytics.pageViews,
      uniqueVisitors: analytics.uniqueVisitors
    };
  }
}

module.exports = AnalyticsController;
