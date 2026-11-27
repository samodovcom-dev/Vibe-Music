
"use strict";

const VibeMusic = (() => {

    const tracks = [
        {
            title: "Dreamer",
            artist: "Demo Artist",
            cover: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=500",
            audio: ""
        },
        {
            title: "Believer",
            artist: "Demo Artist",
            cover: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=500",
            audio: ""
        },
        {
            title: "Faded",
            artist: "Demo Artist",
            cover: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=500",
            audio: ""
        },
        {
            title: "Thunder",
            artist: "Demo Artist",
            cover: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=500",
            audio: ""
        },
        {
            title: "Night Changes",
            artist: "Demo Artist",
            cover: "https://images.unsplash.com/photo-1492683847040-0542c2b4b4b4?w=500",
            audio: ""
        },
        {
            title: "Infinity",
            artist: "Demo Artist",
            cover: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=500",
            audio: ""
        }
    ];

    let currentIndex = 0;
    let audio = null;
    let favorites = [];

    const $ = id => document.getElementById(id);

    function formatTime(seconds) {
        if (!Number.isFinite(seconds)) return "0:00";

        const minutes = Math.floor(seconds / 60);
        const remaining = Math.floor(seconds % 60);

        return `${minutes}:${String(remaining).padStart(2, "0")}`;
    }

    // Отображение музыкальных карточек
    function renderTracks(list = tracks) {
        const container = $("cards");

        if (!container) return;

        container.innerHTML = "";

        list.forEach(track => {
            const index = tracks.indexOf(track);

            const card = document.createElement("article");
            card.className = "track-card";

            const cover = document.createElement("img");
            cover.className = "cover";
            cover.src = track.cover;
            cover.alt = track.title;

            const title = document.createElement("h3");
            title.textContent = track.title;

            const artist = document.createElement("p");
            artist.textContent = track.artist;

            const bottom = document.createElement("div");
            bottom.className = "card-bottom";

            const heart = document.createElement("button");
            heart.className = "heart";
            heart.textContent = favorites.includes(index) ? "♥" : "♡";

            if (favorites.includes(index)) {
                heart.classList.add("liked");
            }

            heart.onclick = () => toggleFavorite(index);

            const play = document.createElement("button");
            play.className = "mini-play";
            play.textContent = "▶";
            play.onclick = () => playTrack(index);

            bottom.append(heart, play);
            card.append(cover, title, artist, bottom);

            container.appendChild(card);
        });
    }

    // Обновление музыкального плеера
    function updatePlayer() {
        const track = tracks[currentIndex];

        if (!track) return;

        if ($("nowCover")) {
            $("nowCover").src = track.cover;
        }

        if ($("nowTitle")) {
            $("nowTitle").textContent = track.title;
        }

        if ($("nowArtist")) {
            $("nowArtist").textContent = track.artist;
        }

        updatePlayButton();
    }

    function updatePlayButton() {
        if (!$("play")) return;

        $("play").textContent =
            audio && !audio.paused ? "❚❚" : "▶";
    }

    // Воспроизведение выбранной песни
    function playTrack(index) {
        if (index < 0 || index >= tracks.length) return;

        currentIndex = index;

        if (audio) {
            audio.pause();
            audio = null;
        }

        const track = tracks[currentIndex];

        updatePlayer();

        if (!track.audio) {
            $("nowArtist").textContent =
                track.artist + " · аудио пока не подключено";

            return;
        }

        audio = new Audio(track.audio);

        audio.addEventListener("timeupdate", updateProgress);

        audio.addEventListener("ended", nextTrack);

        audio.addEventListener("loadedmetadata", updateProgress);

        audio.play()
            .then(updatePlayButton)
            .catch(() => {
                updatePlayButton();
                $("nowArtist").textContent =
                    "Не удалось воспроизвести трек";
            });
    }

    // Пауза и продолжение
    function togglePlay() {
        if (!audio) {
            playTrack(currentIndex);
            return;
        }

        if (audio.paused) {
            audio.play().then(updatePlayButton);
        } else {
            audio.pause();
            updatePlayButton();
        }
    }

    // Следующий трек
    function nextTrack() {
        playTrack((currentIndex + 1) % tracks.length);
    }

    // Предыдущий трек
    function previousTrack() {
        playTrack(
            (currentIndex - 1 + tracks.length) % tracks.length
        );
    }

    // Избранное
    function toggleFavorite(index) {
        if (favorites.includes(index)) {
            favorites = favorites.filter(i => i !== index);
        } else {
            favorites.push(index);
        }

        renderTracks(getFilteredTracks());
    }

    // Поиск
    function getFilteredTracks() {
        const query = $("search")?.value.toLowerCase().trim() || "";

        return tracks.filter(track =>
            (track.title + " " + track.artist)
                .toLowerCase()
                .includes(query)
        );
    }

    // Прогресс воспроизведения
    function updateProgress() {
        if (!audio) return;

        const current = audio.currentTime;
        const duration = audio.duration || 0;

        if ($("elapsed")) {
            $("elapsed").textContent = formatTime(current);
        }

        if ($("duration")) {
            $("duration").textContent = formatTime(duration);
        }

        if ($("fill")) {
            $("fill").style.width =
                duration ? (current / duration * 100) + "%" : "0%";
        }
    }

    // Визуализатор
    function createVisualizer() {
        const container = $("bars");

        if (!container) return;

        container.innerHTML = "";

        for (let i = 0; i < 35; i++) {
            const bar = document.createElement("span");

            bar.style.setProperty(
                "--h",
                (10 + Math.random() * 35) + "px"
            );

            bar.style.setProperty(
                "--d",
                Math.random() + "s"
            );

            container.appendChild(bar);
        }
    }

    // Запуск приложения
    function init() {
        renderTracks();
        createVisualizer();

        $("search")?.addEventListener("input", () => {
            renderTracks(getFilteredTracks());
        });

        $("play")?.addEventListener("click", togglePlay);

        document.querySelectorAll(".controls button").forEach(button => {
            if (button.textContent.trim() === "◀|") {
                button.addEventListener("click", previousTrack);
            }

            if (button.textContent.trim() === "|▶") {
                button.addEventListener("click", nextTrack);
            }
        });

        updatePlayer();
    }

    return {
        init,
        playTrack,
        togglePlay,
        nextTrack,
        previousTrack,
        toggleFavorite
    };

})();

document.addEventListener("DOMContentLoaded", VibeMusic.init);
