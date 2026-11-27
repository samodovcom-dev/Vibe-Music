
"use strict";

document.addEventListener("DOMContentLoaded", () => {

    const $ = id => document.getElementById(id);

    const player = window.VibeAudioPlayer;
    const search = window.VibeSearch;
    const playlists = window.VibePlaylists;

    let localTracks = [];
    let onlineTracks = [];

    function formatTime(seconds) {
        if (!Number.isFinite(seconds)) return "0:00";

        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);

        return `${min}:${String(sec).padStart(2, "0")}`;
    }

    function createCard(track, index, online = false) {
        const card = document.createElement("article");
        card.className = "track-card";

        const cover = document.createElement("img");
        cover.className = "cover";
        cover.src = track.cover ||
            "https://placehold.co/300x300/211638/ffffff?text=VIBE";
        cover.alt = track.title;

        const title = document.createElement("h3");
        title.textContent = track.title;

        const artist = document.createElement("p");
        artist.textContent = track.artist || "Неизвестный исполнитель";

        const bottom = document.createElement("div");
        bottom.className = "card-bottom";

        const heart = document.createElement("button");
        heart.className = "heart";
        heart.textContent = playlists.isFavorite(track.id) ? "♥" : "♡";

        heart.onclick = () => {
            playlists.toggleFavorite(track);
            heart.textContent =
                playlists.isFavorite(track.id) ? "♥" : "♡";
        };

        const play = document.createElement("button");
        play.className = "mini-play";
        play.textContent = "▶";

        play.onclick = () => {
            const list = online ? onlineTracks : localTracks;
            player.setPlaylist(list);
            player.play(index);
        };

        bottom.append(heart, play);
        card.append(cover, title, artist, bottom);

        return card;
    }

    function renderTracks(container, tracks, online = false) {
        container.innerHTML = "";

        if (!tracks.length) {
            container.textContent = "Музыка пока не найдена.";
            return;
        }

        tracks.forEach((track, index) => {
            container.appendChild(createCard(track, index, online));
        });
    }

    // ПОИСК МУЗЫКИ

    async function performSearch() {
        const query = $("search").value.trim();

        if (!query) return;

        $("searchResults").textContent = "Ищем музыку...";

        try {
            onlineTracks = await search.search(query);
            renderTracks($("searchResults"), onlineTracks, true);
        } catch (error) {
            console.error(error);
            $("searchResults").textContent =
                "Ошибка поиска. Проверь интернет и настройки API.";
        }
    }

    $("searchBtn").addEventListener("click", performSearch);

    $("search").addEventListener("keydown", event => {
        if (event.key === "Enter") performSearch();
    });

    // УПРАВЛЕНИЕ ПЛЕЕРОМ

    $("play").addEventListener("click", () => player.toggle());
    $("next").addEventListener("click", () => player.next());
    $("previous").addEventListener("click", () => player.previous());

    $("volume").addEventListener("input", event => {
        player.setVolume(Number(event.target.value) / 100);
    });

    $("shuffle").addEventListener("click", () => {
        const enabled = player.toggleShuffle();
        $("shuffle").classList.toggle("active", enabled);
    });

    $("repeat").addEventListener("click", () => {
        const enabled = player.toggleRepeat();
        $("repeat").classList.toggle("active", enabled);
    });

    player.onUpdate = state => {
        $("play").textContent = state.playing ? "❚❚" : "▶";

        if (state.track) {
            $("nowTitle").textContent = state.track.title;
            $("nowArtist").textContent = state.track.artist;
            $("nowCover").src = state.track.cover ||
                "https://placehold.co/300x300/211638/ffffff?text=VIBE";
        }

        $("elapsed").textContent = formatTime(state.currentTime);
        $("duration").textContent = formatTime(state.duration);

        $("fill").style.width = state.duration
            ? (state.currentTime / state.duration * 100) + "%"
            : "0%";

        $("shuffle").classList.toggle("active", state.shuffle);
        $("repeat").classList.toggle("active", state.repeat);
    };

    // ПЕРЕМОТКА

    $("progressBar").addEventListener("click", event => {
        const rect = event.currentTarget.getBoundingClientRect();

        if (!rect.width) return;

        const percent =
            (event.clientX - rect.left) / rect.width * 100;

        player.seekPercent(percent);
    });

    // ЛОКАЛЬНАЯ МУЗЫКА

    $("addMusic").addEventListener("click", () => {
        $("fileInput").click();
    });

    $("fileInput").addEventListener("change", event => {
        const files = Array.from(event.target.files);

        const newTracks = files.map(file => ({
            id: "local-" + crypto.randomUUID(),
            title: file.name.replace(/\.[^/.]+$/, ""),
            artist: "Моя музыка",
            cover: "https://placehold.co/300x300/211638/ffffff?text=VIBE",
            audio: URL.createObjectURL(file)
        }));

        localTracks.push(...newTracks);

        player.setPlaylist(localTracks);
        renderTracks($("cards"), localTracks);
    });

    // ПЛЕЙЛИСТЫ

    function renderPlaylists() {
        const container = $("playlistList");
        container.innerHTML = "";

        playlists.getAll().forEach(playlist => {
            const item = document.createElement("div");
            item.className = "playlist-item";

            const name = document.createElement("strong");
            name.textContent =
                playlist.name + " (" + playlist.tracks.length + ")";

            const add = document.createElement("button");
            add.textContent = "Добавить текущий трек";

            add.onclick = () => {
                const track = player.getCurrentTrack();

                if (!track) {
                    alert("Сначала выбери музыку.");
                    return;
                }

                if (playlists.addTrack(playlist.id, track)) {
                    renderPlaylists();
                } else {
                    alert("Трек уже есть в плейлисте.");
                }
            };

            item.append(name, add);

            if (playlist.id !== "liked") {
                const remove = document.createElement("button");
                remove.textContent = "Удалить";

                remove.onclick = () => {
                    playlists.delete(playlist.id);
                    renderPlaylists();
                };

                item.append(remove);
            }

            container.appendChild(item);
        });
    }

    $("createPlaylist").addEventListener("click", () => {
        try {
            playlists.create($("playlistName").value);
            $("playlistName").value = "";
            renderPlaylists();
        } catch (error) {
            alert(error.message);
        }
    });

    // ЗАПУСК

    renderPlaylists();

    console.log("VIBE MUSIC запущен!");
});
