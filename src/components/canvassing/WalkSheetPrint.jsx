/**
 * WalkSheetPrint
 * Renders a walk sheet preview with interactive outcome/support tick boxes
 * (tap on screen, tick on paper) and a built-in jsPDF download button.
 */
import { useState } from 'react';
import jsPDF from 'jspdf';

const SUPPORT_LABELS = {
  strong_supporter: { label: 'Strong Support', color: '#16a34a' },
  leaning:          { label: 'Leaning',         color: '#3b82f6' },
  undecided:        { label: 'Undecided',        color: '#d97706' },
  opposed:          { label: 'Opposed',          color: '#dc2626' },
  unknown:          { label: '',                 color: '#9ca3af' },
};

const OUTCOMES = [
  { code: '✓', label: 'Spoken', color: '#16a34a' },
  { code: '⟳', label: 'Callback', color: '#3b82f6' },
  { code: '?',  label: 'No ans',  color: '#d97706' },
  { code: '✗',  label: 'Refused', color: '#dc2626' },
];

const SUPPORTS = [
  { code: 'S', label: 'Strong',    color: '#16a34a' },
  { code: 'L', label: 'Leaning',   color: '#3b82f6' },
  { code: 'U', label: 'Undecided', color: '#d97706' },
  { code: 'O', label: 'Opposed',   color: '#dc2626' },
];

function hexToRgb(hex) {
  return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)];
}

// A single tap-to-toggle tick cell for screen use
function TickCell({ active, onToggle, code, color }) {
  return (
    <td
      onClick={onToggle}
      style={{
        padding: '3px 2px',
        textAlign: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        width: '28px',
      }}
    >
      <div style={{
        width: '22px', height: '22px',
        border: `1.5px solid ${active ? color : '#9ca3af'}`,
        borderRadius: '4px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: active ? color : 'transparent',
        color: active ? 'white' : 'transparent',
        fontSize: '13px',
        fontWeight: 700,
        transition: 'all 0.1s',
      }}>
        {code}
      </div>
    </td>
  );
}

export default function WalkSheetPrint({ stops, title, date, onClose }) {
  const [generating, setGenerating] = useState(false);
  // outcomes[idx] = { outcome: code|null, support: code|null }
  const [selections, setSelections] = useState(() =>
    stops.map(() => ({ outcome: null, support: null }))
  );

  const today = date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const toggleOutcome = (idx, code) => {
    setSelections(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], outcome: next[idx].outcome === code ? null : code };
      return next;
    });
  };

  const toggleSupport = (idx, code) => {
    setSelections(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], support: next[idx].support === code ? null : code };
      return next;
    });
  };

  const generatePDF = () => {
    setGenerating(true);
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageW = 297;
      const margin = 10;
      const usableW = pageW - margin * 2;
      let y = 14;

      // ── Header ──────────────────────────────────────────────────────────
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(20, 83, 45);
      doc.text('Paul Binns — Green Party', margin, y);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(22, 101, 52);
      doc.text('Canvassing Walk Sheet', margin, y + 5);

      const rightX = pageW - margin;
      doc.setFontSize(8.5);
      doc.setTextColor(107, 114, 128);
      doc.text(`Date: ${today}`, rightX, y, { align: 'right' });
      doc.text(`Route: ${title || 'Canvassing Route'}`, rightX, y + 5, { align: 'right' });
      doc.text(`Stops: ${stops.length}`, rightX, y + 10, { align: 'right' });
      doc.text('Volunteer: ____________________________', rightX, y + 15, { align: 'right' });

      y += 19;
      doc.setDrawColor(22, 101, 52);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageW - margin, y);
      y += 4;

      // ── Legend ───────────────────────────────────────────────────────────
      doc.setFontSize(7.5);
      doc.setTextColor(55, 65, 81);
      doc.setFont('helvetica', 'bold');
      doc.text('Outcome:', margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text('✓ = Spoken to   ⟳ = Call back   ? = No answer   ✗ = Refused', margin + 18, y);
      doc.setFont('helvetica', 'bold');
      doc.text('Support:', margin + 110, y);
      doc.setFont('helvetica', 'normal');
      doc.text('S = Strong   L = Leaning   U = Undecided   O = Opposed', margin + 124, y);
      y += 7;

      // ── Column layout ────────────────────────────────────────────────────
      // #, Name, Address, Current badge, ✓ ⟳ ? ✗, S L U O, Notes
      const boxSz = 5; // mm per tick box
      const outcomeW = (boxSz + 1) * 4 + 2; // 4 boxes
      const supportW = (boxSz + 1) * 4 + 2;
      const numW = 7;
      const nameW = 42;
      const addrW = 60;
      const currentW = 26;
      const notesW = usableW - numW - nameW - addrW - currentW - outcomeW - supportW;

      const colX = {
        num:     margin,
        name:    margin + numW,
        address: margin + numW + nameW,
        current: margin + numW + nameW + addrW,
        outcome: margin + numW + nameW + addrW + currentW,
        support: margin + numW + nameW + addrW + currentW + outcomeW,
        notes:   margin + numW + nameW + addrW + currentW + outcomeW + supportW,
      };

      const drawTableHeader = (startY) => {
        doc.setFillColor(240, 253, 244);
        doc.rect(margin, startY - 4, usableW, 7, 'F');
        doc.setDrawColor(22, 101, 52);
        doc.setLineWidth(0.4);
        doc.line(margin, startY + 3, pageW - margin, startY + 3);

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(22, 101, 52);
        doc.text('#',       colX.num + numW / 2,         startY, { align: 'center' });
        doc.text('Name',    colX.name,                    startY);
        doc.text('Address', colX.address,                 startY);
        doc.text('Current', colX.current,                 startY);
        // Outcome headers
        OUTCOMES.forEach((o, i) => {
          doc.text(o.code, colX.outcome + i * (boxSz + 1) + boxSz / 2, startY, { align: 'center' });
        });
        // Support headers
        SUPPORTS.forEach((s, i) => {
          doc.text(s.code, colX.support + i * (boxSz + 1) + boxSz / 2, startY, { align: 'center' });
        });
        doc.text('Notes', colX.notes, startY);
        return startY + 5;
      };

      y = drawTableHeader(y);

      // ── Rows ─────────────────────────────────────────────────────────────
      const rowH = 9;
      stops.forEach((stop, idx) => {
        if (y + rowH > 195) {
          doc.addPage();
          y = 14;
          y = drawTableHeader(y);
        }

        const c = stop.contact || stop;
        const num = stop.stopNumber ?? idx + 1;
        const sl = SUPPORT_LABELS[c.support_level] || SUPPORT_LABELS.unknown;
        const sel = selections[idx] || {};
        const isShaded = idx % 2 === 1;

        if (isShaded) {
          doc.setFillColor(249, 250, 251);
          doc.rect(margin, y - 3, usableW, rowH, 'F');
        }
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.2);
        doc.line(margin, y + rowH - 3, pageW - margin, y + rowH - 3);

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(22, 101, 52);
        doc.text(String(num), colX.num + numW / 2, y, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(31, 41, 55);
        doc.text(doc.splitTextToSize(c.name || '', nameW - 2)[0] || '', colX.name, y);

        const addrFull = [c.address, c.postcode].filter(Boolean).join('  ');
        doc.text(doc.splitTextToSize(addrFull, addrW - 2)[0] || '', colX.address, y);

        // Support badge
        if (sl.label) {
          const rgb = hexToRgb(sl.color);
          doc.setFillColor(...rgb);
          doc.roundedRect(colX.current, y - 3, currentW - 2, 5, 1, 1, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6);
          doc.setTextColor(255, 255, 255);
          doc.text(sl.label, colX.current + (currentW - 2) / 2, y, { align: 'center' });
          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'normal');
        }

        // Outcome tick boxes (4)
        OUTCOMES.forEach((o, i) => {
          const bx = colX.outcome + i * (boxSz + 1);
          const by = y - 3;
          const ticked = sel.outcome === o.code;
          doc.setDrawColor(156, 163, 175);
          doc.setLineWidth(0.4);
          if (ticked) {
            const rgb = hexToRgb(o.color);
            doc.setFillColor(...rgb);
            doc.roundedRect(bx, by, boxSz, boxSz, 0.8, 0.8, 'FD');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
            doc.setTextColor(255, 255, 255);
            doc.text(o.code, bx + boxSz / 2, by + 3.5, { align: 'center' });
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'normal');
          } else {
            doc.roundedRect(bx, by, boxSz, boxSz, 0.8, 0.8);
          }
        });

        // Support tick boxes (4)
        SUPPORTS.forEach((s, i) => {
          const bx = colX.support + i * (boxSz + 1);
          const by = y - 3;
          const ticked = sel.support === s.code;
          doc.setDrawColor(156, 163, 175);
          doc.setLineWidth(0.4);
          if (ticked) {
            const rgb = hexToRgb(s.color);
            doc.setFillColor(...rgb);
            doc.roundedRect(bx, by, boxSz, boxSz, 0.8, 0.8, 'FD');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
            doc.setTextColor(255, 255, 255);
            doc.text(s.code, bx + boxSz / 2, by + 3.5, { align: 'center' });
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'normal');
          } else {
            doc.roundedRect(bx, by, boxSz, boxSz, 0.8, 0.8);
          }
        });

        // Notes line
        doc.setDrawColor(156, 163, 175);
        doc.setLineWidth(0.3);
        doc.line(colX.notes, y + 2, colX.notes + notesW - 2, y + 2);

        y += rowH;
      });

      // ── Footer ───────────────────────────────────────────────────────────
      y += 5;
      if (y > 188) { doc.addPage(); y = 14; }
      doc.setDrawColor(209, 213, 219);
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageW - margin, y);
      y += 4;
      doc.setFontSize(7.5);
      doc.setTextColor(156, 163, 175);
      doc.text('Paul Binns — Green Party · Tyldesley & Mosley Common', margin, y);
      doc.text('Data processed under GDPR. For campaign use only.', pageW - margin, y, { align: 'right' });

      // ── Session Summary ───────────────────────────────────────────────────
      y += 7;
      if (y > 175) { doc.addPage(); y = 14; }
      doc.setDrawColor(209, 213, 219);
      doc.roundedRect(margin, y, usableW, 34, 2, 2);
      y += 5;
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(22, 101, 52);
      doc.text('Session Summary (complete after canvassing)', margin + 3, y);
      y += 5;
      const fields = ['Doors knocked', 'Spoken to', 'No answer', 'Time out'];
      const fw = usableW / 4;
      fields.forEach((label, i) => {
        const sx = margin + 3 + i * fw;
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(107, 114, 128);
        doc.text(label, sx, y);
        doc.setDrawColor(55, 65, 81);
        doc.setLineWidth(0.5);
        doc.line(sx, y + 6, sx + fw - 6, y + 6);
      });
      y += 12;
      doc.setFontSize(7.5);
      doc.setTextColor(107, 114, 128);
      doc.text('General notes / issues raised:', margin + 3, y);
      y += 4;
      for (let i = 0; i < 2; i++) {
        doc.setDrawColor(156, 163, 175);
        doc.setLineWidth(0.2);
        doc.line(margin + 3, y, pageW - margin - 3, y);
        y += 5;
      }

      doc.save(`walk-sheet-${(title || 'route').toLowerCase().replace(/\s+/g, '-')}.pdf`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <style>{`
        @media screen {
          #walk-sheet-root {
            position: fixed; inset: 0; z-index: 99999;
            background: white; overflow-y: auto;
            padding: 20px 28px;
          }
        }
        .ws-tick { transition: all 0.12s; }
        .ws-tick:active { transform: scale(0.88); }
      `}</style>

      <div id="walk-sheet-root">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b gap-4 flex-wrap">
          <div>
            <h2 className="text-base font-semibold text-gray-800">{title || 'Canvassing Walk Sheet'}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{stops.length} stops · {today}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={generatePDF}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white text-sm font-medium rounded-md hover:bg-green-800 disabled:opacity-60"
            >
              {generating ? '⏳ Generating…' : '⬇️ Download PDF'}
            </button>
            <button onClick={onClose} className="text-xs px-3 py-2 border rounded-md hover:bg-gray-100 text-gray-600">
              ✕ Close
            </button>
          </div>
        </div>

        {/* Document header */}
        <table style={{ width: '100%', borderBottom: '2px solid #166534', marginBottom: '8px' }}>
          <tbody>
            <tr>
              <td style={{ verticalAlign: 'top' }}>
                <div style={{ fontSize: '17px', fontWeight: 700, color: '#14532d' }}>🌿 Paul Binns — Green Party</div>
                <div style={{ fontSize: '12px', color: '#166534', marginTop: '2px' }}>Canvassing Walk Sheet</div>
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
        <div style={{ display: 'flex', gap: '16px', fontSize: '10px', color: '#374151', marginBottom: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontWeight: 600 }}>Outcomes (tap to record):</span>
          {OUTCOMES.map(o => (
            <span key={o.code} style={{ display:'inline-flex', alignItems:'center', gap:'4px' }}>
              <span style={{ display:'inline-flex', width:'16px', height:'16px', border:`1.5px solid ${o.color}`, borderRadius:'3px', alignItems:'center', justifyContent:'center', fontSize:'10px', color: o.color, fontWeight:700 }}>{o.code}</span>
              {o.label}
            </span>
          ))}
          <span style={{ fontWeight: 600, marginLeft: 'auto' }}>Support:</span>
          {SUPPORTS.map(s => (
            <span key={s.code} style={{ display:'inline-flex', alignItems:'center', gap:'4px' }}>
              <span style={{ display:'inline-flex', width:'16px', height:'16px', border:`1.5px solid ${s.color}`, borderRadius:'3px', alignItems:'center', justifyContent:'center', fontSize:'10px', color: s.color, fontWeight:700 }}>{s.code}</span>
              {s.label}
            </span>
          ))}
        </div>

        {/* Main table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
          <thead>
            <tr style={{ background: '#f0fdf4', borderBottom: '1.5px solid #166534' }}>
              <th style={{ padding: '5px 4px', textAlign: 'center', width: '24px', color: '#166534' }}>#</th>
              <th style={{ padding: '5px 4px', textAlign: 'left', color: '#166534', width: '120px' }}>Name</th>
              <th style={{ padding: '5px 4px', textAlign: 'left', color: '#166534' }}>Address</th>
              <th style={{ padding: '5px 4px', textAlign: 'center', width: '52px', color: '#166534' }}>Current</th>
              {/* Outcome columns */}
              {OUTCOMES.map(o => (
                <th key={o.code} style={{ padding: '5px 2px', textAlign: 'center', width: '28px', color: o.color, fontSize: '12px', fontWeight: 700 }} title={o.label}>{o.code}</th>
              ))}
              {/* Support columns */}
              {SUPPORTS.map(s => (
                <th key={s.code} style={{ padding: '5px 2px', textAlign: 'center', width: '28px', color: s.color, fontSize: '11px', fontWeight: 700 }} title={s.label}>{s.code}</th>
              ))}
              <th style={{ padding: '5px 4px', textAlign: 'left', color: '#166534' }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {stops.map((stop, idx) => {
              const c = stop.contact || stop;
              const num = stop.stopNumber ?? idx + 1;
              const sl = SUPPORT_LABELS[c.support_level] || SUPPORT_LABELS.unknown;
              const sel = selections[idx] || {};
              const isShaded = idx % 2 === 1;

              return (
                <tr key={c.id || idx} style={{ background: isShaded ? '#f9fafb' : 'white', borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '4px', textAlign: 'center', fontWeight: 700, color: '#166534' }}>{num}</td>
                  <td style={{ padding: '4px', fontWeight: 500 }}>{c.name}</td>
                  <td style={{ padding: '4px', color: '#374151' }}>
                    {c.address}
                    {c.postcode && <span style={{ color: '#6b7280', marginLeft: '4px', fontFamily: 'monospace' }}>{c.postcode}</span>}
                  </td>
                  <td style={{ padding: '4px', textAlign: 'center' }}>
                    {sl.label && (
                      <span style={{ display: 'inline-block', padding: '1px 4px', borderRadius: '4px', fontSize: '9px', fontWeight: 700, color: 'white', background: sl.color, whiteSpace: 'nowrap' }}>
                        {sl.label}
                      </span>
                    )}
                    {c.canvassed && <span style={{ fontSize: '9px', color: '#6b7280', display: 'block' }}>prev.</span>}
                  </td>

                  {/* Outcome tick buttons */}
                  {OUTCOMES.map(o => {
                    const active = sel.outcome === o.code;
                    return (
                      <td key={o.code} style={{ padding: '3px 2px', textAlign: 'center' }}>
                        <button
                          className="ws-tick"
                          onClick={() => toggleOutcome(idx, o.code)}
                          title={o.label}
                          style={{
                            width: '24px', height: '24px',
                            border: `2px solid ${active ? o.color : '#d1d5db'}`,
                            borderRadius: '5px',
                            background: active ? o.color : 'transparent',
                            color: active ? 'white' : '#9ca3af',
                            fontSize: '13px', fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            lineHeight: 1,
                          }}
                        >
                          {active ? o.code : ''}
                        </button>
                      </td>
                    );
                  })}

                  {/* Support tick buttons */}
                  {SUPPORTS.map(s => {
                    const active = sel.support === s.code;
                    return (
                      <td key={s.code} style={{ padding: '3px 2px', textAlign: 'center' }}>
                        <button
                          className="ws-tick"
                          onClick={() => toggleSupport(idx, s.code)}
                          title={s.label}
                          style={{
                            width: '24px', height: '24px',
                            border: `2px solid ${active ? s.color : '#d1d5db'}`,
                            borderRadius: '5px',
                            background: active ? s.color : 'transparent',
                            color: active ? 'white' : '#9ca3af',
                            fontSize: '11px', fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            lineHeight: 1,
                          }}
                        >
                          {active ? s.code : ''}
                        </button>
                      </td>
                    );
                  })}

                  {/* Notes */}
                  <td style={{ padding: '4px' }}>
                    <div style={{ borderBottom: '1px dotted #9ca3af', minWidth: '60px', height: '20px' }} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Footer */}
        <div style={{ marginTop: '14px', borderTop: '1px solid #d1d5db', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#9ca3af' }}>
          <span>Paul Binns — Green Party · Tyldesley &amp; Mosley Common</span>
          <span>Data processed under GDPR. For campaign use only. Do not leave in public places.</span>
        </div>

        {/* Session Summary */}
        <div style={{ marginTop: '12px', border: '1px solid #d1d5db', borderRadius: '6px', padding: '10px 14px', fontSize: '11px' }}>
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