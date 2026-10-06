import styled from 'styled-components';
import ConfigurationJsonReference from './ConfigurationJsonReference';

const Guide = styled.section`
  display: grid;
  gap: 0.55rem;
  min-width: 0;
  padding: 0.82rem;
  border: 1px solid var(--dw-border);
  border-radius: var(--dw-radius-sm);
  background: var(--dw-surface);
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
  color: var(--dw-text);
  font-size: 0.9rem;
  letter-spacing: 0.01em;
  text-transform: none;
`;

const GuideHint = styled.span`
  color: var(--dw-text-muted);
  font-size: 0.72rem;
`;

const GuideDetails = styled.details`
  min-width: 0;
  max-width: 100%;
  border-top: 1px solid var(--dw-border);
  padding-top: 0.55rem;

  summary {
    min-height: 40px;
    min-width: 0;
    max-width: 100%;
    display: flex;
    align-items: center;
    cursor: pointer;
    color: var(--dw-text-secondary);
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
    color: var(--dw-text-secondary);
    font-size: 0.78rem;
    line-height: 1.52;
    overflow-wrap: anywhere;
  }

  code,
  pre {
    color: #c9f1dd;
    font-family: var(--dw-font-ui);
    overflow-wrap: anywhere;
  }

  pre {
    box-sizing: border-box;
    max-width: 100%;
    overflow-x: auto;
    margin: 0.5rem 0 0;
    padding: 0.68rem;
    border: 1px solid var(--dw-border);
    border-radius: var(--dw-radius-sm);
    background: var(--dw-surface);
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
  color: var(--dw-text-secondary);
  font-size: 0.78rem;
  line-height: 1.5;
`;

export default function ConfigurationGuide() {
  return (
      <Guide id="operator-guide">
        <GuideHeader>
          <GuideTitle>Operator guide · what actually happens</GuideTitle>
          <GuideHint>Stage → review → validate → import</GuideHint>
        </GuideHeader>
        <Note>Use JSON for items without images, AI intake package for a photo ZIP, or Text upload
          for basic names. JSON and ZIP uploads only stage a batch: review its destination in
          Existing batches, validate, then import. Text upload creates items directly.</Note>
        <GuideDetails>
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
              <pre>{`DISCO_API_BASE=http://localhost:7610 npm run intake:tui`}</pre>
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
          <summary>What JSON is accepted? · Complete field reference</summary>
          <ConfigurationJsonReference />
        </GuideDetails>
        <GuideDetails>
          <summary>Production, LAN, and SSH-tunnel safety</summary>
          <Note>Inventory mutations go through the backend HTTP API. The TUI never writes MongoDB directly. For local development, explicitly target <code>http://localhost:7610</code>. For a LAN host, set the real private hostname; for an SSH tunnel, forward the backend port and keep the TUI pointed at localhost.</Note>
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

  );
}
