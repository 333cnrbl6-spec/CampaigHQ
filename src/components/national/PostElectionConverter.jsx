import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, Target, MessageSquare, Users, Zap, ArrowRight } from 'lucide-react';
import { useState } from 'react';

export default function PostElectionConverter() {
  const [activeView, setActiveView] = useState('overview');
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizProgress, setQuizProgress] = useState(0);

  const conversionStats = {
    doorsKnocked: 12400,
    contactsReached: 9230,
    voted: 8100,
    votedGreen: 3240,
    votedOther: 4860,
    notVoted: 1200,
    quizCompleted: 2150,
    conversionLikely: 340,
    conversionPossible: 890,
  };

  const topConcerns = [
    { concern: 'Cost of Living Crisis', count: 2340, green_alignment: 92 },
    { concern: 'NHS & Healthcare', count: 1890, green_alignment: 88 },
    { concern: 'Climate Emergency', count: 1650, green_alignment: 95 },
    { concern: 'Housing Affordability', count: 1420, green_alignment: 91 },
    { concern: 'Education & Schools', count: 980, green_alignment: 79 },
  ];

  const policyGaps = [
    { gap: 'Tax on Wealth/Billionaires', mentions: 320 },
    { gap: 'Stronger Public Ownership', mentions: 280 },
    { gap: 'Immigration Policy Details', mentions: 180 },
    { gap: 'Nuclear Energy Position', mentions: 150 },
    { gap: 'Business/Growth Strategy', mentions: 120 },
  ];

  const conversationGuide = [
    {
      question: 'Did you vote on election day?',
      subQuestions: [
        'Who did you vote for?',
        'What was the main reason for that choice?',
        'Would you be open to voting Green in local elections?',
      ],
    },
    {
      question: 'What\'s your top concern facing the country right now?',
      greenAlignment: 'Match their concern to Green policies',
      followUp: 'How does this align with Green Party proposals?',
    },
    {
      question: 'What would need to happen for you to consider voting Green?',
      subQuestions: [
        'What policies matter most to you?',
        'Are there any Green policies you didn\'t know about?',
        'Would you like to learn more about specific areas?',
      ],
    },
    {
      question: 'How Green are YOU? (Take the assessment)',
      description: 'Interactive quiz that scores policy alignment',
      followUp: 'Show personalized Green policies that match their values',
    },
  ];

  const quizQuestions = [
    {
      id: 1,
      question: 'Climate change is the most urgent issue facing the UK',
      category: 'climate',
      options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
    },
    {
      id: 2,
      question: 'The NHS should be fully publicly funded with no private provision',
      category: 'nhs',
      options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
    },
    {
      id: 3,
      question: 'Housing should be treated as a human right, not a commodity',
      category: 'housing',
      options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
    },
    {
      id: 4,
      question: 'Workers should have stronger rights and collective bargaining power',
      category: 'workers',
      options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
    },
    {
      id: 5,
      question: 'The wealthy should pay significantly more tax to fund public services',
      category: 'tax',
      options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Election Date */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-lg border border-primary/20">
        <h2 className="text-2xl font-bold mb-2">Post-Election Conversion Campaign</h2>
        <p className="text-muted-foreground mb-4">
          Election Day: 7 May 2026 • Critical window to convert lost voters while momentum is hot
        </p>
        <Badge className="bg-primary">🔥 72-Hour Blitz Window Active</Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Doors Knocked (Post-Election)</p>
              <p className="text-3xl font-bold">
                {(conversionStats.doorsKnocked / 1000).toFixed(1)}k
              </p>
              <p className="text-xs text-muted-foreground">
                {conversionStats.contactsReached.toLocaleString()} reached
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Policy Alignment Quiz Completed</p>
              <p className="text-3xl font-bold text-primary">
                {(conversionStats.quizCompleted / 1000).toFixed(1)}k
              </p>
              <p className="text-xs text-muted-foreground">
                Data for targeting follow-up
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-green-700">Likely Converts</p>
              <p className="text-3xl font-bold text-green-600">
                {conversionStats.conversionLikely.toLocaleString()}
              </p>
              <p className="text-xs text-green-600">
                + {conversionStats.conversionPossible.toLocaleString()} possible
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b pb-3 overflow-x-auto">
        {[
          { id: 'overview', label: '📊 Overview', icon: BarChart3 },
          { id: 'concerns', label: '🎯 Top Concerns', icon: Target },
          { id: 'quiz', label: '🧠 Policy Quiz', icon: MessageSquare },
          { id: 'conversations', label: '💬 Conversation Guide', icon: Users },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              activeView === tab.id
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeView === 'overview' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Vote Distribution (Post-Election)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {[
                  {
                    party: 'Voted Green',
                    count: conversionStats.votedGreen,
                    color: 'bg-green-500',
                    pct: Math.round(
                      (conversionStats.votedGreen / conversionStats.voted) * 100
                    ),
                  },
                  {
                    party: 'Voted Labour',
                    count: 2100,
                    color: 'bg-red-500',
                    pct: 26,
                  },
                  {
                    party: 'Voted Conservative',
                    count: 1200,
                    color: 'bg-blue-500',
                    pct: 15,
                  },
                  {
                    party: 'Voted Lib Dem',
                    count: 800,
                    color: 'bg-orange-500',
                    pct: 10,
                  },
                  {
                    party: 'Voted Other',
                    count: 760,
                    color: 'bg-slate-500',
                    pct: 9,
                  },
                ].map(item => (
                  <div key={item.party}>
                    <div className="flex justify-between text-sm mb-1">
                      <p className="font-medium">{item.party}</p>
                      <span className="text-muted-foreground">
                        {item.count.toLocaleString()} ({item.pct}%)
                      </span>
                    </div>
                    <div className="h-4 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color}`}
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 mt-4">
                <p className="text-sm font-semibold text-amber-900 mb-2">
                  🎯 Conversion Opportunity
                </p>
                <p className="text-sm text-amber-800">
                  <strong>4,860 Labour/Other voters</strong> are now in your doors. Many voted
                  against Conservative but may not have considered Green. With proper messaging,
                  you can convert <strong>7-15%</strong> to committed supporters by 2029.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Why They Didn't Vote Green</CardTitle>
              <CardDescription>Most common barriers from feedback</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { reason: 'Didn\'t think Greens could win', pct: 42 },
                { reason: 'Lack of awareness of Green policies', pct: 28 },
                { reason: 'Concerned about economic competence', pct: 18 },
                { reason: 'Never heard of the local Green candidate', pct: 15 },
                { reason: 'Policy disagreement', pct: 12 },
              ].map(item => (
                <div key={item.reason} className="flex items-center justify-between text-sm">
                  <span>{item.reason}</span>
                  <Badge variant="outline">{item.pct}%</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Concerns Tab */}
      {activeView === 'concerns' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Voter Top Concerns & Green Alignment
              </CardTitle>
              <CardDescription>
                Match voter priorities to Green policies for conversion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {topConcerns.map(item => (
                <div key={item.concern} className="p-4 bg-muted rounded-lg border">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{item.concern}</h4>
                    <Badge className="bg-green-600">{item.green_alignment}% Green aligned</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {item.count.toLocaleString()} voters mentioned this
                  </p>

                  <div className="space-y-1 text-sm mb-3">
                    {item.concern === 'Cost of Living Crisis' && (
                      <>
                        <p className="font-medium text-green-700">✓ Green Party Solution:</p>
                        <ul className="text-muted-foreground space-y-1">
                          <li>• Wealth tax on billionaires to fund universal basic income</li>
                          <li>• Cap rent increases at inflation rate</li>
                          <li>• Free public transport to reduce household costs</li>
                          <li>• Renationalize water companies to lower bills</li>
                        </ul>
                      </>
                    )}
                    {item.concern === 'NHS & Healthcare' && (
                      <>
                        <p className="font-medium text-green-700">✓ Green Party Solution:</p>
                        <ul className="text-muted-foreground space-y-1">
                          <li>• Invest £100bn in NHS to end waiting lists</li>
                          <li>• Free dental care for all</li>
                          <li>• Mental health services fully funded</li>
                          <li>• Ban private contracts in NHS</li>
                        </ul>
                      </>
                    )}
                    {item.concern === 'Climate Emergency' && (
                      <>
                        <p className="font-medium text-green-700">✓ Green Party Solution:</p>
                        <ul className="text-muted-foreground space-y-1">
                          <li>• Net zero by 2035 (not 2050)</li>
                          <li>• Massive renewable energy investment = new jobs</li>
                          <li>• Free public transport nationwide</li>
                          <li>• Tree planting on every street</li>
                        </ul>
                      </>
                    )}
                  </div>

                  <Button variant="outline" size="sm" className="gap-2">
                    <Zap className="w-4 h-4" />
                    Create Follow-up Campaign
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50/50">
            <CardHeader>
              <CardTitle className="text-red-700">Policy Gaps to Address</CardTitle>
              <CardDescription className="text-red-600">
                Voters felt Green Party messaging was missing on these topics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {policyGaps.map(item => (
                  <div key={item.gap} className="flex items-center justify-between text-sm">
                    <span>{item.gap}</span>
                    <Badge variant="outline">{item.mentions} mentions</Badge>
                  </div>
                ))}
              </div>
              <p className="text-xs text-red-600 mt-4">
                ⚠️ Recommend developing clearer messaging on these topics before 2029 election
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quiz Tab */}
      {activeView === 'quiz' && (
        <div className="space-y-4">
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                "How Green Are You?" Policy Alignment Quiz
              </CardTitle>
              <CardDescription>
                5-question assessment that scores voter alignment with Green policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white p-4 rounded-lg border space-y-4">
                {quizQuestions.map((q, idx) => (
                  <div key={q.id} className="pb-4 border-b last:border-b-0">
                    <p className="font-medium text-sm mb-3">
                      {idx + 1}. {q.question}
                    </p>
                    <div className="space-y-2">
                      {q.options.map(option => (
                        <label key={option} className="flex items-center gap-3 cursor-pointer">
                          <input type="radio" name={`q${q.id}`} className="w-4 h-4" />
                          <span className="text-sm">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline">Save Draft</Button>
                <Button className="gap-2">
                  <Zap className="w-4 h-4" />
                  Calculate Score
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quiz Results (Example)</CardTitle>
              <CardDescription>What happens after voter completes quiz</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm font-semibold text-green-700 mb-2">🎯 Green Alignment Score: 8.2/10</p>
                <p className="text-sm text-green-600 mb-3">
                  You agree with Green Party on almost all major policy areas. Here's where you align best:
                </p>
                <ul className="text-sm text-green-600 space-y-1">
                  <li>✓ Climate action (95% alignment)</li>
                  <li>✓ NHS funding (92% alignment)</li>
                  <li>✓ Tax fairness (89% alignment)</li>
                  <li>⚠ Economic growth (62% alignment)</li>
                </ul>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium text-sm mb-2">Recommended Next Step:</p>
                <p className="text-sm text-muted-foreground mb-3">
                  Based on your results, you'd love Green proposals on <strong>climate action</strong>. 
                  Would you like to:
                </p>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full text-left justify-start gap-2">
                    <ArrowRight className="w-4 h-4" />
                    Learn more about Green climate plans
                  </Button>
                  <Button variant="outline" className="w-full text-left justify-start gap-2">
                    <ArrowRight className="w-4 h-4" />
                    Volunteer for local campaign
                  </Button>
                  <Button variant="outline" className="w-full text-left justify-start gap-2">
                    <ArrowRight className="w-4 h-4" />
                    Receive weekly policy updates
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Conversation Guide Tab */}
      {activeView === 'conversations' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Post-Election Door Knock Script & Guide
              </CardTitle>
              <CardDescription>
                Conversation framework for volunteer training
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {conversationGuide.map((section, idx) => (
                <div key={idx} className="p-4 bg-muted rounded-lg border space-y-2">
                  <p className="font-bold text-lg">Step {idx + 1}: {section.question}</p>

                  {section.subQuestions && (
                    <div className="space-y-1 ml-4">
                      {section.subQuestions.map((sub, sidx) => (
                        <p key={sidx} className="text-sm text-muted-foreground">
                          → {sub}
                        </p>
                      ))}
                    </div>
                  )}

                  {section.greenAlignment && (
                    <p className="text-sm text-green-600 font-medium">✓ {section.greenAlignment}</p>
                  )}

                  {section.description && (
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  )}

                  {section.followUp && (
                    <p className="text-sm text-primary font-medium">→ {section.followUp}</p>
                  )}
                </div>
              ))}

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="font-medium text-blue-900 mb-2">💡 Key Conversion Principles</p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✓ Listen more than you talk (80/20 rule)</li>
                  <li>✓ Validate their concerns before offering solutions</li>
                  <li>✓ Show Green policies match their values, not contradict them</li>
                  <li>✓ Don't argue about past votes — focus on future opportunity</li>
                  <li>✓ Always offer next step (quiz, volunteer, newsletter, etc.)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Campaign Execution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Post-Election Campaign Execution Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            {
              date: 'Election Day - May 7',
              action: 'Standard GOTV calling & door knocks',
              volunteers: 'All teams',
            },
            {
              date: 'May 8-10 (72-Hour Window)',
              action: 'Intensive conversion canvassing — focus on non-Green voters',
              volunteers: 'Experienced team leads',
            },
            {
              date: 'May 11-14',
              action: 'Follow-up calls with quiz completers — personalized policy messaging',
              volunteers: 'Phone banking team',
            },
            {
              date: 'May 15-30',
              action: 'Sustained outreach — convert "possible" to "likely"',
              volunteers: 'Ongoing campaign team',
            },
          ].map((item, idx) => (
            <div key={idx} className="p-3 bg-muted rounded-lg border flex gap-3">
              <div className="font-bold text-primary flex-shrink-0">{idx + 1}</div>
              <div className="flex-1">
                <p className="font-medium">{item.date}</p>
                <p className="text-sm text-muted-foreground">{item.action}</p>
                <p className="text-xs text-muted-foreground mt-1">👥 {item.volunteers}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}