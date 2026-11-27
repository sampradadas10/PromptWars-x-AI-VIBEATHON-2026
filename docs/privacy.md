# PHYGITAL — Privacy & 48-Hour Media Deletion Architecture

## Core Privacy Guarantees
1. **Strict Separation of Records**: Permanent learning tables (`child_profiles`, `quest_progress`) store only nicknames, age bands, XP, and anonymized learning summaries—never full legal names, raw photos, or raw audio.
2. **Private Temporary Storage**: Voice capsules and Quest Scanner images are written to private storage (`ephemeral-media`) and indexed in `ephemeral_media_vault`.
3. **Immediate 48-Hour Access Cutoff**: Both RLS policies (`NOW() < expires_at`) and `accessTemporaryMedia()` deny access the moment `expires_at` is reached.
4. **5-Minute Automated Deletion Worker**: `supabase/functions/purge-expired-media/index.ts` queries expired rows, removes objects via the Storage API with 3x retry, confirms removal (or treats 404/already-absent as cleared), deletes metadata rows, handles partial batch failures gracefully, and logs only aggregate counts in `media_purge_audit`.
5. **Secondary Lifecycle Policy Example (S3 / Cloudflare R2)**:
```json
{
  "Rules": [
    {
      "ID": "Phygital48HourEphemeralPrefixCleanup",
      "Status": "Enabled",
      "Filter": { "Prefix": "ephemeral-media/" },
      "Expiration": { "Days": 2 }
    }
  ]
}
```
*Note: Provider lifecycle rules run asynchronously; PHYGITAL enforces exact 48-hour cutoff via database RLS + the 5-minute `purge-expired-media` worker.*
