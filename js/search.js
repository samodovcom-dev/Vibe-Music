
"use strict";

class VibeMusicSearch {
    constructor() {
        this.api = "https://api.jamendo.com/v3.0";
        this.clientId = "";
        this.limit = 20;
    }

    // Поиск музыки
    async search(query) {
        if (!query || !query.trim()) {
            return [];
        }

        const url = new URL(this.api + "/tracks/");

        url.searchParams.set("format", "json");
        url.searchParams.set("limit", this.limit);
        url.searchParams.set("search", query.trim());
        url.searchParams.set("audioformat", "mp32");
        url.searchParams.set("include", "musicinfo");

        if (this.clientId) {
            url.searchParams.set("client_id", this.clientId);
        }

        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error("Ошибка интернет-соединения");
            }

            const data = await response.json();

            if (!data.results) {
                return [];
            }

            return data.results.map(track => ({
                id: track.id,
                title: track.name,
                artist: track.artist_name,
                album: track.album_name,
                cover: track.album_image,
                audio: track.audio,
                duration: track.duration,
                source: "Jamendo",
                license: track.license_ccurl || ""
            }));

        } catch (error) {
            console.error("Ошибка поиска:", error);
            throw error;
        }
    }

    // Популярная музыка
    async getPopular() {
        const url = new URL(this.api + "/tracks/");

        url.searchParams.set("format", "json");
        url.searchParams.set("limit", this.limit);
        url.searchParams.set("order", "popularity_total");
        url.searchParams.set("audioformat", "mp32");

        if (this.clientId) {
            url.searchParams.set("client_id", this.clientId);
        }

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Не удалось загрузить музыку");
        }

        const data = await response.json();

        return (data.results || []).map(track => ({
            id: track.id,
            title: track.name,
            artist: track.artist_name,
            album: track.album_name,
            cover: track.album_image,
            audio: track.audio,
            duration: track.duration,
            source: "Jamendo",
            license: track.license_ccurl || ""
        }));
    }
}

window.VibeSearch = new VibeMusicSearch();
