import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_not_configured', {
  apiVersion: '2026-03-25.dahlia',
})
