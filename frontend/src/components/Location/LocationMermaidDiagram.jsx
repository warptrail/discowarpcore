import { useEffect, useId, useRef, useState } from 'react';
import * as A from './LocationAtlas.styles';
import * as S from './Location.styles';

let renderer;
async function getRenderer() {
  if (!renderer) renderer = import('mermaid').then(({ default: mermaid }) => {
    mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'base',
      flowchart: { htmlLabels: false, useMaxWidth: false, padding: 12, diagramPadding: 24, nodeSpacing: 28, rankSpacing: 56 },
      themeVariables: { background: '#080e17', primaryColor: '#192637', primaryTextColor: '#edf3fa',
        primaryBorderColor: '#80dfff', lineColor: '#93a7be', fontFamily: 'Avenir Next, Segoe UI, sans-serif', fontSize: '14px' },
    });
    return mermaid;
  });
  return renderer;
}

export default function LocationMermaidDiagram({ locations, source }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [rendered, setRendered] = useState({ svg: '', width: 320, source: '' });
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef(null);
  useEffect(() => {
    let cancelled = false;
    if (!locations.length) return;
    setError('');
    getRenderer().then(async (mermaid) => {
      if (cancelled) return;
      const { svg } = await mermaid.render(`location-chart-${id}`, source);
      if (cancelled) return;
      const document = new DOMParser().parseFromString(svg, 'image/svg+xml');
      const width = Number(document.documentElement.getAttribute('viewBox')?.split(/\s+/)[2]) || 320;
      setRendered({ svg, width, source });
    }).catch((failure) => {
      if (!cancelled) setError(failure?.message || 'Could not draw the location chart.');
    });
    return () => { cancelled = true; };
  }, [id, locations.length, source]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) canvas.scrollLeft = Math.max(0, (canvas.scrollWidth - canvas.clientWidth) / 2);
  }, [rendered.source]);

  return <>
    <A.DiagramControls role="group" aria-label="Diagram zoom">
      <A.ToolButton type="button" title="Zoom out" aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(0.5, value - 0.25))} disabled={zoom <= 0.5}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6M7 10h6" /></svg>
      </A.ToolButton>
      <A.ToolButton type="button" title="Reset zoom" aria-label="Reset zoom" onClick={() => setZoom(1)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7a8 8 0 1 1-1 9M3 3v5h5" /></svg>
      </A.ToolButton>
      <A.ToolButton type="button" title="Zoom in" aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(2, value + 0.25))} disabled={zoom >= 2}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6M7 10h6M10 7v6" /></svg>
      </A.ToolButton>
      <span aria-live="polite">{Math.round(zoom * 100)}%</span>
      <A.DiagramHint><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 6-6 6 6 6m10-12 6 6-6 6M1 12h22" /></svg>Swipe sideways</A.DiagramHint>
    </A.DiagramControls>
    {error ? <S.Message $error role="alert">{error} Saved locations and the Mermaid export remain available.</S.Message>
      : rendered.source !== source ? <S.Text role="status">Drawing the hierarchy…</S.Text>
        : <A.Diagram ref={canvasRef} tabIndex={0} role="img" aria-label="House location hierarchy showing rooms, vicinities, specifics and exact spots. Scroll to explore the chart.">
          <div style={{ width: rendered.width * zoom, marginInline: 'auto', padding: '24px', boxSizing: 'content-box' }} dangerouslySetInnerHTML={{ __html: rendered.svg }} />
        </A.Diagram>}
    <A.Source><summary>Mermaid source</summary><pre>{source}</pre></A.Source>
  </>;
}
