import React from 'react';

const LogoStrip: React.FC = () => {
  // Placeholder logos using text for now to keep it clean, or simple SVG shapes
  const logos = [
    "Riverdale High", "Oakwood Academy", "Summit Public Schools", "Horizon Charter", "Westfield Tech", "Northstar Prep"
  ];

  return (
    <section className="bg-white border-b border-gray-100 py-12 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-sm font-medium text-slate-400 mb-8 uppercase tracking-wider">
          Trusted by forward-thinking schools
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
          {logos.map((logo, i) => (
            <div key={i} className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <div className={`w-6 h-6 rounded-md ${i % 2 === 0 ? 'bg-slate-800' : 'bg-slate-400'}`}></div>
                {logo}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LogoStrip;