
class VibePlayer {
    constructor() {
        this.audio = new Audio();
        this.playlist = [];
        this.currentIndex = -1;

        this.isPlaying = false;
        this.isShuffle = false;
        this.repeatMode = 0;
        this.volume = 0.8;

        this.audio.volume = this.volume;

        this.audio.addEventListener("timeupdate", () => {
            this.update();
        });

        this.audio.addEventListener("loadedmetadata", () => {
            this.update();
        });

        this.audio.addEventListener("ended", () => {
            this.handleEnded();
        });

        this.audio.addEventListener("play", () => {
            this.isPlaying = true;
            this.dispatch("play");
        });

        this.audio.addEventListener("pause", () => {
            this.isPlaying = false;
            this.dispatch("pause");
        });

        this.audio.addEventListener("error", () => {
            this.dispatch("error");
        });
    }

    dispatch(eventName) {
        window.dispatchEvent(
            new CustomEvent("vibe:" + eventName, {
                detail: this.getState()
            })
        );
    }

    setPlaylist(tracks, startIndex = 0) {
        this.playlist = Array.isArray(tracks) ? tracks : [];

        if (this.playlist.length === 0) {
            this.currentIndex = -1;
            this.audio.pause();
            this.audio.removeAttribute("src");
            this.audio.load();
            this.dispatch("change");
            return;
        }

        this.currentIndex = Math.max(
            0,
            Math.min(startIndex, this.playlist.length - 1)
        );

        this.loadCurrentTrack();
    }

    addTrack(track) {
        if (!track || !track.url) return;

        this.playlist.push(track);

        if (this.currentIndex === -1) {
            this.currentIndex = 0;
            this.loadCurrentTrack();
        }
    }

    loadCurrentTrack() {
        const track = this.getCurrentTrack();

        if (!track || !track.url) return;

        this.audio.pause();
        this.audio.src = track.url;
        this.audio.load();

        this.dispatch("change");
    }

    async play(index = null) {
        if (index !== null) {
            if (index < 0 || index >= this.playlist.length) return;

            this.currentIndex = index;
            this.loadCurrentTrack();
        }

        if (this.currentIndex === -1) {
            if (this.playlist.length === 0) return;

            this.currentIndex = 0;
            this.loadCurrentTrack();
        }

        try {
            await this.audio.play();
        } catch (error) {
            console.error("Ошибка воспроизведения:", error);
            this.dispatch("error");
        }
    }

    pause() {
        this.audio.pause();
    }

    async resume() {
        if (!this.audio.src) {
            await this.play();
            return;
        }

        try {
            await this.audio.play();
        } catch (error) {
            console.error("Не удалось продолжить:", error);
        }
    }

    toggle() {
        if (this.audio.paused) {
            this.resume();
        } else {
            this.pause();
        }
    }

    next() {
        if (this.playlist.length === 0) return;

        if (this.isShuffle && this.playlist.length > 1) {
            let nextIndex;

            do {
                nextIndex = Math.floor(
                    Math.random() * this.playlist.length
                );
            } while (nextIndex === this.currentIndex);

            this.currentIndex = nextIndex;
        } else {
            this.currentIndex++;

            if (this.currentIndex >= this.playlist.length) {
                if (this.repeatMode === 2) {
                    this.currentIndex = 0;
                } else {
                    this.currentIndex = this.playlist.length - 1;
                    this.pause();
                    this.audio.currentTime = 0;
                    return;
                }
            }
        }

        this.loadCurrentTrack();
        this.play();
    }

    previous() {
        if (this.playlist.length === 0) return;

        if (this.audio.currentTime > 3) {
            this.audio.currentTime = 0;
            return;
        }

        this.currentIndex--;

        if (this.currentIndex < 0) {
            this.currentIndex = this.playlist.length - 1;
        }

        this.loadCurrentTrack();
        this.play();
    }

    seek(seconds) {
        if (!Number.isFinite(seconds)) return;

        if (Number.isFinite(this.audio.duration)) {
            this.audio.currentTime = Math.max(
                0,
                Math.min(seconds, this.audio.duration)
            );
        }
    }

    seekPercent(percent) {
        if (!Number.isFinite(this.audio.duration)) return;

        const safePercent = Math.max(0, Math.min(100, percent));

        this.seek(
            this.audio.duration * safePercent / 100
        );
    }

    setVolume(value) {
        const volume = Number(value);

        if (!Number.isFinite(volume)) return;

        this.volume = Math.max(0, Math.min(1, volume));
        this.audio.volume = this.volume;
        this.dispatch("volume");
    }

    mute() {
        this.audio.muted = !this.audio.muted;
        this.dispatch("volume");
    }

    toggleShuffle() {
        this.isShuffle = !this.isShuffle;
        this.dispatch("shuffle");
        return this.isShuffle;
    }

    toggleRepeat() {
        this.repeatMode = (this.repeatMode + 1) % 3;
        this.dispatch("repeat");
        return this.repeatMode;
    }

    handleEnded() {
        if (this.repeatMode === 1) {
            this.audio.currentTime = 0;
            this.play();
            return;
        }

        this.next();
    }

    getCurrentTrack() {
        if (this.currentIndex < 0) return null;

        return this.playlist[this.currentIndex] || null;
    }

    getState() {
        return {
            track: this.getCurrentTrack(),
            currentIndex: this.currentIndex,
            playlistLength: this.playlist.length,
            isPlaying: this.isPlaying,
            isShuffle: this.isShuffle,
            repeatMode: this.repeatMode,
            currentTime: this.audio.currentTime || 0,
            duration: this.audio.duration || 0,
            volume: this.volume
        };
    }

    update() {
        this.dispatch("update");
    }

    destroy() {
        this.audio.pause();
        this.audio.removeAttribute("src");
        this.audio.load();
        this.playlist = [];
        this.currentIndex = -1;
    }
}

window.VibeAudioPlayer = new VibePlayer();
