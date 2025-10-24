import { Router } from 'express';
import * as workExperienceController from '../controllers/workExperience.controller';

const router = Router();

router.post('/', workExperienceController.createWorkExperience);
router.get('/:id', workExperienceController.getWorkExperience);
router.get('/user/:userId', workExperienceController.getWorkExperiencesByUserId);
router.patch('/:id', workExperienceController.updateWorkExperience);
router.delete('/:id', workExperienceController.deleteWorkExperience);

export default router;