# One-time video (Vercel + Supabase)

## Included
- `index.html`: minimal one-use video page.
- `api/watch.js`: server-side access claim and private signed URL generation.

## Supabase assumptions
- Project URL: `https://vjxinqxwtrlazhhnmyzw.supabase.co`
- Private Storage bucket: `videos`
- Object path: `video.mp4`
- SQL from the setup steps has created `public.video_gate` and
  `public.claim_video_access(p_token text)`.

## Deploy
1. Create a new Vercel project and deploy this folder.
2. In Vercel > Project Settings > Environment Variables, add:
   - `SUPABASE_URL` = `https://vjxinqxwtrlazhhnmyzw.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = your Supabase **secret/service_role** key.
3. Redeploy after adding the variables.
4. Open the Vercel deployment URL and test only when ready.

Never put the service role/secret key in `index.html`, Git, or a public message.

## Important limitations
The database guarantees that only one request can consume the global gate.
The private signed URL is valid for up to four hours so the browser can make
video range requests during playback. Anyone who obtains that URL could reuse
it until it expires. A website also cannot reliably detect OS-level screenshots
or screen recording, and browser-side pause/seek restrictions are deterrents,
not tamper-proof security.

The gate is consumed before the signed URL is created. If signing fails, the
one-time access remains consumed and an administrator must reset `consumed_at`
in Supabase before trying again.
