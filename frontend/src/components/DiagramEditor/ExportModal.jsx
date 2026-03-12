import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';

const FORMATS = [
  { id: 'pdf',  label: 'PDF',  icon: '📄', desc: 'Portable Document Format' },
  { id: 'png',  label: 'PNG',  icon: '🖼️', desc: 'High-res image' },
  { id: 'svg',  label: 'SVG',  icon: '✏️', desc: 'Vector graphic' },
  { id: 'json', label: 'JSON', icon: '📦', desc: 'Save/share diagram data' },
];

const PAPER_SIZES = ['Letter', 'Legal', 'Tabloid', 'A4', 'A3', 'A2', 'A1', 'A0'];
const ORIENTATIONS = ['Landscape', 'Portrait'];

export default function ExportModal({ canvas, diagramName, onClose }) {
  const [format, setFormat]       = useState('pdf');
  const [paperSize, setPaperSize] = useState('Letter');
  const [orientation, setOr]      = useState('Landscape');
  const [title, setTitle]         = useState(diagramName || 'Electrical Diagram');
  const [drawnBy, setDrawnBy]     = useState('');
  const [projectNo, setProjectNo] = useState('');
  const [revNo, setRevNo]         = useState('Rev 1');
  const [scale, setScale]         = useState('100');
  const [includeTitle, setInclude]= useState(true);
  const [exporting, setExporting] = useState(false);

  const doExport = async () => {
    if (!canvas) return;
    setExporting(true);
    try {
      if (format === 'json') {
        const json = JSON.stringify(canvas.toJSON(['symbolId', 'isWire', 'label', 'standards']), null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        saveAs(blob, `${title.replace(/\s+/g, '_')}.json`);
      } else if (format === 'png') {
        const dataUrl = canvas.toDataURL({ format: 'png', multiplier: Number(scale) / 100 * 2 });
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `${title.replace(/\s+/g, '_')}.png`;
        a.click();
      } else if (format === 'svg') {
        const svgStr = canvas.toSVG();
        const blob = new Blob([svgStr], { type: 'image/svg+xml' });
        saveAs(blob, `${title.replace(/\s+/g, '_')}.svg`);
      } else if (format === 'pdf') {
        // Determine paper dimensions (in mm)
        const sizes = {
          'Letter':  [279.4, 215.9], 'Legal':   [355.6, 215.9],
          'Tabloid': [431.8, 279.4], 'A4':      [297, 210],
          'A3':      [420, 297],     'A2':      [594, 420],
          'A1':      [841, 594],     'A0':      [1189, 841],
        };
        const [w, h] = sizes[paperSize] || sizes['Letter'];
        const [pw, ph] = orientation === 'Landscape' ? [w, h] : [h, w];

        const pdf = new jsPDF({
          orientation: orientation === 'Landscape' ? 'landscape' : 'portrait',
          unit: 'mm',
          format: [pw, ph],
        });

        // Title block (bottom strip)
        const tbH = includeTitle ? 28 : 0;
        const margin = 10;
        const drawArea = { x: margin, y: margin, w: pw - margin * 2, h: ph - margin * 2 - tbH };

        // Export canvas image
        const imgData = canvas.toDataURL({ format: 'jpeg', quality: 0.92, multiplier: 2 });
        pdf.addImage(imgData, 'JPEG', drawArea.x, drawArea.y, drawArea.w, drawArea.h);

        // Title block
        if (includeTitle) {
          const tbY = ph - margin - tbH;
          pdf.setDrawColor(40, 40, 80);
          pdf.setFillColor(240, 242, 248);
          pdf.rect(margin, tbY, pw - margin * 2, tbH, 'FD');

          // Border lines
          pdf.setDrawColor(100, 100, 160);
          pdf.line(margin, tbY, pw - margin, tbY);

          // Logo / company area
          pdf.setFontSize(14);
          pdf.setTextColor(40, 40, 80);
          pdf.setFont(undefined, 'bold');
          pdf.text('MES Electrical', margin + 4, tbY + 8);
          pdf.setFontSize(8);
          pdf.setFont(undefined, 'normal');
          pdf.setTextColor(80, 80, 120);
          pdf.text('Electrical Contractor', margin + 4, tbY + 13);

          // Dividers
          const colW = (pw - margin * 2) / 6;
          [1, 2, 3, 4, 5].forEach(i => {
            pdf.line(margin + colW * i, tbY, margin + colW * i, tbY + tbH);
          });

          // Fields
          const fields = [
            ['PROJECT', projectNo || '—'],
            ['DIAGRAM', title],
            ['DRAWN BY', drawnBy || '—'],
            ['DATE', new Date().toLocaleDateString()],
            ['REVISION', revNo || 'Rev 1'],
          ];
          fields.forEach((f, i) => {
            const x = margin + colW * (i + 1) + 4;
            pdf.setFontSize(7);
            pdf.setTextColor(100, 100, 150);
            pdf.text(f[0], x, tbY + 7);
            pdf.setFontSize(9);
            pdf.setTextColor(30, 30, 60);
            pdf.setFont(undefined, 'bold');
            pdf.text(f[1], x, tbY + 14);
            pdf.setFont(undefined, 'normal');
          });

          // Page indicator
          pdf.setFontSize(9);
          pdf.setTextColor(30, 30, 60);
          pdf.text('1 / 1', pw - margin - colW + colW / 2, tbY + tbH / 2, { align: 'center' });
        }

        pdf.save(`${title.replace(/\s+/g, '_')}.pdf`);
      }
    } catch (err) {
      console.error('Export failed:', err);
    }
    setExporting(false);
    onClose();
  };

  return (
    <div className="de-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="de-modal">
        <div className="de-modal-header">
          <span className="de-modal-title">Export Diagram</span>
          <button className="de-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="de-modal-body">

          {/* Format selector */}
          <div className="de-form-group">
            <label className="de-form-label">Format</label>
            <div className="de-export-format-grid">
              {FORMATS.map(f => (
                <button
                  key={f.id}
                  className={`de-export-format-btn${format === f.id ? ' selected' : ''}`}
                  onClick={() => setFormat(f.id)}
                >
                  <span className="de-export-format-icon">{f.icon}</span>
                  <span>{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* PDF options */}
          {format === 'pdf' && (
            <>
              <div className="de-form-row">
                <div className="de-form-group">
                  <label className="de-form-label">Paper size</label>
                  <select className="de-form-input" value={paperSize} onChange={e => setPaperSize(e.target.value)}>
                    {PAPER_SIZES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="de-form-group">
                  <label className="de-form-label">Orientation</label>
                  <select className="de-form-input" value={orientation} onChange={e => setOr(e.target.value)}>
                    {ORIENTATIONS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              <div className="de-form-group">
                <label className="de-form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={includeTitle} onChange={e => setInclude(e.target.checked)} />
                  Include title block
                </label>
              </div>

              {includeTitle && (
                <>
                  <div className="de-form-row">
                    <div className="de-form-group">
                      <label className="de-form-label">Diagram title</label>
                      <input className="de-form-input" value={title} onChange={e => setTitle(e.target.value)} />
                    </div>
                    <div className="de-form-group">
                      <label className="de-form-label">Project #</label>
                      <input className="de-form-input" value={projectNo} onChange={e => setProjectNo(e.target.value)} placeholder="e.g. MES-2024-001" />
                    </div>
                  </div>
                  <div className="de-form-row">
                    <div className="de-form-group">
                      <label className="de-form-label">Drawn by</label>
                      <input className="de-form-input" value={drawnBy} onChange={e => setDrawnBy(e.target.value)} placeholder="Initials or name" />
                    </div>
                    <div className="de-form-group">
                      <label className="de-form-label">Revision</label>
                      <input className="de-form-input" value={revNo} onChange={e => setRevNo(e.target.value)} placeholder="Rev 1" />
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* PNG scale */}
          {format === 'png' && (
            <div className="de-form-group">
              <label className="de-form-label">Scale ({scale}%)</label>
              <input type="range" min="50" max="300" step="50" value={scale}
                onChange={e => setScale(e.target.value)}
                style={{ width: '100%' }} />
            </div>
          )}

        </div>
        <div className="de-modal-footer">
          <button className="de-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="de-btn-primary" onClick={doExport} disabled={exporting}>
            {exporting ? 'Exporting…' : `Export ${format.toUpperCase()}`}
          </button>
        </div>
      </div>
    </div>
  );
}
