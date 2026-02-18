import React from 'react';
import { Star } from 'lucide-react';

const Testimonials: React.FC = () => {
  return (
    <section id="customers" className="bg-[#6e6ef7] py-24 md:py-32 overflow-hidden relative">
        {/* Background elements to match Tines purple section */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#6e6ef7] to-[#5b5bd6]"></div>
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif text-white mb-6">Loved by our customers</h2>
          <div className="flex items-center justify-center gap-8 text-white/80 text-sm font-medium">
            <div className="flex items-center gap-2">
                <div className="flex text-yellow-300"><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /></div>
                <span>4.8/5 on G2</span>
            </div>
            <div className="h-4 w-px bg-white/20"></div>
             <div className="flex items-center gap-2">
                <div className="flex text-yellow-300"><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /></div>
                <span>TrustPilot</span>
            </div>
          </div>
        </div>

        {/* The Cards Grid - Exact match of Pastel Colors */}
        <div className="grid md:grid-cols-3 gap-6">
            
            {/* Card 1: Pink */}
            <div className="bg-[#ffcfd2] rounded-2xl p-8 flex flex-col justify-between h-[340px] hover:-translate-y-2 transition-transform duration-300 cursor-default shadow-lg shadow-purple-900/10">
                <div className="text-[#592e31]">
                    <h3 className="text-2xl font-serif leading-tight mb-4">
                        "The time we save on administrative tasks is reinvested directly into student mentorship."
                    </h3>
                </div>
                <div className="flex items-end justify-between">
                    <div>
                        <p className="font-bold text-[#592e31] text-sm">Sarah Jenkins</p>
                        <p className="text-[#592e31]/70 text-xs">Principal, Oakwood High</p>
                    </div>
                     <div className="flex text-[#592e31]"><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /></div>
                </div>
            </div>

            {/* Card 2: Yellow/Peach */}
            <div className="bg-[#ffe8c8] rounded-2xl p-8 flex flex-col justify-between h-[340px] hover:-translate-y-2 transition-transform duration-300 delay-75 cursor-default shadow-lg shadow-purple-900/10">
                 <div className="text-[#523e1f]">
                     <div className="text-6xl font-serif mb-2 text-[#523e1f]">10 hours</div>
                     <p className="text-sm uppercase tracking-wide font-bold opacity-60 mb-4">of work time saved every week</p>
                    <p className="font-medium leading-relaxed">
                        "Elora automates the repetitive grading that used to keep me at school until 7pm."
                    </p>
                </div>
                <div className="flex items-center gap-2 mt-4">
                     <div className="w-6 h-6 bg-[#523e1f]/10 rounded-full"></div>
                     <span className="font-bold text-[#523e1f]">EdTech Weekly</span>
                </div>
            </div>

            {/* Card 3: Blue/Lavender */}
             <div className="bg-[#cfd2ff] rounded-2xl p-8 flex flex-col h-[340px] hover:-translate-y-2 transition-transform duration-300 delay-150 cursor-default shadow-lg shadow-purple-900/10 relative overflow-hidden">
                 <div className="relative z-10 text-[#292c5c]">
                    <p className="font-serif text-xl leading-relaxed mb-6">
                        "No matter how the curriculum changes, Elora adapts. It's the most flexible assistant we've ever used."
                    </p>
                    <div className="bg-white/40 backdrop-blur-sm p-4 rounded-xl inline-block">
                         <p className="font-bold text-sm">Automated workflows</p>
                         <p className="text-xs opacity-70">Active in 45 classrooms</p>
                    </div>
                </div>
                {/* Decorative circle */}
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#8c91e0] rounded-full opacity-50 blur-2xl"></div>
                 <div className="absolute bottom-8 right-8">
                     <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#292c5c] shadow-sm">
                         <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                     </div>
                 </div>
            </div>
            
             {/* Card 4: Green (Bottom Row - Wide) */}
             <div className="md:col-span-2 bg-[#cfffc4] rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8 hover:-translate-y-2 transition-transform duration-300 cursor-default shadow-lg shadow-purple-900/10">
                 <div className="flex-1 text-[#1f4518]">
                    <h3 className="text-2xl font-serif leading-tight mb-4">
                        "Beyond the product, the level of support from Elora helps us benchmark our entire district's performance."
                    </h3>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#1f4518] text-[#cfffc4] flex items-center justify-center font-bold">M</div>
                        <div>
                            <p className="font-bold text-sm">Mark Thompson</p>
                            <p className="text-xs opacity-70">District Superintendent</p>
                        </div>
                    </div>
                </div>
                <div className="hidden md:block w-32 h-32 bg-white/30 rounded-full flex-shrink-0 relative">
                     <div className="absolute inset-0 flex items-center justify-center text-[#1f4518] font-serif text-4xl">
                         A+
                     </div>
                </div>
            </div>

            {/* Card 5: Lavender (Bottom Row - Small) */}
            <div className="bg-[#e4cfff] rounded-2xl p-8 flex flex-col justify-center hover:-translate-y-2 transition-transform duration-300 delay-75 cursor-default shadow-lg shadow-purple-900/10">
                 <p className="text-[#41295c] font-medium text-lg text-center">
                    "After a year, I have not come across something I could not accomplish in Elora."
                 </p>
                  <div className="flex justify-center mt-6 text-[#41295c]"><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /></div>
            </div>

        </div>
      </div>
    </section>
  );
};

export default Testimonials;