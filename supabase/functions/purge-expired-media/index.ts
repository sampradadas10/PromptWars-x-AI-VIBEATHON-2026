import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_RETRIES = 3;
const BATCH_SIZE = 50;

async function deleteStorageWithRetry(
  supabase: ReturnType<typeof createClient>,
  bucket: string,
  path: string
): Promise<{ ok: boolean; reason?: string }> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (!error) {
      return { ok: true };
    }
    const msg = error.message?.toLowerCase() ?? '';
    // If object is already absent, treat as safely cleared
    if (msg.includes('not found') || msg.includes('404')) {
      return { ok: true, reason: 'already_absent' };
    }
    if (attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, 200 * attempt));
    }
  }
  return { ok: false, reason: 'storage_remove_failed_after_retries' };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const bucket = Deno.env.get('EPHEMERAL_MEDIA_BUCKET') ?? 'ephemeral-media';

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Server service-role configuration missing.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const nowIso = new Date().toISOString();

    const { data: expiredRecords, error: queryError } = await adminClient
      .from('ephemeral_media_vault')
      .select('id, storage_bucket_path')
      .lte('expires_at', nowIso)
      .order('expires_at', { ascending: true })
      .limit(BATCH_SIZE);

    if (queryError) {
      return new Response(JSON.stringify({ error: 'Failed to query expired media.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let storageDeletedCount = 0;
    let metadataDeletedCount = 0;
    let failedCount = 0;

    for (const record of expiredRecords ?? []) {
      const storageRes = await deleteStorageWithRetry(
        adminClient,
        bucket,
        record.storage_bucket_path
      );

      if (!storageRes.ok) {
        failedCount += 1;
        continue;
      }

      storageDeletedCount += 1;

      const { error: deleteMetaError } = await adminClient
        .from('ephemeral_media_vault')
        .delete()
        .eq('id', record.id);

      if (deleteMetaError) {
        failedCount += 1;
      } else {
        metadataDeletedCount += 1;
      }
    }

    const foundCount = expiredRecords?.length ?? 0;

    await adminClient.from('media_purge_audit').insert({
      expired_found_count: foundCount,
      storage_deleted_count: storageDeletedCount,
      metadata_deleted_count: metadataDeletedCount,
      failed_count: failedCount,
      notes: failedCount > 0 ? 'Partial batch failure; failed items remain for next 5m run.' : 'OK',
    });

    return new Response(
      JSON.stringify({
        expiredFound: foundCount,
        storageDeleted: storageDeletedCount,
        metadataDeleted: metadataDeletedCount,
        failed: failedCount,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Purge worker failed.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
