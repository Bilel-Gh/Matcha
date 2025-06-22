import { Router } from 'express';
import * as browsingController from '../controllers/browsingController';
import { protect } from '../middlewares/auth';

const router = Router();

// All browsing routes require authentication
router.use(protect);

/**
 * @swagger
 * components:
 *   schemas:
 *     BrowseUser:
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
 *         biography:
 *           type: string
 *         fame_rating:
 *           type: integer
 *         distance_km:
 *           type: number
 *           format: float
 *         common_interests_count:
 *           type: integer
 *         is_online:
 *           type: boolean
 *         last_connection:
 *           type: string
 *           format: date-time
 *         gender:
 *           type: string
 *           enum: [male, female, other]
 *         sexual_preferences:
 *           type: string
 *           enum: [male, female, both]
 *         city:
 *           type: string
 *         country:
 *           type: string
 */

/**
 * @swagger
 * /api/browse:
 *   get:
 *     summary: Browse compatible users (mandatory matching logic)
 *     tags: [Browsing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: age_min
 *         schema:
 *           type: integer
 *           minimum: 18
 *         description: Minimum age filter
 *       - in: query
 *         name: age_max
 *         schema:
 *           type: integer
 *           maximum: 100
 *         description: Maximum age filter
 *       - in: query
 *         name: max_distance
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Maximum distance in kilometers
 *       - in: query
 *         name: fame_min
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *         description: Minimum fame rating
 *       - in: query
 *         name: fame_max
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *         description: Maximum fame rating
 *       - in: query
 *         name: min_common_interests
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Minimum number of common interests
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [distance, age, fame_rating, common_interests]
 *           default: distance
 *         description: Sort criteria (geographic priority always maintained)
 *     responses:
 *       200:
 *         description: Browse results with sexually compatible users
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
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/BrowseUser'
 *                     total:
 *                       type: integer
 *                       example: 15
 *       400:
 *         description: Location required for browsing or invalid parameters
 *       401:
 *         description: Unauthorized
 */
router.get('/', browsingController.browseUsers);

/**
 * @swagger
 * /api/browse/search:
 *   get:
 *     summary: Search users by name, firstname, or username
 *     tags: [Browsing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Search query for name, firstname, or username (minimum 2 characters)
 *         example: "John"
 *       - in: query
 *         name: age_min
 *         schema:
 *           type: integer
 *           minimum: 18
 *         description: Minimum age filter (fallback to advanced search if no search query)
 *       - in: query
 *         name: age_max
 *         schema:
 *           type: integer
 *           maximum: 100
 *         description: Maximum age filter (fallback to advanced search if no search query)
 *       - in: query
 *         name: max_distance
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Maximum distance in kilometers (fallback to advanced search if no search query)
 *       - in: query
 *         name: fame_min
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *         description: Minimum fame rating (fallback to advanced search if no search query)
 *       - in: query
 *         name: fame_max
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *         description: Maximum fame rating (fallback to advanced search if no search query)
 *       - in: query
 *         name: min_common_interests
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Minimum number of common interests (fallback to advanced search if no search query)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [distance, age, fame_rating, common_interests]
 *           default: distance
 *         description: Sort criteria (fallback to advanced search if no search query)
 *     responses:
 *       200:
 *         description: Search results sorted by relevance and distance
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
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/BrowseUser'
 *                     total:
 *                       type: integer
 *       400:
 *         description: Location required, search query too short, or invalid parameters
 *       401:
 *         description: Unauthorized
 */
router.get('/search', browsingController.searchUsers);

/**
 * @swagger
 * /api/browse/user/{id}:
 *   get:
 *     summary: Get detailed user profile for viewing
 *     tags: [Browsing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID to view
 *     responses:
 *       200:
 *         description: User profile with distance and common interests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/BrowseUser'
 *       400:
 *         description: Invalid user ID or location required
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/user/:id', browsingController.getUserProfile);

export default router;
