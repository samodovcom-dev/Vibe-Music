
class VibePlaylists {
    constructor() {
        this.playlistsKey = "vibe_music_playlists";
        this.favoritesKey = "vibe_music_favorites";

        this.playlists = this.load(this.playlistsKey, []);
        this.favorites = this.load(this.favoritesKey, []);

        this.ensureFavorites();
    }

    load(key, fallback) {
        try {
            const data = localStorage.getItem(key);

            if (!data) return fallback;

            const parsed = JSON.parse(data);

            return Array.isArray(parsed) ? parsed : fallback;
        } catch (error) {
            console.error("Ошибка загрузки данных:", error);
            return fallback;
        }
    }

    save() {
        try {
            localStorage.setItem(
                this.playlistsKey,
                JSON.stringify(this.playlists)
            );

            localStorage.setItem(
                this.favoritesKey,
                JSON.stringify(this.favorites)
            );
        } catch (error) {
            console.error("Ошибка сохранения:", error);
        }
    }

    ensureFavorites() {
        if (!this.playlists.some(p => p.id === "favorites")) {
            this.playlists.unshift({
                id: "favorites",
                name: "Избранное",
                tracks: [],
                createdAt: Date.now(),
                system: true
            });
        }

        this.save();
    }

    create(name) {
        const playlistName = String(name || "").trim();

        if (!playlistName) {
            throw new Error("Введите название плейлиста.");
        }

        const playlist = {
            id: this.createId(),
            name: playlistName,
            tracks: [],
            createdAt: Date.now(),
            system: false
        };

        this.playlists.push(playlist);
        this.save();

        return playlist;
    }

    createId() {
        if (
            window.crypto &&
            typeof window.crypto.randomUUID === "function"
        ) {
            return window.crypto.randomUUID();
        }

        return "playlist_" + Date.now() + "_" +
            Math.random().toString(36).slice(2);
    }

    delete(id) {
        if (id === "favorites") return false;

        const index = this.playlists.findIndex(
            playlist => playlist.id === id
        );

        if (index === -1) return false;

        this.playlists.splice(index, 1);
        this.save();

        return true;
    }

    addTrack(playlistId, track) {
        if (!track || !track.url) return false;

        const playlist = this.getPlaylist(playlistId);

        if (!playlist) return false;

        const exists = playlist.tracks.some(
            item => item.id === track.id
        );

        if (exists) return false;

        playlist.tracks.push({ ...track });
        this.save();

        return true;
    }

    removeTrack(playlistId, trackId) {
        const playlist = this.getPlaylist(playlistId);

        if (!playlist) return false;

        playlist.tracks = playlist.tracks.filter(
            track => track.id !== trackId
        );

        this.save();

        return true;
    }

    toggleFavorite(track) {
        if (!track || !track.url) return false;

        const exists = this.favorites.some(
            item => item.id === track.id
        );

        if (exists) {
            this.favorites = this.favorites.filter(
                item => item.id !== track.id
            );
        } else {
            this.favorites.push({ ...track });
        }

        const favoritesPlaylist = this.getPlaylist("favorites");

        if (favoritesPlaylist) {
            favoritesPlaylist.tracks = [...this.favorites];
        }

        this.save();

        return !exists;
    }

    isFavorite(trackId) {
        return this.favorites.some(
            track => track.id === trackId
        );
    }

    getFavorites() {
        return [...this.favorites];
    }

    getAll() {
        return this.playlists.map(playlist => ({
            ...playlist,
            tracks: [...playlist.tracks]
        }));
    }

    getPlaylist(id) {
        return this.playlists.find(
            playlist => playlist.id === id
        ) || null;
    }

    getPlaylistTracks(id) {
        const playlist = this.getPlaylist(id);

        return playlist ? [...playlist.tracks] : [];
    }

    clearFavorites() {
        this.favorites = [];

        const favoritesPlaylist = this.getPlaylist("favorites");

        if (favoritesPlaylist) {
            favoritesPlaylist.tracks = [];
        }

        this.save();
    }
}

window.VibePlaylists = new VibePlaylists();
