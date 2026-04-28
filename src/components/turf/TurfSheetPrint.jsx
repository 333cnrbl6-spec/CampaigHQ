import { useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft, Leaf } from 'lucide-react';

const supportLabel = {
  strong_supporter: 'Strong Supporter',
  leaning: 'Leaning',
  undecided: 'Undecided',
  opposed: 'Opposed',
  unknown: 'Unknown',
};

const supportSymbol = {
  strong_supporter: '★★★',
  leaning: '★★',
  undecided: '★',
  opposed: '✗',
  unknown: '?',
};

function extractStreet(address = '') {
  return address.replace(/^\d+[a-zA-Z]?\s*/, '').trim() || address;
}

export default function TurfSheetPrint({ contacts, title, groupBy, onBack }) {
  const printRef = useRef(null);

  const grouped = useMemo(() => {
    const map = {};
    contacts.forEach(c => {
      const key = groupBy === 'postcode'
        ? (c.postcode?.toUpperCase() || 'No Postcode')
        : extractStreet(c.address);
      if (!map[key]) map[key] = [];
      map[key].push(c);
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([street, cts]) => ({
        street,
        contacts: cts.sort((a, b) => parseInt(a.address || '0') - parseInt(b.address || '0')),
      }));
  }, [contacts, groupBy]);

  const handlePrint = () => window.print();

  const printDate = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      {/* Screen-only toolbar */}
      <div className="print:hidden flex items-center gap-3 p-4 bg-card border-b border-border sticky top-0 z-50">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <span className="text-sm text-muted-foreground flex-1">
          {contacts.length} contacts · {grouped.length} {groupBy === 'postcode' ? 'postcodes' : 'streets'}
        </span>
        <Button size="sm" className="gap-2" onClick={handlePrint}>
          <Printer className="w-4 h-4" /> Print / Save PDF
        </Button>
      </div>

      {/* Printable area */}
      <div ref={printRef} className="p-6 max-w-[210mm] mx-auto print:p-0 print:max-w-none print:mx-0">

        {/* Header */}
        <div className="flex items-start justify-between mb-6 pb-4 border-b-2 border-slate-800 print:mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Leaf className="w-6 h-6 text-primary" />
              <h1 className="font-heading text-2xl font-bold">{title}</h1>
            </div>
            <p className="text-sm text-muted-foreground">Green Party — Paul Binns for Tyldesley &amp; Mosley Common</p>
            <p className="text-xs text-muted-foreground mt-1">Printed: {printDate}</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold">{contacts.length} Contacts</p>
            <p className="text-muted-foreground">{grouped.length} {groupBy === 'postcode' ? 'Postcodes' : 'Streets'}</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 flex-wrap mb-5 text-xs print:mb-4">
          <span className="font-semibold text-slate-600">Support key:</span>
          {Object.entries(supportLabel).map(([key, label]) => (
            <span key={key} className="flex items-center gap-1 text-slate-700">
              <span className="font-mono">{supportSymbol[key]}</span> = {label}
            </span>
          ))}
          <span className="flex items-center gap-1 text-slate-700">
            <span className="font-mono">✓</span> = Registered Voter
          </span>
        </div>

        {/* Street groups */}
        {grouped.map(({ street, contacts: cts }, gi) => (
          <div key={street} className={`mb-6 print:mb-4 ${gi > 0 ? 'break-inside-avoid' : ''}`}>
            {/* Street heading */}
            <div className="bg-slate-800 text-white px-3 py-1.5 rounded-t flex items-center justify-between print:rounded-none">
              <span className="font-semibold text-sm">{street}</span>
              <span className="text-xs opacity-70">{cts.length} contacts</span>
            </div>

            {/* Contact table */}
            <table className="w-full text-xs border border-t-0 border-slate-300 rounded-b overflow-hidden">
              <thead>
                <tr className="bg-slate-100 text-slate-600 text-left">
                  <th className="px-3 py-1.5 w-8 font-semibold">#</th>
                  <th className="px-3 py-1.5 font-semibold">Address</th>
                  <th className="px-3 py-1.5 font-semibold">Name</th>
                  <th className="px-3 py-1.5 font-semibold text-center w-16">Support</th>
                  <th className="px-3 py-1.5 font-semibold w-24">Phone</th>
                  <th className="px-3 py-1.5 font-semibold w-28">Notes</th>
                  <th className="px-3 py-1.5 font-semibold w-20 text-center">Canvassed?</th>
                </tr>
              </thead>
              <tbody>
                {cts.map((c, i) => (
                  <tr key={c.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="px-3 py-1.5 text-slate-500">{i + 1}</td>
                    <td className="px-3 py-1.5 font-medium">{c.address || '—'}</td>
                    <td className="px-3 py-1.5">
                      {c.name}
                      {c.registered_voter && <span className="ml-1 text-primary font-bold">✓</span>}
                    </td>
                    <td className="px-3 py-1.5 text-center font-mono tracking-tight">
                      {supportSymbol[c.support_level] || '?'}
                    </td>
                    <td className="px-3 py-1.5 text-slate-600">{c.phone || ''}</td>
                    <td className="px-3 py-1.5 text-slate-500 italic text-xs max-w-[120px] truncate">{c.notes || ''}</td>
                    <td className="px-3 py-1.5 text-center">
                      {/* Tick box for canvassers */}
                      <span className="inline-block w-4 h-4 border border-slate-400 rounded-sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Canvasser notes box */}
            <div className="border border-t-0 border-slate-300 rounded-b px-3 py-2 bg-amber-50 print:bg-white">
              <span className="text-xs text-slate-500">Canvasser notes for this street: </span>
              <span className="inline-block border-b border-dashed border-slate-400 w-full mt-1 h-5" />
            </div>
          </div>
        ))}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-slate-300 flex justify-between text-xs text-slate-500 print:mt-4">
          <span>Green Party — Paul Binns for Council</span>
          <span>Tyldesley &amp; Mosley Common Ward</span>
          <span>greenparty.org.uk</span>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:p-0, .print\\:p-0 * { visibility: visible; }
          /* target the printable div */
          [data-print], [data-print] * { visibility: visible; }
        }
        @page { margin: 12mm; size: A4; }
      `}</style>
    </>
  );
}