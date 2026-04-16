import { corsHeaders } from '@supabase/supabase-js/cors'

const BACKEND_BASE = "https://cognivara-backend-service.onrender.com/api";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    // The path after the function name is the API route
    // e.g. /cognivara-proxy/user -> /api/user
    const pathParam = url.searchParams.get("path");
    if (!pathParam) {
      return new Response(JSON.stringify({ error: "Missing 'path' query param" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const targetUrl = `${BACKEND_BASE}/${pathParam}`;

    // Forward the request as-is (method, headers, body)
    const headers = new Headers();
    const contentType = req.headers.get("content-type");
    if (contentType) headers.set("content-type", contentType);

    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
      // Forward raw body (supports multipart/form-data and JSON)
      fetchOptions.body = await req.arrayBuffer();
    }

    const response = await fetch(targetUrl, fetchOptions);
    const responseBody = await response.arrayBuffer();

    return new Response(responseBody, {
      status: response.status,
      headers: {
        ...corsHeaders,
        "Content-Type": response.headers.get("content-type") || "application/json",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
