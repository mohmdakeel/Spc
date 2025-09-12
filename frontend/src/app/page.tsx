// src/app/page.tsx
import Link from 'next/link';

export default function HomePage() {
  const cards = [
    {
      title: 'Transport',
      description: 'Manage vehicles, drivers, and history',
      link: '/Akeel/Transport',
      emoji: '🚚',
    },
    {
      title: 'Applicant',
      description: 'Manage applicant requests and dashboard',
      link: '/Akeel/Applicant',
      emoji: '👤', // You can choose a different emoji (e.g., 👤 for a person)
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
          SPC System Dashboard Akeel
        </h1>
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Link key={card.title} href={card.link} className="block">
              <div className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:translate-y-[-4px] border border-gray-200">
                <div className="text-5xl mb-4 text-center">{card.emoji}</div>
                <h2 className="text-xl font-semibold text-gray-800 text-center">{card.title}</h2>
                <p className="text-gray-600 text-center mt-2">{card.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}