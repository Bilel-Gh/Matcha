import { Router } from 'express';
import * as profileController from '../controllers/profileController';
import { protect } from '../middlewares/auth';
import { validateBody } from '../middlewares/validator';
import { validateProfileUpdate, validatePasswordChange } from '../utils/validators';

const router = Router();

// All profile routes require authentication
router.use(protect);

/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
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
 *                     id:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     firstname:
 *                       type: string
 *                     lastname:
 *                       type: string
 *                     email:
 *                       type: string
 *                     gender:
 *                       type: string
 *                       enum: [male, female, other]
 *                     sexual_preferences:
 *                       type: string
 *                       enum: [male, female, both]
 *                     biography:
 *                       type: string
 *                     birth_date:
 *                       type: string
 *                       format: date
 *                     age:
 *                       type: integer
 *                     profile_completed:
 *                       type: boolean
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/', profileController.getProfile);

/**
 * @swagger
 * /api/profile:
 *   put:
 *     summary: Update current user's profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstname:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *               lastname:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *               email:
 *                 type: string
 *                 format: email
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 20
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *               sexual_preferences:
 *                 type: string
 *                 enum: [male, female, both]
 *               biography:
 *                 type: string
 *                 maxLength: 500
 *               birth_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Profile updated successfully
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
 *                     id:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     firstname:
 *                       type: string
 *                     lastname:
 *                       type: string
 *                     email:
 *                       type: string
 *                     gender:
 *                       type: string
 *                     sexual_preferences:
 *                       type: string
 *                     biography:
 *                       type: string
 *                     birth_date:
 *                       type: string
 *                       format: date
 *                     age:
 *                       type: integer
 *                     profile_completed:
 *                       type: boolean
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.put('/', validateBody(validateProfileUpdate), profileController.updateProfile);

/**
 * @swagger
 * /api/profile/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - current_password
 *               - new_password
 *             properties:
 *               current_password:
 *                 type: string
 *                 description: Current password for verification
 *               new_password:
 *                 type: string
 *                 minLength: 8
 *                 description: New password (min 8 chars, must contain uppercase, lowercase, and number)
 *     responses:
 *       200:
 *         description: Password updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Password updated successfully
 *       400:
 *         description: Current password is incorrect or validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/change-password', validateBody(validatePasswordChange), profileController.changePassword);

/**
 * @swagger
 * /api/profile/user/{userId}:
 *   get:
 *     summary: Get another user's profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user to view
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
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
 *                     id:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     firstname:
 *                       type: string
 *                     lastname:
 *                       type: string
 *                     age:
 *                       type: integer
 *                     gender:
 *                       type: string
 *                     sexual_preferences:
 *                       type: string
 *                     biography:
 *                       type: string
 *                     city:
 *                       type: string
 *                     country:
 *                       type: string
 *                     profile_picture_url:
 *                       type: string
 *                     fame_rating:
 *                       type: number
 *                     distance_km:
 *                       type: number
 *                     common_interests:
 *                       type: integer
 *                     common_interests_names:
 *                       type: array
 *                       items:
 *                         type: string
 *                     is_online:
 *                       type: boolean
 *                     last_connection:
 *                       type: string
 *                       format: date-time
 *                     photos:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           url:
 *                             type: string
 *                           is_profile_picture:
 *                             type: boolean
 *                     interests:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *       400:
 *         description: Invalid user ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: User not accessible (blocked)
 *       404:
 *         description: User not found
 */
router.get('/user/:userId', profileController.getUserProfile);

export default router;
