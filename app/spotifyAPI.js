const axios = require("axios");

async function getAccessToken(clientId, clientSecret) {
  const tokenUrl = "https://accounts.spotify.com/api/token";
  const response = await axios.post(
    tokenUrl,
    new URLSearchParams({ grant_type: "client_credentials" }).toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "Basic " + Buffer.from(clientId + ":" + clientSecret).toString("base64"),
      },
    }
  );
  return response.data.access_token;
}

async function searchPlaylist(token, mood) {
  const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(mood)}&type=playlist&limit=1`;
  const response = await axios.get(url, {
    headers: { "Authorization": "Bearer " + token },
  });

  if (response.data.playlists.items.length > 0) {
    const playlist = response.data.playlists.items[0];
    return {
      title: playlist.name,
      url: playlist.external_urls.spotify,
      image: playlist.images[0]?.url || null,
      mood: mood,
    };
  } else {
    return null;
  }
}

