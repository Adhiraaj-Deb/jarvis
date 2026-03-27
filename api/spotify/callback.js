export default async function handler(req, res) {
  const { code } = req.query;
  
  if (!code) return res.status(400).send('No authorization code provided');
  
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
  });
  
  const r = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64'),
    },
    body,
  });
  
  const tokens = await r.json();
  
  if (!r.ok) {
    return res.status(r.status).json(tokens);
  }
  
  // Return a simple HTML page that passes the tokens back to the main app window
  // using postMessage, so that the popup can be closed automatically.
  res.setHeader('Content-Type', 'text/html');
  res.send(`
    <html>
      <head>
        <title>Spotify Connected</title>
      </head>
      <body>
        <p>Spotify connected successfully! You can close this window.</p>
        <script>
          window.opener.postMessage(
            { type: 'SPOTIFY_TOKENS', tokens: ${JSON.stringify(tokens)} },
            '*'
          );
          window.close();
        </script>
      </body>
    </html>
  `);
}
