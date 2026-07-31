import { useEffect, useMemo, useState } from 'react';
import styled, { keyframes } from 'styled-components';

const announcementIn = keyframes`
  from {
    opacity: 0;
    filter: blur(4px);
    transform: translateY(3px);
  }
  to {
    opacity: 1;
    filter: blur(0);
    transform: translateY(0);
  }
`;

const Announcement = styled.span`
  display: block;
  min-width: 0;
  overflow: hidden;
  color: rgba(194, 246, 234, 0.92);
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  font-size: 0.88em;
  font-weight: 700;
  letter-spacing: 0.015em;
  text-overflow: ellipsis;
  white-space: nowrap;
  animation: ${announcementIn} 280ms ease-out;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

function pluralize(count, singular, plural = `${singular}s`) {
  return `${count.toLocaleString()} ${count === 1 ? singular : plural}`;
}

function formatCurrency(cents, currency) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function buildBoxAnalyticsAnnouncements(analytics) {
  const metrics = analytics?.metrics;
  if (!metrics || typeof metrics !== 'object') return [];

  const boxCount = Number(metrics.boxCount) || 0;
  const itemRecordCount = Number(metrics.itemRecordCount) || 0;
  const itemQuantity = Number(metrics.itemQuantity) || 0;
  const locationCount = Number(metrics.locationCount) || 0;
  const groupCount = Number(metrics.groupCount) || 0;
  const noteCount =
    (Number(metrics.boxNoteCount) || 0) + (Number(metrics.itemNoteCount) || 0);
  const totalValueCents = Number(metrics.totalValueCents) || 0;
  const announcements = [
    `${pluralize(boxCount, 'box', 'boxes')} across ${pluralize(locationCount, 'location')}`,
    `${pluralize(itemQuantity, 'item')} in ${pluralize(itemRecordCount, 'record')}`,
  ];

  if (groupCount > 0) {
    announcements.push(`${pluralize(groupCount, 'group')} represented`);
  }
  if (noteCount > 0) {
    announcements.push(`${pluralize(noteCount, 'note')} ready when context matters`);
  }
  if (totalValueCents > 0) {
    announcements.push(
      `${formatCurrency(totalValueCents, analytics?.currency)} recorded value`,
    );
  }

  return announcements;
}

export default function RotatingDataAnnouncement({
  analytics,
  intervalMs = 4400,
}) {
  const announcements = useMemo(
    () => buildBoxAnalyticsAnnouncements(analytics),
    [analytics],
  );
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [announcements]);

  useEffect(() => {
    if (announcements.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % announcements.length);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [announcements, intervalMs]);

  const text = announcements[activeIndex] || 'Box inventory standing by';

  return (
    <Announcement key={`${activeIndex}-${text}`} aria-label={announcements.join('. ')}>
      {text}
    </Announcement>
  );
}
