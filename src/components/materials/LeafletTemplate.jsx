import React from 'react';
import { Leaf, Home, Zap, Users, Heart, TrendingUp } from 'lucide-react';

export default function LeafletTemplate() {
  return (
    <div className="bg-white text-slate-900">
      {/* Cover Panel */}
      <div className="bg-gradient-to-br from-[#6AB023] to-[#5A8F1F] text-white p-12 text-center">
        <div className="flex justify-center mb-4">
          <Leaf className="w-16 h-16" />
        </div>
        <h1 className="text-4xl font-heading font-bold mb-2">Vote Green</h1>
        <p className="text-lg font-semibold mb-4">Vote Hope. Vote Change.</p>
        <p className="text-white/90 text-sm">Paul Binns for Tyldesley & Mosley Common</p>
        <p className="text-white/75 text-xs mt-2">4th July 2024</p>
      </div>

      {/* Inside Left */}
      <div className="grid grid-cols-3 gap-0">
        <div className="col-span-1 bg-slate-50 p-8 border-r border-slate-200">
          <h2 className="font-heading text-xl font-bold text-slate-900 mb-6">Our Vision</h2>
          
          <div className="space-y-6">
            <div className="flex gap-3">
              <Home className="w-5 h-5 text-[#6AB023] flex-shrink-0 mt-1" />
              <div className="text-sm">
                <p className="font-semibold">Fairer Homes</p>
                <p className="text-slate-600 text-xs mt-1">Real solutions to the housing crisis - more affordable homes for all</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Zap className="w-5 h-5 text-[#6AB023] flex-shrink-0 mt-1" />
              <div className="text-sm">
                <p className="font-semibold">Green Energy</p>
                <p className="text-slate-600 text-xs mt-1">Massive expansion of renewable power - jobs and lower bills</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Heart className="w-5 h-5 text-[#6AB023] flex-shrink-0 mt-1" />
              <div className="text-sm">
                <p className="font-semibold">Better NHS</p>
                <p className="text-slate-600 text-xs mt-1">Proper funding for our health service - £8bn in year one</p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-2 p-8">
          <h2 className="font-heading text-2xl font-bold text-slate-900 mb-4">Real Change for Tyldesley & Mosley Common</h2>
          
          <p className="text-slate-700 text-sm mb-4">
            Millions of people are feeling insecure about the future. Our NHS is in crisis. Housing is unaffordable. And climate change threatens everything we hold dear.
          </p>

          <p className="text-slate-700 text-sm mb-6">
            <strong>It doesn't have to be this way.</strong> The Green Party has real solutions to real problems:
          </p>

          <div className="space-y-3 mb-6">
            <div className="flex gap-2 text-xs text-slate-700">
              <span className="text-[#6AB023] font-bold">✓</span>
              <span><strong>£28bn more for the NHS by 2030</strong> - quicker access to GPs, dentists and mental health support</span>
            </div>
            <div className="flex gap-2 text-xs text-slate-700">
              <span className="text-[#6AB023] font-bold">✓</span>
              <span><strong>Scrap university tuition fees</strong> - bring back maintenance grants for students</span>
            </div>
            <div className="flex gap-2 text-xs text-slate-700">
              <span className="text-[#6AB023] font-bold">✓</span>
              <span><strong>Transform transport</strong> - more buses, trains, and protected cycle lanes</span>
            </div>
            <div className="flex gap-2 text-xs text-slate-700">
              <span className="text-[#6AB023] font-bold">✓</span>
              <span><strong>Massive investment in schools</strong> - £8bn more, boost teacher pay</span>
            </div>
            <div className="flex gap-2 text-xs text-slate-700">
              <span className="text-[#6AB023] font-bold">✓</span>
              <span><strong>Net zero by 2040</strong> - clean air, renewable energy jobs, thriving nature</span>
            </div>
          </div>

          <p className="text-slate-700 text-sm font-semibold mb-6">
            This is what real change looks like. Not promises - policies.
          </p>

          <div className="bg-[#6AB023] text-white p-4 rounded-lg text-center">
            <p className="font-bold text-lg">Vote Green. Vote Hope. Vote Change.</p>
            <p className="text-sm mt-1">Paul Binns - Your Green Party Candidate</p>
          </div>
        </div>
      </div>

      {/* Back Panel */}
      <div className="bg-slate-100 p-8 border-t border-slate-200">
        <div className="grid grid-cols-3 gap-8">
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">CONTACT</p>
            <p className="text-sm font-semibold">Paul Binns</p>
            <p className="text-xs text-slate-600">Green Party Candidate</p>
            <p className="text-xs text-slate-600 mt-2">Tyldesley & Mosley Common</p>
            <p className="text-xs text-slate-600">Campaign Office: 01942 xxx xxx</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">FIND OUT MORE</p>
            <p className="text-xs text-slate-600">www.greenparty.org.uk</p>
            <p className="text-xs text-slate-600">facebook.com/GreenPartyUK</p>
            <p className="text-xs text-slate-600">@GreenPartyUK on Twitter</p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p>Promoted by Paul Binns on behalf of the Green Party</p>
            <p className="mt-2">Printed on recycled paper • Vote Green on 4th July</p>
          </div>
        </div>
      </div>
    </div>
  );
}