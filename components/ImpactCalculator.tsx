import React, { useState } from 'react';

const ImpactCalculator: React.FC = () => {
  const [students, setStudents] = useState(30);
  const hoursSavedPerStudent = 0.5; // Monthly
  const totalSaved = Math.floor(students * hoursSavedPerStudent * 4); // Yearly rough calc

  return (
    <section className="bg-white py-24 border-b border-gray-100 relative">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-medium text-slate-900 mb-6">
          Calculate your <span className="text-purple-600 font-serif italic">time back</span>
        </h2>
        <p className="text-slate-600 mb-12 max-w-xl mx-auto">
          See how many hours you could reclaim this year by automating administrative tasks with Elora.
        </p>

        <div className="bg-white border border-gray-200 rounded-3xl p-8 md:p-12 shadow-xl shadow-gray-100 max-w-2xl mx-auto">
          <div className="mb-10">
            <label htmlFor="students" className="block text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wide">
              Number of students per class
            </label>
            <div className="flex items-center gap-4">
                <span className="text-slate-400 font-medium">10</span>
                <input
                type="range"
                id="students"
                min="10"
                max="100"
                value={students}
                onChange={(e) => setStudents(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                />
                <span className="text-slate-400 font-medium">100</span>
            </div>
            <div className="mt-4 text-purple-600 font-bold text-5xl font-serif">
                {students} <span className="text-lg font-sans text-slate-400 font-normal">students</span>
            </div>
          </div>

          <div className="pt-10 border-t border-dashed border-gray-200">
            <div className="grid grid-cols-2 gap-8">
                <div>
                    <p className="text-slate-500 text-sm mb-1">Hours saved monthly</p>
                    <p className="text-3xl font-bold text-slate-900">{Math.floor(students * hoursSavedPerStudent)} hrs</p>
                </div>
                 <div>
                    <p className="text-slate-500 text-sm mb-1">Hours saved yearly</p>
                    <p className="text-3xl font-bold text-green-600">{Math.floor(students * hoursSavedPerStudent * 9)} hrs</p>
                </div>
            </div>
             <p className="text-xs text-slate-400 mt-6">*Based on average active Elora user data.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ImpactCalculator;