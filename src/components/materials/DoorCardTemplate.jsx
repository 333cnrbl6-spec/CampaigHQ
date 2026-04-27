import React from 'react';
import { Leaf, CheckCircle } from 'lucide-react';

export default function DoorCardTemplate() {
  return (
    <div className="grid grid-cols-2 gap-0 bg-white text-slate-900">
      {/* Left Card */}
      <div className="p-6 border-r border-dashed border-slate-300 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Leaf className="w-6 h-6 text-[#6AB023]" />
            <h1 className="font-heading text-2xl font-bold text-[#6AB023]">Vote Green</h1>
          </div>

          <p className="text-xs font-semibold text-slate-600 mb-2">Paul Binns</p>
          <p className="text-xs text-slate-600 mb-4">Your Green Party Candidate for Tyldesley & Mosley Common</p>

          <div className="space-y-2 mb-4 text-xs">
            <div className="flex gap-2">
              <CheckCircle className="w-3 h-3 text-[#6AB023] flex-shrink-0 mt-0.5" />
              <span className="font-semibold">Fairer Homes</span>
            </div>
            <div className="flex gap-2">
              <CheckCircle className="w-3 h-3 text-[#6AB023] flex-shrink-0 mt-0.5" />
              <span className="font-semibold">Better NHS</span>
            </div>
            <div className="flex gap-2">
              <CheckCircle className="w-3 h-3 text-[#6AB023] flex-shrink-0 mt-0.5" />
              <span className="font-semibold">Green Energy</span>
            </div>
          </div>
        </div>

        <div className="bg-[#6AB023] text-white text-center py-2 rounded">
          <p className="font-bold text-sm">4th July 2024</p>
          <p className="text-xs">Vote Green</p>
        </div>
      </div>

      {/* Right Card */}
      <div className="p-6 flex flex-col justify-between bg-slate-50">
        <div>
          <p className="text-xs font-bold text-slate-600 mb-3">WHY VOTE GREEN?</p>
          
          <ul className="space-y-1 text-xs text-slate-700">
            <li className="flex gap-1">
              <span className="text-[#6AB023] font-bold">•</span>
              <span><strong>£28bn</strong> more for the NHS</span>
            </li>
            <li className="flex gap-1">
              <span className="text-[#6AB023] font-bold">•</span>
              <span><strong>Free</strong> university for all</span>
            </li>
            <li className="flex gap-1">
              <span className="text-[#6AB023] font-bold">•</span>
              <span>Better <strong>schools</strong> funding</span>
            </li>
            <li className="flex gap-1">
              <span className="text-[#6AB023] font-bold">•</span>
              <span><strong>100% renewable</strong> energy</span>
            </li>
            <li className="flex gap-1">
              <span className="text-[#6AB023] font-bold">•</span>
              <span><strong>Protected cycle lanes</strong></span>
            </li>
            <li className="flex gap-1">
              <span className="text-[#6AB023] font-bold">•</span>
              <span><strong>Net zero by 2040</strong></span>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-600 mb-2">FIND OUT MORE</p>
          <p className="text-xs text-slate-600">www.greenparty.org.uk</p>
          <p className="text-xs text-slate-600">Vote at your local polling station</p>
        </div>
      </div>
    </div>
  );
}