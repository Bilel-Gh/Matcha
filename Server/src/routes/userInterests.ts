import { Router } from 'express';
import * as interestController from '../controllers/interestController';
import { protect } from '../middlewares/auth';
import { validateBody } from '../middlewares/validator';
import {
  validateUserInterestsUpdate,
  validateInterestAddByName,
} from '../utils/validators';

const router = Router();

// All user interest routes require authentication
router.use(protect);

/**
 * @swagger
 * /api/profile/interests:
 *   get:
 *     summary: Get interests for the currently authenticated user
 *     tags: [Profile Interests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of interests for the currently authenticated user
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
 *                         $ref: '#/components/schemas/Interest'
 *       401:
 *         description: Unauthorized
 */
router.get('/', interestController.getUserInterests);

/**
 * @swagger
 * /api/profile/interests/add/{id}:
 *   post:
 *     summary: Add a user interest by ID
 *     tags: [Profile Interests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Interest added successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.post('/add/:id', interestController.addUserInterest);

/**
 * @swagger
 * /api/profile/interests/remove/{id}:
 *   delete:
 *     summary: Remove a user interest by ID
 *     tags: [Profile Interests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Interest removed successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.delete('/remove/:id', interestController.removeUserInterest);

/**
 * @swagger
 * /api/profile/interests/update-all:
 *   put:
 *     summary: Update all user interests at once
 *     tags: [Profile Interests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - interests
 *             properties:
 *               interests:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: User interests updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.put(
  '/update-all',
  validateBody(validateUserInterestsUpdate),
  interestController.updateUserInterests
);

/**
 * @swagger
 * /api/profile/interests/add-by-name:
 *   post:
 *     summary: Add a user interest by name (creates it if not exists)
 *     tags: [Profile Interests]
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
 *                 description: Interest name (2-30 characters, letters and spaces only)
 *     responses:
 *       200:
 *         description: Interest added successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/add-by-name',
  validateBody(validateInterestAddByName),
  interestController.addUserInterestByName
);

export default router;
