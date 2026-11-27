import type { EphemeralMediaRecord, EphemeralMediaType } from '../types/phygital';
import { isSupabaseConfigured, supabase } from './supabaseClient';

export const MEDIA_TTL_HOURS = 48;
export const MEDIA_TTL_MS = MEDIA_TTL_HOURS * 60 * 60 * 1000;

export interface EphemeralPurgeResult {
  expiredFound: number;
  storageDeleted: number;
  metadataDeleted: number;
  failed: number;
  executedAt: string;
  mode: 'supabase' | 'dev-sandbox';
}

/**
 * Pure helper to determine remaining time until 48-hour expiry.
 */
export function getMediaRemainingTime(expiresAtIso: string, nowMs = Date.now()): {
  isExpired: boolean;
  msRemaining: number;
  formattedRemaining: string;
} {
  const expiresMs = new Date(expiresAtIso).getTime();
  const msRemaining = Math.max(0, expiresMs - nowMs);
  if (msRemaining <= 0) {
    return {
      isExpired: true,
      msRemaining: 0,
      formattedRemaining: 'Expired — awaiting physical purge',
    };
  }
  const totalMinutes = Math.floor(msRemaining / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return {
    isExpired: false,
    msRemaining,
    formattedRemaining: `${hours}h ${minutes}m remaining`,
  };
}

/**
 * Enforces immediate 48-hour access cutoff before returning a readable preview/URL.
 */
export async function accessTemporaryMedia(
  record: EphemeralMediaRecord,
  nowMs = Date.now()
): Promise<{ allowed: boolean; url?: string; reason?: string }> {
  const expiresMs = new Date(record.expiresAt).getTime();
  if (nowMs >= expiresMs || record.deletionStatus === 'purged') {
    return {
      allowed: false,
      reason: 'Access denied: this temporary media passed the 48-hour privacy cutoff.',
    };
  }

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.storage
      .from('ephemeral-media')
      .createSignedUrl(record.storageBucketPath, 60);
    if (error || !data?.signedUrl) {
      return {
        allowed: false,
        reason: 'Could not generate a short-lived signed URL.',
      };
    }
    return { allowed: true, url: data.signedUrl };
  }

  return {
    allowed: true,
    url: record.previewDataUrl,
  };
}

export function createEphemeralMediaRecord(params: {
  parentId: string;
  childId: string;
  questId?: string | null;
  mediaType: EphemeralMediaType;
  extension: 'jpg' | 'png' | 'webm';
  previewDataUrl?: string;
  createdAtMs?: number;
}): EphemeralMediaRecord {
  const createdMs = params.createdAtMs ?? Date.now();
  const expiresMs = createdMs + MEDIA_TTL_MS;
  const id = crypto.randomUUID();
  return {
    id,
    childId: params.childId,
    questId: params.questId ?? null,
    mediaType: params.mediaType,
    storageBucketPath: `${params.parentId}/${params.childId}/${id}.${params.extension}`,
    createdAt: new Date(createdMs).toISOString(),
    expiresAt: new Date(expiresMs).toISOString(),
    deletedAt: null,
    deletionStatus: 'active',
    previewDataUrl: params.previewDataUrl,
  };
}

/**
 * Automated cleanup worker mirroring supabase/functions/purge-expired-media/index.ts.
 * In development sandbox mode, physically clears expired blobs & metadata from local records
 * with retry handling and aggregate operational counts.
 */
export async function purgeExpiredMediaLocal(
  records: EphemeralMediaRecord[],
  storageRemoveFn: (path: string) => Promise<{ ok: boolean; alreadyAbsent?: boolean }>,
  nowMs = Date.now(),
  maxRetries = 3
): Promise<{
  remainingRecords: EphemeralMediaRecord[];
  result: EphemeralPurgeResult;
}> {
  const remainingRecords: EphemeralMediaRecord[] = [];
  let expiredFound = 0;
  let storageDeleted = 0;
  let metadataDeleted = 0;
  let failed = 0;

  for (const record of records) {
    const isExpired = new Date(record.expiresAt).getTime() <= nowMs;
    if (!isExpired) {
      remainingRecords.push(record);
      continue;
    }

    expiredFound += 1;
    let deletedOk = false;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const res = await storageRemoveFn(record.storageBucketPath);
      if (res.ok || res.alreadyAbsent) {
        deletedOk = true;
        break;
      }
    }

    if (!deletedOk) {
      failed += 1;
      remainingRecords.push({
        ...record,
        deletionStatus: 'expired_pending_purge',
        previewDataUrl: undefined,
      });
      continue;
    }

    storageDeleted += 1;
    metadataDeleted += 1;
  }

  return {
    remainingRecords,
    result: {
      expiredFound,
      storageDeleted,
      metadataDeleted,
      failed,
      executedAt: new Date(nowMs).toISOString(),
      mode: 'dev-sandbox',
    },
  };
}

export async function invokeCloudMediaPurge(): Promise<EphemeralPurgeResult | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.functions.invoke('purge-expired-media', {
    body: { source: 'parent-dashboard-manual' },
  });
  if (error || !data) {
    throw new Error(error?.message ?? 'Could not trigger cloud media purge.');
  }
  return {
    expiredFound: data.expiredFound ?? 0,
    storageDeleted: data.storageDeleted ?? 0,
    metadataDeleted: data.metadataDeleted ?? 0,
    failed: data.failed ?? 0,
    executedAt: new Date().toISOString(),
    mode: 'supabase',
  };
}
