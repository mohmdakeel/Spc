'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const SPCLogin: React.FC = () => {
  const router = useRouter();

  const handleSignIn = () => {
    router.push('/Dewmini/Marketing/login');
  };

  return (
    <div className="min-h-screen flex justify-center items-center relative">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/bookbg.jpg"         // <-- public/bookbg.jpg is referenced as /bookbg.jpg
          alt="Background"
          fill
          className="object-cover"
          priority
        />
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
};

export default SPCLogin;
