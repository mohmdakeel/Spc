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

      {/* Login Container */}
      <div className="relative z-10 bg-black/60 backdrop-blur-lg rounded-[20px] p-16 lg:p-20 text-center shadow-[0_20px_40px_rgba(0,0,0,0.3)] max-w-2xl w-[90%] border border-white/10">
        
        {/* Logo Container */}
        <div className="mb-10">
          <div className="relative w-full max-w-[300px] h-[120px] mx-auto mb-5">
            <Image
              src="/spclogopic.png"
              alt="SPC Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
        
        {/* Title */}
        <h1 className="text-[#FF6B35] text-4xl lg:text-5xl font-bold tracking-[2px] mb-12 uppercase leading-tight">
          Marketing
          <br />
          Development System
        </h1>
        
        {/* Sign In Button */}
        <button
          type="button"
          onClick={handleSignIn}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSignIn(); }}
          className="bg-transparent border-3 border-white/80 text-white px-10 py-4 text-xl font-semibold rounded-lg cursor-pointer transition-all duration-300 uppercase tracking-wide min-w-[150px] hover:bg-white/10 hover:border-white hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(0,0,0,0.2)] active:translate-y-0"
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'translateY(1px)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Sign In
        </button>
      </div>

      <style jsx>{`
        .border-3 {
          border-width: 3px;
        }
      `}</style>
    </div>
  );
}
