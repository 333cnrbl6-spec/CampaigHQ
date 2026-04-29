import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, MapPin, Home, Mail } from 'lucide-react';

export default function LeafletRunSheet({ turf, streets = [], onBack }) {
  const turfName = turf?.name || 'Leaflet Round';
  const totalHouses = streets.reduce((s, r) => s + (r.total_houses || 0), 0);
  const totalPostal = streets.reduce((s, r) => s + (r.postal_voter_houses || 0), 0);
  const totalNonPostal = totalHouses - totalPostal;

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-background">
      {/* Controls — hidden on print */}
      <div className="print:hidden p-6 flex items-center gap-4 border-b border-border/50 bg-card">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div>
          <h1 className="font-heading text-xl font-bold">{turfName} — Print Sheet</h1>
          <p className="text-sm text-muted-foreground">{streets.length} streets · {totalHouses} households</p>
        </div>
        <Button className="ml-auto gap-2" onClick={handlePrint}>
          <Printer className="w-4 h-4" /> Print Sheet
        </Button>
      </div>

      {/* Printable content */}
      <div className="max-w-[800px] mx-auto p-6 print:p-4 space-y-6">
        {/* Header */}
        <div className="border-b-2 border-foreground pb-4 print:pb-2">
          <h1 className="text-2xl font-bold font-heading print:text-xl">{turfName}</h1>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm mt-1 text-muted-foreground print:text-xs">
            <span className="flex items-center gap-1"><Home className="w-3.5 h-3.5" /> {totalHouses} total households</span>
            <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-purple-600" /> {totalPostal} postal voter addresses</span>
            <span>Round 1: all {totalHouses} · Round 2: {totalPostal} postal only · Round 3: {totalNonPostal} non-postal</span>
          </div>
          {turf?.assigned_to && (
            <p className="text-sm mt-1">Assigned to: <strong>{turf.assigned_to}</strong></p>
          )}
        </div>

        {/* Round summary box */}
        <div className="border border-border rounded-lg overflow-hidden print:border-black">
          <table className="w-full text-sm print:text-xs">
            <thead>
              <tr className="bg-muted print:bg-gray-100">
                <th className="text-left px-3 py-2 font-semibold">Round</th>
                <th className="text-left px-3 py-2 font-semibold">Description</th>
                <th className="text-right px-3 py-2 font-semibold">Households</th>
                <th className="text-center px-3 py-2 font-semibold w-20">Done ✓</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border print:divide-gray-200">
              <tr>
                <td className="px-3 py-2 font-medium">Round 1</td>
                <td className="px-3 py-2 text-muted-foreground">All households</td>
                <td className="px-3 py-2 text-right">{totalHouses}</td>
                <td className="px-3 py-2 text-center"><span className="inline-block w-5 h-5 border-2 border-gray-400 rounded" /></td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium">Round 2</td>
                <td className="px-3 py-2 text-muted-foreground">Postal voters only</td>
                <td className="px-3 py-2 text-right">{totalPostal}</td>
                <td className="px-3 py-2 text-center"><span className="inline-block w-5 h-5 border-2 border-gray-400 rounded" /></td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium">Round 3</td>
                <td className="px-3 py-2 text-muted-foreground">All except postal voters</td>
                <td className="px-3 py-2 text-right">{totalNonPostal}</td>
                <td className="px-3 py-2 text-center"><span className="inline-block w-5 h-5 border-2 border-gray-400 rounded" /></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Street list */}
        <div>
          <h2 className="text-lg font-bold mb-3 print:text-base">Street List</h2>
          <div className="border border-border rounded-lg overflow-hidden print:border-black">
            <table className="w-full text-sm print:text-xs">
              <thead>
                <tr className="bg-muted print:bg-gray-100">
                  <th className="text-left px-3 py-2 font-semibold">Street</th>
                  <th className="text-left px-3 py-2 font-semibold hidden sm:table-cell print:table-cell">House Range / Notes</th>
                  <th className="text-right px-3 py-2 font-semibold">Houses</th>
                  <th className="text-right px-3 py-2 font-semibold text-purple-700">Postal</th>
                  <th className="text-center px-3 py-2 font-semibold w-16">R1</th>
                  <th className="text-center px-3 py-2 font-semibold w-16">R2</th>
                  <th className="text-center px-3 py-2 font-semibold w-16">R3</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border print:divide-gray-200">
                {streets.length === 0 ? (
                  <tr><td colSpan={7} className="px-3 py-4 text-center text-muted-foreground">No streets imported yet</td></tr>
                ) : streets.map((street) => (
                  <tr key={street.id} className="hover:bg-muted/20">
                    <td className="px-3 py-2 font-medium">{street.street_name}</td>
                    <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell print:table-cell text-xs">
                      {street.notes || '—'}
                    </td>
                    <td className="px-3 py-2 text-right">{street.total_houses || '—'}</td>
                    <td className="px-3 py-2 text-right text-purple-700">{street.postal_voter_houses || '—'}</td>
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
                  <tr className="bg-muted/50 print:bg-gray-50 font-semibold">
                    <td className="px-3 py-2">TOTAL</td>
                    <td className="hidden sm:table-cell print:table-cell" />
                    <td className="px-3 py-2 text-right">{totalHouses}</td>
                    <td className="px-3 py-2 text-right text-purple-700">{totalPostal}</td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Notes section */}
        <div className="border border-border rounded-lg p-4 print:border-black">
          <p className="font-semibold text-sm mb-2">Volunteer Notes</p>
          <div className="h-20 border-b border-dashed border-muted-foreground/30 print:border-gray-300" />
          <div className="h-20 border-b border-dashed border-muted-foreground/30 print:border-gray-300 mt-4" />
        </div>

        {/* Footer */}
        <div className="text-xs text-muted-foreground print:text-gray-400 text-center border-t border-border/50 pt-3 print:border-gray-200">
          Printed {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} ·
          R1 = All households · R2 = Postal voters only · R3 = Excluding postal voters
        </div>
      </div>
    </div>
  );
}