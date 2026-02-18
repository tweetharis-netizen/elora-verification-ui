import React from 'react';
import { Clock, Heart, ShieldCheck } from 'lucide-react';

const ValueProps: React.FC = () => {
  const props = [
    {
      icon: <Clock className="w-6 h-6 text-purple-600" />,
      title: "Reduce workload",
      desc: "Automate grading, attendance, and lesson planning. Give teachers their evenings back."
    },
    {
      icon: <Heart className="w-6 h-6 text-pink-500" />,
      title: "Personalize learning",
      desc: "AI-driven insights help tailor curriculum to every student's unique pace and needs."
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-blue-500" />,
      title: "Trustworthy insights",
      desc: "Give parents clear, data-backed visibility into their child's progress, without the jargon."
    }
  ];

  return (
    <section className="bg-white py-20 border-b border-gray-100 bg-grid-pattern bg-[size:40px_40px]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-12 relative">
           {/* Dotted separators for desktop */}
          <div className="hidden md:block absolute top-0 bottom-0 left-1/3 w-px border-l border-dashed border-gray-200"></div>
          <div className="hidden md:block absolute top-0 bottom-0 right-1/3 w-px border-l border-dashed border-gray-200"></div>

          {props.map((p, i) => (
            <div key={i} className="flex flex-col items-start p-4 hover:bg-slate-50/50 rounded-xl transition-colors duration-300">
              <div className="w-12 h-12 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center mb-6">
                {p.icon}
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">{p.title}</h3>
              <p className="text-slate-600 leading-relaxed">
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ValueProps;