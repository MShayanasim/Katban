export default {
  async fetch(request, env, ctx) {
    // CORS headers so your Chrome Extension can talk to it
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: corsHeaders });
    }

    let requestMessages = [];
    try {
      const body = await request.json();
      requestMessages = body.messages || [];
      if (body.rant) requestMessages = [{ role: 'user', content: body.rant }];
    } catch(e) {
      return new Response("Invalid JSON", { status: 400, headers: corsHeaders });
    }

    if (!requestMessages.length) {
      return new Response("No messages provided", { status: 400, headers: corsHeaders });
    }

    const SYSTEM_PROMPT = `You are Katban, a supportive and empathetic friend. 
The user is venting to you. Respond kindly, conversationally, and briefly (2-3 sentences max). 
CRITICAL RULES:
1. Speak naturally like a normal, empathetic friend. 
2. Do NOT use roleplay asterisks under any circumstances (e.g. absolutely no *leans in*, *purrs*, or *twitches whiskers*).
3. Do NOT act like a robot or an AI. 
4. Avoid repetitive or dramatic phrasing. Be a genuine, good listener.`;

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

        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${env.GEMINI_API_KEY}`, {
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
        return new Response(JSON.stringify({ 
          error: "Both AI APIs failed",
          groqError: groqError.message,
          geminiError: geminiError.message
        }), { status: 500, headers: corsHeaders });
      }
    }
  },
};
