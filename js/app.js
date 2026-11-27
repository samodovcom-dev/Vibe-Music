
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

    // Создание карточки трека
    function createTrackCard(track, index, online = false) {
        const card = document.createElement("article");
        card.className = "track-card";

        const cover = document.createElement("img");
        cover.className = "cover";
        cover.src = track.cover || "https://placehold.co/300x300/211638/ffffff?text=VIBE";
        cover.alt = track.title || "Music";

        const title = document.createElement("h3");
        title.textContent = track.title || "Без названия";

        const artist = document.createElement("p");
        artist.textContent = track.artist || "Неизвестный исполнитель";

        const bottom = document.createElement("div");
        bottom.className = "card-bottom";

        const heart = document.createElement("button");
        heart.className = "heart";
        heart.textContent = playlists.isFavorite(track.id) ? "♥" : "♡";

        heart.onclick = () => {
            playlists.toggleFavorite(track);
            heart.textContent = playlists.isFavorite(track.id) ? "♥" : "♡";
        };

        const play = document.createElement("button");
        play.className = "mini-play";
        play.textContent = "▶";

        play.onclick = () => {
            if (online) {
                player.setPlaylist(onlineTracks);
                player.play(index);
            } else {
                player.setPlaylist(localTracks);
                player.play(index);
            }
        };

        bottom.append(heart, play);
        card.append(cover, title, artist, bottom);

        return card;
    }

    // Отображение онлайн-музыки
    function renderOnlineTracks() {
        const container = $("searchResults");
        container.innerHTML = "";

        if (!onlineTracks.length) {
            container.textContent = "Ничего не найдено.";
            return;
        }

        onlineTracks.forEach((track, index) => {
            container.appendChild(
                createTrackCard(track, index, true)
            );
        });
    }

    // Поиск
    async function performSearch() {
        const query = $("search").value.trim();

        if (!query) return;

        $("searchResults").textContent = "Ищем музыку...";

        try {
            onlineTracks = await search.search(query);
            renderOnlineTracks();
        } catch (error) {
            $("searchResults").textContent =
                "Не удалось выполнить поиск. Проверь интернет и настройки API.";
        }
    }

    $("searchBtn").addEventListener("click", performSearch);

    $("search").addEventListener("keydown", event => {
        if (event.key === "Enter") performSearch();
    });

    // Управление плеером
    $("play").addEventListener("click", () => player.toggle());
    $("next").addEventListener("click", () => player.next());
    $("previous").addEventListener("click", () => player.previous());

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
    };

    // Плейлисты
    function renderPlaylists() {
        const container = $("playlistList");
        container.innerHTML = "";

        playlists.getAll().forEach(playlist => {
            const item = document.createElement("div");
            item.className = "playlist-item";

            const name = document.createElement("strong");
            name.textContent = playlist.name +
                " (" + playlist.tracks.length + ")";

            const add = document.createElement("button");
            add.textContent = "Добавить текущую музыку";

            add.onclick = () => {
                const track = player.getCurrentTrack();

                if (!track) {
                    alert("Сначала выбери трек.");
                    return;
                }

                if (playlists.addTrack(playlist.id, track)) {
                    renderPlaylists();
                } else {
                    alert("Трек уже добавлен или плейлист недоступен.");
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
        const name = $("playlistName").value;

        try {
            playlists.create(name);
            $("playlistName").value = "";
            renderPlaylists();
        } catch (error) {
            alert(error.message);
        }
    });

    // Локальная музыка
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "audio/*";
    fileInput.multiple = true;
    fileInput.hidden = true;

    document.body.appendChild(fileInput);

    const localButton = document.createElement("button");
    localButton.textContent = "＋ Добавить музыку с устройства";
    $("cards").before(localButton);

    localButton.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", () => {
        const files = Array.from(fileInput.files);

        localTracks = files.map((file, index) => ({
            id: "local-" + index + "-" + file.name,
            title: file.name.replace(/\.[^/.]+$/, ""),
            artist: "Моя музыка",
            cover: "https://placehold.co/300x300/211638/ffffff?text=VIBE",
            audio: URL.createObjectURL(file)
        }));

        player.setPlaylist(localTracks);

        const container = $("cards");
        container.innerHTML = "";

        localTracks.forEach((track, index) => {
            container.appendChild(createTrackCard(track, index));
        });
    });

    // Полоса перемотки
    $("progressBar").addEventListener("click", event => {
        const rect = event.currentTarget.getBoundingClientRect();
        const percent = (event.clientX - rect.left) / rect.width * 100;
        player.seekPercent(percent);
    });

    renderPlaylists();

    console.log("VIBE MUSIC запущен!");
});
