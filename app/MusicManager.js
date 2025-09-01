const axios = require("axios");

class Music {
  constructor(title, url, artist, image = null) {
    this.title = title;
    this.url = url;
    this.artist = artist;
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

  async searchTrack(query) {
    const token = await this.getValidToken();

    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(
      query
    )}&type=track&limit=1`;

    const response = await axios.get(url, {
      headers: { Authorization: "Bearer " + token },
    });

    if (response.data.tracks.items.length > 0) {
      const track = response.data.tracks.items[0];
      return new Music(
        track.name,
        track.external_urls.spotify,
        track.artists.map((a) => a.name).join(", "),
        track.album.images[0]?.url || null
      );
    }

    return null;
  }
}

module.exports = MusicManager;
