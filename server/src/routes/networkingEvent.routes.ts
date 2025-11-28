import { Router } from 'express';
import * as networkingEventController from '../controllers/networkingEvent.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Event routes
router.post('/', authMiddleware, networkingEventController.createNetworkingEvent);
router.get('/', authMiddleware, networkingEventController.listNetworkingEvents);
router.get('/:id', authMiddleware, networkingEventController.getNetworkingEvent);
router.patch('/:id', authMiddleware, networkingEventController.updateNetworkingEvent);
router.delete('/:id', authMiddleware, networkingEventController.deleteNetworkingEvent);

// Connection routes
router.post('/:eventId/connections', authMiddleware, networkingEventController.addEventConnection);
router.patch('/connections/:connectionId', authMiddleware, networkingEventController.updateEventConnection);
router.delete('/connections/:connectionId', authMiddleware, networkingEventController.deleteEventConnection);

export default router;


