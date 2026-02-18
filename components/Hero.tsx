import React from 'react';
import { Play, ArrowRight } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
      {/* Background - Tines Style Deep Purple */}
      <div className="absolute inset-0 bg-[#6e6ef7] z-0">
        {/* Subtle grid overlay for texture */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
        
        {/* Abstract shapes/blobs */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-purple-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-40"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-medium mb-8 backdrop-blur-sm">
            <span className="bg-white text-elora-600 px-1.5 py-0.5 rounded text-[10px] font-bold">NEW</span>
            <span>2025 Education Impact Report Available →</span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-7xl font-serif md:font-sans font-medium text-white tracking-tight leading-[1.1] mb-6">
            For the education <br className="hidden md:block" />
            <span className="italic font-serif">you can't compromise</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-indigo-100 max-w-2xl mb-10 leading-relaxed">
            Elora orchestrates intelligent workflows for schools. Reduce admin workload, 
            personalize student learning, and give parents the clarity they deserve.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <button className="w-full sm:w-auto px-8 py-4 bg-white text-elora-600 rounded-full font-semibold text-base transition-transform hover:scale-105 shadow-xl shadow-indigo-900/20 flex items-center justify-center gap-2">
              Book a demo
            </button>
            <button className="w-full sm:w-auto px-8 py-4 bg-transparent border border-white/30 text-white rounded-full font-semibold text-base hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
              <Play size={16} fill="currentColor" /> Watch video
            </button>
          </div>
        </div>

        {/* Floating UI Elements / Visuals - The "Product" Shot */}
        <div className="mt-20 relative mx-auto max-w-5xl">
            {/* Main Dashboard Card */}
            <div className="bg-white rounded-t-2xl shadow-2xl shadow-indigo-900/40 border border-white/20 p-2 md:p-4 pb-0 overflow-hidden transform transition-transform hover:-translate-y-2 duration-700">
                <div className="bg-slate-50 rounded-t-xl border border-slate-200 border-b-0 aspect-[16/9] md:aspect-[2/1] relative overflow-hidden">
                    {/* Mockup Header */}
                    <div className="h-12 border-b border-slate-200 bg-white flex items-center px-4 justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                            <div className="w-3 h-3 rounded-full bg-green-400"></div>
                        </div>
                        <div className="h-6 w-64 bg-slate-100 rounded-md"></div>
                        <div className="h-8 w-8 rounded-full bg-slate-200"></div>
                    </div>
                    {/* Mockup Content */}
                    <div className="p-6 grid grid-cols-12 gap-6">
                        {/* Sidebar */}
                        <div className="hidden md:block col-span-2 space-y-3">
                             <div className="h-4 w-24 bg-slate-200 rounded"></div>
                             <div className="h-4 w-20 bg-slate-100 rounded"></div>
                             <div className="h-4 w-16 bg-slate-100 rounded"></div>
                             <div className="h-4 w-20 bg-slate-100 rounded"></div>
                        </div>
                        {/* Main Content */}
                        <div className="col-span-12 md:col-span-7 space-y-4">
                            <div className="h-8 w-48 bg-slate-200 rounded mb-6"></div>
                            {/* AI Message Bubble */}
                            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl rounded-tl-sm p-4 max-w-md">
                                <div className="flex gap-3 mb-2">
                                    <div className="w-6 h-6 rounded bg-indigo-500 flex items-center justify-center text-white text-xs">✨</div>
                                    <div className="h-4 w-32 bg-indigo-200 rounded"></div>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-2 w-full bg-indigo-100 rounded"></div>
                                    <div className="h-2 w-5/6 bg-indigo-100 rounded"></div>
                                </div>
                            </div>
                             {/* User Reply Bubble */}
                             <div className="bg-white border border-slate-200 rounded-2xl rounded-tr-sm p-4 max-w-sm ml-auto shadow-sm">
                                <div className="h-2 w-full bg-slate-100 rounded"></div>
                            </div>
                        </div>
                        {/* Right Panel */}
                        <div className="hidden md:block col-span-3 space-y-3 border-l border-slate-100 pl-6">
                            <div className="h-24 w-full bg-yellow-50 rounded-xl border border-yellow-100 p-3">
                                <div className="h-4 w-12 bg-yellow-200 rounded mb-2"></div>
                                <div className="h-2 w-full bg-yellow-100 rounded"></div>
                            </div>
                            <div className="h-24 w-full bg-green-50 rounded-xl border border-green-100 p-3">
                                <div className="h-4 w-12 bg-green-200 rounded mb-2"></div>
                                <div className="h-2 w-full bg-green-100 rounded"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Element 1 - Notification */}
            <div className="absolute -right-4 md:-right-12 top-20 bg-white p-4 rounded-xl shadow-xl border border-slate-100 animate-[bounce_4s_infinite] max-w-[200px]">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-medium">Grading Complete</p>
                        <p className="text-sm font-bold text-slate-800">Saved 45 mins</p>
                    </div>
                </div>
            </div>

             {/* Floating Element 2 - Parent Insight */}
             <div className="hidden md:block absolute -left-12 bottom-20 bg-white p-4 rounded-xl shadow-xl border border-slate-100 animate-[bounce_5s_infinite] max-w-[240px]">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xs font-bold">JD</div>
                    <p className="text-xs text-slate-500">Parent Update Sent</p>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-purple-500 rounded-full"></div>
                </div>
            </div>
        </div>
      </div>
      
      {/* Separator - pure white curve or line if needed, but Tines usually just ends */}
    </section>
  );
};

export default Hero;