// @flow

import {
	MediaItem,
	Track,
	Album,
	Artist,
	Playlist
} from '../types';
import type {
	MediaProvider,
	PlaybackState,
	PlaybackMetadata,
	PlaybackEvent
} from '../types';

import EventEmitter from 'events';
const BandcampAPI = require('bandcamp-api');

import StreamPlayer from '../../playback/StreamPlayer';
import { sleep } from '../../util/misc';
import AsyncQueue from '../../util/AsyncQueue';


class BandcampProvider implements MediaProvider {
	+name = 'bandcamp';
	+displayName = "Bandcamp";

	+events = new EventEmitter();
	+usesStreamPlayer: boolean = true;

	+api: BandcampAPI = new BandcampAPI();

	_currentTrack: ?Track;

	_playQueue: AsyncQueue = new AsyncQueue({
		cancelUnfinishedTasks: true
	});
	_prepareQueue: AsyncQueue = new AsyncQueue({
		cancelUnfinishedTasks: true
	});

	constructor() {
		this._currentTrack = null;

		StreamPlayer.addListener('play', this._onStreamPlayerPlay);
		StreamPlayer.addListener('pause', this._onStreamPlayerPause);
		StreamPlayer.addListener('trackFinish', this._onStreamPlayerTrackFinish);
	}

	destroy() {
		// nothing to do here
	}

	_onStreamPlayerPlay = () => {
		this.player.events.emit('play', this._createPlaybackEvent());
	};

	_onStreamPlayerPause = () => {
		this.player.events.emit('pause', this._createPlaybackEvent());
	};

	_onStreamPlayerTrackFinish = () => {
		this.player.events.emit('trackFinish', this._createPlaybackEvent());
		this.player.events.emit('contextFinish', this._createPlaybackEvent());
	};

	_createPlaybackEvent() {
		return {
			metadata: this.player._getMetadata(),
			state: this.player._getState()
		};
	}

	async fetchItemData(item: MediaItem): Promise<Object> {
		if(!item.uri) {
			throw new Error("Cannot fetch item: missing URL");
		}
		return await this.api.getItemFromURL(item.uri);
	}


	createMediaItem(data: Object): MediaItem {
		switch(data.type) {
			case 'track':
				return new Track(data, this);
			case 'artist':
				return new Artist(data, this);
			case 'album':
				return new Album(data, this);
			case 'fan':
			case 'label':
				return new MediaItem(data, this);
			default:
				throw new Error("Invalid media item type "+data.type);
		}
	}


	async search(text: string, options: {} = {}): Promise<Object> {
		options = {
			...options
		};
		const results = await this.api.search(text, options);
		if(results.items) {
			results.items = results.items.map((item) => {
				return this.createMediaItem(item);
			});
		}
		return results;
	}

	async getTrack(trackURL: string): Promise<Track> {
		const track = await this.api.getTrack(trackURL);
		return new Track(track, this);
	}

	async getAlbum(albumURL: string): Promise<Album> {
		const album = await this.api.getAlbum(albumURL);
		return new Album(album, this);
	}

	async getArtist(artistURL: string): Promise<Artist> {
		const artist = await this.api.getArtist(artistURL);
		return new Artist(artist, this);
	}

	async getPlaylist(playlistURL: string): Promise<Playlist> {
		throw new Error("Cannot parse Bandcamp playlists (because there aren't any)");
	}




	+player = {
		events: new EventEmitter(),

		prepare: async (track: Track): Promise<void> => {
			await this._prepareQueue.run(async function* (task: AsyncQueue.Task) {
				if (this._currentTrack != null && this._currentTrack.uri === track.uri) {
					return;
				}
				if (track.audioURL == null) {
					await track.fetchItemData();
				}
				yield;
				if (track.audioURL == null) {
					throw new Error("No audio URL for track");
				}
				await StreamPlayer.prepare(track.audioURL);
			}.bind(this));
		},

		play: async (track: Track, position: number = 0): Promise<void> => {
			console.log("playing bandcamp track " + track.name);
			await this._playQueue.run(async function* (task: AsyncQueue.Task) {
				if (track.audioURL == null) {
					await track.fetchItemData();
				}
				yield;
				if (track.audioURL == null) {
					throw new Error("No audio URL for track");
				}
				await StreamPlayer.play(track.audioURL, {
					position: position,
					onPrepare: () => {
						this._currentTrack = track;
						this.player.events.emit('metadataChange', this._createPlaybackEvent());
					}
				});
			}.bind(this));
		},

		setPlaying: async (playing: boolean): Promise<void> => {
			await StreamPlayer.setPlaying(playing);
		},

		seek: async (position: number): Promise<void> => {
			await StreamPlayer.seek(position);
		},

		stop: async (): Promise<void> => {
			this._playQueue.cancelAllTasks();
			this._prepareQueue.cancelAllTasks();
			await StreamPlayer.stop();
			this._currentTrack = null;
		},

		_getMetadata: (): PlaybackMetadata => {
			return {
				currentTrack: this._currentTrack
			};
		},

		getMetadata: async (): Promise<PlaybackMetadata> => {
			return this.player._getMetadata();
		},

		_getState: (): PlaybackState => {
			return StreamPlayer.state;
		},

		getState: (): Promise<PlaybackState> => {
			return this.player._getState();
		}
	}
}


export default new BandcampProvider();
