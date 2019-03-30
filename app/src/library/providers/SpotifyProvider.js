// @flow

import {
	MediaItem,
	Track,
	Album,
	Artist,
	Playlist
} from '../types';
import type {
	AsyncAlbumGenerator,
	MediaProvider,
	MediaPlaybackProvider,
	PlaybackState,
	PlaybackMetadata,
	PlaybackEvent,
	ContinuousAsyncGenerator
} from '../types';

import EventEmitter from 'events';
import RNEvents from 'react-native-events';
import Spotify from 'rn-spotify-sdk';
const SpotifyURI = require('spotify-uri');

import AsyncQueue from '../../util/AsyncQueue';
import {
	waitForEvent,
	sleep
} from '../../util/misc';
import type { MediaLibraryItem } from '../types/MediaLibraryItem';


type UserLibraryResumeId = {
	mostRecentItem: {
		trackURI: string,
		addedAt: string
	},
	syncingOffset: ?number,
	syncingItem: ?{
		trackURI: string,
		addedAt: string
	},
	syncingMostRecentItem: ?{
		trackURI: string,
		addedAt: string
	}
}
export type SpotifyUserLibraryResumeId = UserLibraryResumeId;

class SpotifyProvider implements MediaProvider {
	+name = 'spotify';
	+displayName = "Spotify";

	+events = new EventEmitter();
	_nativeEvents: EventEmitter;
	+usesStreamPlayer: boolean = false;

	+api = Spotify;

	_loggedIn: boolean = false;
	_lastTemporaryIssuesTime: number = 0;
	_trackPlaying: boolean = false;
	_isPlaying: boolean = false;
	_isPausing: boolean = false;

	_userData: ?Object = null;
	_userDataPromise: ?Promise<void> = null;

	_playQueue = new AsyncQueue({
		cancelUnfinishedTasks: true
	});
	_setPlayingQueue = new AsyncQueue({
		cancelUnfinishedTasks: true
	});

	constructor() {
		// forward events from rn-spotify-sdk
		this._nativeEvents = new EventEmitter();
		RNEvents.addSubscriber(this.api, this._nativeEvents);
		this.api.isLoggedInAsync().then((loggedIn) => {
			this._loggedIn = loggedIn;
		});
		this._nativeEvents.addListener('login', this._onLogin);
		this._nativeEvents.addListener('logout', this._onLogout);
		this._nativeEvents.addListener('play', this._onPlay);
		this._nativeEvents.addListener('pause', this._onPause);
		this._nativeEvents.addListener('metadataChange', this._onMetadataChange);
		this._nativeEvents.addListener('trackDelivered', this._onTrackDelivered);
		this._nativeEvents.addListener('trackChange', this._onTrackChange);
		this._nativeEvents.addListener('playerMessage', this._onPlayerMessage);
		this._nativeEvents.addListener('temporaryPlayerError', this._onTemporaryPlayerError);
		this._nativeEvents.addListener('disconnect', this._onDisconnect);
		this._nativeEvents.addListener('reconnect', this._onReconnect);
		this._nativeEvents.addListener('inactive', this._onBecomeInactive);
		this._nativeEvents.addListener('active', this._onBecomeActive);
	}

	destroy() {
		RNEvents.removeSubscriber(this.api, this._nativeEvents);
	}

	async _fetchUserDataIfNeeded() {
		if(!this._loggedIn || this._userData) {
			return;
		}
		if(this._userDataPromise) {
			await this._userDataPromise;
		}
		if(this._userData == null) {
			this._userDataPromise = (async () => {
				try {
					this._userData = await this.api.getMe();
				}
				catch(error) {
					console.error("Error fetching user data: ", error);
				}
				this._userDataPromise = null;
			})();
			await this._userDataPromise;
		}
	}

	async _setPlayingUntilSuccess() {
		await this._setPlayingQueue.run(async function * (task: AsyncQueue.Task) {
			while(true) {
				try {
					await this.api.setPlaying(true);
					yield;
					if(!this._isPlaying) {
						console.log("waiting for play event to fire");
						await waitForEvent(this._nativeEvents, 'play', (event: any) => {
							// hooray, it was called!
						}, {timeout: 2000});
					}
					return;
				}
				catch(error) {
					console.error("Error attempting to play Spotify player: ", error);
					// continue trying...
				}
				yield;
			}
		}.bind(this));
	}

	_onPlaybackEvent = (event: any) => {
		if(event.state) {
			const wasPlaying = this._isPlaying;
			this._isPlaying = event.state.playing;
			if(this._isPausing) {
				this._isPausing = false;
			}
			// TODO re-enable this force auto-playing as an option
			/*else if(wasPlaying && !this._isPlaying && this._trackPlaying) {
				// player paused. should we recover?
				const currentTime = (new Date()).getTime();
				if((currentTime - this._lastTemporaryIssuesTime) <= 60000) {
					Logger.warn("Spotify paused seemingly because of a connection issue. Attempting to start playing again");
					this._setPlayingUntilSuccess();
				}
				else {
					Logger.warn("Spotify randomly paused, but it was outside of the expected time for it to be an error and not a remote");
				}
			}*/
		}
	};

	_onLogin = () => {
		console.log("received Spotify event: login");
		this._loggedIn = true;
		this.events.emit('login');
	};

	_onLogout = () => {
		console.log("received Spotify event: logout");
		this._loggedIn = false;
		this._userData = null;
		this.events.emit('logout');
	};

	_onPlay = (event: Object) => {
		console.log("received Spotify event: play");
		this._onPlaybackEvent(event);
		this.player.events.emit('play', this._createPlaybackEvent(event));
	};

	_onPause = (event: Object) => {
		console.log("received Spotify event: pause");
		this._onPlaybackEvent(event);
		this.player.events.emit('pause', this._createPlaybackEvent(event));
	};

	_onMetadataChange = (event: Object) => {
		console.log("received Spotify event: metadataChange");
		this._onPlaybackEvent(event);
		this.player.events.emit('metadataChange', this._createPlaybackEvent(event));
	};

	_onBecomeInactive = (event: any) => {
		console.log("received Spotify event: inactive");
	};

	_onBecomeActive = (event: any) => {
		console.log("received Spotify event: active");
	};

	_onDisconnect = () => {
		console.log("received Spotify event: disconnect");
	};

	_onReconnect = () => {
		console.log("received Spotify event: reconnect");
	};

	_onTrackDelivered = (event: any) => {
		console.log("received Spotify event: trackDelivered");
		this._trackPlaying = false;
		this._isPausing = false;
		this._onPlaybackEvent(event);
		this.player.events.emit('trackFinish', this._createPlaybackEvent(event));
	};

	_onTrackChange = (event: any) => {
		console.log("received Spotify event: trackChange")
		this._trackPlaying = true;
	};

	_onPlayerMessage = (message: string) => {
		console.log("received Spotify player message: "+message);
	};

	_onTemporaryPlayerError = () => {
		console.warn("received Spotify event: temporaryPlayerError");
		this._lastTemporaryIssuesTime = (new Date()).getTime();
	};




	async login(): Promise<boolean> {
		const loggedIn = await this.api.login({showDialog: true});
		this._fetchUserDataIfNeeded();
		return loggedIn;
	}

	async logout(): Promise<void> {
		await this.api.logout();
	}

	get isLoggedIn() {
		return this._loggedIn;
	}


	_preParseAlbum(album: any) {
		const albumID = this._parseItemId(album.uri);
		const trackResults = album.tracks;
		if(trackResults) {
			// fix Spotify's dumbassery
			if(trackResults.next === 'null') {
				trackResults.next = null;
			}
			if(trackResults.next || trackResults.offset !== 0 || !trackResults.items || trackResults.total == null || trackResults.total > trackResults.items.length) {
				album.asyncLoad = {
					loader: async (index: number, count: number): Promise<Array<any>> => {
						const { items, next } = await this.api.getAlbumTracks(albumID, {
							offset: index,
							limit: count,
							market: 'from_token'
						});
						return items;
					},
					length: trackResults.total,
					chunkSize: 50
				};
			}
		}
		return album;
	}

	_preParsePlaylist(playlist: any) {
		const playlistID = this._parseItemId(playlist.uri);
		const trackResults = playlist.tracks;
		if(trackResults) {
			playlist.asyncLoad = {
				loader: async (index: number, count: number): Promise<Array<any>> => {
					const { items, next } = await this.api.getPlaylistTracks(playlistID, {
						snapshot_id: playlist.snapshot_id,
						offset: index,
						limit: count,
						market: 'from_token'
					});
					return items;
				},
				length: trackResults.total,
				chunkSize: 100
			}
		}
		return playlist;
	}

	createMediaItem(data: Object): MediaItem {
		switch(data.type) {
			case 'track':
				return new Track(data, this);
			case 'artist':
				return new Artist(data, this);
			case 'album':
				return new Album(this._preParseAlbum(data), this);
			case 'playlist':
				return new Playlist(this._preParsePlaylist(data), this);
			default:
				throw new Error("Invalid media item type "+data.type);
		}
	}


	async search(text: string, options: { types?: Array<string> } = {}): Promise<any> {
		await this._fetchUserDataIfNeeded();
		options = {
			types: ['track','artist','album','playlist'],
			market: 'from_token',
			...options
		};
		const { types } = options;
		delete options.types;
		const results = await this.api.search(text, types, options);
		// fix spotify dumbassery
		for(const typeName of ['tracks','artists','albums','playlists']) {
			const typeResults = results[typeName];
			if(typeResults) {
				if(typeResults.next === 'null') {
					typeResults.next = null;
				}
				if(typeResults.prev === 'null') {
					typeResults.prev = null;
				}
				if(typeResults.items) {
					typeResults.items = typeResults.items.map((item) => {
						return this.createMediaItem(item);
					});
				}
			}
		}
		return results;
	}

	_createPlaybackEvent(nativeEvent: any): PlaybackEvent {
		return {
			state: (nativeEvent.state || null),
			metadata: (nativeEvent.metadata ? {
				currentTrack: (nativeEvent.metadata.currentTrack ? new Track(nativeEvent.metadata.currentTrack, this) : null)
			} : null)
		};
	}

	_parseItemId(id: string): string {
		if(id.indexOf(':')) {
			const uriComps = SpotifyURI.parse(id);
			if(uriComps.id) {
				return uriComps.id;
			}
		}
		return id;
	}

	async getTrack(trackId: string): Promise<Track> {
		await this._fetchUserDataIfNeeded();
		trackId = this._parseItemId(trackId);
		const track = await this.api.getTrack(trackId, {
			market: 'from_token'
		});
		return new Track(track, this);
	}

	async getArtist(artistId: string): Promise<Artist> {
		await this._fetchUserDataIfNeeded();
		artistId = this._parseItemId(artistId);
		const artist = await this.api.getArtist(artistId, {
			market: 'from_token'
		});
		return new Artist(artist, this);
	}

	async * getArtistAlbums(artistId: string, options?: {} = {}): AsyncAlbumGenerator {
		await this._fetchUserDataIfNeeded();
		options = {...options};
		artistId = this._parseItemId(artistId);
		let offset = 0;
		while(true) {
			try {
				let { items, next } = await this.api.getArtistAlbums(artistId, {
					offset: offset,
					market: 'from_token'
				});
				items = items.map((item) => {
					return this.createMediaItem(item);
				});
				// fix Spotify's dumbassery
				if(next === 'null') {
					next = null;
				}
				offset += items.length;
				if(next) {
					yield { result: items };
				}
				else {
					return { result: items };
				}
			}
			catch(error) {
				yield { error };
			}
		}
	}

	async getAlbum(albumId: string): Promise<Album> {
		await this._fetchUserDataIfNeeded();
		albumId = this._parseItemId(albumId);
		const albumData = await this.api.getAlbum(albumId, {
			market: 'from_token'
		});
		return new Album(this._preParseAlbum(albumData), this);
	}

	async getPlaylist(playlistId: string): Promise<Playlist> {
		await this._fetchUserDataIfNeeded();
		playlistId = this._parseItemId(playlistId);
		const playlistData = await this.api.getPlaylist(playlistId, {
			market: 'from_token'
		});
		return new Playlist(this._preParsePlaylist(playlistData), this);
	}

	async * generateUserLibrary(resumeId: ?UserLibraryResumeId = null): ContinuousAsyncGenerator<{resumeId:UserLibraryResumeId,items:Array<MediaLibraryItem>,progress:number}> {
		let mostRecentItem = resumeId?.mostRecentItem;
		let syncingOffset = resumeId?.syncingOffset;
		let syncingItem = resumeId?.syncingItem;
		let syncingMostRecentItem = resumeId?.syncingMostRecentItem;
		let offset: number = (syncingOffset != null && syncingItem) ? syncingOffset : 0;
		let progress = 0;
		while(true) {
			let results: any = null;
			try {
				results = await this.api.getMyTracks({
					offset: offset,
					limit: 50,
					market: 'from_token'
				});
			}
			catch(error) {
				yield { error };
				continue;
			}
			let { items, total, next } = results;
			items = items.map((item): MediaLibraryItem => ({
				track: (this.createMediaItem(item.track): any),
				libraryProvider: this.name,
				addedAt: (item.added_at) ? (new Date(item.added_at)).getTime() : null
			}));
			// fix spotify's bullshit
			if(next === 'null') {
				next = null;
			}
			if(offset === 0) {
				// set the "working" most recent item
				const item = items[0];
				syncingMostRecentItem = item ? {
					trackURI: item.track.uri,
					addedAt: item.addedAt
				} : null;
			}
			// check if we're resuming a sync
			else if(offset === syncingOffset && syncingItem) {
				const firstItem = items[0];
				const trackURI = firstItem?.track.uri;
				const addedAt = firstItem?.addedAt;
				// if the item we just got doesn't match the item we stopped at, cache and restart from offset 0
				if(!firstItem || syncingItem.trackURI !== trackURI || syncingItem.addedAt !== addedAt) {
					syncingOffset = null;
					syncingItem = null;
					syncingMostRecentItem = null;
					resumeId = {
						mostRecentItem: (mostRecentItem: any),
						syncingOffset,
						syncingItem,
						syncingMostRecentItem
					};
					yield { result: {
						resumeId,
						items,
						progress
					}};
					offset = 0;
					continue;
				}
			}
			// calculate progress
			progress = (offset + items.length) / total;
			// check if we're finished syncing
			let finished = false;
			if(!next) {
				finished = true;
			}
			else if(mostRecentItem) {
				for(const item of items) {
					if(item.addedAt == null || item.addedAt < mostRecentItem.addedAt) {
						finished = true;
						break;
					}
				}
			}
			if(finished) {
				resumeId = {
					mostRecentItem: (syncingMostRecentItem: any),
					syncingOffset: null,
					syncingItem: null,
					syncingMostRecentItem: null
				};
				return { result: {
					resumeId,
					items,
					progress
				}};
			}
			else {
				const lastIndex = items.length - 1;
				const lastItem = items[lastIndex];
				syncingOffset = (lastIndex >= 0) ? (offset + lastIndex) : null;
				syncingItem = {
					trackURI: lastItem.track.uri,
					addedAt: lastItem.addedAt
				};
				resumeId = {
					mostRecentItem: (mostRecentItem: any),
					syncingOffset,
					syncingItem,
					syncingMostRecentItem
				};
				yield { result: {
					resumeId,
					items,
					progress
				}};
			}
			offset += items.length;
		}
	}



	+player: MediaPlaybackProvider = {
		events: new EventEmitter(),

		prepare: async (track: Track): Promise<void> => {
			// can't really "prepare" with this SDK
			await this._fetchUserDataIfNeeded();
		},

		play: async (track: Track, position: number = 0): Promise<void> => {
			console.log("Playing Spotify track " + track.name);
			this._setPlayingQueue.cancelAllTasks();
			await this._playQueue.run(async function* (task: AsyncQueue.Task) {
				await this._fetchUserDataIfNeeded();
				yield;
				await this.api.playURI(track.uri, 0, position);
				this._trackPlaying = true;
				yield;
				this._setPlayingUntilSuccess();
			}.bind(this));
		},

		setPlaying: async (playing: boolean): Promise<void> => {
			if (!playing && this._isPlaying) {
				this._isPausing = true;
				this._setPlayingQueue.cancelAllTasks();
			}
			await this.api.setPlaying(playing);
		},

		stop: async (): Promise<void> => {
			console.log("Stopping spotify player");
			this._playQueue.cancelAllTasks();
			this._setPlayingQueue.cancelAllTasks();
			if (this._isPlaying) {
				this._isPausing = true;
			}
			await this.api.setPlaying(false);
		},

		seek: async (position: number): Promise<void> => {
			await this.api.seek(position);
		},

		getMetadata: async (): Promise<PlaybackMetadata> => {
			return await this.api.getPlaybackMetadataAsync();
		},

		getState: async (): Promise<PlaybackState> => {
			return await this.api.getPlaybackStateAsync();
		}
	}
}


export default new SpotifyProvider();
