import { useEffect, useId, useMemo, useState } from 'react';
import styled from 'styled-components';
import { buildLocationMermaid } from './locationHierarchy';
import * as S from './Location.styles';
import LocationMapLegend from './LocationMapLegend';

const Canvas = styled.div`
  min-width: 0; max-width: 100%; max-height: 360px; overflow: auto;
  background: radial-gradient(circle, var(--dw-border-soft) 0.6px, transparent 0.8px) 0 0 / 16px 16px, var(--dw-background); border: 1px solid var(--dw-border-soft); border-radius: var(--dw-radius-sm);
  svg { display: block; width: 100%; height: auto; max-width: none !important; }
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: 2px; }
`;
const ChartPanel = styled(S.Panel)`
  padding: 0.65rem;
  gap: 0.45rem;
`;
const ChartActions = styled(S.Actions)`
  gap: 0.35rem;
  button, a { padding: 0.4rem 0.55rem; font-size: 0.78rem; }
`;
const Source = styled.details`
  min-width: 0;
  summary { cursor: pointer; min-height: 32px; font-size: 0.78rem; display: flex; align-items: center; color: var(--dw-text-secondary); }
  @media (pointer: coarse) { summary { min-height: 44px; } }
  pre { margin: 0; padding: 0.75rem; overflow: auto; max-height: 250px; font: 0.75rem/1.5 var(--dw-font-data); background: var(--dw-background); }
`;
let renderer;
async function getRenderer() {
  if (!renderer) renderer = import('mermaid').then(({ default: mermaid }) => {
    mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'base',
      flowchart: { htmlLabels: false, useMaxWidth: false, padding: 6, diagramPadding: 6, nodeSpacing: 16, rankSpacing: 22 },
      themeVariables: { background: '#080e17', primaryColor: '#192637', primaryTextColor: '#edf3fa',
        primaryBorderColor: '#80dfff', lineColor: '#93a7be', fontFamily: 'Avenir Next, Segoe UI, sans-serif', fontSize: '13px' },
    });
    return mermaid;
  });
  return renderer;
}

export default function LocationHierarchyChart({ locations }) {
  const source = useMemo(() => buildLocationMermaid(locations), [locations]);
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [rendered, setRendered] = useState({ svg: '', width: 320, source: '' });
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(1);
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

  return (
    <ChartPanel>
      <S.PanelHeader><h2>House atlas</h2><S.Text>Overview → exact placement</S.Text></S.PanelHeader>
      <LocationMapLegend locations={locations} />
      <S.Text>Arrows show containment. Spacing does not represent distance or room adjacency.</S.Text>
      {!locations.length ? <S.Text>Your map will appear when you add a location.</S.Text> : <>
        <ChartActions>
          <S.Button type="button" onClick={() => setZoom((value) => Math.max(0.5, value - 0.25))} disabled={zoom <= 0.5}>Zoom out</S.Button>
          <S.Button type="button" onClick={() => setZoom(1)}>Reset zoom</S.Button>
          <S.Button type="button" onClick={() => setZoom((value) => Math.min(2, value + 0.25))} disabled={zoom >= 2}>Zoom in</S.Button>
          <S.Button as="a" href={`data:text/plain;charset=utf-8,${encodeURIComponent(source)}`} download="house-locations.mmd">Download Mermaid</S.Button>
        </ChartActions>
        {error ? <S.Message $error role="alert">{error} You can still use the saved locations and Mermaid source below.</S.Message> :
          rendered.source !== source ? <S.Text role="status">Drawing the hierarchy…</S.Text> :
            <Canvas tabIndex={0} role="img" aria-label="House location hierarchy showing rooms, vicinities, specifics and exact spots. Scroll to explore the chart.">
              <div style={{ width: rendered.width * zoom, maxWidth: zoom <= 1 ? '100%' : undefined, marginInline: 'auto' }} dangerouslySetInnerHTML={{ __html: rendered.svg }} />
            </Canvas>}
        <Source><summary>Mermaid source</summary><pre>{source}</pre></Source>
      </>}
    </ChartPanel>
  );
}
