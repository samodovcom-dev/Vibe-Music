
document.addEventListener("DOMContentLoaded", () => {
    const player = window.VibeAudioPlayer;
    const search = window.VibeSearch;
    const playlists = window.VibePlaylists;

    const $ = id => document.getElementById(id);

    const elements = {
        search: $("search"),
        searchBtn: $("searchBtn"),
        searchResults: $("searchResults"),
        cards: $("cards"),
        addMusic: $("addMusic"),
        fileInput: $("fileInput"),
        playlistName: $("playlistName"),
        createPlaylist: $("createPlaylist"),
        playlistList: $("playlistList"),
        nowCover: $("nowCover"),
        nowTitle: $("nowTitle"),
        nowArtist: $("nowArtist"),
        play: $("play"),
        previous: $("previous"),
        next: $("next"),
        shuffle: $("shuffle"),
        repeat: $("repeat"),
        volume: $("volume"),
        progressBar: $("progressBar"),
        fill: $("fill"),
        elapsed: $("elapsed"),
        duration: $("duration"),
        equalizer: $("equalizer")
    };

    let library = [];
    let currentSearchResults = [];

    const defaultCover =
        "https://placehold.co/500x500/211638/ffffff?text=VIBE";

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[char]);
    }

    function formatTime(seconds) {
        if (!Number.isFinite(seconds)) return "0:00";

        const minutes = Math.floor(seconds / 60);
        const remaining = Math.floor(seconds % 60);

        return `${minutes}:${String(remaining).padStart(2, "0")}`;
    }

    function notify(message) {
        let toast = $("vibeToast");

        if (!toast) {
            toast = document.createElement("div");
            toast.id = "vibeToast";

            Object.assign(toast.style, {
                position: "fixed",
                bottom: "25px",
                left: "50%",
                transform: "translateX(-50%)",
                background: "#241632",
                color: "#fff",
                border: "1px solid #9b4dff",
                padding: "13px 20px",
                borderRadius: "14px",
                zIndex: "9999",
                boxShadow: "0 5px 25px #0008",
                maxWidth: "90%",
                textAlign: "center"
            });

            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.style.display = "block";

        clearTimeout(toast.timer);

        toast.timer = setTimeout(() => {
            toast.style.display = "none";
        }, 2500);
    }

    function createTrackCard(track, index, source) {
        const card = document.createElement("article");

        card.className = "track-card";

        const cover = escapeHTML(track.cover || defaultCover);
        const title = escapeHTML(track.title || "Без названия");
        const artist = escapeHTML(track.artist || "Неизвестный исполнитель");

        card.innerHTML = `
            <img src="${cover}" alt="Обложка"
                 onerror="this.src='${defaultCover}'">

            <h3>${title}</h3>
            <p>${artist}</p>

            <button class="track-play">▶ Слушать</button>
            <button class="track-favorite">
                ${playlists.isFavorite(track.id) ? "♥" : "♡"}
            </button>
        `;

        card.querySelector(".track-play").addEventListener("click", () => {
            if (source === "library") {
                player.setPlaylist(library, index);
            } else {
                player.setPlaylist(currentSearchResults, index);
            }

            player.play();
        });

        card.querySelector(".track-favorite").addEventListener("click", () => {
            const added = playlists.toggleFavorite(track);

            card.querySelector(".track-favorite").textContent =
                added ? "♥" : "♡";

            renderLibrary();
            notify(added ? "Добавлено в избранное ♥" : "Удалено из избранного");
        });

        return card;
    }

    function renderLibrary() {
        if (!elements.cards) return;

        elements.cards.innerHTML = "";

        const favoriteCard = document.createElement("article");
        favoriteCard.className = "track-card";

        favoriteCard.innerHTML = `
            <h3>♥ Избранное</h3>
            <p>${playlists.getFavorites().length} треков</p>
            <button>Открыть</button>
        `;

        favoriteCard.querySelector("button").addEventListener("click", () => {
            const tracks = playlists.getFavorites();

            if (!tracks.length) {
                notify("В избранном пока нет музыки");
                return;
            }

            player.setPlaylist(tracks, 0);
            player.play();
        });

        elements.cards.appendChild(favoriteCard);

        library.forEach((track, index) => {
            elements.cards.appendChild(
                createTrackCard(track, index, "library")
            );
        });
    }

    function renderSearchResults(tracks) {
        if (!elements.searchResults) return;

        elements.searchResults.innerHTML = "";

        if (!tracks.length) {
            elements.searchResults.textContent = "Музыка не найдена.";
            return;
        }

        tracks.forEach((track, index) => {
            elements.searchResults.appendChild(
                createTrackCard(track, index, "search")
            );
        });
    }

    function renderPlaylists() {
        if (!elements.playlistList) return;

        elements.playlistList.innerHTML = "";

        playlists.getAll().forEach(playlist => {
            const card = document.createElement("article");

            card.className = "playlist-card";

            const name = escapeHTML(playlist.name);
            const count = playlist.tracks.length;

            card.innerHTML = `
                <h3>♫ ${name}</h3>
                <p>${count} треков</p>
                <button class="open-playlist">▶ Открыть</button>
                ${playlist.id !== "favorites"
                    ? '<button class="delete-playlist">Удалить</button>'
                    : ""}
            `;

            card.querySelector(".open-playlist").addEventListener("click", () => {
                const tracks = playlists.getPlaylistTracks(playlist.id);

                if (!tracks.length) {
                    notify("Этот плейлист пока пуст");
                    return;
                }

                player.setPlaylist(tracks, 0);
                player.play();
            });

            const deleteButton = card.querySelector(".delete-playlist");

            if (deleteButton) {
                deleteButton.addEventListener("click", () => {
                    if (confirm("Удалить этот плейлист?")) {
                        playlists.delete(playlist.id);
                        renderPlaylists();
                        notify("Плейлист удалён");
                    }
                });
            }

            elements.playlistList.appendChild(card);
        });
    }

    async function performSearch() {
        const query = elements.search?.value.trim();

        if (!query) {
            notify("Введи название песни или исполнителя");
            return;
        }

        elements.searchBtn.disabled = true;
        elements.searchBtn.textContent = "Поиск...";

        elements.searchResults.textContent = "Ищем музыку...";

        try {
            currentSearchResults = await search.search(query);
            renderSearchResults(currentSearchResults);

            if (!currentSearchResults.length) {
                notify("Ничего не найдено");
            }
        } catch (error) {
            console.error(error);

            elements.searchResults.textContent =
                "Не удалось выполнить поиск. Проверь интернет и Client ID.";

            notify("Ошибка поиска музыки");
        } finally {
            elements.searchBtn.disabled = false;
            elements.searchBtn.textContent = "Найти";
        }
    }

    function addLocalFiles(files) {
        const audioFiles = Array.from(files).filter(file =>
            file.type.startsWith("audio/")
        );

        if (!audioFiles.length) {
            notify("Аудиофайлы не найдены");
            return;
        }

        audioFiles.forEach(file => {
            const url = URL.createObjectURL(file);

            library.push({
                id: "local_" + Date.now() + "_" + Math.random(),
                title: file.name.replace(/\.[^/.]+$/, ""),
                artist: "Моя музыка",
                cover: defaultCover,
                url,
                duration: 0,
                source: "Local",
                file
            });
        });

        renderLibrary();
        notify(`Добавлено треков: ${audioFiles.length}`);
    }

    function updatePlayer(state) {
        const track = state.track;

        if (track) {
            elements.nowTitle.textContent =
                track.title || "Без названия";

            elements.nowArtist.textContent =
                track.artist || "Неизвестный исполнитель";

            elements.nowCover.src = track.cover || defaultCover;
        } else {
            elements.nowTitle.textContent = "Выбери трек";
            elements.nowArtist.textContent = "VIBE MUSIC";
            elements.nowCover.src = defaultCover;
        }

        elements.play.textContent =
            state.isPlaying ? "Ⅱ" : "▶";

        elements.equalizer.classList.toggle(
            "playing",
            state.isPlaying
        );

        elements.shuffle.style.color =
            state.isShuffle ? "#e044ff" : "#ffffff";

        elements.repeat.textContent =
            state.repeatMode === 1 ? "🔂" :
            state.repeatMode === 2 ? "🔁" : "🔁";

        elements.elapsed.textContent =
            formatTime(state.currentTime);

        elements.duration.textContent =
            formatTime(state.duration);

        const percent = state.duration > 0
            ? state.currentTime / state.duration * 100
            : 0;

        elements.fill.style.width = percent + "%";
    }

    elements.searchBtn?.addEventListener("click", performSearch);

    elements.search?.addEventListener("keydown", event => {
        if (event.key === "Enter") performSearch();
    });

    elements.addMusic?.addEventListener("click", () => {
        elements.fileInput.click();
    });

    elements.fileInput?.addEventListener("change", event => {
        addLocalFiles(event.target.files);
        event.target.value = "";
    });

    elements.createPlaylist?.addEventListener("click", () => {
        try {
            playlists.create(elements.playlistName.value);
            elements.playlistName.value = "";

            renderPlaylists();
            notify("Плейлист создан!");
        } catch (error) {
            notify(error.message);
        }
    });

    elements.playlistName?.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            elements.createPlaylist.click();
        }
    });

    elements.play?.addEventListener("click", () => {
        player.toggle();
    });

    elements.previous?.addEventListener("click", () => {
        player.previous();
    });

    elements.next?.addEventListener("click", () => {
        player.next();
    });

    elements.shuffle?.addEventListener("click", () => {
        const enabled = player.toggleShuffle();
        notify(enabled ? "Перемешивание включено" : "Перемешивание выключено");
    });

    elements.repeat?.addEventListener("click", () => {
        const mode = player.toggleRepeat();

        notify(
            mode === 0 ? "Повтор выключен" :
            mode === 1 ? "Повтор одного трека" :
            "Повтор всего плейлиста"
        );
    });

    elements.volume?.addEventListener("input", event => {
        player.setVolume(Number(event.target.value) / 100);
    });

    elements.progressBar?.addEventListener("click", event => {
        const rect = elements.progressBar.getBoundingClientRect();

        const percent =
            (event.clientX - rect.left) / rect.width * 100;

        player.seekPercent(percent);
    });

    window.addEventListener("vibe:update", event => {
        updatePlayer(event.detail);
    });

    window.addEventListener("vibe:change", event => {
        updatePlayer(event.detail);
    });

    window.addEventListener("vibe:play", event => {
        updatePlayer(event.detail);
    });

    window.addEventListener("vibe:pause", event => {
        updatePlayer(event.detail);
    });

    window.addEventListener("vibe:error", () => {
        notify("Не удалось воспроизвести этот трек");
    });

    renderLibrary();
    renderPlaylists();
    updatePlayer(player.getState());

    console.log("VIBE MUSIC запущен!");
});
