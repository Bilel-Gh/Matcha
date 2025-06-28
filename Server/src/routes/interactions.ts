import { Router } from 'express';
import * as interactionController from '../controllers/interactionController';
import { protect } from '../middlewares/auth';
import { validateBody } from '../middlewares/validator';
import { validateReportUser, validateBlockUser } from '../utils/validators';

const router = Router();

// All interaction routes require authentication
router.use(protect);

/**
 * @swagger
 * components:
 *   schemas:
 *     LikeUserInfo:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         username:
 *           type: string
 *         firstname:
 *           type: string
 *         lastname:
 *           type: string
 *         age:
 *           type: integer
 *         profile_picture_url:
 *           type: string
 *         fame_rating:
 *           type: integer
 *         is_online:
 *           type: boolean
 *         last_connection:
 *           type: string
 *           format: date-time
 *         created_at:
 *           type: string
 *           format: date-time
 *
 *     MatchInfo:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         username:
 *           type: string
 *         firstname:
 *           type: string
 *         lastname:
 *           type: string
 *         age:
 *           type: integer
 *         profile_picture_url:
 *           type: string
 *         fame_rating:
 *           type: integer
 *         is_online:
 *           type: boolean
 *         last_connection:
 *           type: string
 *           format: date-time
 *         match_date:
 *           type: string
 *           format: date-time
 *
 *     VisitUserInfo:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         username:
 *           type: string
 *         firstname:
 *           type: string
 *         lastname:
 *           type: string
 *         age:
 *           type: integer
 *         profile_picture_url:
 *           type: string
 *         fame_rating:
 *           type: integer
 *         is_online:
 *           type: boolean
 *         last_connection:
 *           type: string
 *           format: date-time
 *         visited_at:
 *           type: string
 *           format: date-time
 *         visit_count:
 *           type: integer
 */

// ===== LIKES ROUTES =====

/**
 * @swagger
 * /api/interactions/like/{userId}:
 *   post:
 *     summary: Like a user
 *     tags: [Interactions - Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of user to like
 *     responses:
 *       201:
 *         description: Like sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                     match:
 *                       type: boolean
 *                     message:
 *                       type: string
 *       400:
 *         description: Cannot like yourself or profile picture required
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Like already exists
 */
router.post('/like/:userId', interactionController.likeUser);

/**
 * @swagger
 * /api/interactions/like/{userId}:
 *   delete:
 *     summary: Unlike a user
 *     tags: [Interactions - Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of user to unlike
 *     responses:
 *       200:
 *         description: Like removed successfully
 *       400:
 *         description: Invalid user ID
 *       404:
 *         description: Like not found
 */
router.delete('/like/:userId', interactionController.unlikeUser);

/**
 * @swagger
 * /api/interactions/likes-received:
 *   get:
 *     summary: Get users who liked me
 *     tags: [Interactions - Likes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users who liked the current user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     likes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/LikeUserInfo'
 *                     count:
 *                       type: integer
 */
router.get('/likes-received', interactionController.getLikesReceived);

/**
 * @swagger
 * /api/interactions/likes-given:
 *   get:
 *     summary: Get users I liked
 *     tags: [Interactions - Likes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users the current user liked
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     likes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/LikeUserInfo'
 *                     count:
 *                       type: integer
 */
router.get('/likes-given', interactionController.getLikesGiven);

/**
 * @swagger
 * /api/interactions/matches:
 *   get:
 *     summary: Get mutual likes (matches)
 *     tags: [Interactions - Likes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Matched users (mutual likes)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     matches:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/MatchInfo'
 *                     count:
 *                       type: integer
 */
router.get('/matches', interactionController.getMatches);

/**
 * @swagger
 * /api/interactions/like-status/{userId}:
 *   get:
 *     summary: Check like status between users
 *     tags: [Interactions - Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of other user
 *     responses:
 *       200:
 *         description: Like status between users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     i_liked_them:
 *                       type: boolean
 *                     they_liked_me:
 *                       type: boolean
 *                     is_match:
 *                       type: boolean
 */
router.get('/like-status/:userId', interactionController.getLikeStatus);

// ===== VISITS ROUTES =====

/**
 * @swagger
 * /api/interactions/visit/{userId}:
 *   post:
 *     summary: Record profile visit
 *     tags: [Interactions - Visits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of user profile to visit
 *     responses:
 *       201:
 *         description: Visit recorded successfully
 *       200:
 *         description: Visit already recorded recently
 *       400:
 *         description: Cannot visit own profile
 */
router.post('/visit/:userId', interactionController.recordVisit);

/**
 * @swagger
 * /api/interactions/visits-received:
 *   get:
 *     summary: Get users who visited my profile
 *     tags: [Interactions - Visits]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users who visited the current user's profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     visits:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/VisitUserInfo'
 *                     count:
 *                       type: integer
 */
router.get('/visits-received', interactionController.getVisitsReceived);

/**
 * @swagger
 * /api/interactions/visits-given:
 *   get:
 *     summary: Get profiles I visited
 *     tags: [Interactions - Visits]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profiles the current user visited
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     visits:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/VisitUserInfo'
 *                     count:
 *                       type: integer
 */
router.get('/visits-given', interactionController.getVisitsGiven);

// ===== BLOCKS ROUTES =====

/**
 * @swagger
 * /api/interactions/block/{userId}:
 *   post:
 *     summary: Block a user
 *     tags: [Interactions - Blocks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of user to block
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Optional reason for blocking
 *     responses:
 *       201:
 *         description: User blocked successfully
 *       400:
 *         description: Cannot block yourself
 *       409:
 *         description: User already blocked
 */
router.post('/block/:userId', validateBody(validateBlockUser), interactionController.blockUser);

/**
 * @swagger
 * /api/interactions/block/{userId}:
 *   delete:
 *     summary: Unblock a user
 *     tags: [Interactions - Blocks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of user to unblock
 *     responses:
 *       200:
 *         description: User unblocked successfully
 *       404:
 *         description: Block not found
 */
router.delete('/unblock/:userId', interactionController.unblockUser);

/**
 * @swagger
 * /api/interactions/blocked:
 *   get:
 *     summary: Get my blocked users
 *     tags: [Interactions - Blocks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users blocked by the current user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     blocked_users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           username:
 *                             type: string
 *                           firstname:
 *                             type: string
 *                           lastname:
 *                             type: string
 *                           age:
 *                             type: integer
 *                           profile_picture_url:
 *                             type: string
 *                           reason:
 *                             type: string
 *                           blocked_at:
 *                             type: string
 *                             format: date-time
 *                     count:
 *                       type: integer
 */
router.get('/blocks', interactionController.getBlockedUsers);

/**
 * @swagger
 * /api/interactions/block-status/{userId}:
 *   get:
 *     summary: Check block status between users
 *     tags: [Interactions - Blocks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of other user
 *     responses:
 *       200:
 *         description: Block status between users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     i_blocked_them:
 *                       type: boolean
 *                     they_blocked_me:
 *                       type: boolean
 *                     blocked_either_way:
 *                       type: boolean
 */
router.get('/block-status/:userId', interactionController.getBlockStatus);

// ===== REPORTS ROUTES =====

/**
 * @swagger
 * /api/interactions/report/{userId}:
 *   post:
 *     summary: Report a user for fake account
 *     tags: [Interactions - Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of user to report
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 enum:
 *                   - Fake account
 *                   - Inappropriate photos
 *                   - Harassment
 *                   - Spam or promotional content
 *                   - Underage user
 *                   - Offensive behavior
 *                   - Scam or fraud
 *                   - Impersonation
 *                   - Other
 *     responses:
 *       201:
 *         description: User reported successfully
 *       400:
 *         description: Cannot report yourself or invalid reason
 *       429:
 *         description: Already reported this user recently
 */
router.post('/report/:userId', validateBody(validateReportUser), interactionController.reportUser);

/**
 * @swagger
 * /api/interactions/my-reports:
 *   get:
 *     summary: Get my reports
 *     tags: [Interactions - Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reports made by the current user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     reports:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           reported_user:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               username:
 *                                 type: string
 *                               firstname:
 *                                 type: string
 *                               lastname:
 *                                 type: string
 *                               profile_picture_url:
 *                                 type: string
 *                           reason:
 *                             type: string
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                     count:
 *                       type: integer
 */
router.get('/reports', interactionController.getMyReports);

/**
 * @swagger
 * /api/interactions/report-reasons:
 *   get:
 *     summary: Get available report reasons
 *     tags: [Interactions - Reports]
 *     responses:
 *       200:
 *         description: Available report reasons
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     reasons:
 *                       type: array
 *                       items:
 *                         type: string
 */
router.get('/report-reasons', interactionController.getReportReasons);

// ===== COMBINED ENDPOINTS =====

/**
 * @swagger
 * /api/interactions/status/{userId}:
 *   get:
 *     summary: Get complete interaction status with another user
 *     tags: [Interactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of other user
 *     responses:
 *       200:
 *         description: Complete interaction status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     like_status:
 *                       type: object
 *                       properties:
 *                         i_liked_them:
 *                           type: boolean
 *                         they_liked_me:
 *                           type: boolean
 *                         is_match:
 *                           type: boolean
 *                     block_status:
 *                       type: object
 *                       properties:
 *                         i_blocked_them:
 *                           type: boolean
 *                         they_blocked_me:
 *                           type: boolean
 *                         blocked_either_way:
 *                           type: boolean
 *                     has_reported:
 *                       type: boolean
 */
router.get('/status/:userId', interactionController.getInteractionStatus);

/**
 * @swagger
 * /api/interactions/summary:
 *   get:
 *     summary: Get interaction summary for dashboard
 *     tags: [Interactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Interaction summary with counts and recent activity
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                       properties:
 *                         likes_received:
 *                           type: integer
 *                         likes_given:
 *                           type: integer
 *                         matches:
 *                           type: integer
 *                         visits_received:
 *                           type: integer
 *                         visits_given:
 *                           type: integer
 *                         blocked_users:
 *                           type: integer
 *                         reports_made:
 *                           type: integer
 *                     recent_activity:
 *                       type: object
 *                       properties:
 *                         recent_likes:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/LikeUserInfo'
 *                         recent_visits:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/VisitUserInfo'
 *                         latest_matches:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/MatchInfo'
 */
router.get('/summary', interactionController.getInteractionSummary);

export default router;
