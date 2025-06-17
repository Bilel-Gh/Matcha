import { Router } from 'express';
import * as fameRatingController from '../controllers/fameRatingController';
import { protect } from '../middlewares/auth';

const router = Router();

/**
 * @swagger
 * /api/profile/fame-rating/{userId}:
 *   put:
 *     summary: Recalculate and update user's fame rating
 *     tags: [Fame Rating]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: Fame rating updated successfully
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
 *                     user_id:
 *                       type: integer
 *                       example: 1
 *                     fame_rating:
 *                       type: integer
 *                       example: 45
 *                 message:
 *                   type: string
 *                   example: Fame rating updated successfully
 *       400:
 *         description: Invalid user ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.put('/:userId', protect, fameRatingController.updateFameRating);

export default router;
