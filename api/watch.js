export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: "Falta configurar Supabase en Vercel." });
  }

  const token = typeof req.body?.token === "string" ? req.body.token : "";
  if (!/^[a-f0-9]{64}$/i.test(token)) {
    return res.status(400).json({ error: "Solicitud no válida." });
  }

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json"
  };

  try {
    // The database function atomically lets only one request consume the gate.
    const claim = await fetch(`${supabaseUrl}/rest/v1/rpc/claim_video_access`, {
      method: "POST",
      headers,
      body: JSON.stringify({ p_token: token })
    });
    if (!claim.ok) {
      return res.status(502).json({ error: "No se pudo comprobar el acceso." });
    }
    const allowed = await claim.json();
    if (allowed !== true) {
      return res.status(410).json({ error: "Este vídeo ya ha sido visto o el acceso se ha consumido." });
    }

    // Private object URL. Its expiry is a practical playback compromise:
    // browser video streaming may make multiple range requests.
    const signed = await fetch(
      `${supabaseUrl}/storage/v1/object/sign/videos/video.mp4`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ expiresIn: 14400 })
      }
    );
    if (!signed.ok) {
      return res.status(502).json({ error: "El acceso se consumió, pero no se pudo abrir el vídeo. Contacta con el administrador." });
    }
    const result = await signed.json();
    const signedPath = result.signedURL || result.signedUrl;
    if (!signedPath) {
      return res.status(502).json({ error: "Supabase no devolvió el enlace del vídeo." });
    }
    const videoUrl = signedPath.startsWith("http")
      ? signedPath
      : `${supabaseUrl}/storage/v1${signedPath.startsWith("/") ? "" : "/"}${signedPath}`;
    return res.status(200).json({ url: videoUrl });
  } catch (error) {
    return res.status(500).json({ error: "Error interno al autorizar el vídeo." });
  }
}
