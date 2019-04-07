class Queue {
    constructor(remote) {
        this.now_playing = null;
        this.queue = [];
        this.remote = remote;
        this.is_playing = true;

        this.remote.on('waiting', () => {
            if (this.now_playing)
                this.progressQueue();
        });
    }

    addToQueue(item) {
        if (this.now_playing === null && this.queue.length === 0 && this.is_playing) {
            // We only do this if its playing because now_playing suggests the song was already 'playing'.
            // This way, when we recontinue, we know to requeue this song to the actual media player
            this.now_playing = item;
            this.remote.play_song(this.now_playing);
            return;
        }

        this.queue.push(item)
    }

    find(uri) {
        // Yay for magic numbers!
        if (this.now_playing !== null && this.now_playing.uri === uri)
            return {index: -1, item: this.now_playing};

        for (let i = 0; i < this.queue.length; i++)
            if (this.queue[i].uri === uri)
                return {index: i, item: this.queue[i]};

        return null;
    }

    remove(idx) {
        if (idx === -1) {
            if (this.is_playing) {
                // Just overwrite the previous song with the next one
                this.progressQueue()
            } else {
                this.now_playing = null;
            }
        } else {
            this.queue.splice(idx, 1);
        }
    }

    progressQueue() {
        if (this.queue.length === 0) {
            this.now_playing = null;
            return;
        }
        this.now_playing = this.queue.shift();
        this.remote.play_song(this.now_playing);
    }

    unpause() {
        if (this.now_playing === null && this.queue.length !== 0) {
            this.progressQueue();
        } else {
            this.remote.continue();
        }
        this.is_playing = true;
    }

    pause() {
        this.remote.stop();
        this.is_playing = false;
    }

    print() {
        return {
            "now_playing": this.now_playing,
            "queue": this.queue,
            "is_playing": true
        }
    }
}

module.exports = Queue;