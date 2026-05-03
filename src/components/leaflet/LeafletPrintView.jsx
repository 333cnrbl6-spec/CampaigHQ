import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Map } from 'lucide-react';
import PrintCoverPage from '../print/PrintCoverPage';
import TurfBoundaryMap from '../map/TurfBoundaryMap';

export default function LeafletPrintView({ turf, streets = [], contacts = [], onBack }) {
  const turfName = turf?.name || 'Leaflet Run';
  const totalHouses = streets.reduce((s, r) => s + (r.total_houses || 0), 0);
  const totalPostal = streets.reduce((s, r) => s + (r.postal_voter_houses || 0), 0);
  const totalNonPostal = totalHouses - totalPostal;

  // Get contacts for this turf for map display
  const turfContacts = useMemo(() => {
    if (!contacts.length || !streets.length) return [];
    const streetNames = streets.map(s => s.street_name);
    return contacts.filter(c => streetNames.some(s => c.address?.includes(s)));
  }, [contacts, streets]);

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-background">
      {/* Controls — hidden on print */}
      <div className="print:hidden p-6 flex items-center gap-4 border-b border-border/50 bg-card sticky top-0 z-10">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div>
          <h1 className="font-heading text-xl font-bold">{turfName} — Leaflet Sheet</h1>
          <p className="text-sm text-muted-foreground">{streets.length} streets · {totalHouses} households</p>
        </div>
        <Button className="ml-auto gap-2" onClick={handlePrint}>
          <Printer className="w-4 h-4" /> Print Sheet
        </Button>
      </div>

      {/* Printable content */}
      <div className="max-w-[850px] mx-auto p-6 print:p-4 space-y-6">

        {/* Cover page */}
        <PrintCoverPage
          title={turfName}
          mode="leaflet"
          briefing={{
            round1_houses: totalHouses,
            round2_postal: totalPostal,
            round3_nonpostal: totalNonPostal,
          }}
          stats={{
            streetCount: streets.length,
            totalHouses,
            totalPostal,
            totalNonPostal,
          }}
        />

        {/* Header */}
        <div className="border-b-2 border-foreground pb-4 print:pb-2">
          <h1 className="text-2xl font-bold font-heading print:text-xl">{turfName}</h1>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm mt-2 text-muted-foreground print:text-xs">
            <span>📍 {streets.length} streets</span>
            <span>🏠 {totalHouses} total households</span>
            <span>📮 {totalPostal} postal voters</span>
          </div>
          {turf?.assigned_to && (
            <p className="text-sm mt-2 print:mt-1">Assigned to: <strong>{turf.assigned_to}</strong></p>
          )}
        </div>

        {/* Quick reference box */}
        <div className="border border-border rounded-lg overflow-hidden print:border-black print:border-2">
          <table className="w-full text-sm print:text-xs">
            <thead>
              <tr className="bg-primary/10 print:bg-gray-200">
                <th className="text-left px-4 py-2.5 font-semibold">Postal Round</th>
                <th className="text-left px-4 py-2.5 font-semibold">Target</th>
                <th className="text-center px-4 py-2.5 font-semibold w-24">Delivered ✓</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border print:divide-gray-300">
              <tr>
                <td className="px-4 py-2 font-medium">Round 1: All households</td>
                <td className="px-4 py-2">{totalHouses}</td>
                <td className="px-4 py-2 text-center"><span className="inline-block w-5 h-5 border-2 border-gray-400 rounded" /></td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-medium">Round 2: Postal voters (by post)</td>
                <td className="px-4 py-2">{totalPostal}</td>
                <td className="px-4 py-2 text-center"><span className="inline-block w-5 h-5 border-2 border-gray-400 rounded" /></td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-medium">Round 3: Hand-delivery (non-postal)</td>
                <td className="px-4 py-2">{totalNonPostal}</td>
                <td className="px-4 py-2 text-center"><span className="inline-block w-5 h-5 border-2 border-gray-400 rounded" /></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Street directory */}
        <div>
          <h2 className="text-lg font-bold mb-3 print:text-base print:mb-2">Street Directory</h2>
          <div className="border border-border rounded-lg overflow-hidden print:border-black print:border-2">
            <table className="w-full text-sm print:text-xs">
              <thead>
                <tr className="bg-primary/10 print:bg-gray-200">
                  <th className="text-left px-3 py-2.5 font-semibold">Street Name</th>
                  <th className="text-right px-3 py-2.5 font-semibold">Houses</th>
                  <th className="text-right px-3 py-2.5 font-semibold">Postal</th>
                  <th className="text-center px-3 py-2.5 font-semibold w-12">R1 ✓</th>
                  <th className="text-center px-3 py-2.5 font-semibold w-12">R2 ✓</th>
                  <th className="text-center px-3 py-2.5 font-semibold w-12">R3 ✓</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border print:divide-gray-300">
                {streets.length === 0 ? (
                  <tr><td colSpan={6} className="px-3 py-4 text-center text-muted-foreground">No streets imported yet</td></tr>
                ) : streets.map((street, idx) => (
                  <tr key={idx} className="hover:bg-muted/20 print:hover:bg-white">
                    <td className="px-3 py-2 font-medium">{street.street_name}</td>
                    <td className="px-3 py-2 text-right font-medium">{street.total_houses || '—'}</td>
                    <td className="px-3 py-2 text-right text-purple-600 font-medium">{street.postal_voter_houses || '—'}</td>
                    <td className="px-3 py-2 text-center">
                      {street.round_1_done
                        ? <span className="text-green-600 font-bold">✓</span>
                        : <span className="inline-block w-4 h-4 border border-gray-400 rounded-sm" />}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {street.round_2_done
                        ? <span className="text-green-600 font-bold">✓</span>
                        : <span className="inline-block w-4 h-4 border border-gray-400 rounded-sm" />}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {street.round_3_done
                        ? <span className="text-green-600 font-bold">✓</span>
                        : <span className="inline-block w-4 h-4 border border-gray-400 rounded-sm" />}
                    </td>
                  </tr>
                ))}
              </tbody>
              {streets.length > 0 && (
                <tfoot>
                  <tr className="bg-primary/5 print:bg-gray-100 font-semibold border-t-2 border-border print:border-gray-300">
                    <td className="px-3 py-2">TOTAL</td>
                    <td className="px-3 py-2 text-right">{totalHouses}</td>
                    <td className="px-3 py-2 text-right text-purple-600">{totalPostal}</td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Map reference (on print shows placeholder) */}
        <div className="border border-border rounded-lg p-4 print:border-black print:p-3">
          <h3 className="font-semibold mb-3 print:text-sm">Route Map Reference</h3>
          <div className="bg-muted/20 rounded h-48 print:h-32 flex items-center justify-center print:print print:bg-white print:border print:border-gray-400">
            <div className="text-center">
              <Map className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground print:text-xs">Map reference for street locations</p>
            </div>
          </div>
        </div>

        {/* Delivery notes */}
        <div className="border border-border rounded-lg p-4 print:border-black">
          <h3 className="font-semibold text-sm mb-3 print:text-xs">Volunteer Notes & Feedback</h3>
          <div className="space-y-2">
            <div className="h-16 border-b border-dashed border-muted-foreground/30 print:border-gray-300" />
            <div className="h-16 border-b border-dashed border-muted-foreground/30 print:border-gray-300" />
            <div className="h-16 border-b border-dashed border-muted-foreground/30 print:border-gray-300" />
          </div>
        </div>

        {/* Footer */}
        <div className="text-xs text-muted-foreground print:text-gray-400 text-center border-t border-border/50 pt-4 print:border-gray-300 print:pt-2">
          <p>Printed {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} · Turf: {turfName}</p>
          <p className="mt-1 text-[10px]">R1 = All households in turf · R2 = Postal voters (by post) · R3 = Hand-delivery (non-postal addresses)</p>
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white; }
          .no-print { display: none !important; }
          @page { margin: 12mm; size: A4; }
          .page-break { page-break-after: always; }
        }
      `}</style>
    </div>
  );
}