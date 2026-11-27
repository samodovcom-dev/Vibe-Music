
class VibeSearch {
    constructor() {
        this.apiUrl = "https://api.jamendo.com/v3.0";
        this.clientId = "YOUR_JAMENDO_CLIENT_ID";
    }

    async search(query) {
        const text = String(query || "").trim();

        if (!text) {
            return [];
        }

        if (
            !this.clientId ||
            this.clientId === "YOUR_JAMENDO_CLIENT_ID"
        ) {
            console.error("Сначала добавь Jamendo Client ID.");
            throw new Error("Не указан API Client ID.");
        }

        const params = new URLSearchParams({
            client_id: this.clientId,
            format: "json",
            limit: "30",
            search: text,
            audioformat: "mp32",
            include: "musicinfo",
            order: "popularity_total"
        });

        const response = await fetch(
            `${this.apiUrl}/tracks/?${params.toString()}`
        );

        if (!response.ok) {
            throw new Error("Ошибка соединения с Jamendo.");
        }

        const data = await response.json();

        if (data.headers && data.headers.status !== "success") {
            throw new Error(
                data.headers.error_message || "Ошибка поиска."
            );
        }

        return (data.results || []).map(track => ({
            id: "jamendo_" + track.id,
            title: track.name || "Без названия",
            artist: track.artist_name || "Неизвестный исполнитель",
            album: track.album_name || "",
            cover: track.album_image || "",
            url: track.audio || "",
            duration: Number(track.duration) || 0,
            source: "Jamendo",
            license: track.license_ccurl || "",
            download: track.audiodownload || "",
            downloadAllowed: Boolean(track.audiodownload_allowed)
        })).filter(track => track.url);
    }

    async getPopular() {
        if (
            !this.clientId ||
            this.clientId === "YOUR_JAMENDO_CLIENT_ID"
        ) {
            throw new Error("Не указан API Client ID.");
        }

        const params = new URLSearchParams({
            client_id: this.clientId,
            format: "json",
            limit: "30",
            audioformat: "mp32",
            order: "popularity_total"
        });

        const response = await fetch(
            `${this.apiUrl}/tracks/?${params.toString()}`
        );

        if (!response.ok) {
            throw new Error("Не удалось загрузить популярную музыку.");
        }

        const data = await response.json();

        return (data.results || []).map(track => ({
            id: "jamendo_" + track.id,
            title: track.name || "Без названия",
            artist: track.artist_name || "Неизвестный исполнитель",
            album: track.album_name || "",
            cover: track.album_image || "",
            url: track.audio || "",
            duration: Number(track.duration) || 0,
            source: "Jamendo",
            license: track.license_ccurl || "",
            download: track.audiodownload || "",
            downloadAllowed: Boolean(track.audiodownload_allowed)
        })).filter(track => track.url);
    }
}

window.VibeSearch = new VibeSearch();
