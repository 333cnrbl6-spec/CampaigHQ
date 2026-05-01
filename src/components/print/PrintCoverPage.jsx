import { Leaf, ShieldCheck, Phone, User, Calendar, AlertCircle, Home, MapPin } from 'lucide-react';

/**
 * PrintCoverPage — first page of any printed canvassing or leaflet sheet.
 * Props:
 *   title: string
 *   mode: 'canvassing' | 'leaflet'
 *   briefing: { volunteer_name, distribution_date, leaflet_round, emergency_contact_name, emergency_contact_phone, access_notes }
 *   stats: object — varies by mode
 *     canvassing: { contactCount, streetCount, groupBy }
 *     leaflet:    { streetCount, totalHouses, totalPostal, totalNonPostal, round }
 */
export default function PrintCoverPage({ title, mode, briefing, stats }) {
  const dateFormatted = briefing.distribution_date
    ? new Date(briefing.distribution_date + 'T12:00:00').toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    : '—';

  const roundLabels = { 1: 'Round 1 — All Households', 2: 'Round 2 — Postal Voters Only', 3: 'Round 3 — Non-Postal Households' };

  return (
    <div className="page-break-after mb-0 print:page-break-after-always">
      {/* Campaign header */}
      <div className="flex items-start justify-between pb-4 border-b-2 border-slate-800 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Leaf className="w-7 h-7 text-primary" />
            <h1 className="font-heading text-3xl font-bold">{title}</h1>
          </div>
          <p className="text-sm text-muted-foreground font-medium">Green Party — Paul Binns for Tyldesley &amp; Mosley Common</p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <p>greenparty.org.uk</p>
          <p className="mt-0.5">Tyldesley &amp; Mosley Common Ward</p>
        </div>
      </div>

      {/* Two-column detail grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">

        {/* Volunteer info */}
        <div className="border border-slate-300 rounded-lg p-4 space-y-2 print:border-gray-300">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 flex items-center gap-1.5 mb-3">
            <User className="w-3.5 h-3.5" /> Volunteer Details
          </p>
          <Row label="Name" value={briefing.volunteer_name} />
          <Row label="Date" value={dateFormatted} />
          {mode === 'leaflet' && (
            <Row label="Round" value={roundLabels[briefing.leaflet_round] || `Round ${briefing.leaflet_round}`} />
          )}
          {briefing.access_notes && (
            <Row label="Notes" value={briefing.access_notes} />
          )}
        </div>

        {/* Emergency contact */}
        <div className="border border-red-200 rounded-lg p-4 space-y-2 print:border-red-300 bg-red-50/30 print:bg-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-600 flex items-center gap-1.5 mb-3">
            <Phone className="w-3.5 h-3.5" /> Emergency Contact (Lone Worker)
          </p>
          <Row label="Name" value={briefing.emergency_contact_name} />
          <Row label="Phone" value={briefing.emergency_contact_phone} bold />
          <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
            If you feel unsafe or have an incident, call this number immediately. Also call the campaign line on
            the number given at briefing.
          </p>
        </div>
      </div>

      {/* Statistics summary */}
      <div className="border border-slate-200 rounded-lg overflow-hidden mb-6 print:border-gray-300">
        <div className="bg-slate-800 text-white px-4 py-2 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          <span className="font-semibold text-sm">
            {mode === 'canvassing' ? 'Canvassing Summary' : 'Leaflet Distribution Summary'}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-slate-200 print:divide-gray-200">
          {mode === 'canvassing' ? (
            <>
              <StatBox value={stats.contactCount} label="Contacts" />
              <StatBox value={stats.streetCount} label={stats.groupBy === 'postcode' ? 'Postcodes' : 'Streets'} />
              <StatBox value="—" label="Leaflets needed" note="n/a" />
              <StatBox value={new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} label="Print date" />
            </>
          ) : (
            <>
              <StatBox value={stats.streetCount} label="Streets" />
              <StatBox value={stats.totalHouses} label="Total Households" />
              <StatBox value={stats.totalPostal} label="Postal Voter HH" />
              <StatBox value={
                briefing.leaflet_round === '1' ? stats.totalHouses
                : briefing.leaflet_round === '2' ? stats.totalPostal
                : stats.totalNonPostal
              } label="Leaflets Needed" bold />
            </>
          )}
        </div>
      </div>

      {/* Safeguarding reminder box */}
      <div className="border border-amber-300 rounded-lg p-4 bg-amber-50/50 print:bg-white print:border-amber-400 flex gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 space-y-1 leading-relaxed">
          <p className="font-semibold text-sm text-amber-700">Safeguarding &amp; Data Reminder</p>
          <p>✓ You have confirmed your route with your emergency contact and noted your expected return time.</p>
          <p>✓ This sheet contains personal data — keep it secure, use for this session only, and return or destroy after use.</p>
          <p>✓ Do not photograph, copy, or share the contact details on this sheet.</p>
          <p>✓ If challenged or made to feel unsafe, leave the area and call your emergency contact.</p>
        </div>
      </div>

      {/* Page break separator */}
      <div className="hidden print:block" style={{ pageBreakAfter: 'always' }} />
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-slate-500 w-16 flex-shrink-0 text-xs pt-0.5">{label}:</span>
      <span className={`text-slate-800 ${bold ? 'font-bold' : 'font-medium'}`}>{value || '—'}</span>
    </div>
  );
}

function StatBox({ value, label, bold, note }) {
  return (
    <div className="p-3 text-center">
      <p className={`text-xl font-bold ${bold ? 'text-primary' : 'text-foreground'}`}>{value}</p>
      <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
      {note && <p className="text-[9px] text-slate-400">{note}</p>}
    </div>
  );
}