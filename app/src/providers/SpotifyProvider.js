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
	AsyncAlbumGenerator,
	PlaybackState,
	PlaybackMetadata,
	PlaybackEvent
} from './types';

import EventEmitter from 'events';
import RNEvents from 'react-native-events';
import Spotify from 'rn-spotify-sdk';
const SpotifyURI = require('spotify-uri');

import AsyncQueue from '../util/AsyncQueue';
import {
	waitForEvent,
	sleep
} from '../util/misc';


class SpotifyProvider implements MediaProvider {
	+name = 'spotify';
	+displayName = "Spotify";

	+events = new EventEmitter();
	_nativeEvents: EventEmitter;

	+usesStreamPlayer: boolean = false;

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
		RNEvents.addSubscriber(Spotify, this._nativeEvents);
		const eventForwards = {
			play: 'play',
			contextFinish: 'audioDeliveryDone',
			metadataChange: 'metadataChange'
		};
		for(const eventName in eventForwards) {
			const eventForward = eventForwards[eventName];
			this._nativeEvents.addListener(eventForward, (event) => {
				this._onPlaybackEvent(event);
				this.events.emit(eventName, this._createPlaybackEvent(event));
			});
		}
		Spotify.isLoggedInAsync().then((loggedIn) => {
			this._loggedIn = loggedIn;
		});
		this._nativeEvents.addListener('pause', this._onPause);
		this._nativeEvents.addListener('login', this._onLogin);
		this._nativeEvents.addListener('logout', this._onLogout);
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
		RNEvents.removeSubscriber(Spotify, this._nativeEvents);
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
					this._userData = await Spotify.getMe();
				}
				catch(error) {
					console.warn("Error fetching user data: ", error);
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
					await Spotify.setPlaying(true);
					yield;
					if(!this._isPlaying) {
						await waitForEvent(this._nativeEvents, 'play', (event: any) => {
							// hooray, it was called!
						}, {timeout: 2000});
					}
					return;
				}
				catch(error) {
					console.warn("Error attempting to play Spotify player: ", error);
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
	}

	_onPause = (event: any) => {
		this._onPlaybackEvent(event);
		this.events.emit('pause', this._createPlaybackEvent(event));
	}

	_onLogin = () => {
		this._loggedIn = true;
		this.events.emit('login');
	}

	_onLogout = () => {
		this._loggedIn = false;
		this._userData = null;
		this.events.emit('logout');
	}

	_onBecomeInactive = (event: any) => {
		//
	}

	_onBecomeActive = (event: any) => {
		//
	}

	_onDisconnect = () => {
		//
	}

	_onReconnect = () => {
		//
	}

	_onTrackDelivered = (event: any) => {
		this._trackPlaying = false;
		this._isPausing = false;
		this._onPlaybackEvent(event);
		this.events.emit('trackFinish', this._createPlaybackEvent(event));
	}

	_onTrackChange = (event: any) => {
		this._trackPlaying = true;
	}

	_onPlayerMessage = (message: string) => {
		//
	}

	_onTemporaryPlayerError = () => {
		this._lastTemporaryIssuesTime = (new Date()).getTime();
	}




	async login(): Promise<boolean> {
		const loggedIn = await Spotify.login({showDialog: true});
		this._fetchUserDataIfNeeded();
		return loggedIn;
	}

	async logout(): Promise<void> {
		await Spotify.logout();
	}

	get isLoggedIn() {
		return this._loggedIn;
	}


	_preParseAlbum(album: any) {
		const trackResults = album.tracks;
		if(trackResults) {
			album.tracks = trackResults.items || [];
			// fix Spotify's dumbassery
			if(trackResults.next === 'null') {
				trackResults.next = null;
			}
			if(trackResults.next || (!trackResults.items && trackResults.total > 0)) {
				album.asyncLoad = {
					loader: async (index: number, count: number): Promise<Array<any>> => {
						const { items, next } = await Spotify.getAlbumTracks(album.id, {
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
		const trackResults = playlist.tracks;
		if(trackResults) {
			playlist.tracks = trackResults.items || [];
			playlist.asyncLoad = {
				loader: async (index: number, count: number): Promise<Array<any>> => {
					const { items, next } = await Spotify.getPlaylistTracks(playlist.id, {
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
		const results = await Spotify.search(text, types, options);
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
		const track = await Spotify.getTrack(trackId, {
			market: 'from_token'
		});
		return new Track(track, this);
	}

	async getArtist(artistId: string): Promise<Artist> {
		await this._fetchUserDataIfNeeded();
		artistId = this._parseItemId(artistId);
		const artist = await Spotify.getArtist(artistId, {
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
				let { items, next } = await Spotify.getArtistAlbums(artistId, {
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
		const albumData = await Spotify.getAlbum(albumId, {
			market: 'from_token'
		});
		return new Album(this._preParseAlbum(albumData), this);
	}

	async getPlaylist(playlistId: string): Promise<Playlist> {
		await this._fetchUserDataIfNeeded();
		playlistId = this._parseItemId(playlistId);
		const playlistData = await Spotify.getPlaylist(playlistId, {
			market: 'from_token'
		});
		return new Playlist(this._preParsePlaylist(playlistData), this);
	}

	async prepare(track: Track): Promise<void> {
		// can't really "prepare" with this SDK
		await this._fetchUserDataIfNeeded();
	}

	async play(track: Track): Promise<void> {
		this._setPlayingQueue.cancelAllTasks();
		await this._playQueue.run(async function * (task: AsyncQueue.Task) {
			await this._fetchUserDataIfNeeded();
			yield;
			await Spotify.playURI(track.uri, 0, 0);
			this._trackPlaying = true;
			yield;
			this._setPlayingUntilSuccess();
		}.bind(this));
	}

	async setPlaying(playing: boolean): Promise<void> {
		if(!playing && this._isPlaying) {
			this._isPausing = true;
			this._setPlayingQueue.cancelAllTasks();
		}
		await Spotify.setPlaying(playing);
	}

	async stop(): Promise<void> {
		this._playQueue.cancelAllTasks();
		this._setPlayingQueue.cancelAllTasks();
		if(this._isPlaying) {
			this._isPausing = true;
		}
		await Spotify.setPlaying(false);
	}

	async seek(position: number): Promise<void> {
		await Spotify.seek(position);
	}

	async getPlayerMetadata(): Promise<PlaybackMetadata> {
		return await Spotify.getPlaybackMetadataAsync();
	}

	async getPlayerState(): Promise<PlaybackState> {
		return await Spotify.getPlaybackStateAsync();
	}
}


export default new SpotifyProvider();
