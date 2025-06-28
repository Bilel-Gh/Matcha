import { Router } from 'express';
import * as chatController from '../controllers/chatController';
import { protect } from '../middlewares/auth';
import { validateBody, validateQuery } from '../middlewares/validator';
import { validateSendMessage, validateSearchConversations } from '../utils/validators';

const router = Router();

// All chat routes require authentication
router.use(protect);

/**
 * @swagger
 * components:
 *   schemas:
 *     Message:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         sender_id:
 *           type: integer
 *         receiver_id:
 *           type: integer
 *         content:
 *           type: string
 *         is_read:
 *           type: boolean
 *         sent_at:
 *           type: string
 *           format: date-time
 *
 *     PublicUser:
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
 *         profile_picture_url:
 *           type: string
 *         is_online:
 *           type: boolean
 *         last_connection:
 *           type: string
 *           format: date-time
 *
 *     ChatMessage:
 *       allOf:
 *         - $ref: '#/components/schemas/Message'
 *         - type: object
 *           properties:
 *             sender:
 *               $ref: '#/components/schemas/PublicUser'
 *             receiver:
 *               $ref: '#/components/schemas/PublicUser'
 *
 *     Conversation:
 *       type: object
 *       properties:
 *         user:
 *           $ref: '#/components/schemas/PublicUser'
 *         last_message:
 *           $ref: '#/components/schemas/Message'
 *         unread_count:
 *           type: integer
 */

/**
 * @swagger
 * /api/chat/conversations:
 *   get:
 *     summary: Get all conversations for the authenticated user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of conversations
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
 *                     conversations:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Conversation'
 *                     total_conversations:
 *                       type: integer
 *                     total_unread:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 */
router.get('/conversations', chatController.getConversations);

/**
 * @swagger
 * /api/chat/conversations/search:
 *   get:
 *     summary: Search conversations by user name
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *         description: Search query (minimum 2 characters)
 *     responses:
 *       200:
 *         description: Filtered conversations
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
 *                     conversations:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Conversation'
 *                     query:
 *                       type: string
 *       400:
 *         description: Invalid search query
 *       401:
 *         description: Unauthorized
 */
router.get('/conversations/search', validateQuery(validateSearchConversations), chatController.searchConversations);

/**
 * @swagger
 * /api/chat/messages/{userId}:
 *   get:
 *     summary: Get messages with a specific user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user to get messages with
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of messages to retrieve
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of messages to skip
 *     responses:
 *       200:
 *         description: Messages between users
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
 *                     messages:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ChatMessage'
 *                     total:
 *                       type: integer
 *                     has_more:
 *                       type: boolean
 *       400:
 *         description: Invalid user ID or pagination parameters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not matched with this user
 */
router.get('/messages/:userId', chatController.getMessages);

/**
 * @swagger
 * /api/chat/send:
 *   post:
 *     summary: Send a message to another user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - receiverId
 *               - content
 *             properties:
 *               receiverId:
 *                 type: integer
 *                 description: ID of the message recipient
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *                 description: Message content
 *               tempId:
 *                 type: string
 *                 description: Temporary ID for client-side optimistic updates
 *     responses:
 *       201:
 *         description: Message sent successfully
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
 *                     message:
 *                       $ref: '#/components/schemas/ChatMessage'
 *                     tempId:
 *                       type: string
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not matched with this user or user blocked
 */
router.post('/send', validateBody(validateSendMessage), chatController.sendMessage);

/**
 * @swagger
 * /api/chat/read/{messageId}:
 *   put:
 *     summary: Mark a specific message as read
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the message to mark as read
 *     responses:
 *       200:
 *         description: Message marked as read
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
 *                     message:
 *                       $ref: '#/components/schemas/Message'
 *                 message:
 *                   type: string
 *                   example: Message marked as read
 *       400:
 *         description: Invalid message ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Cannot mark this message as read
 *       404:
 *         description: Message not found
 */
router.put('/read/:messageId', chatController.markMessageAsRead);

/**
 * @swagger
 * /api/chat/read-all/{senderId}:
 *   put:
 *     summary: Mark all messages from a specific user as read
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: senderId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the sender whose messages to mark as read
 *     responses:
 *       200:
 *         description: Messages marked as read
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
 *                     marked_count:
 *                       type: integer
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid sender ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not matched with this user
 */
router.put('/read-all/:senderId', chatController.markAllMessagesAsRead);

/**
 * @swagger
 * /api/chat/unread-count:
 *   get:
 *     summary: Get unread message count for the authenticated user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread message count
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
 *                     total_unread:
 *                       type: integer
 *                     conversations_with_unread:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 */
router.get('/unread-count', chatController.getUnreadCount);

/**
 * @swagger
 * /api/chat/partner/{partnerId}:
 *   get:
 *     summary: Get conversation partner information
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partnerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the conversation partner
 *     responses:
 *       200:
 *         description: Partner information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/PublicUser'
 *       400:
 *         description: Invalid partner ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Cannot access conversation with this user
 *       404:
 *         description: User not found
 */
router.get('/partner/:partnerId', chatController.getConversationPartner);

/**
 * @swagger
 * /api/chat/stats/{partnerId}:
 *   get:
 *     summary: Get conversation statistics with a specific user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partnerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the conversation partner
 *     responses:
 *       200:
 *         description: Conversation statistics
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
 *                     total_messages:
 *                       type: integer
 *                     messages_sent:
 *                       type: integer
 *                     messages_received:
 *                       type: integer
 *                     first_message_date:
 *                       type: string
 *                       format: date-time
 *                     last_message_date:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid partner ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Cannot access conversation statistics with this user
 */
router.get('/stats/:partnerId', chatController.getConversationStats);

/**
 * @swagger
 * /api/chat/can-chat/{userId}:
 *   get:
 *     summary: Check if current user can chat with another user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user to check chat permission with
 *     responses:
 *       200:
 *         description: Chat permission status
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
 *                     can_chat:
 *                       type: boolean
 *                     user_id:
 *                       type: integer
 *       400:
 *         description: Invalid user ID
 *       401:
 *         description: Unauthorized
 */
router.get('/can-chat/:userId', chatController.checkChatPermission);

export default router;
