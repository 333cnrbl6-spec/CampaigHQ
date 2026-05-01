/**
 * WalkSheetPrint
 * Renders a printable walk sheet and triggers window.print().
 * Pass `stops` as an array of { contact, stopNumber? } objects,
 * plus optional `title` and `date` strings.
 */
import { useEffect } from 'react';

const SUPPORT_LABELS = {
  strong_supporter: { label: 'Strong Support', color: '#16a34a' },
  leaning:          { label: 'Leaning',         color: '#3b82f6' },
  undecided:        { label: 'Undecided',        color: '#d97706' },
  opposed:          { label: 'Opposed',          color: '#dc2626' },
  unknown:          { label: '',                 color: '#9ca3af' },
};

export default function WalkSheetPrint({ stops, title, date, onClose }) {
  useEffect(() => {
    // Give the DOM a tick to render before printing
    const timer = setTimeout(() => window.print(), 300);
    return () => clearTimeout(timer);
  }, []);

  const today = date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      {/* Print-only styles injected inline */}
      <style>{`
        @media print {
          body > *:not(#walk-sheet-root) { display: none !important; }
          #walk-sheet-root { display: block !important; }
          @page { size: A4 portrait; margin: 12mm 12mm 14mm 12mm; }
        }
        @media screen {
          #walk-sheet-root {
            position: fixed; inset: 0; z-index: 99999;
            background: white; overflow-y: auto;
            padding: 24px 32px;
          }
        }
        .ws-row { page-break-inside: avoid; }
      `}</style>

      <div id="walk-sheet-root">
        {/* Screen close button — hidden on print */}
        <div className="flex items-center justify-between mb-4 print:hidden">
          <p className="text-sm text-gray-500">Preview — printing will start automatically. Use your browser's print dialog to save as PDF.</p>
          <button
            onClick={onClose}
            className="text-xs px-3 py-1.5 border rounded-md hover:bg-gray-100"
          >
            ✕ Close
          </button>
        </div>

        {/* Document header */}
        <table style={{ width: '100%', borderBottom: '2px solid #166534', marginBottom: '10px' }}>
          <tbody>
            <tr>
              <td style={{ verticalAlign: 'top' }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#14532d' }}>
                  🌿 Paul Binns — Green Party
                </div>
                <div style={{ fontSize: '13px', color: '#166534', marginTop: '2px' }}>
                  Canvassing Walk Sheet
                </div>
              </td>
              <td style={{ textAlign: 'right', verticalAlign: 'top', fontSize: '11px', color: '#6b7280' }}>
                <div><strong>Date:</strong> {today}</div>
                <div><strong>Route:</strong> {title || 'Canvassing Route'}</div>
                <div><strong>Stops:</strong> {stops.length}</div>
                <div style={{ marginTop: '4px' }}><strong>Volunteer:</strong> ___________________________</div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '16px', fontSize: '10px', color: '#374151', marginBottom: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600 }}>Outcome codes:</span>
          {[['✓','Spoken to'],['⟳','Call back'],['?','No answer'],['✗','Refused']].map(([code, desc]) => (
            <span key={code}><strong>{code}</strong> = {desc}</span>
          ))}
          <span style={{ fontWeight: 600, marginLeft: 'auto' }}>Support: S = Strong · L = Leaning · U = Undecided · O = Opposed</span>
        </div>

        {/* Contact table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
          <thead>
            <tr style={{ background: '#f0fdf4', borderBottom: '1.5px solid #166534' }}>
              <th style={{ padding: '5px 6px', textAlign: 'center', width: '28px', color: '#166534' }}>#</th>
              <th style={{ padding: '5px 6px', textAlign: 'left', color: '#166534', width: '130px' }}>Name</th>
              <th style={{ padding: '5px 6px', textAlign: 'left', color: '#166534' }}>Address</th>
              <th style={{ padding: '5px 6px', textAlign: 'center', width: '48px', color: '#166534' }}>Current</th>
              <th style={{ padding: '5px 6px', textAlign: 'center', width: '36px', color: '#166534' }}>Out✓</th>
              <th style={{ padding: '5px 6px', textAlign: 'center', width: '44px', color: '#166534' }}>Support</th>
              <th style={{ padding: '5px 6px', textAlign: 'left', color: '#166534' }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {stops.map((stop, idx) => {
              const c = stop.contact || stop;
              const num = stop.stopNumber ?? idx + 1;
              const sl = SUPPORT_LABELS[c.support_level] || SUPPORT_LABELS.unknown;
              const isShaded = idx % 2 === 1;

              return (
                <tr
                  key={c.id || idx}
                  className="ws-row"
                  style={{ background: isShaded ? '#f9fafb' : 'white', borderBottom: '1px solid #e5e7eb' }}
                >
                  <td style={{ padding: '5px 6px', textAlign: 'center', fontWeight: 700, color: '#166534' }}>{num}</td>
                  <td style={{ padding: '5px 6px', fontWeight: 500 }}>{c.name}</td>
                  <td style={{ padding: '5px 6px', color: '#374151' }}>
                    {c.address}
                    {c.postcode && <span style={{ color: '#6b7280', marginLeft: '4px', fontFamily: 'monospace' }}>{c.postcode}</span>}
                  </td>
                  <td style={{ padding: '5px 6px', textAlign: 'center' }}>
                    {sl.label && (
                      <span style={{
                        display: 'inline-block',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        fontSize: '9px',
                        fontWeight: 700,
                        color: 'white',
                        background: sl.color,
                        whiteSpace: 'nowrap',
                      }}>
                        {sl.label}
                      </span>
                    )}
                    {c.canvassed && <span style={{ fontSize: '9px', color: '#6b7280', display: 'block' }}>prev. canvassed</span>}
                  </td>
                  {/* Outcome checkbox */}
                  <td style={{ padding: '5px 6px', textAlign: 'center' }}>
                    <div style={{
                      width: '22px', height: '22px', border: '1.5px solid #9ca3af',
                      borderRadius: '3px', display: 'inline-block'
                    }} />
                  </td>
                  {/* Support field */}
                  <td style={{ padding: '5px 6px', textAlign: 'center' }}>
                    <div style={{
                      width: '34px', height: '20px', border: '1px solid #9ca3af',
                      borderRadius: '3px', display: 'inline-block'
                    }} />
                  </td>
                  {/* Notes */}
                  <td style={{ padding: '5px 6px' }}>
                    <div style={{
                      borderBottom: '1px dotted #9ca3af',
                      minWidth: '80px',
                      height: '18px',
                    }} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Footer */}
        <div style={{ marginTop: '16px', borderTop: '1px solid #d1d5db', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#9ca3af' }}>
          <span>Paul Binns — Green Party · Tyldesley &amp; Mosley Common</span>
          <span>Data processed under GDPR. For campaign use only. Do not leave in public places.</span>
        </div>

        {/* Volunteer summary box */}
        <div style={{ marginTop: '14px', border: '1px solid #d1d5db', borderRadius: '6px', padding: '10px 14px', fontSize: '11px' }}>
          <div style={{ fontWeight: 700, marginBottom: '6px', color: '#166534' }}>Session Summary (complete after canvassing)</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
            {['Doors knocked', 'Spoken to', 'No answer', 'Time out'].map(label => (
              <div key={label}>
                <div style={{ color: '#6b7280', marginBottom: '3px' }}>{label}</div>
                <div style={{ borderBottom: '1.5px solid #374151', height: '20px' }} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: '10px' }}>
            <div style={{ color: '#6b7280', marginBottom: '3px' }}>General notes / issues raised</div>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ borderBottom: '1px dotted #9ca3af', height: '22px', marginBottom: '4px' }} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}