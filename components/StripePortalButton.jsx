'use client'

export default function StripePortalButton() {
  async function handlePortal() {
    const response = await fetch('/api/stripe/portal', { method: 'POST' })
    const data = await response.json()
    if (data.url) {
      window.location.href = data.url
    }
  }

  return (
    <button
      onClick={handlePortal}
      className="block w-full py-3 px-4 bg-gray-100 text-gray-700 text-center rounded-lg font-medium hover:bg-gray-200 transition-colors"
    >
      Gerenciar no Portal do Stripe
    </button>
  )
}
