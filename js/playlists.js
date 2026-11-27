
"use strict";

class VibePlaylists {
    constructor() {
        this.storageKey = "vibe_music_playlists";
        this.favoriteKey = "vibe_music_favorites";

        this.playlists = this.load(this.storageKey, [
            { id: "liked", name: "Избранное", tracks: [] }
        ]);

        this.favorites = this.load(this.favoriteKey, []);
    }

    load(key, fallback) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : fallback;
        } catch {
            return fallback;
        }
    }

    save() {
        localStorage.setItem(
            this.storageKey,
            JSON.stringify(this.playlists)
        );

        localStorage.setItem(
            this.favoriteKey,
            JSON.stringify(this.favorites)
        );
    }

    create(name) {
        name = name.trim();

        if (!name) {
            throw new Error("Введите название плейлиста");
        }

        const playlist = {
            id: Date.now().toString(),
            name,
            tracks: []
        };

        this.playlists.push(playlist);
        this.save();

        return playlist;
    }

    delete(id) {
        if (id === "liked") return false;

        this.playlists = this.playlists.filter(
            playlist => playlist.id !== id
        );

        this.save();
        return true;
    }

    addTrack(playlistId, track) {
        const playlist = this.playlists.find(
            item => item.id === playlistId
        );

        if (!playlist || !track) return false;

        const exists = playlist.tracks.some(
            item => item.id === track.id
        );

        if (exists) return false;

        playlist.tracks.push(track);
        this.save();

        return true;
    }

    removeTrack(playlistId, trackId) {
        const playlist = this.playlists.find(
            item => item.id === playlistId
        );

        if (!playlist) return;

        playlist.tracks = playlist.tracks.filter(
            track => track.id !== trackId
        );

        this.save();
    }

    toggleFavorite(track) {
        if (!track || track.id === undefined) return false;

        const index = this.favorites.findIndex(
            item => item.id === track.id
        );

        if (index !== -1) {
            this.favorites.splice(index, 1);
        } else {
            this.favorites.push(track);
        }

        this.save();
        return index === -1;
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
        return [...this.playlists];
    }

    getPlaylist(id) {
        return this.playlists.find(
            playlist => playlist.id === id
        ) || null;
    }
}

window.VibePlaylists = new VibePlaylists();
