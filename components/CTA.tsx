import React from 'react';
import { ArrowRight } from 'lucide-react';

const CTA: React.FC = () => {
  return (
    <section className="bg-slate-50 py-32 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-100 rounded-full filter blur-[100px] opacity-60"></div>

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <h2 className="text-5xl md:text-6xl font-medium text-slate-900 mb-8 tracking-tight">
          Start teaching <br/>
          <span className="text-elora-600 font-serif italic">without the burnout.</span>
        </h2>
        <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
          Join 500+ schools using Elora to empower teachers and engage students. No credit card required for the pilot.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button className="px-8 py-4 bg-elora-600 text-white rounded-full font-semibold text-lg hover:bg-elora-700 transition-all hover:scale-105 shadow-xl shadow-purple-200">
            Get started for free
          </button>
          <button className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-full font-semibold text-lg hover:bg-gray-50 transition-colors">
            Book a demo
          </button>
        </div>
      </div>
    </section>
  );
};

export default CTA;