import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-100 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-10 mb-20">
        <div className="col-span-2">
            <div className="flex items-center gap-2 font-bold text-xl mb-6 text-slate-900">
                <div className="w-6 h-6 rounded bg-elora-600 text-white flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-4 h-4">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                </div>
                <span>Elora</span>
            </div>
            <p className="text-slate-500 max-w-xs">
                The AI teaching assistant that helps you focus on what matters most: your students.
            </p>
        </div>
        
        <div className="flex flex-col gap-4">
            <h4 className="font-semibold text-slate-900">Platform</h4>
            <a href="#" className="text-slate-500 hover:text-elora-600 transition-colors">Features</a>
            <a href="#" className="text-slate-500 hover:text-elora-600 transition-colors">Pricing</a>
            <a href="#" className="text-slate-500 hover:text-elora-600 transition-colors">Security</a>
        </div>
        
        <div className="flex flex-col gap-4">
            <h4 className="font-semibold text-slate-900">Company</h4>
            <a href="#" className="text-slate-500 hover:text-elora-600 transition-colors">About</a>
            <a href="#" className="text-slate-500 hover:text-elora-600 transition-colors">Careers</a>
            <a href="#" className="text-slate-500 hover:text-elora-600 transition-colors">Contact</a>
        </div>
        
        <div className="flex flex-col gap-4">
            <h4 className="font-semibold text-slate-900">Resources</h4>
            <a href="#" className="text-slate-500 hover:text-elora-600 transition-colors">Blog</a>
            <a href="#" className="text-slate-500 hover:text-elora-600 transition-colors">Help Center</a>
            <a href="#" className="text-slate-500 hover:text-elora-600 transition-colors">Case Studies</a>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-sm text-slate-400 pt-8 border-t border-gray-100">
        <p>© 2024 Elora Education Inc. All rights reserved.</p>
        <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-slate-600">Privacy Policy</a>
            <a href="#" className="hover:text-slate-600">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;