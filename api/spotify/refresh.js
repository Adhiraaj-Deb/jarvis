export default async function handler(req, res) {
  const { refresh_token } = req.body;
  
  if (!refresh_token) return res.status(400).send('No refresh token provided');
  
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token,
  });
  
  const r = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64'),
    },
    body,
  });
  
  const data = await r.json();
  
  if (!r.ok) {
    return res.status(r.status).json(data);
  }
  
  res.json({ access_token: data.access_token, expires_in: data.expires_in });
}
