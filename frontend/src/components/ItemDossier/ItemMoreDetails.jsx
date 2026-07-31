import React, { useMemo, useState } from 'react';
import * as S from './ItemDossier.styles';

function hasValue(value) {
  if (React.isValidElement(value)) return true;
  const text = String(value ?? '').trim();
  const normalized = text.toLowerCase();
  return Boolean(
    text &&
      text !== '—' &&
      normalized !== 'unspecified' &&
      normalized !== 'unknown' &&
      normalized !== '$0.00'
  );
}

function BreadcrumbTrail({ breadcrumb = [] }) {
  if (!Array.isArray(breadcrumb) || !breadcrumb.length) return null;

  return (
    <S.Breadcrumbs aria-label="Box breadcrumb">
      {breadcrumb.map((node, index) => (
        <React.Fragment key={node?._id || `${node?.box_id || 'box'}-${index}`}>
          <S.BreadcrumbNode>
            <strong>{node?.box_id || '—'}</strong>
            {node?.label || 'Box'}
          </S.BreadcrumbNode>
          {index < breadcrumb.length - 1 ? <span aria-hidden="true">›</span> : null}
        </React.Fragment>
      ))}
    </S.Breadcrumbs>
  );
}

function LinkList({ links = [] }) {
  if (!Array.isArray(links) || !links.length) return null;

  return (
    <S.ExternalLinks>
      {links.map((link, index) => (
        <S.ExternalLink
          key={`${link.url}-${index}`}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {link.label}
        </S.ExternalLink>
      ))}
    </S.ExternalLinks>
  );
}

export default function ItemMoreDetails({
  notes,
  boxGroup,
  breadcrumb = [],
  keepPriority,
  primaryOwner,
  condition,
  consumableLabel,
  valueLabel,
  purchasePriceLabel,
  externalLinks = [],
}) {
  const [open, setOpen] = useState(false);
  const rows = useMemo(
    () =>
      [
        ['Notes', notes],
        ['Box group', boxGroup],
        ['Keep priority', keepPriority],
        ['Primary owner', primaryOwner],
        ['Condition', condition],
        ['Consumable', consumableLabel],
        ['Value', valueLabel],
        ['Purchase price', purchasePriceLabel],
        [
          'Breadcrumb',
          Array.isArray(breadcrumb) && breadcrumb.length ? (
            <BreadcrumbTrail breadcrumb={breadcrumb} />
          ) : null,
        ],
        [
          'References',
          Array.isArray(externalLinks) && externalLinks.length ? (
            <LinkList links={externalLinks} />
          ) : null,
        ],
      ].filter(([, value]) => hasValue(value)),
    [
      boxGroup,
      breadcrumb,
      condition,
      consumableLabel,
      externalLinks,
      keepPriority,
      notes,
      primaryOwner,
      purchasePriceLabel,
      valueLabel,
    ]
  );

  if (!rows.length) return null;

  return (
    <S.Disclosure>
      <S.DisclosureButton
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>More details</span>
        <S.DisclosureState>{open ? 'CLOSE' : `${rows.length} FIELDS`}</S.DisclosureState>
      </S.DisclosureButton>

      <S.DisclosureBody $open={open} aria-hidden={!open}>
        <div>
          <S.DetailRows>
            {rows.map(([label, value]) => (
              <S.DetailRow key={label}>
                <S.Label>{label}</S.Label>
                <S.DetailValue>{value}</S.DetailValue>
              </S.DetailRow>
            ))}
          </S.DetailRows>
        </div>
      </S.DisclosureBody>
    </S.Disclosure>
  );
}
