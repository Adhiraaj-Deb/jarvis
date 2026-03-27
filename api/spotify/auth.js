export default function handler(req, res) {
  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    scope: 'user-read-playback-state user-modify-playback-state streaming',
    show_dialog: 'true',
  });
  
  res.redirect(`https://accounts.spotify.com/authorize?${params}`);
}
