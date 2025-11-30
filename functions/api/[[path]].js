
// Cloudflare Pages Function for /api/*
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-api-key, content-type, x-client-info, apikey',
        'Access-Control-Max-Age': '86400',
      },
    });
  }
  
  // Build Supabase API Gateway URL
  // Maps /api/posts → /api-gateway/api/posts
  const supabaseUrl = `https://ryyimcbdvvufbtzheqah.supabase.co/functions/v1/api-gateway${url.pathname}${url.search}`;
  
  console.log('[Pages Function] Proxying:', request.method, url.pathname, '→', supabaseUrl);
  
  try {
    // Forward the request to Supabase
    const proxyResponse = await fetch(supabaseUrl, {
      method: request.method,
      headers: {
        'Content-Type': request.headers.get('Content-Type') || 'application/json',
        'x-api-key': request.headers.get('x-api-key') || '',
        'authorization': request.headers.get('authorization') || '',
        'x-client-info': request.headers.get('x-client-info') || '',
      },
      body: request.method !== 'GET' && request.method !== 'HEAD' 
        ? await request.text() 
        : undefined,
    });
    
    // Get response body
    const responseBody = await proxyResponse.text();
    
    // Return response with CORS headers
    return new Response(responseBody, {
      status: proxyResponse.status,
      statusText: proxyResponse.statusText,
      headers: {
        'Content-Type': proxyResponse.headers.get('Content-Type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-api-key, content-type, x-client-info, apikey',
      },
    });
  } catch (error) {
    console.error('[Pages Function] Error:', error);
    return new Response(JSON.stringify({ error: 'Proxy error', details: error.message }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
