import { Router } from 'express';
import * as referralRequestController from '../controllers/referralRequest.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authMiddleware, referralRequestController.createReferralRequest);
router.post('/generate-template', authMiddleware, referralRequestController.generateReferralTemplateForRequest);
router.get('/', authMiddleware, referralRequestController.listReferralRequests);
router.get('/analytics', authMiddleware, referralRequestController.getReferralAnalytics);
router.get('/job/:jobId/potential-sources', authMiddleware, referralRequestController.getPotentialReferralSources);
router.get('/:id', authMiddleware, referralRequestController.getReferralRequest);
router.patch('/:id', authMiddleware, referralRequestController.updateReferralRequest);
router.delete('/:id', authMiddleware, referralRequestController.deleteReferralRequest);

export default router;

