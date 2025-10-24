import { Router } from 'express';
import * as educationController from '../controllers/education.controller';

const router = Router();

router.post('/', educationController.createEducation);
router.get('/:id', educationController.getEducation);
router.get('/user/:userId', educationController.getEducationsByUserId);
router.patch('/:id', educationController.updateEducation);
router.delete('/:id', educationController.deleteEducation);

export default router;