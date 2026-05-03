import { useState } from 'react';
import { base44 } from '@/api/base44Client';

const DEMO_NEWS = [
  {
    id: 1,
    tag: 'News',
    title: 'Sarah Mitchell and James Thornton tour Manchester to launch high streets revival plan',
    summary: 'The Green Party\'s leader and newest MP met shopkeepers in Levenshulme, outlining a vision for high streets that serve communities — not corporate profits.',
    date: '28 Apr 2026',
    img: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&q=80',
  },
  {
    id: 2,
    tag: 'News',
    title: '"We deserve better": Green Party launches local election fundraiser',
    summary: 'Party leader Sarah Mitchell launched the fundraiser ahead of the 7 May local elections, vowing to take on the big money of Labour and Reform.',
    date: '21 Apr 2026',
    img: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=600&q=80',
  },
  {
    id: 3,
    tag: 'News',
    title: 'Mitchell and Deputy Leader Clare Okafor make affordability pledge at Sussex foodbank',
    summary: 'Visiting volunteers at a local foodbank, the leaders called for an end to the normalisation of food bank use and announced measures to tackle the affordability crisis.',
    date: '17 Apr 2026',
    img: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&q=80',
  },
  {
    id: 4,
    tag: 'News',
    title: 'Hope beat hate — how Greens took on Reform in Kent… and won!',
    summary: 'Cllr David Osei and hundreds of campaigners defied all odds to defeat Reform in a "seismic" by-election victory in Margate, leading the way for Greens in May.',
    date: '14 Apr 2026',
    img: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=600&q=80',
  },
  {
    id: 5,
    tag: 'News',
    title: 'Mitchell launches local election campaign with affordable housing pledge in Deptford',
    summary: 'Green Party leader launched the campaign in Deptford to a packed room of energetic candidates and campaigners, with a bold pledge on social housing.',
    date: '10 Apr 2026',
    img: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=600&q=80',
  },
  {
    id: 6,
    tag: 'Members Update',
    title: '"Only just getting started": 15,000 new members join in a record-breaking week!',
    summary: 'Green Party membership has grown by more than 2,000 a day — over 15,000 in a week — since the historic by-election victory, rising from 200,000 to over 215,000 members.',
    date: '11 Mar 2026',
    img: 'https://images.unsplash.com/photo-1591189863430-ab87e120f312?w=600&q=80',
  },
];

const DemoBanner = () => (
  <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-400 text-amber-900 text-center text-xs font-bold py-1 tracking-widest uppercase">
    ⚠ DEMONSTRATION ONLY — Fictional content for pitch purposes. Not affiliated with Green Party of England & Wales.
  </div>
);

const DemoWatermark = () => (
  <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-10 overflow-hidden">
    <p className="text-green-800/10 font-black text-6xl rotate-[-35deg] whitespace-nowrap select-none">
      DEMO CONTENT
    </p>
  </div>
);

export default function GreenPartyDemo() {
  const handleLogin = () => {
    base44.auth.redirectToLogin('/dashboard');
  };

  return (
    <div className="min-h-screen bg-white font-body" style={{ fontFamily: 'Inter, sans-serif' }}>
      <DemoBanner />

      {/* Top nav — matches Green Party exactly */}
      <nav className="fixed top-5 left-0 right-0 z-50" style={{ backgroundColor: '#00612B' }}>
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
          {/* Logo area */}
          <div className="flex items-center gap-2">
            {/* Simplified sunflower-style icon (original design, not copied) */}
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: '#A8C423' }}>
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="white">
                <circle cx="12" cy="12" r="3" />
                {[0,45,90,135,180,225,270,315].map((deg, i) => (
                  <ellipse key={i} cx="12" cy="5" rx="1.5" ry="3" fill="white" opacity="0.9"
                    transform={`rotate(${deg} 12 12)`} />
                ))}
              </svg>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">Green Party</span>
            <span className="ml-2 text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#A8C423', color: '#1a1a1a' }}>DEMO</span>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-6 text-white text-sm font-medium">
            <a href="#about" onClick={e => e.preventDefault()} className="hover:text-lime-300 transition-colors cursor-pointer">About</a>
              <a href="#get-involved" onClick={e => e.preventDefault()} className="hover:text-lime-300 transition-colors cursor-pointer">Get involved</a>
              <a href="#members" onClick={e => e.preventDefault()} className="hover:text-lime-300 transition-colors cursor-pointer">Members</a>
              <a href="#news" onClick={e => e.preventDefault()} className="hover:text-lime-300 transition-colors cursor-pointer">News</a>
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleLogin}
              className="px-4 py-1.5 text-sm font-semibold rounded text-white border border-white hover:bg-white hover:text-green-900 transition-colors"
            >
              Log in
            </button>
            <button
              onClick={handleLogin}
              className="px-4 py-1.5 text-sm font-semibold rounded text-green-900"
              style={{ backgroundColor: '#A8C423' }}
            >
              Join
            </button>
            <button
              onClick={handleLogin}
              className="px-4 py-1.5 text-sm font-semibold rounded text-white"
              style={{ backgroundColor: '#005525' }}
            >
              Donate
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative mt-[calc(1.25rem+3.5rem)] overflow-hidden" style={{ minHeight: '520px' }}>
        <img
          src="https://images.unsplash.com/photo-1521791055366-0d553872952f?w=1400&q=80"
          alt="Green Party campaigners"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />
        <DemoWatermark />
        <div className="relative z-10 flex flex-col items-start justify-end h-full px-8 pb-16" style={{ minHeight: '520px' }}>
          <div className="max-w-2xl">
            <h1 className="text-5xl font-black text-white uppercase tracking-tight leading-tight mb-4">
              WELCOME TO THE GREEN PARTY
            </h1>
            <p className="text-2xl text-white font-semibold mb-6">
              Let's make <strong>hope normal again.</strong>
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleLogin}
                className="px-6 py-3 font-bold rounded text-green-900 text-base"
                style={{ backgroundColor: '#A8C423' }}
              >
                Join the Green Party today
              </button>
              <button
                onClick={handleLogin}
                className="px-6 py-3 font-bold rounded text-white text-base border-2 border-white hover:bg-white hover:text-green-900 transition-colors"
              >
                🔐 Member Login → Platform
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Platform CTA Banner — the key pitch element */}
      <div className="py-10 px-4 text-center" style={{ backgroundColor: '#00612B' }}>
        <h2 className="text-2xl font-black text-white uppercase tracking-wide mb-2">
          Members — Access Your Campaign Platform
        </h2>
        <p className="text-lime-200 mb-6 max-w-xl mx-auto">
          Organise canvassing, coordinate volunteers, track results and drive turnout — all in one place.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={handleLogin}
            className="px-8 py-3 font-bold rounded text-green-900 text-base"
            style={{ backgroundColor: '#A8C423' }}
          >
            🗳 Organiser Login
          </button>
          <button
            onClick={handleLogin}
            className="px-8 py-3 font-bold rounded text-white border-2 border-white hover:bg-white hover:text-green-900 transition-colors text-base"
          >
            🙋 Volunteer Login
          </button>
          <button
            onClick={handleLogin}
            className="px-8 py-3 font-bold rounded text-white border-2 border-lime-300 hover:bg-lime-300 hover:text-green-900 transition-colors text-base"
          >
            📊 National Dashboard
          </button>
        </div>
      </div>

      {/* Latest News */}
      <section id="news" className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black uppercase tracking-wide" style={{ color: '#00612B' }}>
            Latest News
          </h2>
          <button onClick={handleLogin} className="text-sm font-semibold bg-transparent border-0 cursor-pointer" style={{ color: '#00612B' }}>View all news →</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DEMO_NEWS.map(story => (
            <div key={story.id} className="relative border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer group">
              <DemoWatermark />
              <div className="relative overflow-hidden h-48">
                <img
                  src={story.img}
                  alt={story.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <span className="text-xs font-bold uppercase tracking-wide" style={{ color: '#00612B' }}>
                  {story.tag}
                </span>
                <h3 className="font-bold text-gray-900 mt-1 mb-2 leading-snug group-hover:text-green-800 transition-colors">
                  {story.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-3">{story.summary}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Green Party · {story.date}</span>
                  <span className="text-xs px-2 py-0.5 rounded font-semibold text-amber-800 bg-amber-100">DEMO</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <button className="px-6 py-2 border-2 font-semibold rounded hover:bg-green-800 hover:text-white transition-colors"
            style={{ borderColor: '#00612B', color: '#00612B' }} disabled>
            Load more
          </button>
        </div>
      </section>

      {/* About section */}
      <section id="about" className="bg-gray-50 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-black uppercase tracking-wide mb-6" style={{ color: '#00612B' }}>About</h2>
          <p className="text-gray-700 mb-4 max-w-3xl">
            The Green Party of England and Wales consists of over 200 Local Green Parties. Your local Green Party is where you can campaign for the issues that matter to you, and make a difference for the community you live in.
          </p>
          <p className="text-gray-700 mb-8 max-w-3xl">
            Local Parties are supported in their work by 10 Regional Parties and by the following bodies:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            {[
              { title: 'The Green Party Executive (GPEx)', desc: 'Responsible for the day-to-day running and direction of the party.' },
              { title: 'The Green Party Regional Council', desc: 'Responsible for the welfare of the Party, and for encouraging dialogue between the regions.' },
              { title: 'Other Green Party Groups', desc: 'A range of groups exist to serve the Green Party by undertaking specialist work on behalf of members.' },
            ].map(item => (
              <div key={item.title} className="relative p-5 rounded-lg text-white overflow-hidden" style={{ backgroundColor: '#00612B' }}>
                <DemoWatermark />
                <h3 className="font-black uppercase text-sm tracking-wide mb-2">{item.title}</h3>
                <p className="text-green-100 text-sm">{item.desc}</p>
                <button onClick={handleLogin} className="mt-3 inline-block text-xs font-bold underline text-lime-300 bg-transparent border-0 cursor-pointer hover:text-white transition-colors">Find out more</button>
              </div>
            ))}
          </div>

          {/* Platform pitch inside About */}
          <div className="rounded-xl p-8 text-white relative overflow-hidden" style={{ backgroundColor: '#A8C423' }}>
            <DemoWatermark />
            <h3 className="text-xl font-black uppercase text-green-900 mb-2">
              🖥 Campaign Management Platform — Member Access
            </h3>
            <p className="text-green-900 mb-4 max-w-2xl">
              The Green Party uses a dedicated campaign coordination platform to organise canvassing, manage volunteers, track voter data, and drive GOTV. Available to all members.
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => base44.auth.redirectToLogin('/dashboard')}
                className="px-5 py-2 font-bold rounded text-white text-sm" style={{ backgroundColor: '#00612B' }}>
                Organiser Access →
              </button>
              <button onClick={() => base44.auth.redirectToLogin('/field-mode')}
                className="px-5 py-2 font-bold rounded text-white text-sm" style={{ backgroundColor: '#004d22' }}>
                Volunteer Access →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Get Involved */}
      <section id="get-involved" className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-black uppercase tracking-wide mb-4" style={{ color: '#00612B' }}>Get Involved</h2>
        <p className="text-gray-700 mb-8 max-w-2xl">
          The Green Party is 99% made up of volunteers — this is how we've been running for over 40 years. There is so much to do to win — and every single person makes a difference.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Canvass with us', icon: '🚪', desc: 'Join a canvassing session in your area and talk to voters door-to-door.', action: () => handleLogin() },
            { label: 'Deliver leaflets', icon: '📬', desc: 'Help us get our message out by delivering leaflets in your neighbourhood.', action: () => handleLogin() },
            { label: 'Attend an event', icon: '📅', desc: 'Come to a local meeting, hustings, or social event near you.', action: () => handleLogin() },
            { label: 'Donate', icon: '💚', desc: 'Support our campaigns financially — every pound helps us fight the big parties.', action: () => handleLogin() },
          ].map(item => (
            <button key={item.label} onClick={item.action} className="border border-gray-200 rounded-lg p-5 hover:border-green-600 hover:shadow-sm transition-all text-left bg-white cursor-pointer">
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="font-bold text-gray-900 mb-1" style={{ color: '#00612B' }}>{item.label}</h3>
              <p className="text-sm text-gray-600">{item.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Members section */}
      <section id="members" className="py-16 px-4" style={{ backgroundColor: '#00612B' }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-black uppercase tracking-wide text-white mb-4">Members</h2>
          <p className="text-green-100 mb-8 max-w-2xl">
            As a Green Party member you get access to our campaign coordination platform, internal comms, and can stand as a candidate or volunteer for elections.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { role: 'Local Organiser', icon: '📋', desc: 'Manage your ward campaign — assign turfs, track canvassing, run reports.', link: '/organizer' },
              { role: 'Volunteer', icon: '🙋', desc: 'Access your assigned turf, log door responses, and see your leaderboard rank.', link: '/field-mode' },
              { role: 'National Board', icon: '📊', desc: 'See all 650+ campaigns at a glance with real-time national metrics.', link: '/national' },
            ].map(item => (
              <div key={item.role} className="bg-white/10 rounded-xl p-6 hover:bg-white/20 transition-colors">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-white text-lg mb-2">{item.role}</h3>
                <p className="text-green-100 text-sm mb-4">{item.desc}</p>
                <button
                  onClick={() => base44.auth.redirectToLogin(item.link)}
                  className="px-4 py-2 text-sm font-bold rounded text-green-900"
                  style={{ backgroundColor: '#A8C423' }}
                >
                  Login as {item.role} →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 text-white text-sm" style={{ backgroundColor: '#00331a' }}>
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <h4 className="font-bold mb-3 uppercase text-xs tracking-wide text-lime-300">About</h4>
            <ul className="space-y-1 text-green-200">
              <li><button onClick={handleLogin} className="hover:text-white bg-transparent border-0 cursor-pointer text-left">Our story</button></li>
              <li><button onClick={handleLogin} className="hover:text-white bg-transparent border-0 cursor-pointer text-left">Leadership</button></li>
              <li><button onClick={handleLogin} className="hover:text-white bg-transparent border-0 cursor-pointer text-left">Policies</button></li>
              <li><button onClick={handleLogin} className="hover:text-white bg-transparent border-0 cursor-pointer text-left">Contact us</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-3 uppercase text-xs tracking-wide text-lime-300">Get Involved</h4>
            <ul className="space-y-1 text-green-200">
              <li><button onClick={handleLogin} className="hover:text-white bg-transparent border-0 cursor-pointer text-left">Join the party</button></li>
              <li><button onClick={handleLogin} className="hover:text-white bg-transparent border-0 cursor-pointer text-left">Canvass with us</button></li>
              <li><button onClick={handleLogin} className="hover:text-white bg-transparent border-0 cursor-pointer text-left">Find local party</button></li>
              <li><button onClick={handleLogin} className="hover:text-white bg-transparent border-0 cursor-pointer text-left">Donate</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-3 uppercase text-xs tracking-wide text-lime-300">Members</h4>
            <ul className="space-y-1 text-green-200">
              <li>
                <button onClick={() => base44.auth.redirectToLogin('/dashboard')} className="hover:text-white text-left">
                  Campaign Platform
                </button>
              </li>
              <li>
                <button onClick={() => base44.auth.redirectToLogin('/field-mode')} className="hover:text-white text-left">
                  Volunteer App
                </button>
              </li>
              <li>
                <button onClick={() => base44.auth.redirectToLogin('/national')} className="hover:text-white text-left">
                  National Dashboard
                </button>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-3 uppercase text-xs tracking-wide text-lime-300">Legal</h4>
            <ul className="space-y-1 text-green-200">
              <li><button onClick={handleLogin} className="hover:text-white bg-transparent border-0 cursor-pointer text-left">Privacy Policy</button></li>
              <li><button onClick={handleLogin} className="hover:text-white bg-transparent border-0 cursor-pointer text-left">Cookie Policy</button></li>
              <li><button onClick={handleLogin} className="hover:text-white bg-transparent border-0 cursor-pointer text-left">Accessibility</button></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-green-800 flex flex-wrap items-center justify-between gap-4">
          <p className="text-green-400 text-xs">
            © 2026 Campaign HQ — Demo platform. Not affiliated with the Green Party of England and Wales.
          </p>
          <div className="bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded">
            ⚠ DEMO — All stories and images are fictional for demonstration purposes only
          </div>
        </div>
      </footer>
    </div>
  );
}