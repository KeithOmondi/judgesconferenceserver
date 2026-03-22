import webpush from 'web-push'
import { Request, Response } from 'express'
import { env } from '../config/env'

// Configure VAPID keys
webpush.setVapidDetails(
   env.VAPID_EMAIL!,
  env.VAPID_PUBLIC_KEY!,
  env.VAPID_PRIVATE_KEY!
)

// In-memory store for now — we'll move to DB next
let subscriptions: webpush.PushSubscription[] = []

// POST /notifications/subscribe
export const subscribe = async (req: Request, res: Response) => {
  try {
    const subscription = req.body as webpush.PushSubscription

    // Avoid duplicate subscriptions
    const exists = subscriptions.some(s => s.endpoint === subscription.endpoint)
    if (!exists) {
      subscriptions.push(subscription)
    }

    res.status(201).json({ message: 'Subscribed successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Failed to subscribe' })
  }
}

// POST /notifications/send
export const sendNotification = async (req: Request, res: Response) => {
  try {
    const { title, body } = req.body

    const payload = JSON.stringify({ title, body })

    // Send to all subscribers
    const results = await Promise.allSettled(
      subscriptions.map(sub => webpush.sendNotification(sub, payload))
    )

    // Remove expired/invalid subscriptions
    subscriptions = subscriptions.filter((_, i) => results[i].status === 'fulfilled')

    res.status(200).json({ message: 'Notifications sent' })
  } catch (error) {
    res.status(500).json({ message: 'Failed to send notification' })
  }
}