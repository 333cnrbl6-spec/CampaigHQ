import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, CheckCheck, Twitter, Instagram, Facebook, ChevronDown, ChevronUp, Lightbulb, Calendar, Megaphone } from 'lucide-react';
import { toast } from 'sonner';
import AIMessageAssistant from '../components/social/AIMessageAssistant';

// ─── Data ────────────────────────────────────────────────────────────────────

const PLATFORMS = [
  {
    key: 'facebook',
    label: 'Facebook',
    icon: Facebook,
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200',
    charLimit: 63206,
    tip: 'Ideal for local community groups, longer updates & sharing campaign events. Aim for 2–3 posts per week.',
  },
  {
    key: 'twitter',
    label: 'X / Twitter',
    icon: Twitter,
    color: 'text-sky-500',
    bg: 'bg-sky-50 border-sky-200',
    charLimit: 280,
    tip: 'Use for quick reactions, local news hooks and retweeting supporters. Daily posting works well.',
  },
  {
    key: 'instagram',
    label: 'Instagram',
    icon: Instagram,
    color: 'text-pink-500',
    bg: 'bg-pink-50 border-pink-200',
    charLimit: 2200,
    tip: 'Share canvassing photos, behind-the-scenes shots, and infographics. Stories are great for quick updates.',
  },
  {
    key: 'nextdoor',
    label: 'Nextdoor',
    icon: Megaphone,
    color: 'text-green-600',
    bg: 'bg-green-50 border-green-200',
    charLimit: 3000,
    tip: 'Nextdoor is hyper-local — perfect for Tyldesley & Mosley Common residents. Post about local issues directly.',
  },
];

const POSTS = [
  // ── Facebook ──
  {
    platform: 'facebook',
    category: 'Introduction',
    label: 'Meet Your Candidate',
    text: `👋 Hello Tyldesley & Mosley Common!

My name is Paul, and I'm standing as your local councillor candidate because I believe our community deserves better — better local services, cleaner streets, and a voice that truly listens.

I've spent years talking to residents across our ward and I know what matters most to you: safe roads, green spaces your kids can actually play in, and a council that picks up the phone.

Over the next few weeks I'll be knocking on doors, attending community events, and sharing exactly what I'll do for you on polling day.

Drop a comment below — what's the #1 issue you want me to fight for? 👇

#TyldesleyVotes #MosleyCommon #LocalElections #YourVoiceMatters`,
  },
  {
    platform: 'facebook',
    category: 'Community Issue',
    label: 'Potholes & Roads',
    text: `🚗 Fed up with the state of our roads?

You've told me — potholes on [Street Name], crumbling pavements near the school, and street lights that have been out for months.

This isn't acceptable. If elected, I will:
✅ Push the council for a full roads audit in Tyldesley & Mosley Common
✅ Set up a direct reporting line so residents can flag issues to me personally
✅ Hold officers to account with published timelines for every repair

You deserve roads that are safe for your family. Let's make it happen.

📍 Vote Paul on [polling date]. 

Share this if you're tired of the excuses! 👇

#FixOurRoads #TyldesleyFirst #LocalElections`,
  },
  {
    platform: 'facebook',
    category: 'Canvassing Update',
    label: 'Weekend Door Knock',
    text: `🚪 Great morning on the doorsteps of Tyldesley today!

Spoke with dozens of brilliant residents — your passion for this community is why I do this. Topics coming up again and again:

🟢 Green spaces and parks maintenance
🟡 Anti-social behaviour near the town centre
🔵 Bin collections being missed

Every conversation counts. If I missed your door, please message me directly — I want to hear from you.

Huge thanks to our amazing volunteers who gave up their Saturday morning to help. You're the heart of this campaign! ❤️

#Canvassing #TyldesleyVotes #CommunityFirst`,
  },
  {
    platform: 'facebook',
    category: 'Event',
    label: 'Community Event Invite',
    text: `📅 SAVE THE DATE — Community Surgery with Paul

Come and meet me in person! No appointment needed. Bring your questions, concerns, or just come for a chat over a brew ☕

📍 Venue: [Location, Tyldesley]
🗓 Date: [Date]
⏰ Time: [Time]

I'll be talking through my pledges and listening to what YOU want to see from your local councillor.

All welcome — bring a neighbour! 

#CommunitySurgery #TyldesleyFirst #LocalElections #MosleyCommon`,
  },

  // ── Twitter ──
  {
    platform: 'twitter',
    category: 'Introduction',
    label: 'Who I Am',
    text: `Hi Tyldesley & Mosley Common! 👋 I'm Paul, your local councillor candidate. Better roads, cleaner streets, a council that listens. Let's make change happen. Drop me your questions below 👇 #TyldesleyVotes #LocalElections`,
  },
  {
    platform: 'twitter',
    category: 'Policy Pledge',
    label: 'Roads Pledge',
    text: `🚗 Pledge #1: A full roads & pavement audit for Tyldesley & Mosley Common in my first 30 days if elected. No more excuses. #FixOurRoads #TyldesleyVotes`,
  },
  {
    platform: 'twitter',
    category: 'Policy Pledge',
    label: 'Green Spaces',
    text: `🌳 Our parks and green spaces matter. I will fight to protect every square foot of green in Tyldesley & Mosley Common. Vote Paul on [date]. #GreenSpaces #TyldesleyFirst #LocalElections`,
  },
  {
    platform: 'twitter',
    category: 'Engagement',
    label: 'Poll — Top Issue',
    text: `What's the biggest issue in Tyldesley & Mosley Common? 🗳️

🔴 Potholes & roads
🟡 Anti-social behaviour
🟢 Parks & green spaces
🔵 Bin collections

Vote below & RT so your neighbours can have their say! #LocalElections #TyldesleyVotes`,
  },
  {
    platform: 'twitter',
    category: 'Canvassing',
    label: 'On the Doorstep',
    text: `Out on the doorsteps of Tyldesley this morning. The conversations with residents remind me exactly why this matters. Every vote counts. #Canvassing #TyldesleyVotes`,
  },
  {
    platform: 'twitter',
    category: 'Polling Day',
    label: 'Get Out The Vote',
    text: `📣 POLLING DAY IS HERE! Polls open until 10pm tonight. Every single vote matters in Tyldesley & Mosley Common. If you haven't voted yet — please do it today. 🗳️ #VoteToday #TyldesleyVotes`,
  },

  // ── Instagram ──
  {
    platform: 'instagram',
    category: 'Introduction',
    label: 'Meet Paul (Caption)',
    text: `Your community. Your voice. Your vote. 🌿

Hi! I'm Paul, standing to be your local councillor for Tyldesley & Mosley Common. I'm passionate about cleaner streets, better parks, and a council that actually listens.

Swipe to find out my top 3 pledges for the ward 👉

Drop a ❤️ if you want real change locally and follow along as we hit the campaign trail!

#TyldesleyVotes #MosleyCommon #LocalElections #CommunityFirst #ManifestoMoment #VoteLocal #GreaterManchester`,
  },
  {
    platform: 'instagram',
    category: 'Canvassing',
    label: 'Canvassing Photo Caption',
    text: `Another great morning on the doors 🚪☀️

Nothing beats speaking with residents face-to-face. Today we heard about road safety, missed bin collections, and the need for better youth facilities in the ward.

Your stories fuel this campaign. Every conversation. Every doorstep. Every vote.

📍 Tyldesley & Mosley Common
🗓 [Polling Date]

#Canvassing #Grassroots #TyldesleyVotes #LocalElections #DoorKnocking #CommunityFirst #YourVoice`,
  },
  {
    platform: 'instagram',
    category: 'Policy',
    label: 'Issues Graphic Caption',
    text: `These are YOUR top issues 📊

We've spoken to hundreds of residents and here's what matters most in Tyldesley & Mosley Common:

🔴 Roads & potholes
🟡 Anti-social behaviour  
🟢 Green spaces & parks
🔵 Bin collections

These will be my priorities on Day 1. Save this post and share it with your neighbours 👇

#LocalIssues #TyldesleyFirst #VoteLocal #PolicyMatters #MosleyCommon`,
  },

  // ── Nextdoor ──
  {
    platform: 'nextdoor',
    category: 'Introduction',
    label: 'Neighbourhood Introduction',
    text: `Hello neighbours! 👋

My name is Paul and I'm running as your local councillor candidate for Tyldesley & Mosley Common in the upcoming elections.

I want to be the councillor who actually responds to your messages, fights your corner at the town hall, and makes sure our streets and services are the best they can be.

I'd love to know — what would make the biggest difference to YOUR street or neighbourhood? Please reply below and I'll personally read every response.

Polling day is [date]. I'll be canvassing locally over the coming weeks and hope to knock on your door soon!

Best,
Paul`,
  },
  {
    platform: 'nextdoor',
    category: 'Local Issue',
    label: 'Pothole Report Follow-up',
    text: `UPDATE: Pothole report on [Street] 🚗

Several residents flagged the dangerous pothole on [Street Name] to me last week. I've since formally reported this to [Council Name] highways team with a request for urgent repair and a reference number.

I'll post an update here as soon as I hear back. If you have other road or pavement issues in Tyldesley or Mosley Common, please reply or message me directly — I'm tracking them all.

This is exactly why having an engaged local councillor matters.

Paul`,
  },
];

const STEP_BY_STEP = [
  {
    phase: 'Weeks 1–2: Launch',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    steps: [
      'Set up / refresh your Facebook Page, X (Twitter), and Instagram with a consistent profile photo and banner.',
      'Post the "Meet Your Candidate" introduction post on all platforms simultaneously.',
      'Join local Facebook Groups (Tyldesley Community, Mosley Common residents etc.) and introduce yourself.',
      'Post on Nextdoor to reach hyper-local residents who may not follow social media.',
      'Pin your top policy pledge post to the top of your Facebook page.',
    ],
  },
  {
    phase: 'Weeks 3–4: Build Momentum',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    steps: [
      'Post canvassing updates after every session — photos humanise the campaign and build trust.',
      'Share a "poll" on X/Twitter about local issues to drive engagement and gather intel.',
      'Go live on Facebook from a community walk-around or surgery — even 5 mins is powerful.',
      'Ask supporters to share your posts — word of mouth in local groups is highly effective.',
      'Respond to every comment and DM within 24 hours to build personal credibility.',
    ],
  },
  {
    phase: 'Week 5–6: Final Push',
    color: 'bg-green-100 text-green-800 border-green-200',
    steps: [
      'Increase posting frequency to daily — final week drives maximum visibility.',
      'Share a "Why I\'m voting Paul" story from a real resident (with their permission).',
      'Post a clear reminder of polling day date, location, and hours.',
      'Use Instagram & Facebook Stories for countdown posts: "X days to go".',
      'Final evening before polling day: post a heartfelt "please vote tomorrow" message.',
    ],
  },
  {
    phase: 'Polling Day',
    color: 'bg-red-100 text-red-800 border-red-200',
    steps: [
      'Post a "Polls are open!" message at 7am across all platforms.',
      'Share mid-day update with encouragement to vote.',
      'Post a "Polls close at 10pm — last chance!" reminder at 8pm.',
      'Thank all supporters and volunteers publicly once polls close.',
    ],
  },
];

const HASHTAGS = [
  '#TyldesleyVotes', '#MosleyCommon', '#TyldesleyFirst', '#LocalElections',
  '#CommunityFirst', '#YourVoiceMatters', '#GreaterManchester', '#VoteLocal',
  '#FixOurRoads', '#GreenSpaces', '#Canvassing', '#GetOutTheVote',
];

// ─── Components ───────────────────────────────────────────────────────────────

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button size="sm" variant="outline" onClick={handleCopy} className="gap-1.5 h-8 text-xs flex-shrink-0">
      {copied ? <CheckCheck className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied!' : 'Copy'}
    </Button>
  );
}

function PostCard({ post }) {
  const [expanded, setExpanded] = useState(false);
  const preview = post.text.length > 160 ? post.text.slice(0, 160) + '…' : post.text;

  return (
    <div className="bg-card border border-border/60 rounded-xl p-4 space-y-2 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="text-xs">{post.category}</Badge>
          <span className="text-sm font-medium">{post.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <CopyButton text={post.text} />
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setExpanded(e => !e)}>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </div>
      <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">
        {expanded ? post.text : preview}
      </pre>
      {post.text.length > 160 && (
        <button onClick={() => setExpanded(e => !e)} className="text-xs text-primary hover:underline">
          {expanded ? 'Show less' : 'Read full post'}
        </button>
      )}
    </div>
  );
}

function StepPhase({ phase }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        className={`w-full flex items-center justify-between px-5 py-3 text-sm font-semibold border-b ${phase.color}`}
        onClick={() => setOpen(o => !o)}
      >
        <span className="flex items-center gap-2"><Calendar className="w-4 h-4" />{phase.phase}</span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && (
        <ol className="bg-card px-5 py-4 space-y-2">
          {phase.steps.map((s, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SocialMedia() {
  const [activePlatform, setActivePlatform] = useState('facebook');
  const [activeTab, setActiveTab] = useState('ai');

  const platform = PLATFORMS.find(p => p.key === activePlatform);
  const PlatformIcon = platform.icon;
  const filteredPosts = POSTS.filter(p => p.platform === activePlatform);

  return (
    <div className="p-6 lg:p-10 max-w-[1200px] mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl font-bold">Social Media Toolkit</h1>
        <p className="text-muted-foreground mt-1">Ready-to-post copy, step-by-step campaign plan, and hashtag bank</p>
      </div>

      {/* Tab nav */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'ai', label: '✨ AI Assistant' },
          { key: 'posts', label: '📝 Ready-to-Copy Posts' },
          { key: 'steps', label: '📅 Campaign Plan' },
          { key: 'hashtags', label: '#️⃣ Hashtag Bank' },
          { key: 'tips', label: '💡 Platform Tips' },
        ].map(t => (
          <Button key={t.key} size="sm" variant={activeTab === t.key ? 'default' : 'outline'} onClick={() => setActiveTab(t.key)}>
            {t.label}
          </Button>
        ))}
      </div>

      {/* AI TAB */}
      {activeTab === 'ai' && <AIMessageAssistant />}

      {/* POSTS TAB */}
      {activeTab === 'posts' && (
        <div className="space-y-6">
          {/* Platform selector */}
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map(p => {
              const Icon = p.icon;
              return (
                <button
                  key={p.key}
                  onClick={() => setActivePlatform(p.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                    activePlatform === p.key
                      ? `${p.bg} ${p.color} border-current shadow-sm`
                      : 'bg-card border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${activePlatform === p.key ? p.color : ''}`} />
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Platform tip banner */}
          <div className={`rounded-xl border px-4 py-3 text-sm flex items-start gap-2 ${platform.bg}`}>
            <Lightbulb className={`w-4 h-4 flex-shrink-0 mt-0.5 ${platform.color}`} />
            <span>{platform.tip}</span>
          </div>

          {/* Posts */}
          <div className="grid gap-4">
            {filteredPosts.map((post, i) => <PostCard key={i} post={post} />)}
          </div>

          <p className="text-xs text-muted-foreground italic">
            💡 Replace [Street Name], [Date], [Location] etc. with your specific details before posting.
          </p>
        </div>
      )}

      {/* STEPS TAB */}
      {activeTab === 'steps' && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="font-semibold text-lg mb-1">Your Week-by-Week Campaign Plan</h2>
            <p className="text-sm text-muted-foreground">Click each phase to expand. Work through the steps in order for maximum impact.</p>
          </div>
          {STEP_BY_STEP.map((phase, i) => <StepPhase key={i} phase={phase} />)}
        </div>
      )}

      {/* HASHTAGS TAB */}
      {activeTab === 'hashtags' && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h2 className="font-semibold text-lg">Campaign Hashtag Bank</h2>
            <p className="text-sm text-muted-foreground">Click any hashtag to copy it. Add 3–5 relevant hashtags to every post. Don't paste all of them — choose the most relevant for each post.</p>
            <div className="flex flex-wrap gap-2">
              {HASHTAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => { navigator.clipboard.writeText(tag); toast.success(`Copied ${tag}`); }}
                  className="bg-primary/10 hover:bg-primary/20 text-primary font-mono text-sm px-3 py-1.5 rounded-full border border-primary/20 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <h3 className="font-semibold flex items-center gap-2"><Copy className="w-4 h-4" /> Copy Full Set</h3>
            <p className="text-sm text-muted-foreground">Copy all hashtags at once for use in Instagram captions (paste at the end).</p>
            <div className="bg-muted rounded-lg p-3 font-mono text-sm break-words text-muted-foreground">
              {HASHTAGS.join(' ')}
            </div>
            <CopyButton text={HASHTAGS.join(' ')} />
          </div>
        </div>
      )}

      {/* TIPS TAB */}
      {activeTab === 'tips' && (
        <div className="grid md:grid-cols-2 gap-4">
          {PLATFORMS.map(p => {
            const Icon = p.icon;
            return (
              <div key={p.key} className={`rounded-xl border p-5 space-y-3 ${p.bg}`}>
                <div className={`flex items-center gap-2 font-semibold ${p.color}`}>
                  <Icon className="w-5 h-5" />
                  {p.label}
                </div>
                <p className="text-sm">{p.tip}</p>
                <p className="text-xs text-muted-foreground">Character limit: {p.charLimit.toLocaleString()} chars</p>
              </div>
            );
          })}
          <div className="md:col-span-2 bg-card border border-border rounded-xl p-5 space-y-3">
            <h3 className="font-semibold flex items-center gap-2"><Lightbulb className="w-4 h-4 text-amber-500" /> General Best Practices</h3>
            <ul className="text-sm space-y-2 text-muted-foreground list-disc list-inside">
              <li>Always respond to comments — engagement boosts organic reach on all platforms.</li>
              <li>Photos and videos get 2–3× more reach than text-only posts on Facebook & Instagram.</li>
              <li>Post at peak times: 7–9am, 12–2pm, and 7–9pm on weekdays.</li>
              <li>Keep X/Twitter posts punchy — one clear message per tweet.</li>
              <li>Use "local" language — mention street names, landmarks, pubs, schools people recognise.</li>
              <li>Never delete negative comments — respond calmly and professionally. Transparency builds trust.</li>
              <li>Pin your most important post (e.g. polling day reminder) to the top of your Facebook page.</li>
              <li>Ask your volunteers to share posts from their own accounts to reach new audiences.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}