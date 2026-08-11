import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import BulkImportAiJsonPanel from './BulkImportAiJsonPanel';

const Wrap = styled.div`
  display: grid;
  gap: 1rem;
  min-width: 0;
`;

const Hero = styled.section`
  border: 1px solid rgba(92, 158, 181, 0.44);
  border-radius: 10px;
  background: rgba(9, 17, 25, 0.92);
  box-shadow: inset 0 1px 0 rgba(180, 224, 235, 0.07);
  padding: clamp(1rem, 2.4vw, 1.5rem);
  display: grid;
  gap: 0.64rem;
`;

const Eyebrow = styled.div`
  color: #8fd2d0;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
`;

const Title = styled.h1`
  margin: 0;
  max-width: 15ch;
  font-size: clamp(1.45rem, 4vw, 2.35rem);
  line-height: 1.02;
  letter-spacing: -0.035em;
  color: #ecf8ff;
`;

const IntroText = styled.p`
  margin: 0;
  max-width: 72ch;
  color: #abc3d2;
  font-size: 0.88rem;
  line-height: 1.45;
`;

const RouteGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.62rem;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const RouteCard = styled.a`
  display: grid;
  gap: 0.34rem;
  min-height: 9.2rem;
  padding: 0.78rem;
  border: 1px solid ${({ $recommended }) => ($recommended ? 'rgba(101, 202, 171, 0.62)' : 'rgba(99, 151, 182, 0.36)')};
  border-radius: 9px;
  background: ${({ $recommended }) => ($recommended ? 'rgba(14, 44, 38, 0.78)' : 'rgba(12, 24, 34, 0.78)')};
  color: inherit;
  text-decoration: none;
  transition: border-color 180ms ease, transform 180ms ease, background 180ms ease;

  &:hover,
  &:focus-visible {
    border-color: rgba(151, 220, 226, 0.82);
    background: rgba(18, 40, 52, 0.94);
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid rgba(151, 220, 226, 0.48);
    outline-offset: 2px;
  }
`;

const RouteKicker = styled.div`
  color: ${({ $recommended }) => ($recommended ? '#9ff0cf' : '#9dbbd0')};
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.11em;
  text-transform: uppercase;
`;

const RouteTitle = styled.h2`
  margin: 0;
  color: #e8f4fb;
  font-size: 0.95rem;
`;

const RouteText = styled.p`
  margin: 0;
  color: #a6bfce;
  font-size: 0.76rem;
  line-height: 1.4;
`;

const RouteAction = styled.span`
  align-self: end;
  color: #bfe6e6;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.04em;
`;

const Guide = styled.section`
  display: grid;
  gap: 0.55rem;
  min-width: 0;
  padding: 0.82rem;
  border: 1px solid rgba(104, 150, 174, 0.3);
  border-radius: 10px;
  background: rgba(8, 16, 24, 0.72);
`;

const GuideHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.8rem;
  flex-wrap: wrap;
  min-width: 0;
`;

const GuideTitle = styled.h2`
  margin: 0;
  color: #dceefa;
  font-size: 0.9rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const GuideHint = styled.span`
  color: #8faabd;
  font-size: 0.72rem;
`;

const GuideDetails = styled.details`
  min-width: 0;
  max-width: 100%;
  border-top: 1px solid rgba(104, 150, 174, 0.2);
  padding-top: 0.55rem;

  summary {
    min-height: 40px;
    min-width: 0;
    max-width: 100%;
    display: flex;
    align-items: center;
    cursor: pointer;
    color: #cfe5f1;
    font-size: 0.82rem;
    font-weight: 700;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  > *:not(summary) {
    min-width: 0;
    max-width: 100%;
  }

  p,
  li {
    color: #9db7c8;
    font-size: 0.78rem;
    line-height: 1.52;
    overflow-wrap: anywhere;
  }

  code,
  pre {
    color: #c9f1dd;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    overflow-wrap: anywhere;
  }

  pre {
    box-sizing: border-box;
    max-width: 100%;
    overflow-x: auto;
    margin: 0.5rem 0 0;
    padding: 0.68rem;
    border: 1px solid rgba(96, 152, 189, 0.28);
    border-radius: 7px;
    background: rgba(3, 8, 13, 0.72);
    font-size: 0.72rem;
    line-height: 1.45;
  }
`;

const GuideColumns = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  min-width: 0;

  > * {
    min-width: 0;
  }

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }
`;

const Note = styled.p`
  margin: 0.54rem 0 0;
  color: #9db7c8;
  font-size: 0.78rem;
  line-height: 1.5;
`;

export default function BulkImportPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const linkedBatchId = String(searchParams.get('batch') || '').trim();

  const syncBatchParam = useCallback((nextBatchId) => {
    const normalizedBatchId = String(nextBatchId || '').trim();
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (normalizedBatchId) {
        next.set('batch', normalizedBatchId);
      } else {
        next.delete('batch');
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const clearInvalidBatchParam = useCallback((invalidBatchId) => {
    const normalizedBatchId = String(invalidBatchId || '').trim();
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (String(next.get('batch') || '').trim() === normalizedBatchId) {
        next.delete('batch');
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  return (
    <Wrap>
      <Hero>
        <Eyebrow>Inventory intake · choose a route</Eyebrow>
        <Title>AI Bulk Import</Title>
        <IntroText>
          Bring a shelf, box, or pile of things into Disco Warp Core. Choose the least technical
          path that fits your source, then follow the same safe sequence: stage, validate, import.
        </IntroText>
        <IntroText>
          Nothing is written to inventory during staging or validation. Import is the deliberate
          final step.
        </IntroText>

        <RouteGrid aria-label="Import routes">
          <RouteCard href="#operator-guide" $recommended>
            <RouteKicker $recommended>Recommended · many photos</RouteKicker>
            <RouteTitle>AI photo intake</RouteTitle>
            <RouteText>Use the local wizard to process photos, let Codex fill item JSON, and send a validated package.</RouteText>
            <RouteAction>Read the walkthrough ↓</RouteAction>
          </RouteCard>
          <RouteCard href="#ai-workbench">
            <RouteKicker>Manual package</RouteKicker>
            <RouteTitle>Upload a ZIP or JSON</RouteTitle>
            <RouteText>Already have an export? Stage it here, review the batch, validate it, then import.</RouteText>
            <RouteAction>Open upload workbench ↓</RouteAction>
          </RouteCard>
          <RouteCard href="#simple-text-upload">
            <RouteKicker>Fast fallback</RouteKicker>
            <RouteTitle>One name per line</RouteTitle>
            <RouteText>Use plain text when you only need basic item records and do not need AI descriptions or images.</RouteText>
            <RouteAction>Jump to text upload ↓</RouteAction>
          </RouteCard>
        </RouteGrid>
      </Hero>

      <Guide id="operator-guide">
        <GuideHeader>
          <GuideTitle>Operator guide · what actually happens</GuideTitle>
          <GuideHint>Written for a brand-new dummy user</GuideHint>
        </GuideHeader>
        <GuideDetails open>
          <summary>AI photo intake: the complete local workflow</summary>
          <GuideColumns>
            <div>
              <Note><strong>1. Put source photos in the inbox.</strong> The wizard uses a private local workspace so the originals remain recoverable.</Note>
              <pre>{`~/Intake/
  inbox/        ← put raw photos here
  processing/   ← active batch workspace
  completed/    ← successful archives
  exports/      ← ZIPs for manual upload`}</pre>
              <Note><strong>2. Start the wizard from the repository root.</strong></Note>
              <pre>{`npm run intake:tui`}</pre>
              <Note>Choose a batch name, optional location/box, and an import mode. <code>Direct database import</code> sends the package through the backend API; <code>Export zip only</code> leaves you with a ZIP for this page; <code>Validate/package only</code> stops before import.</Note>
            </div>
            <div>
              <Note><strong>3. Let the wizard prepare the batch.</strong> It preprocesses images, creates JSON stubs, and writes <code>CODEX_AGENT_PROMPT.md</code>.</Note>
              <Note><strong>4. Let Codex annotate only the JSON files.</strong> The prompt tells Codex to inspect processed images and fill practical fields. It must not rename, move, delete, or copy images, call APIs, or write into backend media folders.</Note>
              <Note><strong>5. Return to the wizard and continue.</strong> Validation checks image/JSON pairing, valid JSON, required <code>imageKey</code>/<code>name</code>, duplicate keys, and destination warnings. A failed validation does not package or import.</Note>
              <Note><strong>6. Package, then import.</strong> A package contains <code>batch_manifest.json</code> and referenced files under <code>images/</code>. On this page, stage it first; open the selected batch; review its destination; validate; then choose Import.</Note>
            </div>
          </GuideColumns>
        </GuideDetails>
        <GuideDetails>
          <summary>What JSON is accepted?</summary>
          <Note>The simplest valid payload is an object containing a non-empty <code>items</code> array. Each item needs only <code>name</code>; description, category, tags, quantity, imageKey, location, and box are optional. The page normalizes missing quantity to 1 and unknown categories to miscellaneous.</Note>
          <pre>{`{
  "batchContext": { "location": "garage", "box": "701" },
  "items": [
    { "name": "Hammer", "category": "tools", "quantity": 1 },
    { "name": "Screwdriver set", "tags": ["hand tool"] }
  ]
}`}</pre>
          <Note>Accepted outer shapes are a direct payload, <code>{'{ payload: { items: [...] } }'}</code>, or JSON text containing one of those. A missing or empty <code>items</code> array, a non-object item, or a missing item name blocks validation.</Note>
        </GuideDetails>
        <GuideDetails>
          <summary>Production, LAN, and SSH-tunnel safety</summary>
          <Note>Inventory mutations go through the backend HTTP API. The TUI never writes MongoDB directly. In development, the default target is <code>http://localhost:5002</code>. For a LAN host, set the real private hostname; for an SSH tunnel, forward the backend port and keep the TUI pointed at localhost.</Note>
          <pre>{`# direct private-LAN API
DISCO_ENV=production DISCO_API_BASE=http://your-host.local:5002 npm run intake:tui

# SSH tunnel: terminal 1
ssh -L 5002:localhost:5002 user@your-host.local

# tunnel client: terminal 2
DISCO_ENV=production DISCO_API_BASE=http://localhost:5002 npm run intake:tui`}</pre>
        </GuideDetails>
        <GuideDetails>
          <summary>Common confusion and recovery</summary>
          <ul>
            <li><strong>“Staged” does not mean imported.</strong> Staging records a package; validation is a separate safety check; Import creates or updates inventory.</li>
            <li><strong>Images are optional for JSON-only imports.</strong> Image processing is a later, explicit operator action.</li>
            <li><strong>A missing legacy folder is not automatically data loss.</strong> Durable provenance can remain in Mongo even when the old local staging folder is gone.</li>
            <li><strong>Use Archive after success.</strong> Delete is corrective cleanup and may remove imported items and associated media.</li>
          </ul>
        </GuideDetails>
      </Guide>

      <BulkImportAiJsonPanel
        selectedBatchIdOverride={linkedBatchId}
        onSelectedBatchIdChange={syncBatchParam}
        onSelectedBatchIdInvalid={clearInvalidBatchParam}
      />
    </Wrap>
  );
}
