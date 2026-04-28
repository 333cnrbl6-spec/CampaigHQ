import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp, Users, CheckCircle2, Edit2, Save } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const DEFAULT_TARGETS = {
  total_contacts: 500,
  canvassed: 300,
  strong_supporters: 150,
  volunteers: 20,
  door_knocks: 200,
  phone_calls: 100,
};

function GoalBar({ label, current, target, color = '#16a34a' }) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const done = pct >= 100;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium flex items-center gap-1.5">
          {done && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
          {label}
        </span>
        <span className="text-muted-foreground">
          <span className="font-semibold text-foreground">{current}</span> / {target}
          <span className="ml-1.5 text-xs font-bold" style={{ color: done ? '#16a34a' : color }}>{pct}%</span>
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
        <div
          className="h-3 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: done ? '#16a34a' : color }}
        />
      </div>
    </div>
  );
}

export default function GOTVTracker() {
  const [editing, setEditing] = useState(false);
  const [targets, setTargets] = useState(DEFAULT_TARGETS);
  const [draft, setDraft] = useState(DEFAULT_TARGETS);

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list('-created_date', 1000),
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['interactions'],
    queryFn: () => base44.entities.ContactInteraction.list('-date', 1000),
  });

  const actuals = {
    total_contacts: contacts.length,
    canvassed: contacts.filter(c => c.canvassed).length,
    strong_supporters: contacts.filter(c => c.support_level === 'strong_supporter').length,
    volunteers: contacts.filter(c => c.volunteer).length,
    door_knocks: interactions.filter(i => i.type === 'door_knock').length,
    phone_calls: interactions.filter(i => i.type === 'phone_call').length,
  };

  // Weekly activity for chart
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    return {
      day: d.toLocaleDateString('en-GB', { weekday: 'short' }),
      interactions: interactions.filter(i => i.date === dateStr).length,
      canvassed: contacts.filter(c => c.canvass_date === dateStr).length,
    };
  });

  const overallPct = targets.canvassed > 0
    ? Math.min(100, Math.round((actuals.canvassed / targets.canvassed) * 100))
    : 0;

  const goals = [
    { key: 'total_contacts', label: 'Total Contacts in Database', color: '#3b82f6' },
    { key: 'canvassed', label: 'Voters Canvassed', color: '#16a34a' },
    { key: 'strong_supporters', label: 'Strong Supporters Identified', color: '#22c55e' },
    { key: 'volunteers', label: 'Volunteers Recruited', color: '#8b5cf6' },
    { key: 'door_knocks', label: 'Door Knocks', color: '#f59e0b' },
    { key: 'phone_calls', label: 'Phone Calls', color: '#06b6d4' },
  ];

  const handleSave = () => {
    setTargets(draft);
    setEditing(false);
  };

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="font-heading text-3xl font-bold flex items-center gap-2">
            <Target className="w-8 h-8 text-primary" /> GOTV Tracker
          </h1>
          <p className="text-muted-foreground mt-1">Get Out The Vote — monitor progress toward campaign targets</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => { setDraft({ ...targets }); setEditing(!editing); }}>
          {editing ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
          {editing ? 'Cancel' : 'Edit Targets'}
        </Button>
      </div>

      {/* Overall progress hero */}
      <Card className="bg-primary text-primary-foreground">
        <CardContent className="pt-6 pb-6 text-center">
          <p className="text-primary-foreground/80 text-sm mb-1">Overall Canvassing Progress</p>
          <div className="text-6xl font-bold mb-3">{overallPct}%</div>
          <div className="w-full bg-primary-foreground/20 rounded-full h-4 mb-3">
            <div className="h-4 rounded-full bg-accent transition-all" style={{ width: `${overallPct}%` }} />
          </div>
          <p className="text-primary-foreground/80 text-sm">{actuals.canvassed} of {targets.canvassed} target voters canvassed</p>
        </CardContent>
      </Card>

      {/* Goal bars (editable) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Campaign Goals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {goals.map(({ key, label, color }) => (
            <div key={key}>
              {editing ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium w-48 flex-shrink-0">{label}</span>
                  <Input
                    type="number"
                    min={0}
                    value={draft[key]}
                    onChange={e => setDraft({ ...draft, [key]: parseInt(e.target.value) || 0 })}
                    className="w-28"
                  />
                  <span className="text-xs text-muted-foreground">current: {actuals[key]}</span>
                </div>
              ) : (
                <GoalBar label={label} current={actuals[key]} target={targets[key]} color={color} />
              )}
            </div>
          ))}
          {editing && (
            <Button className="mt-2 gap-2" onClick={handleSave}>
              <Save className="w-4 h-4" /> Save Targets
            </Button>
          )}
        </CardContent>
      </Card>

      {/* 7-day activity chart */}
      <Card>
        <CardHeader>
          <CardTitle>Activity — Last 7 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={last7} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="interactions" name="Interactions" fill="#16a34a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="canvassed" name="Canvassed" fill="#86efac" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Support breakdown quick view */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Strong Support', value: actuals.strong_supporters, color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
          { label: 'Leaning', value: contacts.filter(c => c.support_level === 'leaning').length, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
          { label: 'Undecided', value: contacts.filter(c => c.support_level === 'undecided').length, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-100' },
          { label: 'Opposed', value: contacts.filter(c => c.support_level === 'opposed').length, color: 'text-red-600', bg: 'bg-red-50 border-red-100' },
        ].map(({ label, value, color, bg }) => (
          <Card key={label} className={`border ${bg}`}>
            <CardContent className="pt-5 pb-4 text-center">
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}