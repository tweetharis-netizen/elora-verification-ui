import React, { useState, useEffect } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';

const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Use the Tines-purple for the header background when at top to match the Hero
  const navClasses = scrolled
    ? 'bg-white/90 backdrop-blur-md border-b border-gray-100 text-slate-800 shadow-sm'
    : 'bg-[#6e6ef7] border-b border-[#6e6ef7] text-white';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navClasses}`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 font-bold text-2xl tracking-tight">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${scrolled ? 'bg-elora-600 text-white' : 'bg-white text-elora-600'}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-5 h-5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span>Elora</span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 font-medium text-sm">
          <button className="flex items-center gap-1 hover:opacity-80 transition-opacity">
            Product <ChevronDown size={14} />
          </button>
          <a href="#solutions" className="hover:opacity-80 transition-opacity">Solutions</a>
          <a href="#customers" className="hover:opacity-80 transition-opacity">Customers</a>
          <a href="#pricing" className="hover:opacity-80 transition-opacity">Pricing</a>
        </div>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <a href="#" className="text-sm font-medium hover:opacity-80 transition-opacity">Log in</a>
          <a 
            href="#" 
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all hover:scale-105 ${
              scrolled 
                ? 'bg-elora-600 text-white hover:bg-elora-700 shadow-lg shadow-elora-200' 
                : 'bg-white text-elora-600 hover:bg-gray-50'
            }`}
          >
            Book a demo
          </a>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white text-slate-900 border-b border-gray-100 shadow-xl p-6 flex flex-col gap-4">
          <a href="#" className="text-lg font-medium">Product</a>
          <a href="#" className="text-lg font-medium">Solutions</a>
          <a href="#" className="text-lg font-medium">Customers</a>
          <a href="#" className="text-lg font-medium">Pricing</a>
          <hr className="border-gray-100" />
          <a href="#" className="text-lg font-medium">Log in</a>
          <a href="#" className="bg-elora-600 text-white text-center py-3 rounded-xl font-semibold">Book a demo</a>
        </div>
      )}
    </nav>
  );
};

export default Navbar;