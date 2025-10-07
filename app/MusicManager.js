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
          "Basic " +
          Buffer.from(clientId + ":" + clientSecret).toString("base64"),
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
    let url = `https://api.spotify.com/v1/search?q=track:${encodeURIComponent(
      query
    )}&type=track&limit=${limit}`;
    let response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    let items = response.data.tracks.items;

    // If no results, fallback to broad search
    if (items.length === 0) {
      url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(
        query
      )}&type=track&limit=${limit}`;
      response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      items = response.data.tracks.items;
    }

    if (items.length > 0) {
      return items.map((track) => ({
        title: track.name,
        url: track.external_urls.spotify,
        artist: track.artists.map((a) => a.name).join(", "),
        image: track.album.images[0]?.url || null,
        preview_url: track.preview_url || null,
      }));
    }

    return [];
  }

  async getArtistGenres(artistName) {
    const token = await this.getValidToken();
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(
      artistName
    )}&type=artist&limit=1`;

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

  // ✅ Get available genre seeds from Spotify
  async getAvailableGenres(limit = 50) {
  const token = await this.getValidToken();

  // Random letter search
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const randomLetter = letters[Math.floor(Math.random() * letters.length)];

  const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(randomLetter)}&type=artist&limit=${limit}`;
  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  // Collect genres from all artists returned
  const genres = new Set();
  response.data.artists.items.forEach(artist => {
    if (artist.genres && artist.genres.length) {
      artist.genres.forEach(g => genres.add(g));
    }
  });

  return Array.from(genres);
}

  // ✅ Get a random artist by picking a random genre and searching Spotify
  async getRandomArtist() {
  const token = await this.getValidToken();

  // Use a random letter to search artists
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const randomLetter = letters[Math.floor(Math.random() * letters.length)];

  const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(randomLetter)}&type=artist&limit=50`;

  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const artists = response.data.artists.items.filter(a => a.genres && a.genres.length > 0);
  if (!artists.length) return null;

  // Pick a random artist
  const randomArtist = artists[Math.floor(Math.random() * artists.length)];

  return {
    name: randomArtist.name,
    genres: randomArtist.genres,
  };
}
}

module.exports = MusicManager;
