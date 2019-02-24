// @flow

import {
	MediaItem,
	MediaProvider,
	Track,
	Album,
	Artist,
	Playlist
} from './types';
import type {
	PlaybackState,
	PlaybackMetadata,
	PlaybackEvent
} from './types';

import EventEmitter from 'events';
const BandcampAPI = require('bandcamp-api');

import StreamPlayer from '../playback/StreamPlayer';
import { sleep } from '../util/misc';
import AsyncQueue from '../util/AsyncQueue';


class BandcampProvider implements MediaProvider {
	+name = 'bandcamp';
	+displayName = "Bandcamp";

	+events = new EventEmitter();
	+usesStreamPlayer: boolean = true;

	_bandcamp: BandcampAPI;
	_currentTrack: ?Track;

	_playQueue: AsyncQueue = new AsyncQueue({
		cancelUnfinishedTasks: true
	});
	_prepareQueue: AsyncQueue = new AsyncQueue({
		cancelUnfinishedTasks: true
	});

	constructor() {
		this._bandcamp = new BandcampAPI();
		this._currentTrack = null;

		StreamPlayer.addListener('play', this._onStreamPlayerPlay);
		StreamPlayer.addListener('pause', this._onStreamPlayerPause);
		StreamPlayer.addListener('trackFinish', this._onStreamPlayerTrackFinish);
	}

	destroy() {
		// nothing to do here
	}

	_onStreamPlayerPlay = () => {
		this.events.emit('play', this._createPlaybackEvent());
	}

	_onStreamPlayerPause = () => {
		this.events.emit('pause', this._createPlaybackEvent());
	}

	_onStreamPlayerTrackFinish = () => {
		this.events.emit('trackFinish', this._createPlaybackEvent());
		this.events.emit('contextFinish', this._createPlaybackEvent());
	}

	_createPlaybackEvent() {
		return {
			metadata: this._getPlayerMetadata(),
			state: this._getPlayerState()
		};
	}

	async fetchItemData(item: MediaItem): Promise<any> {
		if(!item.uri) {
			throw new Error("Cannot fetch item: missing URL");
		}
		return await this._bandcamp.getItemFromURL(item.uri);
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


	async search(text: string, options: {} = {}): Promise<any> {
		options = {
			...options
		};
		const results = await this._bandcamp.search(text, options);
		if(results.items) {
			results.items = results.items.map((item) => {
				return this.createMediaItem(item);
			});
		}
		return results;
	}

	async getTrack(trackURL: string): Promise<Track> {
		const track = await this._bandcamp.getTrack(trackURL);
		return new Track(track, this);
	}

	async getAlbum(albumURL: string): Promise<Album> {
		const album = await this._bandcamp.getAlbum(albumURL);
		return new Album(album, this);
	}

	async getArtist(artistURL: string): Promise<Artist> {
		const artist = await this._bandcamp.getArtist(artistURL);
		return new Artist(artist, this);
	}

	async getPlaylist(playlistURL: string): Promise<Playlist> {
		throw new Error("Cannot parse Bandcamp playlists (because there aren't any)");
	}

	async prepare(track: Track): Promise<void> {
		await this._prepareQueue.run(async function * (task: AsyncQueue.Task) {
			if(this._currentTrack != null && this._currentTrack.uri === track.uri) {
				return;
			}
			if(track.audioURL == null) {
				await track.fetchItemData();
			}
			yield;
			if(track.audioURL == null) {
				throw new Error("No audio URL for track");
			}
			await StreamPlayer.prepare(track.audioURL);
		}.bind(this));
	}

	async play(track: Track): Promise<void> {
		await this._playQueue.run(async function * (task: AsyncQueue.Task) {
			if(track.audioURL == null) {
				await track.fetchItemData();
			}
			yield;
			if(track.audioURL == null) {
				throw new Error("No audio URL for track");
			}
			await StreamPlayer.play(track.audioURL, {
				onPrepare: () => {
					this._currentTrack = track;
					this.events.emit('metadataChange', this._createPlaybackEvent());
				}
			});
		}.bind(this));
	}

	async setPlaying(playing: boolean): Promise<void> {
		await StreamPlayer.setPlaying(playing);
	}

	async seek(position: number): Promise<void> {
		await StreamPlayer.seek(position);
	}

	async stop(): Promise<void> {
		this._playQueue.cancelAllTasks();
		this._prepareQueue.cancelAllTasks();
		await StreamPlayer.stop();
		this._currentTrack = null;
	}

	_getPlayerMetadata(): PlaybackMetadata {
		return {
			currentTrack: this._currentTrack
		};
	}

	async getPlayerMetadata(): Promise<PlaybackMetadata> {
		return this._getPlayerMetadata();
	}

	_getPlayerState(): PlaybackState {
		return StreamPlayer.state;
	}

	async getPlayerState(): Promise<PlaybackState> {
		return this._getPlayerState();
	}
}


export default new BandcampProvider();
