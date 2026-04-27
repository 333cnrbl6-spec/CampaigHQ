import React from 'react';
import { Leaf } from 'lucide-react';

export default function PosterTemplate() {
  return (
    <div className="bg-gradient-to-b from-[#6AB023] via-[#5A8F1F] to-[#4A7F1F] text-white aspect-[3/4] p-12 flex flex-col justify-between relative overflow-hidden">
      {/* Decorative leaf pattern background */}
      <div className="absolute top-0 right-0 opacity-10">
        <Leaf className="w-40 h-40" />
      </div>

      {/* Top Section */}
      <div className="relative z-10 text-center">
        <div className="flex justify-center mb-4">
          <Leaf className="w-24 h-24 text-white" />
        </div>
      </div>

      {/* Main Message */}
      <div className="relative z-10 text-center space-y-6">
        <div>
          <h1 className="text-7xl font-heading font-bold leading-tight mb-2">
            Vote Hope
          </h1>
          <h2 className="text-5xl font-heading font-bold text-yellow-300 leading-tight mb-4">
            Vote Change
          </h2>
          <h3 className="text-4xl font-heading font-bold">
            Vote Green
          </h3>
        </div>

        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6 inline-block">
          <p className="text-2xl font-bold">Paul Binns</p>
          <p className="text-xl">Green Party Candidate</p>
          <p className="text-lg mt-2">Tyldesley & Mosley Common</p>
        </div>

        <div className="text-lg font-semibold">
          <p>Real solutions. Real change.</p>
        </div>
      </div>

      {/* Bottom Information */}
      <div className="relative z-10 text-center space-y-2">
        <p className="text-3xl font-bold">4th July 2024</p>
        <p className="text-sm opacity-90">www.greenparty.org.uk</p>
        <p className="text-xs opacity-75">Vote at your local polling station • Polling stations open 7am - 10pm</p>
      </div>
    </div>
  );
}