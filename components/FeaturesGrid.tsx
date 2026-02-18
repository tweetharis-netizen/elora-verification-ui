import React from 'react';
import { ArrowRight } from 'lucide-react';

const FeaturesGrid: React.FC = () => {
  return (
    <section className="bg-slate-50 py-24 md:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16 max-w-2xl">
          <h2 className="text-4xl md:text-5xl font-medium text-slate-900 mb-6 tracking-tight">
            Built for the modern <br/> <span className="text-elora-600 font-serif italic">classroom ecosystem.</span>
          </h2>
          <p className="text-lg text-slate-600">
            Everything you need to manage your class, communicate with families, and support student growth—all in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:auto-rows-[400px]">
          
          {/* Large Card - AI Assistant */}
          <div className="col-span-1 md:col-span-7 bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="relative z-10 max-w-sm">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mb-6 text-purple-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-4">Your AI Co-pilot</h3>
              <p className="text-slate-600 mb-8">Generate lesson plans, quiz questions, and progress reports in seconds. Elora learns your teaching style.</p>
              <a href="#" className="inline-flex items-center text-elora-600 font-medium hover:gap-2 transition-all">
                Learn more <ArrowRight size={16} className="ml-1" />
              </a>
            </div>
            {/* Visual */}
            <div className="absolute top-12 right-[-20%] w-[60%] md:w-[50%] h-full bg-slate-50 rounded-tl-2xl border-l border-t border-gray-100 shadow-xl transition-transform duration-500 group-hover:-translate-x-4 p-4">
                 <div className="space-y-3">
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                        <div className="h-2 w-12 bg-purple-100 rounded mb-2"></div>
                        <div className="h-2 w-full bg-slate-100 rounded"></div>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 ml-4">
                         <div className="h-2 w-12 bg-blue-100 rounded mb-2"></div>
                        <div className="h-2 w-full bg-slate-100 rounded"></div>
                    </div>
                     <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                         <div className="h-2 w-12 bg-green-100 rounded mb-2"></div>
                        <div className="h-2 w-full bg-slate-100 rounded"></div>
                    </div>
                 </div>
            </div>
          </div>

          {/* Tall Card - Parent Communication */}
          <div className="col-span-1 md:col-span-5 bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="relative z-10">
               <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-6 text-blue-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-4">Instant Updates</h3>
              <p className="text-slate-600 mb-6">Automated summaries sent to parents. No more "How was school?" silence.</p>
            </div>
             <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[80%] h-[50%] bg-blue-50 rounded-t-2xl border-x border-t border-gray-100 shadow-lg transition-transform duration-500 group-hover:-translate-y-4 p-4 flex flex-col items-center">
                 <div className="w-12 h-1 rounded-full bg-slate-200 mb-4"></div>
                 <div className="w-full space-y-2">
                     <div className="flex gap-2 items-center">
                         <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                         <div className="h-8 flex-1 bg-white rounded-xl shadow-sm border border-blue-100"></div>
                     </div>
                 </div>
            </div>
          </div>

          {/* Wide Card Bottom - Analytics */}
          <div className="col-span-1 md:col-span-12 bg-[#312e81] rounded-3xl p-8 md:p-12 shadow-sm relative overflow-hidden text-white group">
            <div className="grid md:grid-cols-2 gap-12 items-center h-full relative z-10">
                <div>
                     <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-6 text-white">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    </div>
                    <h3 className="text-2xl font-semibold text-white mb-4">Insights that matter</h3>
                    <p className="text-indigo-200 mb-8 max-w-md">Track student performance trends over time. Identify learning gaps before they become problems.</p>
                    <button className="bg-white text-indigo-900 px-6 py-3 rounded-full font-medium hover:bg-indigo-50 transition-colors">
                        View dashboard
                    </button>
                </div>
                <div className="relative h-full min-h-[200px] flex items-center justify-center">
                    {/* Abstract Graph */}
                    <div className="w-full h-48 flex items-end justify-between gap-4 px-8 opacity-80 group-hover:opacity-100 transition-opacity">
                        <div className="w-full bg-indigo-500/30 rounded-t-sm h-[40%] group-hover:h-[60%] transition-all duration-700"></div>
                        <div className="w-full bg-indigo-500/50 rounded-t-sm h-[70%] group-hover:h-[50%] transition-all duration-700 delay-75"></div>
                        <div className="w-full bg-indigo-400 rounded-t-sm h-[50%] group-hover:h-[80%] transition-all duration-700 delay-100"></div>
                        <div className="w-full bg-indigo-300 rounded-t-sm h-[85%] group-hover:h-[90%] transition-all duration-700 delay-150"></div>
                        <div className="w-full bg-white rounded-t-sm h-[60%] group-hover:h-[95%] transition-all duration-700 delay-200"></div>
                    </div>
                </div>
            </div>
             {/* Background decoration */}
             <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500 rounded-full mix-blend-overlay filter blur-[100px] opacity-20"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;