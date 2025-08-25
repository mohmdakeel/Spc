'use client'
import Link from 'next/link'

export default function HomePage() {
  const cards = [
    {
      title: 'Transport',
      description: 'Manage vehicles, drivers, and routes',
      link: '/Akeel/Transport/Dashboard', // ✅ FIXED link
      emoji: '🚚',
    },
    {
      title: 'Marketing',
      description: 'Handle campaigns and analytics',
      link: '/akee/marketing', // example
      emoji: '📊',
    },
    {
      title: 'Dewmini Marketing',
      description: 'Manage Dewmini campaigns and analytics',
      link: '/Dewmini/Marketing', // New link
      emoji: '📈',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">SPC System Dashboard</h1>
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto">
        {cards.map((card) => (
          <Link key={card.title} href={card.link} className="block">
            <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition">
              <div className="text-5xl mb-4">{card.emoji}</div>
              <h2 className="text-xl font-semibold">{card.title}</h2>
              <p className="text-gray-600">{card.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
