
"use strict";

class VibePlayer {
    constructor() {
        this.audio = new Audio();
        this.playlist = [];
        this.currentIndex = 0;

        this.shuffle = false;
        this.repeat = false;

        this.volume = 0.8;
        this.audio.volume = this.volume;

        this.onUpdate = null;

        this.audio.addEventListener("timeupdate", () => {
            this.update();
        });

        this.audio.addEventListener("ended", () => {
            this.handleEnded();
        });

        this.audio.addEventListener("play", () => {
            this.update();
        });

        this.audio.addEventListener("pause", () => {
            this.update();
        });

        this.audio.addEventListener("loadedmetadata", () => {
            this.update();
        });
    }

    // Добавить песни в очередь
    setPlaylist(tracks) {
        this.playlist = tracks;
        this.currentIndex = 0;
        this.update();
    }

    // Добавить один трек
    addTrack(track) {
        this.playlist.push(track);
        this.update();
    }

    // Выбрать песню
    async play(index = this.currentIndex) {
        if (!this.playlist.length) return;

        if (index < 0 || index >= this.playlist.length) {
            return;
        }

        this.currentIndex = index;

        const track = this.playlist[index];

        if (!track || !track.audio) {
            console.warn("У этого трека нет аудиофайла.");
            this.update();
            return;
        }

        this.audio.src = track.audio;

        try {
            await this.audio.play();
            this.update();
        } catch (error) {
            console.error("Ошибка воспроизведения:", error);
        }
    }

    // Пауза
    pause() {
        this.audio.pause();
    }

    // Продолжить
    resume() {
        if (this.audio.src) {
            this.audio.play().catch(console.error);
        }
    }

    // Play / Pause
    toggle() {
        if (this.audio.paused) {
            this.resume();
        } else {
            this.pause();
        }
    }

    // Следующая песня
    next() {
        if (!this.playlist.length) return;

        let nextIndex;

        if (this.shuffle && this.playlist.length > 1) {
            do {
                nextIndex = Math.floor(
                    Math.random() * this.playlist.length
                );
            } while (nextIndex === this.currentIndex);
        } else {
            nextIndex =
                (this.currentIndex + 1) % this.playlist.length;
        }

        this.play(nextIndex);
    }

    // Предыдущая песня
    previous() {
        if (!this.playlist.length) return;

        if (this.audio.currentTime > 3) {
            this.audio.currentTime = 0;
            return;
        }

        const previousIndex =
            (this.currentIndex - 1 + this.playlist.length)
            % this.playlist.length;

        this.play(previousIndex);
    }

    // Перемотка
    seek(seconds) {
        if (!Number.isFinite(this.audio.duration)) return;

        this.audio.currentTime = Math.max(
            0,
            Math.min(seconds, this.audio.duration)
        );
    }

    // Перемотка в процентах
    seekPercent(percent) {
        if (!Number.isFinite(this.audio.duration)) return;

        const safePercent = Math.max(
            0,
            Math.min(percent, 100)
        );

        this.seek(this.audio.duration * safePercent / 100);
    }

    // Громкость
    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        this.audio.volume = this.volume;
    }

    // Выключить звук
    mute() {
        this.audio.muted = !this.audio.muted;
        return this.audio.muted;
    }

    // Перемешивание
    toggleShuffle() {
        this.shuffle = !this.shuffle;
        return this.shuffle;
    }

    // Повтор
    toggleRepeat() {
        this.repeat = !this.repeat;
        return this.repeat;
    }

    // Обработка окончания песни
    handleEnded() {
        if (this.repeat) {
            this.audio.currentTime = 0;
            this.audio.play().catch(console.error);
        } else {
            this.next();
        }
    }

    // Текущий трек
    getCurrentTrack() {
        return this.playlist[this.currentIndex] || null;
    }

    // Информация о воспроизведении
    getState() {
        return {
            playing: !this.audio.paused,
            currentTime: this.audio.currentTime,
            duration: this.audio.duration || 0,
            volume: this.audio.volume,
            muted: this.audio.muted,
            shuffle: this.shuffle,
            repeat: this.repeat,
            currentIndex: this.currentIndex,
            track: this.getCurrentTrack()
        };
    }

    // Обновление интерфейса
    update() {
        if (typeof this.onUpdate === "function") {
            this.onUpdate(this.getState());
        }
    }

    // Очистка плеера
    destroy() {
        this.audio.pause();
        this.audio.removeAttribute("src");
        this.audio.load();
        this.playlist = [];
        this.update();
    }
}

// Создаём глобальный экземпляр
window.VibeAudioPlayer = new VibePlayer();
