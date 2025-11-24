import { Router } from 'express';
import * as professionalContactController from '../controllers/professionalContact.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authMiddleware, professionalContactController.createProfessionalContact);
router.get('/', authMiddleware, professionalContactController.listProfessionalContacts);
router.get('/reminders', authMiddleware, professionalContactController.getFollowUpReminders);
router.get('/:id', authMiddleware, professionalContactController.getProfessionalContact);
router.patch('/:id', authMiddleware, professionalContactController.updateProfessionalContact);
router.delete('/:id', authMiddleware, professionalContactController.deleteProfessionalContact);

router.post('/:contactId/interactions', authMiddleware, professionalContactController.createContactInteraction);
router.patch('/:contactId/interactions/:interactionId', authMiddleware, professionalContactController.updateContactInteraction);
router.delete('/:id/interactions/:interactionId', authMiddleware, professionalContactController.deleteContactInteraction);

export default router;

