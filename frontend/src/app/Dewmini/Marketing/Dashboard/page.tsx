// src/app/Dewmini/Marketing/Dashboard/page.tsx
import Link from "next/link";

type Card = {
  title: string;
  description: string;
  emoji: string;
  link?: string; // make it optional
};

export default function DashboardPage() {
  const cards: Card[] = [
    {
      title: "Transport",
      description: "Manage vehicles, drivers, and routes",
      link: "/Akeel/Transport/Dashboard",
      emoji: "🚚",
    },
    {
      title: "Marketing",
      description: "Handle campaigns and analytics",
      link: "/akee/marketing",
      emoji: "📊",
    },
    {
      title: "Dewmini Marketing",
      description: "Manage Dewmini campaigns and analytics",
      // link omitted until route exists
      emoji: "📈",
    },
  ];

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <header className="max-w-5xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-center">SPC System Dashboard</h1>
        <p className="text-center text-gray-600 mt-2">
          Quick links to modules and tools
        </p>
      </header>

      <section className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
        {cards.map((card) => {
          const CardBody = (
            <div className="p-6 bg-white rounded-xl shadow-sm ring-1 ring-gray-200 hover:shadow-md hover:ring-gray-300 transition">
              <div className="text-5xl mb-4">{card.emoji}</div>
              <h2 className="text-xl font-semibold">{card.title}</h2>
              <p className="text-gray-600 mt-1">{card.description}</p>
              <div className="mt-4 text-sm text-[#FF6B35] font-medium group-hover:underline">
                {card.link ? `Go to ${card.title} →` : "Coming soon"}
              </div>
            </div>
          );

          return card.link ? (
            <Link key={card.title} href={card.link} className="group block">
              {CardBody}
            </Link>
          ) : (
            <div
              key={card.title}
              className="group block opacity-60 pointer-events-none"
              aria-disabled="true"
            >
              {CardBody}
            </div>
          );
        })}
      </section>
    </main>
  );
}
