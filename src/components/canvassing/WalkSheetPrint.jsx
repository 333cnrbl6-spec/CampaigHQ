/**
 * WalkSheetPrint
 * Renders a walk sheet preview with a built-in "Download PDF" button
 * using jsPDF — no browser print dialog, no blank page issues.
 */
import { useRef, useState } from 'react';
import jsPDF from 'jspdf';

const SUPPORT_LABELS = {
  strong_supporter: { label: 'Strong Support', color: '#16a34a' },
  leaning:          { label: 'Leaning',         color: '#3b82f6' },
  undecided:        { label: 'Undecided',        color: '#d97706' },
  opposed:          { label: 'Opposed',          color: '#dc2626' },
  unknown:          { label: '',                 color: '#9ca3af' },
};

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

export default function WalkSheetPrint({ stops, title, date, onClose }) {
  const [generating, setGenerating] = useState(false);
  const today = date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const generatePDF = () => {
    setGenerating(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = 210;
      const margin = 12;
      const usableW = pageW - margin * 2;
      let y = 14;

      // ── Header ──────────────────────────────────────────────────────────
      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(20, 83, 45);
      doc.text('Paul Binns — Green Party', margin, y);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(22, 101, 52);
      doc.text('Canvassing Walk Sheet', margin, y + 5);

      // Right side meta
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      const rightX = pageW - margin;
      doc.text(`Date: ${today}`, rightX, y, { align: 'right' });
      doc.text(`Route: ${title || 'Canvassing Route'}`, rightX, y + 5, { align: 'right' });
      doc.text(`Stops: ${stops.length}`, rightX, y + 10, { align: 'right' });
      doc.text('Volunteer: ____________________________', rightX, y + 15, { align: 'right' });

      y += 20;
      doc.setDrawColor(22, 101, 52);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageW - margin, y);
      y += 5;

      // ── Legend ───────────────────────────────────────────────────────────
      doc.setFontSize(8);
      doc.setTextColor(55, 65, 81);
      doc.setFont('helvetica', 'bold');
      doc.text('Outcome codes:', margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text('✓ = Spoken to    ⟳ = Call back    ? = No answer    ✗ = Refused', margin + 28, y);
      doc.setFont('helvetica', 'bold');
      doc.text('Support: S=Strong  L=Leaning  U=Undecided  O=Opposed', pageW - margin, y, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      y += 7;

      // ── Table header ─────────────────────────────────────────────────────
      const cols = {
        num:     { x: margin,      w: 8 },
        name:    { x: margin + 8,  w: 36 },
        address: { x: margin + 44, w: 62 },
        current: { x: margin + 106, w: 24 },
        out:     { x: margin + 130, w: 10 },
        support: { x: margin + 140, w: 14 },
        notes:   { x: margin + 154, w: usableW - 154 },
      };

      const drawTableHeader = (startY) => {
        doc.setFillColor(240, 253, 244);
        doc.rect(margin, startY - 4, usableW, 7, 'F');
        doc.setDrawColor(22, 101, 52);
        doc.setLineWidth(0.4);
        doc.line(margin, startY + 3, pageW - margin, startY + 3);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(22, 101, 52);
        doc.text('#',       cols.num.x + cols.num.w / 2,     startY, { align: 'center' });
        doc.text('Name',    cols.name.x,                      startY);
        doc.text('Address', cols.address.x,                   startY);
        doc.text('Current', cols.current.x,                   startY);
        doc.text('Out',     cols.out.x + cols.out.w / 2,      startY, { align: 'center' });
        doc.text('Supp.',   cols.support.x + cols.support.w / 2, startY, { align: 'center' });
        doc.text('Notes',   cols.notes.x,                     startY);
        return startY + 5;
      };

      y = drawTableHeader(y);

      // ── Rows ─────────────────────────────────────────────────────────────
      const rowH = 8;
      stops.forEach((stop, idx) => {
        // New page check
        if (y + rowH > 270) {
          doc.addPage();
          y = 14;
          y = drawTableHeader(y);
        }

        const c = stop.contact || stop;
        const num = stop.stopNumber ?? idx + 1;
        const sl = SUPPORT_LABELS[c.support_level] || SUPPORT_LABELS.unknown;
        const isShaded = idx % 2 === 1;

        // Row background
        if (isShaded) {
          doc.setFillColor(249, 250, 251);
          doc.rect(margin, y - 3, usableW, rowH, 'F');
        }

        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.2);
        doc.line(margin, y + rowH - 3, pageW - margin, y + rowH - 3);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(22, 101, 52);
        doc.text(String(num), cols.num.x + cols.num.w / 2, y, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(31, 41, 55);
        // Truncate long names/addresses to fit
        const nameText = doc.splitTextToSize(c.name || '', cols.name.w - 2)[0] || '';
        doc.text(nameText, cols.name.x, y);

        const addrFull = [c.address, c.postcode].filter(Boolean).join('  ');
        const addrText = doc.splitTextToSize(addrFull, cols.address.w - 2)[0] || '';
        doc.text(addrText, cols.address.x, y);

        // Support badge
        if (sl.label) {
          const rgb = hexToRgb(sl.color);
          doc.setFillColor(...rgb);
          const badgeW = 22;
          doc.roundedRect(cols.current.x, y - 3, badgeW, 5, 1, 1, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6.5);
          doc.setTextColor(255, 255, 255);
          doc.text(sl.label, cols.current.x + badgeW / 2, y, { align: 'center' });
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
        }
        if (c.canvassed) {
          doc.setFontSize(6);
          doc.setTextColor(156, 163, 175);
          doc.text('prev. canvassed', cols.current.x, y + 3.5);
          doc.setFontSize(8);
        }

        // Outcome checkbox
        doc.setDrawColor(156, 163, 175);
        doc.setLineWidth(0.4);
        doc.rect(cols.out.x + 1, y - 3, 5, 5);

        // Support fill box
        doc.rect(cols.support.x + 1, y - 3, 7, 5);

        // Notes line
        doc.setDrawColor(156, 163, 175);
        doc.setLineWidth(0.3);
        doc.line(cols.notes.x, y + 2, cols.notes.x + cols.notes.w - 2, y + 2);

        y += rowH;
      });

      // ── Footer ───────────────────────────────────────────────────────────
      y += 6;
      if (y > 255) { doc.addPage(); y = 14; }
      doc.setDrawColor(209, 213, 219);
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageW - margin, y);
      y += 4;
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text('Paul Binns — Green Party · Tyldesley & Mosley Common', margin, y);
      doc.text('Data processed under GDPR. For campaign use only. Do not leave in public places.', pageW - margin, y, { align: 'right' });

      // ── Session Summary Box ───────────────────────────────────────────────
      y += 8;
      if (y > 250) { doc.addPage(); y = 14; }
      doc.setDrawColor(209, 213, 219);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, y, usableW, 38, 2, 2);
      y += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(22, 101, 52);
      doc.text('Session Summary (complete after canvassing)', margin + 3, y);
      y += 6;
      const summaryFields = ['Doors knocked', 'Spoken to', 'No answer', 'Time out'];
      const colW = usableW / 4;
      summaryFields.forEach((label, i) => {
        const sx = margin + 3 + i * colW;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(107, 114, 128);
        doc.text(label, sx, y);
        doc.setDrawColor(55, 65, 81);
        doc.setLineWidth(0.5);
        doc.line(sx, y + 6, sx + colW - 6, y + 6);
      });
      y += 12;
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text('General notes / issues raised:', margin + 3, y);
      y += 5;
      for (let i = 0; i < 3; i++) {
        doc.setDrawColor(156, 163, 175);
        doc.setLineWidth(0.2);
        doc.line(margin + 3, y, pageW - margin - 3, y);
        y += 6;
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
            padding: 24px 32px;
          }
        }
        .ws-row { page-break-inside: avoid; }
      `}</style>

      <div id="walk-sheet-root">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-5 pb-3 border-b gap-4">
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
            <button
              onClick={onClose}
              className="text-xs px-3 py-2 border rounded-md hover:bg-gray-100 text-gray-600"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Visual preview table */}
        <table style={{ width: '100%', borderBottom: '2px solid #166534', marginBottom: '10px' }}>
          <tbody>
            <tr>
              <td style={{ verticalAlign: 'top' }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#14532d' }}>🌿 Paul Binns — Green Party</div>
                <div style={{ fontSize: '13px', color: '#166534', marginTop: '2px' }}>Canvassing Walk Sheet</div>
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

        <div style={{ display: 'flex', gap: '16px', fontSize: '10px', color: '#374151', marginBottom: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600 }}>Outcome codes:</span>
          {[['✓','Spoken to'],['⟳','Call back'],['?','No answer'],['✗','Refused']].map(([code, desc]) => (
            <span key={code}><strong>{code}</strong> = {desc}</span>
          ))}
          <span style={{ fontWeight: 600, marginLeft: 'auto' }}>Support: S = Strong · L = Leaning · U = Undecided · O = Opposed</span>
        </div>

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
                <tr key={c.id || idx} className="ws-row" style={{ background: isShaded ? '#f9fafb' : 'white', borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '5px 6px', textAlign: 'center', fontWeight: 700, color: '#166534' }}>{num}</td>
                  <td style={{ padding: '5px 6px', fontWeight: 500 }}>{c.name}</td>
                  <td style={{ padding: '5px 6px', color: '#374151' }}>
                    {c.address}
                    {c.postcode && <span style={{ color: '#6b7280', marginLeft: '4px', fontFamily: 'monospace' }}>{c.postcode}</span>}
                  </td>
                  <td style={{ padding: '5px 6px', textAlign: 'center' }}>
                    {sl.label && (
                      <span style={{ display: 'inline-block', padding: '1px 5px', borderRadius: '4px', fontSize: '9px', fontWeight: 700, color: 'white', background: sl.color, whiteSpace: 'nowrap' }}>
                        {sl.label}
                      </span>
                    )}
                    {c.canvassed && <span style={{ fontSize: '9px', color: '#6b7280', display: 'block' }}>prev. canvassed</span>}
                  </td>
                  <td style={{ padding: '5px 6px', textAlign: 'center' }}>
                    <div style={{ width: '22px', height: '22px', border: '1.5px solid #9ca3af', borderRadius: '3px', display: 'inline-block' }} />
                  </td>
                  <td style={{ padding: '5px 6px', textAlign: 'center' }}>
                    <div style={{ width: '34px', height: '20px', border: '1px solid #9ca3af', borderRadius: '3px', display: 'inline-block' }} />
                  </td>
                  <td style={{ padding: '5px 6px' }}>
                    <div style={{ borderBottom: '1px dotted #9ca3af', minWidth: '80px', height: '18px' }} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div style={{ marginTop: '16px', borderTop: '1px solid #d1d5db', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#9ca3af' }}>
          <span>Paul Binns — Green Party · Tyldesley &amp; Mosley Common</span>
          <span>Data processed under GDPR. For campaign use only. Do not leave in public places.</span>
        </div>

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