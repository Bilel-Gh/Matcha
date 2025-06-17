import { Router } from 'express';
import * as photoController from '../controllers/photoController';
import { protect } from '../middlewares/auth';
import { uploadSingle, handleMulterError } from '../middlewares/upload';

const router = Router();

// All photo routes require authentication
router.use(protect);

/**
 * @swagger
 * components:
 *   schemas:
 *     Photo:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         filename:
 *           type: string
 *         url:
 *           type: string
 *         is_profile:
 *           type: boolean
 *         created_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/profile/photos:
 *   get:
 *     summary: Get current user's photos
 *     tags: [Photos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Photos retrieved successfully
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
 *                     photos:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Photo'
 *                     count:
 *                       type: integer
 *                       example: 3
 *                     max_photos:
 *                       type: integer
 *                       example: 5
 *                     has_profile_picture:
 *                       type: boolean
 *                       example: true
 *       401:
 *         description: Unauthorized
 */
router.get('/', photoController.getPhotos);

/**
 * @swagger
 * /api/profile/photos:
 *   post:
 *     summary: Upload a new photo
 *     tags: [Photos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPEG or PNG, max 5MB)
 *     responses:
 *       201:
 *         description: Photo uploaded successfully
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
 *                       example: true
 *                     photo:
 *                       $ref: '#/components/schemas/Photo'
 *                     count:
 *                       type: integer
 *                       example: 2
 *       400:
 *         description: Invalid file or max photos exceeded
 *       401:
 *         description: Unauthorized
 */
router.post('/', uploadSingle, handleMulterError, photoController.uploadPhoto);

/**
 * @swagger
 * /api/profile/photos/{id}/profile:
 *   put:
 *     summary: Set photo as profile picture
 *     tags: [Photos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Photo ID
 *     responses:
 *       200:
 *         description: Profile photo updated successfully
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
 *                     photo:
 *                       $ref: '#/components/schemas/Photo'
 *                     message:
 *                       type: string
 *                       example: Profile photo updated successfully
 *       400:
 *         description: Invalid photo ID
 *       403:
 *         description: Cannot set another user's photo as profile
 *       404:
 *         description: Photo not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:id/profile', photoController.setProfilePhoto);

/**
 * @swagger
 * /api/profile/photos/{id}:
 *   delete:
 *     summary: Delete a specific photo
 *     tags: [Photos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Photo ID
 *     responses:
 *       200:
 *         description: Photo deleted successfully
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
 *                   example: Photo deleted successfully
 *       400:
 *         description: Invalid photo ID
 *       404:
 *         description: Photo not found or unauthorized
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', photoController.deletePhoto);

export default router;
