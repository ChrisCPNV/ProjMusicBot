const axios = require("axios");

async function getAccessToken(clientId, clientSecret) {
  const tokenUrl = "https://accounts.spotify.com/api/token";

  const response = await axios.post(
    tokenUrl,
    new URLSearchParams({ grant_type: "client_credentials" }).toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization":
          "Basic " + Buffer.from(clientId + ":" + clientSecret).toString("base64"),
      },
    }
  );

  return response.data.access_token;
}

class MusicManager {
  constructor(clientId, clientSecret) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.token = null;
    this.tokenExpiresAt = 0;
  }

  async init() {
    const token = await getAccessToken(this.clientId, this.clientSecret);
    this.token = token;
    this.tokenExpiresAt = Date.now() + 3600 * 1000;
  }

  async getValidToken() {
    if (!this.token || Date.now() >= this.tokenExpiresAt) {
      await this.init();
    }
    return this.token;
  }

  async searchTracks(query, limit = 5) {
    const token = await this.getValidToken();

    // First try exact title search
    let url = `https://api.spotify.com/v1/search?q=track:${encodeURIComponent(query)}&type=track&limit=${limit}`;
    let response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    let items = response.data.tracks.items;

    // If no results, fallback to broad search
    if (items.length === 0) {
      url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`;
      response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      items = response.data.tracks.items;
    }

    if (items.length > 0) {
      return items.map(track => ({
        title: track.name,
        url: track.external_urls.spotify,
        artist: track.artists.map(a => a.name).join(', '),
        image: track.album.images[0]?.url || null,
        preview_url: track.preview_url || null,
      }));
    }

    return [];
  }

  // ✅ Now inside the class
  async getArtistGenres(artistName) {
    const token = await this.getValidToken();
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`;
    
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const artist = response.data.artists.items[0];
    if (!artist) return null;

    return {
      name: artist.name,
      genres: artist.genres,
    };
  }
}

module.exports = MusicManager;
