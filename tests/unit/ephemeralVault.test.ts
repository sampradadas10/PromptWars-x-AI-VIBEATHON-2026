import { describe, expect, it } from 'vitest';
import {
  accessTemporaryMedia,
  createEphemeralMediaRecord,
  getMediaRemainingTime,
  MEDIA_TTL_MS,
  purgeExpiredMediaLocal,
} from '../../src/services/ephemeralVault';

describe('48-Hour Privacy Shield & Ephemeral Media Vault', () => {
  it('allows access before 48 hours and denies access immediately after expiry', async () => {
    const createdMs = Date.UTC(2026, 10, 1, 12, 0, 0);
    const record = createEphemeralMediaRecord({
      parentId: 'parent-1',
      childId: 'child-1',
      mediaType: 'image',
      extension: 'jpg',
      previewDataUrl: 'data:image/jpeg;base64,ZmFrZQ==',
      createdAtMs: createdMs,
    });

    const beforeExpiry = await accessTemporaryMedia(record, createdMs + 10_000);
    expect(beforeExpiry.allowed).toBe(true);
    expect(beforeExpiry.url).toBe('data:image/jpeg;base64,ZmFrZQ==');

    const remaining = getMediaRemainingTime(record.expiresAt, createdMs + 60 * 60 * 1000);
    expect(remaining.isExpired).toBe(false);
    expect(remaining.formattedRemaining).toContain('47h');

    const atExactExpiry = await accessTemporaryMedia(record, createdMs + MEDIA_TTL_MS);
    expect(atExactExpiry.allowed).toBe(false);
    expect(atExactExpiry.reason).toContain('48-hour privacy cutoff');
  });

  it('physically deletes expired items, retries transient failures, and is idempotent', async () => {
    const createdExpired = Date.now() - MEDIA_TTL_MS - 60_000;
    const createdFresh = Date.now() - 60_000;

    const expiredA = createEphemeralMediaRecord({
      parentId: 'p1',
      childId: 'c1',
      mediaType: 'image',
      extension: 'jpg',
      createdAtMs: createdExpired,
    });
    const expiredB = createEphemeralMediaRecord({
      parentId: 'p1',
      childId: 'c1',
      mediaType: 'audio',
      extension: 'webm',
      createdAtMs: createdExpired,
    });
    const activeC = createEphemeralMediaRecord({
      parentId: 'p1',
      childId: 'c1',
      mediaType: 'image',
      extension: 'jpg',
      createdAtMs: createdFresh,
    });

    const attempts: Record<string, number> = {};
    const deletedPaths = new Set<string>();

    // Simulate transient failure on expiredA (succeeds on 2nd retry), permanent failure on expiredB
    const firstRun = await purgeExpiredMediaLocal(
      [expiredA, expiredB, activeC],
      async (bucketPath) => {
        attempts[bucketPath] = (attempts[bucketPath] ?? 0) + 1;
        if (bucketPath === expiredA.storageBucketPath && attempts[bucketPath] === 1) {
          return { ok: false };
        }
        if (bucketPath === expiredB.storageBucketPath) {
          return { ok: false };
        }
        deletedPaths.add(bucketPath);
        return { ok: true };
      }
    );

    expect(firstRun.result.expiredFound).toBe(2);
    expect(firstRun.result.storageDeleted).toBe(1);
    expect(firstRun.result.metadataDeleted).toBe(1);
    expect(firstRun.result.failed).toBe(1);
    expect(deletedPaths.has(expiredA.storageBucketPath)).toBe(true);
    expect(firstRun.remainingRecords.map((r) => r.id)).toEqual([expiredB.id, activeC.id]);

    // Second run: expiredB now succeeds, activeC remains untouched
    const secondRun = await purgeExpiredMediaLocal(
      firstRun.remainingRecords,
      async (bucketPath) => {
        deletedPaths.add(bucketPath);
        return { ok: true };
      }
    );
    expect(secondRun.result.expiredFound).toBe(1);
    expect(secondRun.result.storageDeleted).toBe(1);
    expect(secondRun.result.failed).toBe(0);
    expect(secondRun.remainingRecords.map((r) => r.id)).toEqual([activeC.id]);

    // Third run: idempotent when nothing is expired
    const thirdRun = await purgeExpiredMediaLocal(
      secondRun.remainingRecords,
      async () => ({ ok: true })
    );
    expect(thirdRun.result.expiredFound).toBe(0);
    expect(thirdRun.remainingRecords).toHaveLength(1);
  });
});
