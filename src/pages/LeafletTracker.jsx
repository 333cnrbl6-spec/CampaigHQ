import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useCampaign } from '@/lib/CampaignContext';
import useSecureData from '@/hooks/useSecureData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, CheckCircle2, Clock, Loader2, MapPin, User, Home, Printer, ChevronDown, ChevronUp, Navigation, X } from 'lucide-react';
import LeafletRunForm from '../components/leaflet/LeafletRunForm';
import RoundProgressCard from '../components/leaflet/RoundProgressCard';
import PrePrintBriefing from '../components/print/PrePrintBriefing';
import LeafletRunSheet from '../components/leaflet/LeafletRunSheet';

const ROUND_CONFIG = {
  1: { label: 'Round 1 — All Households', color: 'bg-blue-100 text-blue-800 border-blue-200', dot: 'bg-blue-500', description: 'Leaflet to every household' },
  2: { label: 'Round 2 — Postal Voters Only', color: 'bg-purple-100 text-purple-800 border-purple-200', dot: 'bg-purple-500', description: 'Postal voter addresses only (list from council)' },
  3: { label: 'Round 3 — Non-Postal Households', color: 'bg-amber-100 text-amber-800 border-amber-200', dot: 'bg-amber-500', description: 'All households EXCEPT postal voters' },
};

const statusConfig = {
  not_started: { label: 'Not Started', color: 'bg-muted text-muted-foreground', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-amber-100 text-amber-700', icon: Loader2 },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
};

function RoundBadge({ run, round }) {
  const done = run[`round_${round}_done`];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${
      done ? 'bg-green-100 text-green-700 border-green-200' : 'bg-muted text-muted-foreground border-border'
    }`}>
      {done ? '✓' : '○'} R{round}
    </span>
  );
}

export default function LeafletTracker() {
  const navigate = useNavigate();
  const { campaign } = useCampaign();
  const campaignId = campaign?.id;
  const urlParams = new URLSearchParams(window.location.search);
  const initialTurf = urlParams.get('turf_id') || 'all';

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterArea, setFilterArea] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTurf, setFilterTurf] = useState(initialTurf);
  const [activeRound, setActiveRound] = useState(0); // 0 = all rounds view
  const [expandedStreet, setExpandedStreet] = useState(null);
  const [printContext, setPrintContext] = useState(null); // { turfId }
  const [briefingData, setBriefingData] = useState(null);
  const queryClient = useQueryClient();

  const { data: runs = [], isLoading, refetch } = useSecureData(
    'getSessionLogs',
    campaignId ? { campaign_id: campaignId } : null,
    { staleTime: 120000, refetchInterval: 120000, enabled: !!campaignId }
  );

  const { data: turfs = [] } = useSecureData(
    'getAssignedTurfs',
    campaignId ? { campaign_id: campaignId } : null,
    { staleTime: 120000, refetchInterval: 120000, enabled: !!campaignId }
  );

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.LeafletRun.create({ ...data, campaign_id: campaignId }),
    onSuccess: () => { refetch(); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LeafletRun.update(id, data),
    onSuccess: () => { refetch(); setEditing(null); setShowForm(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.LeafletRun.delete(id),
    onSuccess: () => refetch(),
  });

  const handleSubmit = (data) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const toggleRoundDone = (run, round) => {
    const key = `round_${round}_done`;
    updateMutation.mutate({ id: run.id, data: { [key]: !run[key] } });
  };

  const quickStatus = (run, status) => {
    const update = { status };
    if (status === 'completed') update.completed_date = new Date().toISOString().split('T')[0];
    updateMutation.mutate({ id: run.id, data: { ...run, ...update } });
  };

  // Filtering
  const filtered = runs.filter(r => {
    const areaMatch = filterArea === 'all' || r.area === filterArea;
    const statusMatch = filterStatus === 'all' || r.status === filterStatus;
    const turfMatch = filterTurf === 'all' || r.turf_id === filterTurf;
    return areaMatch && statusMatch && turfMatch;
  });

  // Summary stats across all runs
  const total = runs.length;
  const totalHouses = runs.reduce((s, r) => s + (r.total_houses || 0), 0);
  const r1Done = runs.filter(r => r.round_1_done).length;
  const r2Done = runs.filter(r => r.round_2_done).length;
  const r3Done = runs.filter(r => r.round_3_done).length;
  const totalPostalHouses = runs.reduce((s, r) => s + (r.postal_voter_houses || 0), 0);

  const handlePrint = (turfId) => {
    setPrintContext({ turfId });
    setBriefingData(null);
  };

  // --- Pre-print briefing flow ---
  if (printContext && !briefingData) {
    const turfForPrint = turfs.find(t => t.id === printContext.turfId);
    const streetsForPrint = runs.filter(r => r.turf_id === printContext.turfId);
    const totalH = streetsForPrint.reduce((s, r) => s + (r.total_houses || 0), 0);
    const totalP = streetsForPrint.reduce((s, r) => s + (r.postal_voter_houses || 0), 0);
    return (
      <PrePrintBriefing
        mode="leaflet"
        defaultTitle={turfForPrint ? `${turfForPrint.name} — Leaflet Sheet` : 'Leaflet Distribution Sheet'}
        streetCount={streetsForPrint.length}
        totalHouses={totalH}
        onBack={() => setPrintContext(null)}
        onConfirm={(data) => setBriefingData(data)}
      />
    );
  }

  if (printContext && briefingData) {
    const turfForPrint = turfs.find(t => t.id === printContext.turfId);
    const streetsForPrint = runs.filter(r => r.turf_id === printContext.turfId);
    return (
      <LeafletRunSheet
        turf={turfForPrint}
        streets={streetsForPrint}
        briefing={briefingData}
        onBack={() => { setPrintContext(null); setBriefingData(null); }}
      />
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-[1200px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold">Leaflet Rounds Tracker</h1>
          <p className="text-muted-foreground mt-1">Manage up to 3 rounds of leafleting — track postal voters separately</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Add Street
        </Button>
      </div>

      {/* Turf zone context banner */}
      {filterTurf !== 'all' && (() => {
        const turf = turfs.find(t => t.id === filterTurf);
        if (!turf) return null;
        return (
          <div className="mb-6 flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl">
            <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">Filtered to zone: {turf.name}</p>
              {turf.assigned_to && <p className="text-xs text-muted-foreground">Assigned to: {turf.assigned_to}</p>}
            </div>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs flex-shrink-0" onClick={() => navigate(`/route?turf_id=${turf.id}`)}>
              <Navigation className="w-3.5 h-3.5" /> Optimise Route
            </Button>
            <button onClick={() => setFilterTurf('all')} className="text-muted-foreground hover:text-foreground flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })()}

      {/* Round Progress Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map(round => (
          <RoundProgressCard
            key={round}
            round={round}
            config={ROUND_CONFIG[round]}
            done={round === 1 ? r1Done : round === 2 ? r2Done : r3Done}
            total={total}
            isActive={activeRound === round}
            onClick={() => setActiveRound(activeRound === round ? 0 : round)}
          />
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-border/50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{total}</p>
          <p className="text-xs text-muted-foreground mt-1">Streets Total</p>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-primary">{totalHouses.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Households</p>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{totalPostalHouses.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Postal Voter Addresses</p>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{(totalHouses - totalPostalHouses).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Non-Postal Households</p>
        </div>
      </div>

      {/* Active round banner */}
      {activeRound > 0 && (
        <div className={`rounded-xl border p-4 mb-5 flex items-start justify-between gap-3 ${ROUND_CONFIG[activeRound].color}`}>
          <div>
            <p className="font-semibold text-sm">{ROUND_CONFIG[activeRound].label}</p>
            <p className="text-xs mt-0.5 opacity-75">{ROUND_CONFIG[activeRound].description}</p>
            {activeRound === 2 && <p className="text-xs mt-0.5 font-medium">Only streets with postal voter addresses are shown below.</p>}
            {activeRound === 3 && <p className="text-xs mt-0.5 font-medium">Postal-voter-only houses ({totalPostalHouses.toLocaleString()}) will be skipped on this round.</p>}
          </div>
          <button onClick={() => setActiveRound(0)} className="text-xs underline opacity-75 hover:opacity-100 flex-shrink-0">Clear filter</button>
        </div>
      )}

      {showForm && (
        <div className="mb-6">
          <LeafletRunForm
            run={editing}
            turfs={turfs}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setEditing(null); }}
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Select value={filterArea} onValueChange={setFilterArea}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Areas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Areas</SelectItem>
            <SelectItem value="Tyldesley">Tyldesley</SelectItem>
            <SelectItem value="Mosley Common">Mosley Common</SelectItem>
            <SelectItem value="Astley">Astley</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="not_started">Not Started</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        {turfs.length > 0 && (
          <Select value={filterTurf} onValueChange={setFilterTurf}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Rounds/Turfs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rounds/Turfs</SelectItem>
              {turfs.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Street List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <MapPin className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No streets match these filters.</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {filtered
            .filter(r => {
              if (activeRound === 2) return (r.postal_voter_houses || 0) > 0;
              return true;
            })
            .map((run) => {
              const sc = statusConfig[run.status] || statusConfig.not_started;
              const StatusIcon = sc.icon;
              const isExpanded = expandedStreet === run.id;
              const turfName = turfs.find(t => t.id === run.turf_id)?.name;
              const deliverCount = activeRound === 2
                ? (run.postal_voter_houses || 0)
                : activeRound === 3
                ? (run.total_houses || 0) - (run.postal_voter_houses || 0)
                : (run.total_houses || 0);

              return (
                <div key={run.id} className="bg-card border border-border/50 rounded-xl overflow-hidden">
                  <div
                    className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 cursor-pointer hover:bg-muted/20"
                    onClick={() => setExpandedStreet(isExpanded ? null : run.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{run.street_name}</p>
                        <Badge variant="secondary" className="text-xs">{run.area}</Badge>
                        {run.turf_part && <Badge variant="outline" className="text-xs">Part {run.turf_part}</Badge>}
                        {run.postcode && <span className="text-xs text-muted-foreground">{run.postcode}</span>}
                        {turfName && <span className="text-xs text-muted-foreground">· {turfName}</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                        {run.assigned_to && (
                          <span className="flex items-center gap-1"><User className="w-3 h-3" />{run.assigned_to}</span>
                        )}
                        {run.total_houses > 0 && (
                          <span className="flex items-center gap-1">
                            <Home className="w-3 h-3" />
                            {activeRound > 0 ? `${deliverCount} to deliver` : `${run.total_houses} houses`}
                            {run.postal_voter_houses > 0 && activeRound === 0 && (
                              <span className="text-purple-600">({run.postal_voter_houses} postal)</span>
                            )}
                          </span>
                        )}
                        <RoundBadge run={run} round={1} />
                        <RoundBadge run={run} round={2} />
                        <RoundBadge run={run} round={3} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge className={`text-xs gap-1 ${sc.color} border-0`}>
                        <StatusIcon className="w-3 h-3" />
                        {sc.label}
                      </Badge>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {/* Expanded round controls */}
                  {isExpanded && (
                    <div className="border-t border-border/40 p-4 bg-muted/10 space-y-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Round Completion</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {[1, 2, 3].map(r => {
                          const done = run[`round_${r}_done`];
                          return (
                            <button
                              key={r}
                              onClick={() => toggleRoundDone(run, r)}
                              className={`text-left px-3 py-2.5 rounded-lg border text-xs transition-all ${
                                done
                                  ? 'bg-green-50 border-green-300 text-green-800'
                                  : 'bg-card border-border hover:border-primary/50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                  done ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                                }`}>{done ? '✓' : r}</span>
                                <span className="font-medium">{r === 1 ? 'All HH' : r === 2 ? 'Postal Only' : 'Non-Postal'}</span>
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-1 pl-7">
                                {r === 1 && `${run.total_houses || 0} households`}
                                {r === 2 && `${run.postal_voter_houses || 0} postal addresses`}
                                {r === 3 && `${(run.total_houses || 0) - (run.postal_voter_houses || 0)} non-postal`}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => { setEditing(run); setShowForm(true); setExpandedStreet(null); }}>
                          Edit
                        </Button>
                        <Button size="sm" variant="ghost" className="text-xs h-7 text-destructive" onClick={() => deleteMutation.mutate(run.id)}>
                          Remove
                        </Button>
                        {run.turf_id && (
                          <Button size="sm" variant="outline" className="text-xs h-7 gap-1 ml-auto" onClick={() => handlePrint(run.turf_id)}>
                            <Printer className="w-3 h-3" /> Print Sheet
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}