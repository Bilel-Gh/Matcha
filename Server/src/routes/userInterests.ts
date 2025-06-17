import { Router } from 'express';
import * as interestController from '../controllers/interestController';
import { protect } from '../middlewares/auth';
import { validate } from '../middlewares/validation';
import { userInterestsUpdateSchema, interestAddByNameSchema } from '../utils/validation';

const router = Router();

// All user interest routes require authentication
router.use(protect);

/**
 * @swagger
 * components:
 *   schemas:
 *     UserInterest:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         tag:
 *           type: string
 *         added_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/profile/interests:
 *   get:
 *     summary: Get current user's interests
 *     tags: [User Interests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User interests retrieved successfully
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
 *                     interests:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/UserInterest'
 *                     count:
 *                       type: integer
 *                       example: 3
 *                     max_interests:
 *                       type: integer
 *                       example: 10
 *       401:
 *         description: Unauthorized
 */
router.get('/', interestController.getUserInterests);

/**
 * @swagger
 * /api/profile/interests:
 *   put:
 *     summary: Update user's interests (replace all)
 *     tags: [User Interests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - interest_ids
 *             properties:
 *               interest_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 maxItems: 10
 *                 description: Array of interest IDs (max 10)
 *     responses:
 *       200:
 *         description: User interests updated successfully
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
 *                     interests:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/UserInterest'
 *                     count:
 *                       type: integer
 *                     max_interests:
 *                       type: integer
 *                 message:
 *                   type: string
 *                   example: User interests updated successfully
 *       400:
 *         description: Invalid input data or too many interests
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: One or more interests not found
 */
router.put('/', validate(userInterestsUpdateSchema), interestController.updateUserInterests);

/**
 * @swagger
 * /api/profile/interests/{id}:
 *   post:
 *     summary: Add single interest to user
 *     tags: [User Interests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Interest ID
 *     responses:
 *       201:
 *         description: Interest added successfully
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
 *                     interest:
 *                       $ref: '#/components/schemas/UserInterest'
 *                     message:
 *                       type: string
 *                       example: Interest added successfully
 *       400:
 *         description: Invalid interest ID or maximum interests reached
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Interest not found
 *       409:
 *         description: User already has this interest
 */
/**
 * @swagger
 * /api/profile/interests/add-by-name:
 *   post:
 *     summary: Add interest by name (creates if doesn't exist)
 *     tags: [User Interests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 30
 *                 description: Interest name (will be created if doesn't exist)
 *     responses:
 *       201:
 *         description: Interest added successfully
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
 *                     interest:
 *                       $ref: '#/components/schemas/UserInterest'
 *                     message:
 *                       type: string
 *                       example: Interest added successfully
 *       400:
 *         description: Invalid interest name or maximum interests reached
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: User already has this interest
 */
router.post('/add-by-name', validate(interestAddByNameSchema), interestController.addUserInterestByName);

router.post('/:id', interestController.addUserInterest);

/**
 * @swagger
 * /api/profile/interests/{id}:
 *   delete:
 *     summary: Remove interest from user
 *     tags: [User Interests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Interest ID
 *     responses:
 *       200:
 *         description: Interest removed successfully
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
 *                   example: Interest removed successfully
 *       400:
 *         description: Invalid interest ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Interest not found or not associated with user
 */
router.delete('/:id', interestController.removeUserInterest);

export default router;
