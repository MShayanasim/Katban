export default {
  async fetch(request, env, ctx) {
    // Only allow requests from Chrome extensions (chrome-extension:// origins).
    // Browsers enforce that websites cannot spoof the Origin header, so this
    // effectively blocks all web-based callers while allowing your extension.
    const requestOrigin = request.headers.get("Origin") || "";
    const isExtensionOrigin = requestOrigin.startsWith("chrome-extension://") ||
                              requestOrigin.startsWith("moz-extension://");

    // For non-extension origins on preflight, return 403 immediately.
    if (request.method === "OPTIONS") {
      if (!isExtensionOrigin) {
        return new Response("Forbidden", { status: 403 });
      }
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": requestOrigin,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // Build CORS headers — only reflect back a chrome-extension origin
    const corsHeaders = isExtensionOrigin
      ? {
          "Access-Control-Allow-Origin": requestOrigin,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        }
      : {};

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: corsHeaders });
    }

    // Block non-extension POST requests outright
    if (!isExtensionOrigin) {
      return new Response("Forbidden", { status: 403 });
    }

    // ── Rate limiting (per real client IP) ──────────────────────────────────
    // Cloudflare provides the real client IP in CF-Connecting-IP. Keying on this
    // means every individual user gets their OWN budget, rather than all users
    // sharing one pool (which was the flaw when keying on the extension origin).
    if (!globalThis._rateLimitMap) {
      globalThis._rateLimitMap = new Map();
      globalThis._rateLimitCleanupCounter = 0;
    }
    const now = Date.now();
    const WINDOW_MS = 60 * 1000;  // 1-minute sliding window
    const MAX_REQUESTS = 20;      // 20 rant messages per minute per user

    // CF-Connecting-IP is injected by Cloudflare's edge — it cannot be spoofed
    // by the client because Cloudflare strips and re-adds it at the network level.
    const clientIP = request.headers.get("CF-Connecting-IP") || "unknown";
    const record = globalThis._rateLimitMap.get(clientIP) || { count: 0, windowStart: now };

    if (now - record.windowStart > WINDOW_MS) {
      record.count = 0;
      record.windowStart = now;
    }
    record.count += 1;
    globalThis._rateLimitMap.set(clientIP, record);

    if (record.count > MAX_REQUESTS) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please wait a moment before venting again." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json",
            "Retry-After": "60" } }
      );
    }

    // Periodic cleanup: every 100 requests, purge expired entries to prevent memory leaks.
    // Also hard-cap at 10,000 entries — if it's larger, something is wrong (attack), nuke it.
    globalThis._rateLimitCleanupCounter += 1;
    if (globalThis._rateLimitCleanupCounter >= 100) {
      globalThis._rateLimitCleanupCounter = 0;
      if (globalThis._rateLimitMap.size > 10000) {
        globalThis._rateLimitMap.clear();
      } else {
        for (const [ip, rec] of globalThis._rateLimitMap) {
          if (now - rec.windowStart > WINDOW_MS) {
            globalThis._rateLimitMap.delete(ip);
          }
        }
      }
    }
    // ── End rate limiting ─────────────────────────────────────────────────────


    // ── Body size check ──────────────────────────────────────────────────────
    // Reject oversized payloads before JSON parsing to prevent CPU/memory abuse.
    // Normal Katban requests are ~2-5KB. 50KB is extremely generous.
    const MAX_BODY_BYTES = 50 * 1024; // 50KB
    const contentLength = parseInt(request.headers.get("Content-Length") || "0", 10);
    if (contentLength > MAX_BODY_BYTES) {
      return new Response(
        JSON.stringify({ error: "Request too large." }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let requestMessages = [];
    try {
      // Read as text first so we can check actual size (Content-Length can be missing)
      const bodyText = await request.text();
      if (bodyText.length > MAX_BODY_BYTES) {
        return new Response(
          JSON.stringify({ error: "Request too large." }),
          { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const body = JSON.parse(bodyText);
      requestMessages = body.messages || [];
      if (body.rant) requestMessages = [{ role: 'user', content: body.rant }];
    } catch(e) {
      return new Response("Invalid JSON", { status: 400, headers: corsHeaders });
    }

    // ── Input Sanitization ────────────────────────────────────────────────────
    // Without this, a single request with 1000 messages of 100,000 chars each
    // could exhaust your entire monthly Groq/Gemini quota in seconds.
    const ALLOWED_ROLES = new Set(['user', 'assistant']);
    const MAX_MESSAGES = 10;      // Maximum conversation history to process
    const MAX_MSG_LENGTH = 1000;  // Maximum characters per individual message

    // Only keep the last MAX_MESSAGES entries (trim old history)
    if (requestMessages.length > MAX_MESSAGES) {
      requestMessages = requestMessages.slice(-MAX_MESSAGES);
    }

    // Validate and sanitize each message entry
    requestMessages = requestMessages
      .filter(msg =>
        msg &&
        typeof msg === 'object' &&
        typeof msg.content === 'string' &&    // content must be a string (reject objects, arrays, nulls)
        ALLOWED_ROLES.has(msg.role)           // role must be exactly 'user' or 'assistant'
      )
      .map(msg => ({
        role: msg.role,
        content: msg.content.slice(0, MAX_MSG_LENGTH)  // hard-cap each message's length
      }));

    if (!requestMessages.length) {
      return new Response(
        JSON.stringify({ error: "No valid messages provided." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    // ── End sanitization ──────────────────────────────────────────────────────

    const SYSTEM_PROMPT = `You are Katban, a supportive and empathetic cat companion. 
The user is venting to you. Respond kindly, conversationally, and briefly (2-3 sentences max). 
CRITICAL RULES:
1. Do NOT use roleplay asterisks under any circumstances (e.g. absolutely no *leans in*, *purrs*, or *twitches whiskers*).
2. Incorporate extremely subtle, lighthearted cat puns occasionally (e.g. using "purrfect" instead of perfect, "pawsitive" instead of positive, "meowment" instead of moment, or "claws" instead of flaws).
3. Speak naturally like an empathetic friend. Do not act like a robotic AI.
4. Keep the focus entirely on comforting the user. Be a genuine, good listener without being overly dramatic.`;

    try {
      // Layer 1: Groq API
      if (!env.GROQ_API_KEY) throw new Error("No Groq Key");

      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...requestMessages
          ],
          temperature: 0.7,
          max_tokens: 150
        })
      });

      if (!groqRes.ok) throw new Error("Groq API failed: " + await groqRes.text());
      const groqData = await groqRes.json();
      return new Response(JSON.stringify({ reply: groqData.choices[0].message.content }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
      
    } catch (groqError) {
      try {
        // Layer 2: Gemini API
        if (!env.GEMINI_API_KEY) throw new Error("No Gemini Key");

        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-001:generateContent?key=${env.GEMINI_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: { text: SYSTEM_PROMPT } },
            contents: requestMessages.map(msg => ({
              role: msg.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: msg.content }]
            }))
          })
        });
        if (!geminiRes.ok) throw new Error("Gemini API failed: " + await geminiRes.text());
        const geminiData = await geminiRes.json();
        return new Response(JSON.stringify({ reply: geminiData.candidates[0].content.parts[0].text }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (geminiError) {
        // Log full error details server-side only (visible in Cloudflare dashboard logs).
        // Never expose raw API error messages to the client — they can leak key status,
        // model names, and quota details.
        console.error("Groq error:", groqError.message);
        console.error("Gemini error:", geminiError.message);
        return new Response(JSON.stringify({
          error: "The AI companion is temporarily unavailable. Please try again in a moment."
        }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }
  },
};
