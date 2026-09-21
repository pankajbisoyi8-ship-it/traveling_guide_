import { Router } from 'express';
import { LiveInfoController } from './liveInfo.controller';

const router = Router();

router.get('/:destinationId', LiveInfoController.getDestinationPulse);

export default router;
