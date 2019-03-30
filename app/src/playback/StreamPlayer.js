// @flow

import EventEmitter from 'events';
import { Player, MediaStates } from 'react-native-audio-toolkit';
import type {
	PlaybackState,
	PlaybackMetadata,
	PlaybackEvent
} from '../library/types';
import AsyncQueue from '../util/AsyncQueue';


type PlayOptions = {
	onPrepare?: ?() => void,
	position?: number
}


class StreamPlayer extends EventEmitter {
	_player: ?Player = null;
	_playerAudioURL: ?string = null;
	_preparedPlayer: ?Player = null;
	_preparedAudioURL: ?string = null;

	_playQueue: AsyncQueue = new AsyncQueue();

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
		console.log("recieved StreamPlayer event: ended");
		this.emit('trackFinish');
	}

	_onPlayerLooped = () => {
		console.log("recieved StreamPlayer event: looped");
		this.emit('trackLoop');
	}

	_onPlayerError = (error: Error) => {
		console.error("recieved StreamPlayer error: ", error);
		this.emit('error', error);
	}

	async prepare(audioURL: string): Promise<void> {
		if(audioURL == null) {
			throw new Error("audioURL cannot be null");
		}
		if(this._preparedAudioURL === audioURL) {
			return;
		}
		const runOptions = {
			tag: 'prepare',
			cancelMatchingTags: true
		};
		await this._playQueue.run(runOptions, async function * (task: AsyncQueue.Task) {
			this._destroyPreparedPlayer();
			const preparedPlayer = this._createPlayer(audioURL)
			this._preparedPlayer = preparedPlayer;
			this._preparedAudioURL = audioURL;
			await new Promise((resolve, reject) => {
				preparedPlayer.prepare(() => {
					resolve();
				});
			});
		}.bind(this));
	}

	async play(audioURL: string, options: PlayOptions = {}): Promise<void> {
		const runOptions = {
			tag: 'play',
			cancelMatchingTags: true
		};
		await this._playQueue.run(runOptions, async function * (task: AsyncQueue.Task) {
			if(audioURL == null) {
				throw new Error("audioURL cannot be null");
			}
			// set the new player
			if(this._playerAudioURL === audioURL) {
				const player = this._player;
				if(player == null) {
					throw new Error("IMPOSSIBLE CASE: _player is null but _playerAudioURL is not null");
				}
				await new Promise((resolve, reject) => {
					player.seek((options.position ?? 0) * 1000.0, () => {
						if(player.isPlaying) {
							resolve();
							return;
						}
						player.play(() => {
							resolve();
						});
					});
				});
				return;
			}
			else if(this._preparedAudioURL != null && this._preparedAudioURL === audioURL) {
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
					console.error("Error destroying prepared player: ", error);
				});
				await this._setPlayer(this._createPlayer(audioURL), audioURL);
			}
			yield;
			if(options.onPrepare) {
				options.onPrepare();
			}
			const player = this._player;
			if(player == null) {
				throw new Error("IMPOSSIBLE CASE: player is null after calling setup");
			}
			const playerPos = (options.position ?? 0) * 1000;
			const playerCurrentPos = Math.max(player.currentTime, 0);
			await new Promise((resolve, reject) => {
				player.play((error) => {
					if(error) {
						reject(error);
					}
					else {
						resolve();
						this.emit('play');
					}
				});
			});
			if(playerCurrentPos !== playerPos) {
				await new Promise((resolve, reject) => {
					player.seek(playerPos, () => {
						resolve();
					});
				});
			}
			this.emit('play');

		}.bind(this));
	}

	async setPlaying(playing: boolean): Promise<void> {
		const runOptions = {
			tag: 'setPlaying',
			cancelMatchingTags: true
		};
		await this._playQueue.run(runOptions, async function * (task: AsyncQueue.Task) {
			const player = this._player;
			if(player == null) {
				return;
			}
			const wasPlaying = player.isPlaying;
			let isPlaying = wasPlaying;
			if(playing) {
				await new Promise((resolve, reject) => {
					player.play((error) => {
						if (error) {
							reject(error);
						}
						else {
							isPlaying = true;
							resolve();
						}
					});
				});
			}
			else {
				await new Promise((resolve, reject) => {
					player.pause((error) => {
						if(error) {
							reject(error);
						}
						else {
							isPlaying = false;
							resolve();
						}
					});
				});
			}
			if(!wasPlaying && isPlaying) {
				this.emit('play');
			}
			else if(wasPlaying && !isPlaying) {
				this.emit('pause');
			}
		}.bind(this));
	}

	async stop(): Promise<void> {
		const runOptions = {
			tag: 'stop',
			cancelMatchingTags: true
		};
		await this._playQueue.run(runOptions, async function * (task: AsyncQueue.Task) {
			await Promise.all([this._destroyPlayer(), this._destroyPreparedPlayer()]);
		}.bind(this));
	}

	get state(): ?PlaybackState {
		const player = this._player;
		if(!player) {
			return null;
		}
		return {
			playing: player.isPlaying,
			repeating: player.looping,
			position: player.currentTime / 1000.0,
			duration: player.duration / 1000.0
		};
	}

	async seek(position: number): Promise<void> {
		const runOptions = {
			tag: 'seek',
			cancelMatchingTags: true
		};
		await this._playQueue.run(runOptions, async function * (task: AsyncQueue.Task) {
			await new Promise((resolve, reject) => {
				const player = this._player;
				if(!player) {
					resolve();
					return;
				}
				player.seek(position * 1000, () => {
					resolve();
				});
			});
		}.bind(this));
	}
}


export default new StreamPlayer();
