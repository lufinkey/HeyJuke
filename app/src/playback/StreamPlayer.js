// @flow

import EventEmitter from 'events';
import { Player } from 'react-native-audio-toolkit';
import type {
	PlaybackState,
	PlaybackMetadata,
	PlaybackEvent
} from '../providers/types';
import AsyncQueue from '../util/AsyncQueue';


type PlayOptions = {
	onPrepare?: ?() => void
}


class StreamPlayer extends EventEmitter {
	_player: ?Player = null;
	_playerAudioURL: ?string = null;
	_preparedPlayer: ?Player = null;
	_preparedAudioURL: ?string = null;

	_playQueue: AsyncQueue = new AsyncQueue({
		cancelUnfinishedTasks: true
	});

	constructor() {
		super();
	}

	_createPlayer(audioURL: string, options: { autoDestroy?: boolean, continuesToPlayInBackground?: boolean } = {}): Player {
		return new Player(audioURL, {
			autoDestroy: false,
			continuesToPlayInBackground: true,
			...options
		});
	}

	async _setPlayer(player: Player, audioURL: string): Promise<void> {
		const destroyPlayerPromise = this._destroyPlayer();
		this._player = player;
		this._playerAudioURL = audioURL;
		player.addListener('ended', this._onPlayerEnded);
		player.addListener('looped', this._onPlayerLooped);
		player.addListener('error', this._onPlayerError);
		await destroyPlayerPromise;
	}

	async _destroyPlayer(): Promise<void> {
		if(this._player) {
			const deadPlayer = this._player;
			this._player = null;
			this._playerAudioURL = null;
			deadPlayer.removeListener('ended', this._onPlayerEnded);
			deadPlayer.removeListener('looped', this._onPlayerLooped);
			deadPlayer.removeListener('error', this._onPlayerError);
			await new Promise((resolve, reject) => {
				deadPlayer.destroy(() => {
					resolve();
				});
			});
		}
	}

	async _destroyPreparedPlayer(): Promise<void> {
		if(this._preparedPlayer) {
			const deadPlayer = this._preparedPlayer;
			this._preparedPlayer = null;
			this._preparedAudioURL = null;
			await new Promise((resolve, reject) => {
				deadPlayer.destroy(() => {
					resolve();
				});
			});
		}
	}

	_onPlayerEnded = () => {
		this.emit('trackFinish');
	}

	_onPlayerLooped = () => {
		this.emit('trackLoop');
	}

	_onPlayerError = (error: Error) => {
		this.emit('error', error);
	}

	async prepare(audioURL: string): Promise<void> {
		if(audioURL == null) {
			throw new Error("audioURL cannot be null");
		}
		if(this._preparedAudioURL === audioURL) {
			return;
		}
		this._destroyPreparedPlayer();
		const preparedPlayer = this._createPlayer(audioURL)
		this._preparedPlayer = preparedPlayer;
		this._preparedAudioURL = audioURL;
		await new Promise((resolve, reject) => {
			preparedPlayer.prepare(() => {
				resolve();
			});
		});
	}

	async play(audioURL: string, options: PlayOptions = {}): Promise<void> {
		await this._playQueue.run(async function * (task: AsyncQueue.Task) {
			if(audioURL == null) {
				throw new Error("audioURL cannot be null");
			}
			// set the new player
			if(this._playerAudioURL === audioURL) {
				await new Promise((resolve, reject) => {
					if(this._player == null) {
						resolve();
						return;
					}
					this._player.seek(0, () => {
						resolve();
					});
				});
				return;
			}
			else if(this._preparedAudioURL === audioURL && this._preparedAudioURL != null) {
				const preparedPlayer = this._preparedPlayer;
				const preparedAudioURL = this._preparedAudioURL;
				this._preparedPlayer = null;
				this._preparedAudioURL = null;
				await this._setPlayer(preparedPlayer, preparedAudioURL);
			}
			else {
				this._destroyPreparedPlayer().then(() => {
					// done
				}).catch((error) => {
					console.warn("failed to destroy the prepared player: ", error);
				});
				await this._setPlayer(this._createPlayer(audioURL), audioURL);
			}
			yield;
			if(options.onPrepare) {
				options.onPrepare();
			}
			await new Promise((resolve, reject) => {
				if(this._player == null) {
					resolve();
					return;
				}
				this._player.play((error) => {
					if(error) {
						reject(error);
					}
					else {
						resolve();
						this.emit('play');
					}
				});
			});
		}.bind(this));
	}

	async setPlaying(playing: boolean): Promise<void> {
		if(this._player == null) {
			return;
		}
		const wasPlaying = this._player.isPlaying;
		let isPlaying = wasPlaying;
		if(playing) {
			await new Promise((resolve, reject) => {
				if(this._player == null) {
					resolve();
					return;
				}
				this._player.play((error) => {
					if(error) {
						reject(error);
					}
					else {
						isPlaying = true;
						resolve();
					}
				});
			});
			if(!wasPlaying && isPlaying) {
				this.emit('play');
			}
		}
		else {
			await new Promise((resolve, reject) => {
				if(this._player == null) {
					resolve();
					return;
				}
				this._player.pause((error) => {
					if(error) {
						reject(error);
					}
					else {
						isPlaying = false;
						resolve();
					}
				});
			});
			if(wasPlaying && !isPlaying) {
				this.emit('pause');
			}
		}
	}

	async stop(): Promise<void> {
		this._playQueue.cancelAllTasks();
		if(!this._player) {
			return;
		}
		await this._playQueue.run(async () => {
			await Promise.all([this._destroyPlayer(), this._destroyPreparedPlayer()]);
		});
	}

	get state(): ?PlaybackState {
		if(!this._player) {
			return null;
		}
		return {
			playing: this._player.isPlaying,
			repeating: this._player.looping,
			position: this._player.currentTime / 1000.0,
			duration: this._player.duration / 1000.0
		};
	}

	async seek(position: number): Promise<void> {
		await new Promise((resolve, reject) => {
			if(this._player == null) {
				resolve();
				return;
			}
			this._player.seek(position * 1000, () => {
				resolve();
			});
		});
	}
}


export default new StreamPlayer();
