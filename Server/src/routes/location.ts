import { Router } from 'express';
import * as locationController from '../controllers/locationController';
import { protect } from '../middlewares/auth';
import { validateBody } from '../middlewares/validator';
import { validateLocationUpdate } from '../utils/validators';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     LocationData:
 *       type: object
 *       properties:
 *         latitude:
 *           type: number
 *           format: float
 *           minimum: -90
 *           maximum: 90
 *         longitude:
 *           type: number
 *           format: float
 *           minimum: -180
 *           maximum: 180
 *         city:
 *           type: string
 *         country:
 *           type: string
 *         source:
 *           type: string
 *           enum: [gps, ip, manual]
 *         updated_at:
 *           type: string
 *           format: date-time
 *         has_location:
 *           type: boolean
 *
 *     IPLocationResponse:
 *       type: object
 *       properties:
 *         latitude:
 *           type: number
 *           format: float
 *         longitude:
 *           type: number
 *           format: float
 *         city:
 *           type: string
 *         region:
 *           type: string
 *         country:
 *           type: string
 *         ip:
 *           type: string
 */

/**
 * @swagger
 * /api/profile/location:
 *   get:
 *     summary: Get current user's location
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User location retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/LocationData'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/profile/location', protect, locationController.getUserLocation);

/**
 * @swagger
 * /api/profile/location:
 *   put:
 *     summary: Update user's location
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *               - source
 *             properties:
 *               latitude:
 *                 type: number
 *                 format: float
 *                 minimum: -90
 *                 maximum: 90
 *                 description: Latitude coordinate
 *               longitude:
 *                 type: number
 *                 format: float
 *                 minimum: -180
 *                 maximum: 180
 *                 description: Longitude coordinate
 *               source:
 *                 type: string
 *                 enum: [gps, ip, manual]
 *                 description: Source of the location data
 *               city:
 *                 type: string
 *                 maxLength: 100
 *                 description: City name (optional)
 *               country:
 *                 type: string
 *                 maxLength: 100
 *                 description: Country name (optional)
 *     responses:
 *       200:
 *         description: Location updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/LocationData'
 *                 message:
 *                   type: string
 *                   example: Location updated successfully
 *       400:
 *         description: Invalid location data
 *       401:
 *         description: Unauthorized
 */
router.put('/profile/location', protect, validateBody(validateLocationUpdate), locationController.updateUserLocation);

/**
 * @swagger
 * /api/location/ip:
 *   post:
 *     summary: Get location from user's IP address
 *     tags: [Location]
 *     responses:
 *       200:
 *         description: IP location retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/IPLocationResponse'
 *       500:
 *         description: IP geolocation service error
 */
router.post('/location/ip', locationController.getLocationFromIP);

/**
 * @swagger
 * /api/location/set-from-ip:
 *   post:
 *     summary: Set user location from IP address (automatic fallback)
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Location set from IP successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/LocationData'
 *                 message:
 *                   type: string
 *                   example: Location set from IP address successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to set location from IP
 */
router.post('/location/set-from-ip', protect, locationController.setLocationFromIP);

/**
 * @swagger
 * /api/location/reverse-geocode:
 *   get:
 *     summary: Convert coordinates to address information
 *     tags: [Location]
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *           format: float
 *           minimum: -90
 *           maximum: 90
 *         description: Latitude coordinate
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *           format: float
 *           minimum: -180
 *           maximum: 180
 *         description: Longitude coordinate
 *     responses:
 *       200:
 *         description: Reverse geocoding successful
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
 *                     latitude:
 *                       type: number
 *                       format: float
 *                     longitude:
 *                       type: number
 *                       format: float
 *                     city:
 *                       type: string
 *                     country:
 *                       type: string
 *       400:
 *         description: Invalid coordinates
 */
router.get('/location/reverse-geocode', locationController.reverseGeocode);

/**
 * @swagger
 * /api/location/distance:
 *   get:
 *     summary: Calculate distance between two points
 *     tags: [Location]
 *     parameters:
 *       - in: query
 *         name: lat1
 *         required: true
 *         schema:
 *           type: number
 *           format: float
 *         description: First point latitude
 *       - in: query
 *         name: lng1
 *         required: true
 *         schema:
 *           type: number
 *           format: float
 *         description: First point longitude
 *       - in: query
 *         name: lat2
 *         required: true
 *         schema:
 *           type: number
 *           format: float
 *         description: Second point latitude
 *       - in: query
 *         name: lng2
 *         required: true
 *         schema:
 *           type: number
 *           format: float
 *         description: Second point longitude
 *     responses:
 *       200:
 *         description: Distance calculated successfully
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
 *                     distance_km:
 *                       type: number
 *                       format: float
 *                       description: Distance in kilometers
 *                     coordinates:
 *                       type: object
 *                       properties:
 *                         point1:
 *                           type: object
 *                           properties:
 *                             latitude:
 *                               type: number
 *                               format: float
 *                             longitude:
 *                               type: number
 *                               format: float
 *                         point2:
 *                           type: object
 *                           properties:
 *                             latitude:
 *                               type: number
 *                               format: float
 *                             longitude:
 *                               type: number
 *                               format: float
 *       400:
 *         description: Invalid coordinates
 */
router.get('/location/distance', locationController.calculateDistance);

export default router;
