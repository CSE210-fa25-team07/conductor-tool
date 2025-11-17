/**
 * @fileoverview Standup Routes - Journal/Standup
 * Standup team endpoints for daily standups and journal entries
 * @module routes/standupRoutes
 */

import express from 'express';

const router = express.Router();

// ============================================
// MOCK DATA
// ============================================

/**
 * Mock journal entries
 */
const mockJournalEntries = [
  {
    id: 1,
    date: '2024-11-15',
    user_id: 1,
    user_name: 'John Doe',
    user_avatar: 'JD',
    yesterday: 'Completed the authentication module and wrote unit tests',
    today: 'Working on the user dashboard UI components',
    blockers: 'None',
    mood: '😄',
    status: 'completed',
    created_at: '2024-11-15T09:00:00Z'
  },
  {
    id: 2,
    date: '2024-11-14',
    user_id: 1,
    user_name: 'John Doe',
    user_avatar: 'JD',
    yesterday: 'Started work on authentication module',
    today: 'Finish authentication and begin testing',
    blockers: 'Waiting for API documentation',
    mood: '😊',
    status: 'in-progress',
    created_at: '2024-11-14T09:00:00Z'
  },
  {
    id: 3,
    date: '2024-11-13',
    user_id: 1,
    user_name: 'John Doe',
    user_avatar: 'JD',
    yesterday: 'Set up project structure and dependencies',
    today: 'Begin authentication module implementation',
    blockers: 'None',
    mood: '😄',
    status: 'completed',
    created_at: '2024-11-13T09:00:00Z'
  }
];

/**
 * Mock team members
 */
const mockTeamMembers = [
  { id: 1, name: 'Alice Johnson', avatar: 'AJ', role: 'Frontend Dev', entries: 15, streak: 7, lastUpdate: '2 hours ago' },
  { id: 2, name: 'Bob Smith', avatar: 'BS', role: 'Backend Dev', entries: 12, streak: 5, lastUpdate: '1 hour ago' },
  { id: 3, name: 'Carol Williams', avatar: 'CW', role: 'Designer', entries: 14, streak: 6, lastUpdate: '3 hours ago' },
  { id: 4, name: 'David Brown', avatar: 'DB', role: 'QA Engineer', entries: 11, streak: 4, lastUpdate: '30 minutes ago' }
];

// ============================================
// ENDPOINTS
// ============================================

/**
 * GET /api/journal
 * Get journal entries for current user
 *
 * @route GET /api/journal
 * @returns {Object} 200 - Success response with journal entries
 * @returns {Object} 200.success - Indicates successful operation
 * @returns {Object} 200.data - Journal data object
 * @returns {Array} 200.data.entries - Array of journal entries
 * @returns {number} 200.data.streak - Current streak of consecutive entries
 * @returns {number} 200.data.totalEntries - Total number of entries
 * @example
 * // Response:
 * {
 *   "success": true,
 *   "data": {
 *     "entries": [
 *       {
 *         "id": 1,
 *         "date": "2024-11-15",
 *         "user_id": 1,
 *         "user_name": "John Doe",
 *         "user_avatar": "JD",
 *         "yesterday": "Completed the authentication module",
 *         "today": "Working on the user dashboard",
 *         "blockers": "None",
 *         "mood": "😄",
 *         "status": "completed",
 *         "created_at": "2024-11-15T09:00:00Z"
 *       }
 *     ],
 *     "streak": 7,
 *     "totalEntries": 3
 *   }
 * }
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      entries: mockJournalEntries,
      streak: 7,
      totalEntries: mockJournalEntries.length
    }
  });
});

/**
 * POST /api/journal
 * Submit a new journal entry
 *
 * @route POST /api/journal
 * @param {string} req.body.yesterday - What was accomplished yesterday
 * @param {string} req.body.today - What will be done today
 * @param {string} req.body.blockers - Any blockers or issues
 * @param {string} req.body.mood - Mood emoji
 * @returns {Object} 200 - Success response with created entry
 * @returns {Object} 200.success - Indicates successful operation
 * @returns {string} 200.message - Success message
 * @returns {Object} 200.data - Created journal entry object
 * @example
 * // Request body:
 * {
 *   "yesterday": "Completed authentication module",
 *   "today": "Working on user dashboard",
 *   "blockers": "None",
 *   "mood": "😄"
 * }
 * @example
 * // Response:
 * {
 *   "success": true,
 *   "message": "Journal entry submitted successfully!",
 *   "data": {
 *     "id": 4,
 *     "date": "2024-11-16",
 *     "user_id": 1,
 *     "user_name": "John Doe",
 *     "user_avatar": "JD",
 *     "yesterday": "Completed authentication module",
 *     "today": "Working on user dashboard",
 *     "blockers": "None",
 *     "mood": "😄",
 *     "status": "completed",
 *     "created_at": "2024-11-16T09:00:00.000Z"
 *   }
 * }
 */
router.post('/', (req, res) => {
  const { yesterday, today, blockers, mood } = req.body;

  const newEntry = {
    id: mockJournalEntries.length + 1,
    date: new Date().toISOString().split('T')[0],
    user_id: 1, // Mock user
    user_name: 'John Doe',
    user_avatar: 'JD',
    yesterday,
    today,
    blockers,
    mood,
    status: 'completed',
    created_at: new Date().toISOString()
  };

  mockJournalEntries.unshift(newEntry);

  res.json({
    success: true,
    message: 'Journal entry submitted successfully!',
    data: newEntry
  });
});

/**
 * GET /api/journal/team
 * Get team journal statistics
 *
 * @route GET /api/journal/team
 * @returns {Object} 200 - Success response with team statistics
 * @returns {Object} 200.success - Indicates successful operation
 * @returns {Object} 200.data - Team data object
 * @returns {Array} 200.data.members - Array of team member objects
 * @returns {Object} 200.data.stats - Team statistics
 * @returns {number} 200.data.stats.totalMembers - Total number of team members
 * @returns {number} 200.data.stats.totalEntries - Total journal entries across team
 * @returns {number} 200.data.stats.averageStreak - Average streak across team
 * @returns {number} 200.data.stats.completionRate - Completion rate percentage
 * @example
 * // Response:
 * {
 *   "success": true,
 *   "data": {
 *     "members": [
 *       {
 *         "id": 1,
 *         "name": "Alice Johnson",
 *         "avatar": "AJ",
 *         "role": "Frontend Dev",
 *         "entries": 15,
 *         "streak": 7,
 *         "lastUpdate": "2 hours ago"
 *       }
 *     ],
 *     "stats": {
 *       "totalMembers": 4,
 *       "totalEntries": 52,
 *       "averageStreak": 5.5,
 *       "completionRate": 95
 *     }
 *   }
 * }
 */
router.get('/team', (req, res) => {
  res.json({
    success: true,
    data: {
      members: mockTeamMembers,
      stats: {
        totalMembers: mockTeamMembers.length,
        totalEntries: 52,
        averageStreak: 5.5,
        completionRate: 95
      }
    }
  });
});

export default router;
