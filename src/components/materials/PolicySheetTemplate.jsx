import React from 'react';
import { Leaf, Home, Zap, Users, Heart, Book, Sprout, Award } from 'lucide-react';

export default function PolicySheetTemplate() {
  const policies = [
    {
      icon: Home,
      title: 'Fairer, Greener Homes for All',
      points: [
        'Build 150,000 social homes a year',
        'Freeze private rent increases',
        'Bring empty properties back into use',
        'Retrofit all homes for energy efficiency by 2030'
      ]
    },
    {
      icon: Heart,
      title: 'Building a Fairer, Healthier Country',
      points: [
        '£8bn extra for NHS in year one',
        '£28bn more by 2030',
        'Free NHS dentistry for all',
        'Faster GP and mental health access',
        '35% pay rise for junior doctors'
      ]
    },
    {
      icon: Zap,
      title: 'Powering Up Fairer, Greener Energy',
      points: [
        '100% renewable energy by 2030',
        'Massive expansion of wind and solar',
        'Energy bills cut in half',
        'Create 1 million green jobs'
      ]
    },
    {
      icon: Book,
      title: 'A Fairer, Greener Education System',
      points: [
        'Scrap university tuition fees',
        'Bring back maintenance grants',
        '£8bn extra for schools funding',
        'Boost teachers\' pay',
        'Abolish high-stakes testing'
      ]
    },
    {
      icon: Users,
      title: 'Making Work Fair',
      points: [
        'Real Living Wage for all',
        'Workers\' rights and union recognition',
        'Ban zero-hour contracts',
        '4-day working week'
      ]
    },
    {
      icon: Award,
      title: 'Fairer, Greener Transport',
      points: [
        'Free or near-free buses',
        'Massive investment in trains',
        'Protected cycle lanes everywhere',
        'End support for new roads',
        'Electric vehicle infrastructure'
      ]
    },
    {
      icon: Sprout,
      title: 'Bringing Nature Back to Life',
      points: [
        'Restore 500,000 acres of woodland',
        'Expand wildlife corridors',
        'Ban neonicotinoid pesticides',
        'Net zero by 2040',
        'Protect our green belt'
      ]
    }
  ];

  return (
    <div className="bg-white text-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#6AB023] to-[#5A8F1F] text-white p-8">
        <div className="flex items-center gap-3 mb-2">
          <Leaf className="w-8 h-8" />
          <h1 className="text-3xl font-heading font-bold">Green Party Policies</h1>
        </div>
        <p className="text-white/90">Real hope. Real change. Real solutions.</p>
        <p className="text-white/75 text-sm mt-2">Paul Binns - Green Party Candidate for Tyldesley & Mosley Common</p>
      </div>

      {/* Main Content */}
      <div className="p-8">
        <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-700">
            <strong>Millions of people are feeling insecure about the future.</strong> The NHS is in crisis. Housing is unaffordable. Young people face a climate emergency. It doesn't have to be this way. The Green Party has real solutions backed by proper costings and a commitment to fund them fairly.
          </p>
        </div>

        {/* Policies Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {policies.map((policy, idx) => {
            const IconComponent = policy.icon;
            return (
              <div key={idx} className="border border-slate-200 rounded-lg p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 bg-[#6AB023]/10 rounded-lg flex-shrink-0">
                    <IconComponent className="w-5 h-5 text-[#6AB023]" />
                  </div>
                  <h2 className="font-heading text-lg font-bold text-slate-900">{policy.title}</h2>
                </div>
                <ul className="space-y-2">
                  {policy.points.map((point, pidx) => (
                    <li key={pidx} className="flex gap-2 text-sm text-slate-700">
                      <span className="text-[#6AB023] font-bold flex-shrink-0">✓</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* How We'll Pay For It */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="font-heading text-lg font-bold text-slate-900 mb-4">How We'll Pay For It</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-700">
            <div>
              <p className="font-semibold mb-1">New Taxes on the Wealthy</p>
              <p className="text-xs text-slate-600">Wealth tax on assets over £10m • Higher income tax for top earners</p>
            </div>
            <div>
              <p className="font-semibold mb-1">Carbon Tax</p>
              <p className="text-xs text-slate-600">Polluter pays principle • Revenue funds green transition</p>
            </div>
            <div>
              <p className="font-semibold mb-1">Close Tax Loopholes</p>
              <p className="text-xs text-slate-600">Crack down on tax avoidance by big corporations</p>
            </div>
            <div>
              <p className="font-semibold mb-1">Economic Growth</p>
              <p className="text-xs text-slate-600">Green investment creates jobs and prosperity</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-8 bg-[#6AB023] text-white rounded-lg p-6 text-center">
          <h2 className="font-heading text-2xl font-bold mb-2">Vote Green on 4th July 2024</h2>
          <p className="mb-4">Vote Hope. Vote Change. Vote Green.</p>
          <p className="text-sm opacity-90">www.greenparty.org.uk</p>
          <p className="text-xs opacity-75 mt-2">Promoted by Paul Binns on behalf of the Green Party of England and Wales</p>
        </div>
      </div>
    </div>
  );
}