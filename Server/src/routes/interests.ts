import { Router } from 'express';
import * as interestController from '../controllers/interestController';
import { validate } from '../middlewares/validation';
import { interestCreateSchema, interestSearchSchema } from '../utils/validation';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Interest:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         tag:
 *           type: string
 */

/**
 * @swagger
 * /api/interests:
 *   get:
 *     summary: Get all available interests/tags
 *     tags: [Interests]
 *     responses:
 *       200:
 *         description: List of all interests
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
 */
router.get('/', interestController.getAllInterests);

/**
 * @swagger
 * /api/interests/search:
 *   get:
 *     summary: Search interests by name or tag
 *     tags: [Interests]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *         description: Search term for interest name or tag
 *     responses:
 *       200:
 *         description: Search results
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
 *       400:
 *         description: Missing or invalid search query
 */
router.get('/search', interestController.searchInterests);

/**
 * @swagger
 * /api/interests:
 *   post:
 *     summary: Create a new interest
 *     tags: [Interests]
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
 *               tag:
 *                 type: string
 *                 maxLength: 50
 *                 description: Optional custom tag (auto-generated if not provided)
 *     responses:
 *       201:
 *         description: Interest created successfully
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
 *                       $ref: '#/components/schemas/Interest'
 *       400:
 *         description: Invalid input data
 *       409:
 *         description: Interest already exists
 */
router.post('/', validate(interestCreateSchema), interestController.createInterest);

export default router;
