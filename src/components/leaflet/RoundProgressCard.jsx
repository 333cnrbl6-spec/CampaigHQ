const DOT_COLORS = { 1: '#3b82f6', 2: '#8b5cf6', 3: '#f59e0b' };

export default function RoundProgressCard({ round, config, done, total, isActive, onClick }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-xl border-2 p-4 transition-all w-full ${
        isActive ? 'border-primary shadow-md bg-primary/5' : 'border-border/50 bg-card hover:border-primary/40'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${config.color}`}>Round {round}</span>
        <span className="text-xs text-muted-foreground">{done}/{total} streets</span>
      </div>
      <p className="text-sm font-semibold leading-tight mb-1">{config.label.split(' — ')[1]}</p>
      <p className="text-xs text-muted-foreground mb-3">{config.description}</p>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: DOT_COLORS[round] }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1">{pct}% complete {isActive ? '· Click to clear' : '· Click to filter'}</p>
    </button>
  );
}