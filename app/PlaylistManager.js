const axios = require("axios");

class Playlist {
  constructor(title, url, mood, image = null) {
    this.title = title;
    this.url = url;
    this.mood = mood;
    this.image = image;
  }
}

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

class PlaylistManager {
  constructor(clientId, clientSecret) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.token = null;
    this.tokenExpiresAt = 0; // timestamp pour savoir quand renouveler
  }

  async init() {
    const token = await getAccessToken(this.clientId, this.clientSecret);
    this.token = token;
    // Par défaut, un token Spotify est valide 1h
    this.tokenExpiresAt = Date.now() + 3600 * 1000;
  }

  async getValidToken() {
    if (!this.token || Date.now() >= this.tokenExpiresAt) {
      await this.init();
    }
    return this.token;
  }

  async getPlaylist(mood) {
    const token = await this.getValidToken();

    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(
      mood
    )}&type=playlist&limit=1`;

    const response = await axios.get(url, {
      headers: { Authorization: "Bearer " + token },
    });

    if (response.data.playlists.items.length > 0) {
      const playlist = response.data.playlists.items[0];
      return new Playlist(
        playlist.name,
        playlist.external_urls.spotify,
        mood,
        playlist.images[0]?.url || null
      );
    }

    return null;
  }

  getRandomMood() {
    const moods = this.listMoods();
    return moods[Math.floor(Math.random() * moods.length)];
  }

  async getRandomPlaylist() {
    const randomMood = this.getRandomMood();
    return await this.getPlaylist(randomMood);
  }

  listMoods() {
    // Tu peux personnaliser cette liste à ta guise
    return ["chill", "focus", "sport", "party", "study", "happy", "sad"];
  }
}

module.exports = PlaylistManager;
