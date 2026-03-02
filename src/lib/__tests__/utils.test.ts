import { describe, it, expect } from 'vitest';
import { cn, getInitials, getStatusColor, formatRelativeTime } from '../utils';

describe('cn()', () => {
  it('merges class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('deduplicates tailwind classes', () => {
    const result = cn('p-2', 'p-4');
    expect(result).toBe('p-4');
  });
});

describe('getInitials()', () => {
  it('returns 2-letter initials from first and last name', () => {
    expect(getInitials('Jean', 'Dupont')).toBe('JD');
  });

  it('returns single letter when only first name provided', () => {
    expect(getInitials('Jean')).toBe('J');
  });

  it('returns ? when no names provided', () => {
    expect(getInitials()).toBe('?');
  });

  it('returns uppercase initials', () => {
    expect(getInitials('jean', 'dupont')).toBe('JD');
  });
});

describe('getStatusColor()', () => {
  it('returns green for online/active', () => {
    expect(getStatusColor('online')).toBe('bg-green-500');
    expect(getStatusColor('active')).toBe('bg-green-500');
  });

  it('returns gray for offline/inactive', () => {
    expect(getStatusColor('offline')).toBe('bg-gray-500');
    expect(getStatusColor('inactive')).toBe('bg-gray-500');
  });

  it('returns yellow for pending', () => {
    expect(getStatusColor('pending')).toBe('bg-yellow-500');
  });

  it('returns red for error', () => {
    expect(getStatusColor('error')).toBe('bg-red-500');
  });

  it('returns gray for unknown statuses', () => {
    expect(getStatusColor('unknown')).toBe('bg-gray-500');
  });
});

describe('formatRelativeTime()', () => {
  it('returns "À l\'instant" for fresh timestamps', () => {
    const now = new Date().toISOString();
    expect(formatRelativeTime(now)).toBe("À l'instant");
  });

  it('returns minutes for recent timestamps', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatRelativeTime(fiveMinutesAgo)).toBe('5 min');
  });

  it('returns hours for timestamps within a day', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(twoHoursAgo)).toBe('2h');
  });
});
