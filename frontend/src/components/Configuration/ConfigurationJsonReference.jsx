import styled from 'styled-components';
import { Control } from '../../styles/primitives';

const Wrap = styled.div`
  display: grid;
  gap: 1rem;
  min-width: 0;
  h3 { margin: 0.8rem 0 0; font-size: 0.95rem; color: var(--dw-text); }
  p { margin: 0; line-height: 1.6; }
  code { font-family: var(--dw-font-data); }
  pre { white-space: pre-wrap; word-break: break-word; }
`;
const Fields = styled.dl`
  margin: 0;
  display: grid;
  min-width: 0;
  > div {
    display: grid;
    grid-template-columns: minmax(130px, 0.35fr) minmax(0, 1fr);
    gap: 0.4rem 1rem;
    padding: 0.7rem 0;
    border-bottom: 1px solid var(--dw-border-soft);
  }
  dt { color: var(--dw-cyan); font-size: 0.8rem; overflow-wrap: anywhere; }
  dt span { display: block; margin-top: 0.3rem; color: var(--dw-text-muted); font: 400 0.75rem/1.5 var(--dw-font-ui); }
  dd { margin: 0; color: var(--dw-text-secondary); font-size: 0.8rem; line-height: 1.6; overflow-wrap: anywhere; }
  @media (max-width: 560px) { > div { grid-template-columns: minmax(0, 1fr); } }
`;
const Actions = styled.div`display: flex; flex-wrap: wrap; gap: 0.6rem;`;

const ITEM_FIELDS = [
  ['name', 'string · required', 'The item name. Surrounding whitespace is trimmed; an empty or missing name is rejected. Example: "Claw hammer".'],
  ['description', 'string · optional', 'Practical details such as appearance, condition, brand, dimensions, or intended use. Defaults to an empty string. Example: "Steel head, worn red rubber grip".'],
  ['category', 'string · optional', 'Use one of the category values below. Missing values become "miscellaneous"; final import lowercases the value and maps unrecognized categories to "miscellaneous".'],
  ['tags', 'array of strings · optional', 'Example: ["hand tool", "red"]. Defaults to []. Final import trims tags, drops blank entries, and removes duplicates without regard to capitalization, keeping the first spelling. A non-array becomes [].'],
  ['quantity', 'positive integer · optional', 'Example: 2. Defaults to 1. Final import also replaces zero, negative values, fractions, empty values, and nonnumeric values with 1. Numeric strings are converted, but author a JSON number.'],
  ['location', 'string or null · optional', 'A plain location label, such as "garage". An item value overrides the batch default; blank, missing, or null values inherit it. Without a default, the item location is empty. Structured room/vicinity/specifics objects are not supported here.'],
  ['box', 'string or null · optional', 'An existing box reference. Prefer exactly three digits as a string, e.g. "007", to preserve leading zeroes. An existing MongoDB ID or a unique exact box label (case-insensitive) also resolves. Blank, missing, or null inherits the batch default; without one the item is unboxed. Missing or ambiguous boxes fail that item during import; JSON validation does not prove the box exists.'],
];
const CONTEXT_FIELDS = [
  ['items', 'array of objects · required in a batch payload', 'At least one item. This array is the inventory content; each object uses the item fields above. The JSON tab also accepts one item object directly, or an array directly.'],
  ['batchContext', 'object · optional', 'Shared destination and provenance defaults for an items payload. Omit it when no shared defaults are needed.'],
  ['batchContext.location', 'string or null · optional', 'Default location for items whose own location is blank, null, or missing.'],
  ['batchContext.box', 'string or null · optional', 'Default existing box reference. Use a quoted three-digit ID. To import unboxed items, omit both the item and batch box values. Item null does not cancel a batch box default.'],
  ['batchContext.source', 'string · optional', 'Provenance label. The JSON tab defaults it to "simple_json_upload" for an items payload. A direct item or array gets that label automatically. The lower-level API defaults to "ai_json_import". Final import removes control characters, collapses whitespace, and limits this label to 120 characters.'],
  ['batchContext.itemCount', 'non-negative integer · calculated by the uploader', 'The JSON tab replaces this with the actual array length. For the lower-level API, it is optional informational metadata: invalid values or mismatched counts cause a warning, not an item-count limit.'],
  ['batchContext.destinationReviewed', 'boolean · workflow metadata', 'Records the batch destination review. The simple JSON items wrapper can retain this field. Leave it out of starter files and use the batch destination controls to record an intentional review. It is not an item attribute, and the ZIP materializer does not copy it from the manifest.'],
];
const IMAGE_FIELDS = [
  ['imageFile', 'string · required for each ZIP item', 'The image filename inside images/, e.g. "hammer_001.jpg". Use only the filename, not "images/hammer_001.jpg", a URL, or an absolute path. The referenced file must be present. Accepted extensions: .jpg, .jpeg, .png, .webp, .heic.'],
  ['sourceFile', 'string · optional alias for imageFile', 'Used when imageFile is absent or empty. Prefer imageFile for new packages.'],
  ['imageKey', 'string · optional in ZIP, supported by the lower-level API', 'The exact filename stem without the extension, e.g. "hammer_001". A ZIP derives it when omitted and rejects a supplied key that differs from the stem. Image matching is case-sensitive. Avoid duplicate stems, even across different extensions. Plain JSON uploads discard this item field and do not attach images.'],
];
const MANIFEST_FIELDS = [
  ['items', 'non-empty array · required', 'Each item uses the seven common fields plus imageFile (or sourceFile) and optional imageKey. Every item in this package format needs an image.'],
  ['app', 'string · optional', 'Must be "discowarpcore" when supplied; omission defaults to it.'],
  ['packageVersion', 'number · optional', 'Use 2. Any supplied value that does not convert to 2 is rejected.'],
  ['batchLabel', 'string · optional', 'Preferred human-readable batch name. Falls back to displayName, then batchId, then the extracted folder name.'],
  ['displayName', 'string · optional alias', 'Fallback batch label when batchLabel is empty or missing.'],
  ['batchId', 'string · optional label fallback', 'Used as a label when batchLabel and displayName are absent. It does not set the server-generated batch identity or update an existing batch.'],
  ['createdAt', 'ISO date/time string · optional', 'Package creation metadata, e.g. "2026-10-05T12:00:00Z". Defaults to the server’s current time. It does not set an inventory item’s timestamps.'],
  ['target', 'object · optional', 'Shared destination. Recognized children are location and box, using the same string/null types as the common item fields.'],
  ['target.location / target.box', 'string or null · optional', 'Default destination for items. A non-empty target value takes precedence over the corresponding batchContext value; an item value overrides both.'],
  ['batchContext', 'object · optional', 'In ZIPs, only location, box, and source are read. location/box are fallbacks for target; source overrides source.createdByTool. itemCount is calculated from items.'],
  ['source', 'object · optional', 'Recognized children: createdByTool, sourceMachine, and operator, all strings. Describes where the package was prepared.'],
  ['source.createdByTool', 'string · optional', 'Tool/provenance label, e.g. "manual_json". Sets the import source unless batchContext.source is supplied; import source otherwise defaults to "vision_intake". Package tool metadata otherwise defaults to "batch_manifest".'],
  ['sourceMachine', 'string · optional', 'Machine provenance. Takes precedence over source.sourceMachine. Defaults to an empty string.'],
  ['source.sourceMachine', 'string · optional alias', 'Fallback machine provenance when the top-level sourceMachine is absent or empty.'],
  ['operator', 'string · optional', 'Operator provenance. Takes precedence over source.operator. Defaults to an empty string.'],
  ['source.operator', 'string · optional alias', 'Fallback operator provenance when the top-level operator is absent or empty.'],
];
const CATEGORIES = 'miscellaneous, tools, hardware, automotive, cleaning, kitchen, appliances, electronics, office, books, clothing, bathroom, medical, decor, furniture, garden, camping, hobbies, toys, games, seasonal';
const JSON_TEMPLATE = {
  batchContext: { location: 'garage', box: '701', source: 'manual_json' },
  items: [{ name: 'Claw hammer', description: 'Steel head, red rubber grip', category: 'tools', tags: ['hand tool', 'red'], quantity: 1, location: 'garage', box: '701' }],
};
const PACKAGE_TEMPLATE = {
  app: 'discowarpcore', packageVersion: 2, batchLabel: 'Garage tools',
  createdAt: '2026-10-05T12:00:00Z',
  target: { location: 'garage', box: '701' },
  source: { createdByTool: 'manual_json', sourceMachine: 'my-computer', operator: 'your-name' },
  items: [{ ...JSON_TEMPLATE.items[0], imageFile: 'hammer_001.jpg', imageKey: 'hammer_001' }],
};

function FieldReference({ fields, label }) {
  return <Fields aria-label={label}>{fields.map(([name, type, description]) => (
    <div key={name}><dt><code>{name}</code><span>{type}</span></dt><dd>{description}</dd></div>
  ))}</Fields>;
}
function downloadHref(value) {
  return `data:application/json;charset=utf-8,${encodeURIComponent(`${JSON.stringify(value, null, 2)}\n`)}`;
}

export default function ConfigurationJsonReference() {
  return (
    <Wrap>
      <p>Use this reference to build a file from scratch. These are the fields the current intake code
        actually uses. Choose the JSON tab for items without images, or AI intake package for a ZIP
        with photos. Both paths stage a batch for review before inventory import.</p>
      <h3>1. Choose a JSON shape</h3>
      <p>The JSON tab accepts a single item object, an array of item objects, or an object containing
        a non-empty <code>items</code> array and optional <code>batchContext</code>.
        The smallest file is <code>{'{"name":"Claw hammer"}'}</code>.
        Use UTF-8 JSON with double quotes, no comments, and no trailing commas.</p>
      <h3>2. Item attributes</h3>
      <FieldReference fields={ITEM_FIELDS} label="Common item attributes" />
      <p><strong>Category values:</strong> {CATEGORIES}.</p>
      <h3>3. Batch payload and defaults</h3>
      <FieldReference fields={CONTEXT_FIELDS} label="Batch payload attributes" />
      <h3>4. Complete plain JSON example</h3>
      <p>Replace the sample values before use. Box 701 must already exist. Remove <code>box</code>
        from both the item and batchContext to import unboxed items. Each item may have its own destination.</p>
      <pre>{JSON.stringify(JSON_TEMPLATE, null, 2)}</pre>
      <Actions><Control as="a" href={downloadHref(JSON_TEMPLATE)} download="inventory-template.json">Download JSON starter</Control></Actions>
      <h3>5. Image package attributes</h3>
      <p>Place <code>batch_manifest.json</code> at the ZIP root and its referenced photos in
        <code>images/</code>. The manifest must be an object with a non-empty items array.
        Plain JSON uploads remove image fields; use a ZIP to retain them.</p>
      <FieldReference fields={IMAGE_FIELDS} label="Image item attributes" />
      <FieldReference fields={MANIFEST_FIELDS} label="Package manifest attributes" />
      <h3>6. Complete image package example</h3>
      <pre>{`my-package.zip\n  batch_manifest.json\n  images/\n    hammer_001.jpg`}</pre>
      <pre>{JSON.stringify(PACKAGE_TEMPLATE, null, 2)}</pre>
      <Actions><Control as="a" href={downloadHref(PACKAGE_TEMPLATE)} download="batch_manifest.json">Download manifest starter</Control></Actions>
      <p>Add your actual image before creating the ZIP. Old root files such as <code>manifest.json</code>,
        <code>ai_intake.json</code>, <code>import_ready.json</code>, <code>image_mapping.csv</code>,
        <code>image_order.csv</code>, and <code>order.csv</code> are rejected by this ZIP uploader.
        Packages without any destination require an explicit destination review before validation/import.</p>
      <h3>7. Lower-level API formats</h3>
      <p>For integrations, <code>/api/items/ai-json/validate</code> and <code>/api/items/ai-json/import</code>
        accept the batch payload directly, <code>{'{"payload": {"items": [...]}}'}</code>,
        or <code>{'{"jsonText": "JSON text containing an items payload"}'}</code>.
        The parsed payload must be an object with a non-empty items array; direct single items
        and arrays belong to the page’s JSON uploader. <code>jsonText</code> takes precedence over
        <code>payload</code>. These request wrappers are not accepted as files by the JSON tab.</p>
      <p>The API also recognizes item <code>imageKey</code>. Image files are uploaded as multipart
        <code>importImages</code>, not embedded JSON or local filesystem paths (up to 500 files,
        10 MiB per file). The import request can carry <code>sourceBatchId</code>, an existing MongoDB
        batch-record ID for provenance; it is not the folder-style batch name. Leave it to the batch
        workflow unless writing an integration. API import creates inventory immediately.</p>
      <h3>8. Fields that do not import</h3>
      <p>Extra item keys are discarded. Inventory fields such as IDs, timestamps, status,
        disposition, priority, links, notes, compartments, locationId, image URLs, and media processing
        settings are not accepted item attributes in these intake paths. Set supported inventory
        details after import through their normal editing controls. Additional root/context metadata
        may survive staging in some formats, but it does not automatically become item data.</p>
      <p>Malformed JSON, empty arrays, non-object items, or blank names are rejected. A ZIP additionally
        rejects missing referenced images, unsupported image extensions, and mismatched image keys.
        Validation is separate from import; check the destination and the resulting per-item import
        errors, particularly missing box references.</p>
    </Wrap>
  );
}
