// @flow

import EventEmitter from 'events';
import * as URLUtils from 'url';
import * as QueryString from 'querystring';
import { AllHtmlEntities } from 'html-entities';
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
import AsyncQueue from "../../util/AsyncQueue";
import StreamPlayer from "../../playback/StreamPlayer";

const YoutubeDL = require('ytdl-core');
const YoutubeCredentials = require('../../../credentials/Youtube');

const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3';

const entities = new AllHtmlEntities();


class YoutubeProvider implements MediaProvider {
	+name = 'youtube';
	+displayName = 'YouTube';

	+events = new EventEmitter();
	+usesStreamPlayer: boolean = true;

	+api = YoutubeDL;

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



	createURI(type: string, id: string): string {
		return `youtube:${type}:${id}`;
	}

	parseURI(uri: string): {type:string, id:string} {
		const parts = uri.split(':');
		if(parts[0] !== 'youtube' || !parts[1] || !parts[2]) {
			throw new Error("Invalid YouTube URI");
		}
		return {
			type: parts[1],
			id: parts[2]
		};
	}

	_sendRequest = (method: string, endpoint: string, query?: ?Object, body?: ?Object = null): Promise<any> => {
		return new Promise((resolve, reject) => {
			query = {
				...query,
				key: YoutubeCredentials.apiKey
			};
			const xhr = new XMLHttpRequest();
			xhr.onreadystatechange = () => {
				if(xhr.readyState === 4) {
					if(xhr.responseText === "" && (xhr.status >= 200 && xhr.status < 300)) {
						resolve();
					}
					let response: Object = (null: any);
					try {
						response = JSON.parse(xhr.responseText);
					} catch(error) {
						reject(new Error(xhr.responseText));
						return;
					}
					if(xhr.status >= 200 && xhr.status < 300) {
						resolve(response);
					}
					else if(response.error) {
						reject(new Error(response.error.message));
					}
					else {
						resolve();
					}
				}
			};
			let url = `${YOUTUBE_API_URL}/${endpoint}?${QueryString.stringify(query)}`;
			xhr.open(method, url);
			if(body != null) {
				xhr.setRequestHeader('Content-Type', 'application/json');
				xhr.send(JSON.stringify(body));
			}
			else {
				xhr.send();
			}
		});
	};

	_parseResource(item: Object): Object {
		let typeParts = item.id.kind.split('#');
		let uri = null;
		let type = typeParts[1];
		switch(type) {
			case 'video':
				type = 'track';
				uri = this.createURI(item.id.kind, item.id.videoId);
				break;
			case 'channel':
				type = 'artist';
				uri = this.createURI(item.id.kind, item.id.channelId);
				break;
			case 'playlist':
				type = 'playlist';
				uri = this.createURI(item.id.kind, item.id.playlistId);
				break;
			default:
				throw new Error(`Unknown youtube search result type ${type}`);
		}
		const data: Object = {
			type: type,
			uri: uri,
			name: entities.decode(item.snippet.title),
			images: Object.keys(item.snippet.thumbnails).map((key: string) => {
				return item.snippet.thumbnails[key];
			})
		};
		if(type !== 'artist') {
			data.artists = [{
				type: 'artist',
				uri: this.createURI('channel', item.snippet.channelId),
				name: entities.decode(item.snippet.channelTitle)
			}];
		}
		return data;
	}


	async _fetchVideoData(uri: string): Promise<Object> {
		console.log("fetching video data from ", uri);
		const { id, type } = this.parseURI(uri);
		const url = `https://www.youtube.com/watch?v=${id}`;
		const info = await new Promise((resolve, reject) => {
			YoutubeDL.getInfo(url, (error, info) => {
				if (error) {
					reject(error);
				} else {
					resolve(info);
				}
			});
		});
		const audioFormat = YoutubeDL.chooseFormat(info.formats, {format: 'mp3'});
		const videoDetails = info.player_response?.videoDetails;
		let duration = videoDetails?.lengthSeconds;
		if(typeof duration === 'string') {
			duration = Number.parseInt(duration);
			if(Number.isNaN(duration)) {
				duration = undefined;
			}
		}
		const data: Object = {
			type: 'track',
			uri: uri,
			name: info.title ?? videoDetails?.title,
			duration: duration,
			images: videoDetails?.thumbnail?.thumbnails,
			audioURL: audioFormat?.url
		};
		const songURL = info.media?.song_url ? URLUtils.parse(info.media?.song_url) : null;
		if((!songURL || songURL.query?.v === id || (songURL: any).searchParams?.v === id) && info.media?.song) {
			data.name = info.media.song;
			let artists = [{
				type: 'artist',
				uri: this.createURI('channel', videoDetails?.channelId ?? info.author?.id),
				name: videoDetails?.author ?? info.author?.name
			}];
			if (info.media?.artist) {
				const channelPathPrefix = '/channel/';
				const artistURL = (info.media?.artist_url) ? URLUtils.parse(info.media.artist_url) : null;
				if (artistURL && artistURL.pathname && artistURL.pathname && artistURL.pathname.startsWith(channelPathPrefix)) {
					artists = [{
						type: 'artist',
						uri: this.createURI('channel', artistURL.pathname.substring(channelPathPrefix.length)),
						name: info.media.artist
					}];
				} else {
					artists.push({
						type: 'artist',
						name: info.media.artist
					});
				}
			}
			data.artists = artists;
		}
		return data;
	}

	async fetchItemData(item: MediaItem): Promise<Object> {
		if(!item.uri) {
			throw new Error("Cannot fetch item: missing URI");
		}
		switch(item.type) {
			case 'track':
				return await this._fetchVideoData(item.uri);
			case 'artist':
			case 'playlist':
				// TODO fetch detailed data for channels and playlists
			default:
				return {};
		}
	}


	createMediaItem(data: Object): MediaItem {
		switch(data.type) {
			case 'track':
				return new Track(data, this);
			case 'artist':
				return new Artist(data, this);
			case 'playlist':
				return new Playlist(data, this);
			case 'album':
				throw new Error("YouTube does not have albums");
			default:
				throw new Error(`Invalid media item type ${data.type}`);
		}
	}


	async search(query: string, options: {pageToken?: string, types?: Array<string>, maxResults?: number} = {}): Promise<Object> {
		const params: Object = {...options};
		if(params.types != null) {
			const types = params.types;
			delete params.types;
			params.type = types.map((type) => {
				switch(type) {
					case 'track':
						return 'video';
					case 'artist':
						return 'channel';
					default:
						return type;
				}
			}).join(',');
		}
		Object.assign(params, {
			part: 'id,snippet',
			q: query
		});
		const results = await this._sendRequest('GET', 'search', params);
		results.items = results.items.map((item) => {
			return this.createMediaItem(this._parseResource(item));
		});
		return results;
	}



	async getTrack(uri: string): Promise<Track> {
		const { id, type } = this.parseURI(uri);
		if(type !== 'video') {
			throw new Error(`Invalid video uri ${uri}`);
		}
		const results = await this._sendRequest('GET', 'videos', {
			id,
			part: 'id,snippet'
		});
		if(results.items.length === 0) {
			throw new Error(`Track not found for uri ${uri}`);
		}
		// TODO get audio stream URLs
		return new Track(this._parseResource(results.items[0]), this);
	}

	async getArtist(uri: string): Promise<Artist> {
		const { id, type } = this.parseURI(uri);
		if(type !== 'channel') {
			throw new Error(`Invalid channel uri ${uri}`);
		}
		const results = await this._sendRequest('GET', 'channels', {
			id,
			part: 'id,snippet'
		});
		if(results.items.length === 0) {
			throw new Error(`Artist not found for uri ${uri}`);
		}
		return new Artist(this._parseResource(results.items[0]), this);
	}

	async getPlaylist(uri: string): Promise<Playlist> {
		const { id, type } = this.parseURI(uri);
		if(type !== 'playlist') {
			throw new Error(`Invalid playlist uri ${uri}`);
		}
		const results = await this._sendRequest('GET', 'playlists', {
			id,
			part: 'id,snippet'
		});
		if(results.items.length === 0) {
			throw new Error(`Playlist not found for uri ${uri}`);
		}
		return new Playlist(this._parseResource(results.items[0]), this);
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
			console.log("playing youtube track " + track.name);
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


export default new YoutubeProvider();
