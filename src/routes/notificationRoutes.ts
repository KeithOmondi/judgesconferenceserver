import { Router } from 'express'
import { subscribe, sendNotification } from '../controllers/notificationController'

const router = Router()

router.post('/subscribe', subscribe)
router.post('/send', sendNotification)

export default router