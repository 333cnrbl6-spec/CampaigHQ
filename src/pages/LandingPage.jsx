import { useState, useEffect } from 'react';
import {
  Leaf, Heart, Globe, Users, MapPin, CheckCircle, Star,
  ChevronDown, Mail, Phone, ArrowRight, Shield, TreePine,
  Bike, Home, AlertTriangle, Trash2, Sun, Baby, Quote, Vote
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Countdown ────────────────────────────────────────────────────────────────
const POLLING_DATE = new Date('2026-05-07T07:00:00');

function useCountdown() {
  const [time, setTime] = useState({});
  useEffect(() => {
    const calc = () => {
      const diff = POLLING_DATE - new Date();
      if (diff <= 0) return setTime({ done: true });
      setTime({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function CountdownUnit({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 min-w-[64px] text-center border border-white/30">
        <span className="text-3xl font-bold font-heading text-white tabular-nums">{String(value ?? '--').padStart(2, '0')}</span>
      </div>
      <span className="text-xs text-white/70 mt-1.5 uppercase tracking-wider font-medium">{label}</span>
    </div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const PLEDGES = [
  {
    icon: MapPin,
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200',
    title: 'Fix Our Roads & Pavements',
    desc: 'A full roads and pavement audit within 30 days of election. Publish repair timelines and chase officers for every unresolved issue in Tyldesley & Mosley Common.',
  },
  {
    icon: TreePine,
    color: 'text-green-600',
    bg: 'bg-green-50 border-green-200',
    title: 'Protect Green Spaces',
    desc: 'Fight against inappropriate development on greenbelt land. Our parks, commons, and open spaces are irreplaceable — I will defend every square foot.',
  },
  {
    icon: Home,
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200',
    title: 'Scrutinise Housing Plans',
    desc: 'Hold developers and the council accountable on the Mosley Common development. Ensure any new homes serve local need, not just profit, and protect existing infrastructure.',
  },
  {
    icon: Shield,
    color: 'text-purple-600',
    bg: 'bg-purple-50 border-purple-200',
    title: 'Safer Streets',
    desc: 'Work with residents and authorities to tackle anti-social behaviour, improve street lighting, and make Tyldesley & Mosley Common a ward where everyone feels safe.',
  },
  {
    icon: Trash2,
    color: 'text-rose-600',
    bg: 'bg-rose-50 border-rose-200',
    title: 'Reliable Local Services',
    desc: 'No more missed bin collections. Cleaner streets and better maintained public spaces. I will hold the council to account every single week.',
  },
  {
    icon: Baby,
    color: 'text-teal-600',
    bg: 'bg-teal-50 border-teal-200',
    title: 'Youth & Community Facilities',
    desc: 'Advocate for better facilities for young people and families — safe play areas, youth clubs, and spaces that bring our community together.',
  },
];

const VALUES = [
  { icon: Heart, label: 'Compassion', desc: 'A career dedicated to community welfare, working with people in need across the world.' },
  { icon: Globe, label: 'Global Experience', desc: 'Decades of working with governments and communities to deliver real-world solutions.' },
  { icon: Users, label: 'Community First', desc: '6 years living in Tyldesley — drawn here by its warmth and staying because of its people.' },
  { icon: Leaf, label: 'Green Values', desc: 'Committed to environmental protection, sustainability, and a fairer economy for all.' },
];

const TIMELINE = [
  { year: 'Decades', label: 'International health & community work', detail: 'Worked with local communities and national governments around the world, bringing principled problem-solving and a commitment to public welfare.' },
  { year: '6 Years', label: 'Tyldesley resident', detail: 'Chose Tyldesley for its community spirit and warmth. Rooted in the ward, Paul knows the streets, the issues, and the people.' },
  { year: '2026', label: 'Green Party candidate', detail: 'Standing for Tyldesley & Mosley Common in the May 2026 local elections to put residents first.' },
];

const GREEN_WHY = [
  'The Green Party is the only party with a credible plan to protect our local green belt and open spaces.',
  'We believe public services must work for people, not cut to the bone.',
  'We stand for transparency, accountability, and councillors who actually show up.',
  'We support a fairer economy — one where working families in Tyldesley don\'t get left behind.',
  'Environmental health is community health — clean air, green spaces, and safe streets matter.',
];

const QUOTES = [
  {
    text: 'I know how to listen to what people want and help them get the government policies they need.',
    attr: 'Paul Binns — Statement to voters',
  },
  {
    text: 'I was drawn to Tyldesley by its warmth and community spirit. As your Green Party Councillor I would bring my principled commitment to hard work and problem solving for all residents.',
    attr: 'Paul Binns',
  },
];

// ─── Components ───────────────────────────────────────────────────────────────

function NavBar({ scrolled }) {
  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-md' : 'bg-transparent'}`}>
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <span className={`font-heading font-bold text-lg transition-colors ${scrolled ? 'text-foreground' : 'text-white'}`}>Paul Binns</span>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          {[['#about', 'About'], ['#pledges', 'Pledges'], ['#why-green', 'Why Green?'], ['#contact', 'Get Involved']].map(([href, label]) => (
            <a key={href} href={href} className={`text-sm font-medium transition-colors hover:text-primary ${scrolled ? 'text-foreground/80' : 'text-white/90'}`}>{label}</a>
          ))}
        </nav>
        <a href="#contact" className="bg-primary hover:bg-primary/90 text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors">
          Vote Paul — 7 May
        </a>
      </div>
    </header>
  );
}

function HeroSection({ countdown }) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-900 via-green-800 to-emerald-700" />
      <div className="absolute inset-0 opacity-20"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1600&q=80)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div className="absolute inset-0 bg-gradient-to-t from-green-950/60 via-transparent to-transparent" />

      {/* Decorative circles */}
      <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
      <div className="absolute bottom-20 left-10 w-48 h-48 rounded-full bg-emerald-400/10 blur-2xl" />

      <div className="relative z-10 text-center max-w-4xl mx-auto px-6 py-24 pt-32">
        {/* Party badge */}
        <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 rounded-full px-4 py-1.5 mb-6">
          <Leaf className="w-4 h-4 text-emerald-300" />
          <span className="text-white/90 text-sm font-medium">Green Party — Wigan Local Elections 2026</span>
        </div>

        {/* Main headline */}
        <h1 className="font-heading text-5xl md:text-7xl font-bold text-white leading-tight mb-4">
          Paul Binns
        </h1>
        <p className="text-emerald-200 text-xl md:text-2xl font-medium mb-2">
          Your Local Councillor Candidate
        </p>
        <p className="text-white/70 text-lg md:text-xl mb-8">
          Tyldesley & Mosley Common Ward
        </p>

        {/* Tagline */}
        <p className="text-white/90 text-xl md:text-2xl font-light max-w-2xl mx-auto mb-10 leading-relaxed italic">
          "Principled commitment to hard work and problem solving for all residents."
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
          <a href="#pledges" className="bg-white text-green-800 hover:bg-green-50 font-bold px-8 py-3.5 rounded-full text-base transition-colors shadow-lg">
            My Pledges for the Ward →
          </a>
          <a href="#about" className="border-2 border-white/50 hover:border-white text-white font-semibold px-8 py-3.5 rounded-full text-base transition-colors backdrop-blur-sm">
            About Paul
          </a>
        </div>

        {/* Countdown */}
        <div className="space-y-3">
          <p className="text-white/60 text-sm uppercase tracking-widest font-medium">Polling Day — Thursday 7 May 2026</p>
          {countdown.done ? (
            <p className="text-white font-bold text-xl">Polls are open today! 🗳️ Vote Paul!</p>
          ) : (
            <div className="flex justify-center gap-4">
              <CountdownUnit value={countdown.days} label="Days" />
              <CountdownUnit value={countdown.hours} label="Hours" />
              <CountdownUnit value={countdown.minutes} label="Mins" />
              <CountdownUnit value={countdown.seconds} label="Secs" />
            </div>
          )}
        </div>

        {/* Scroll hint */}
        <div className="mt-16 animate-bounce">
          <ChevronDown className="w-6 h-6 text-white/40 mx-auto" />
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section id="about" className="py-24 bg-background">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Image / visual */}
          <div className="relative">
            <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-gradient-to-br from-green-100 to-emerald-200 flex items-center justify-center shadow-xl">
              <img
                src="https://candidates.democracyclub.org.uk/media/cache/c6/a9/c6a9e229d660ecd8e91301a8500022c4.jpg"
                alt="Paul Binns"
                className="w-full h-full object-cover object-top"
                onError={e => { e.target.style.display = 'none'; }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-end p-6 bg-gradient-to-t from-green-900/60 to-transparent">
                <p className="text-white font-heading text-2xl font-bold">Paul Binns</p>
                <p className="text-emerald-200 text-sm">Green Party Candidate</p>
              </div>
            </div>
            {/* Floating stats */}
            <div className="absolute -right-6 top-1/4 bg-white rounded-2xl shadow-xl p-4 border border-border/50">
              <p className="text-3xl font-bold text-primary font-heading">6</p>
              <p className="text-xs text-muted-foreground font-medium">Years in Tyldesley</p>
            </div>
            <div className="absolute -left-6 bottom-1/4 bg-white rounded-2xl shadow-xl p-4 border border-border/50">
              <p className="text-3xl font-bold text-primary font-heading">7</p>
              <p className="text-xs text-muted-foreground font-medium">May — Polling Day</p>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6">
            <div>
              <span className="text-primary text-sm font-semibold uppercase tracking-wider">Meet Your Candidate</span>
              <h2 className="font-heading text-4xl font-bold mt-2 mb-4">A Life of Service — Now Fighting for You</h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Paul Binns has built a career around public service — working with local communities and national governments to deliver meaningful change. He brings that same dedication, determination, and compassionate problem-solving to Tyldesley & Mosley Common.
              </p>
            </div>

            <p className="text-muted-foreground leading-relaxed">
              Paul chose to make Tyldesley his home six years ago, drawn in by the warmth of its people and the genuine community spirit of the ward. He's walked these streets, met the neighbours, and listened to the frustrations — from pothole-riddled roads to concerns about greenbelt development and missed bin collections.
            </p>

            <p className="text-muted-foreground leading-relaxed">
              As a Green Party councillor, Paul would bring the same principled, evidence-driven approach that shaped his international career: listening carefully, working collaboratively, and holding those in power to account — for every resident, on every street, in every corner of Tyldesley & Mosley Common.
            </p>

            {/* Quote block */}
            <blockquote className="border-l-4 border-primary pl-5 py-1 space-y-1">
              <p className="text-foreground font-medium italic">"{QUOTES[0].text}"</p>
              <p className="text-sm text-muted-foreground">— {QUOTES[0].attr}</p>
            </blockquote>

            <a href="#pledges" className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-full font-semibold transition-colors">
              See My Pledges <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Values grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
          {VALUES.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="bg-card border border-border/60 rounded-2xl p-6 hover:shadow-md transition-shadow text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-base mb-2">{label}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TimelineSection() {
  return (
    <section className="py-20 bg-muted/40">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">Background & Experience</span>
          <h2 className="font-heading text-4xl font-bold mt-2">A Journey of Purpose</h2>
        </div>
        <div className="relative">
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-border hidden md:block" />
          <div className="space-y-10">
            {TIMELINE.map((item, i) => (
              <div key={i} className={`flex items-start gap-8 md:gap-0 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                <div className={`flex-1 ${i % 2 === 0 ? 'md:text-right md:pr-12' : 'md:pl-12'}`}>
                  <div className={`bg-card border border-border/60 rounded-2xl p-6 hover:shadow-sm transition-shadow ${i % 2 === 0 ? '' : 'md:ml-auto'}`}>
                    <p className="text-primary font-bold text-2xl font-heading mb-1">{item.year}</p>
                    <p className="font-semibold mb-2">{item.label}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.detail}</p>
                  </div>
                </div>
                <div className="hidden md:flex w-10 h-10 rounded-full bg-primary flex-shrink-0 items-center justify-center z-10 self-center shadow-md">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 hidden md:block" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PledgesSection() {
  return (
    <section id="pledges" className="py-24 bg-background">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">What I'll Do For You</span>
          <h2 className="font-heading text-4xl font-bold mt-2 mb-4">Paul's Pledges for Tyldesley & Mosley Common</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Six concrete commitments. Not vague promises — specific actions I will take from day one as your councillor.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PLEDGES.map(({ icon: Icon, color, bg, title, desc }, i) => (
            <div key={i} className={`rounded-2xl border p-6 space-y-4 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 ${bg}`}>
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <span className={`text-xs font-bold uppercase tracking-wider ${color} opacity-70`}>Pledge {i + 1}</span>
                  <h3 className="font-semibold text-base mt-0.5">{title}</h3>
                </div>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyGreenSection() {
  return (
    <section id="why-green" className="py-24 bg-gradient-to-br from-green-900 via-green-800 to-emerald-800 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1448375240586-882707db888b?w=1400&q=80)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="text-emerald-300 text-sm font-semibold uppercase tracking-wider">The Difference</span>
          <h2 className="font-heading text-4xl font-bold text-white mt-2 mb-4">Why Vote Green?</h2>
          <p className="text-white/70 max-w-xl mx-auto">Paul and the Green Party offer something different — a genuine commitment to community, environment, and accountability.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-4 mb-12">
          {GREEN_WHY.map((point, i) => (
            <div key={i} className="flex items-start gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
              <CheckCircle className="w-5 h-5 text-emerald-300 flex-shrink-0 mt-0.5" />
              <p className="text-white/90 text-sm leading-relaxed">{point}</p>
            </div>
          ))}
        </div>

        {/* Quote */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 max-w-3xl mx-auto text-center">
          <Quote className="w-8 h-8 text-emerald-300 mx-auto mb-4" />
          <p className="text-white text-xl font-light leading-relaxed italic mb-4">
            "{QUOTES[1].text}"
          </p>
          <p className="text-emerald-300 text-sm font-medium">— {QUOTES[1].attr}</p>
        </div>
      </div>
    </section>
  );
}

function LocalIssuesSection() {
  const issues = [
    { icon: MapPin, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', label: 'Roads & Potholes', desc: 'Crumbling roads and dangerous pavements are a constant frustration. Residents deserve safe streets.' },
    { icon: TreePine, color: 'text-green-600', bg: 'bg-green-50 border-green-200', label: 'Green Space Protection', desc: 'Greenbelt land and open spaces are under pressure from developers. Our commons must be protected.' },
    { icon: Shield, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', label: 'Anti-social Behaviour', desc: 'Residents want safer streets, better lighting, and a council that takes community safety seriously.' },
    { icon: Trash2, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200', label: 'Bin Collections & Street Cleaning', desc: 'Missed collections and littered streets reflect a council that isn\'t listening. Basic services must work.' },
    { icon: Home, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', label: 'Housing & Planning', desc: 'New development must serve local people, not just developers. Affordable homes and protected infrastructure.' },
    { icon: Baby, color: 'text-teal-600', bg: 'bg-teal-50 border-teal-200', label: 'Youth & Family Facilities', desc: 'Young people need safe spaces, youth clubs, and community facilities that give them a stake in their ward.' },
  ];
  return (
    <section className="py-24 bg-muted/30">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">What Residents Are Saying</span>
          <h2 className="font-heading text-4xl font-bold mt-2 mb-4">The Issues That Matter Most</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">From doorstep conversations across Tyldesley & Mosley Common — these are the priorities coming up again and again.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {issues.map(({ icon: Icon, color, bg, label, desc }) => (
            <div key={label} className={`rounded-2xl border p-5 space-y-3 ${bg}`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/70 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <h3 className="font-semibold text-sm">{label}</h3>
              </div>
              <p className="text-sm text-foreground/75 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-6 italic">Issues raised during volunteer canvassing conversations across the ward.</p>
      </div>
    </section>
  );
}

function GetInvolvedSection() {
  const [joined, setJoined] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const actions = [
    { icon: Vote, label: 'Vote on 7 May', desc: 'Polls open 7am – 10pm. Your polling station is listed on your polling card.', cta: null },
    { icon: Users, label: 'Volunteer', desc: 'Join Paul\'s team — canvassing, leafleting, or helping online. Every hour counts.', cta: 'paulwnlgreen@gmail.com' },
    { icon: Mail, label: 'Share the Message', desc: 'Tell your neighbours, share on social media, and help spread Paul\'s message across the ward.', cta: null },
  ];

  return (
    <section id="contact" className="py-24 bg-background">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">Make a Difference</span>
          <h2 className="font-heading text-4xl font-bold mt-2 mb-4">Get Involved</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Every conversation, every leaflet, every vote makes a difference in a local election. Here's how you can help.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-14">
          {actions.map(({ icon: Icon, label, desc, cta }) => (
            <div key={label} className="bg-card border border-border/60 rounded-2xl p-7 text-center hover:shadow-md transition-shadow space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <Icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">{label}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              {cta && (
                <a href={`mailto:${cta}`} className="inline-flex items-center gap-2 text-primary text-sm font-semibold hover:underline">
                  <Mail className="w-4 h-4" /> {cta}
                </a>
              )}
            </div>
          ))}
        </div>

        {/* Sign-up strip */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20 rounded-2xl px-8 py-10 text-center max-w-2xl mx-auto">
          {joined ? (
            <div className="space-y-3">
              <CheckCircle className="w-10 h-10 text-primary mx-auto" />
              <h3 className="font-heading text-2xl font-bold">Thank you, {name || 'Neighbour'}!</h3>
              <p className="text-muted-foreground">You're supporting real change in Tyldesley & Mosley Common. We'll be in touch!</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-heading text-2xl font-bold">Stay Updated</h3>
              <p className="text-muted-foreground text-sm">Enter your details to receive campaign updates from Paul.</p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <input
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <Button onClick={() => { if (email) setJoined(true); }} className="px-8 rounded-full">
                Count Me In <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <p className="text-xs text-muted-foreground">Your details will only be used for campaign communications.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-green-950 text-white/70 py-10">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
            <Leaf className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-white">Paul Binns — Green Party</span>
        </div>
        <p className="text-center">Tyldesley & Mosley Common ward · Wigan Local Election · Thursday 7 May 2026</p>
        <a href="https://www.facebook.com/paulwnlgreen/" target="_blank" rel="noopener noreferrer"
          className="text-white/70 hover:text-white transition-colors">
          Follow on Facebook →
        </a>
      </div>
      <div className="text-center mt-4 text-xs text-white/40 px-6">
        Promoted by Paul Binns on behalf of the Green Party of England and Wales. Authorised by the Green Party.
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const countdown = useCountdown();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className="min-h-screen font-body">
      <NavBar scrolled={scrolled} />
      <HeroSection countdown={countdown} />
      <AboutSection />
      <TimelineSection />
      <PledgesSection />
      <WhyGreenSection />
      <LocalIssuesSection />
      <GetInvolvedSection />
      <Footer />
    </div>
  );
}