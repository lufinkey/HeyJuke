// @flow

import { MediaProvider } from './MediaProvider';
import TrackCollection from './TrackCollection';
import MediaItem from './MediaItem';

import Album from './Album';
import Artist from './Artist';

import {
	parseAlbum,
	parseArtists
} from './parse';


export default class Track extends MediaItem {
	type: string = 'track';

	album: ?Album = null;
	artists: ?Array<Artist> = null;

	duration: ?number = null;
	audioURL: ?string = null;

	_itemDataPromise: ?Promise<void> = null;

	constructor(data: Object, provider: MediaProvider) {
		super(data, provider);

		// album
		this.album = parseAlbum(data, provider);

		// artists
		this.artists = parseArtists(data, provider);

		// other data
		if(data.duration) {
			this.duration = data.duration;
		}
		else if(data.duration_ms) {
			this.duration = data.duration_ms / 1000;
		}
		if(data.audioURL) {
			this.audioURL = data.audioURL;
		}
	}

	get artist(): ?Artist {
		if(!this.artists || this.artists.length === 0) {
			return null;
		}
		return this.artists[0];
	}

	get genre(): ?string {
		const genre = this.data.genre;
		if(genre) {
			return genre;
		}
		return null;
	}

	get tags(): ?Array<string> {
		const tags = this.data.tags;
		if(tags) {
			return tags.slice(0);
		}
		return null;
	}

	isSingle(): boolean {
		if(this.uri === this.album?.uri) {
			return true;
		}
		else if(this.album) {
			return this.album.isSingle();
		}
		return true;
	}

	isPlayable(): boolean {
		const data = this.data;
		if(typeof data.playable === 'boolean') {
			return data.playable;
		}
		else if(typeof data.is_playable === 'boolean') {
			return data.is_playable;
		}
		else if(data.available_markets instanceof Array && data.available_markets.length == 0) {
			return false;
		}
		return true;
	}

	isMissingAlbumData(): boolean {
		return (!this.album || !this.album.uri);
	}

	isMissingArtistData(): boolean {
		return (!this.artists || this.artists.length == 0 || !this.artists[0].uri);
	}

	isMissingAudioData(): boolean {
		const data = this.data;
		if(typeof data.playable === 'boolean' && !data.playable) {
			return false;
		}
		else if(!this.audioURL && this.provider.usesStreamPlayer) {
			return true;
		}
		return false;
	}

	isMissingData(): boolean {
		return this.isMissingAlbumData() || this.isMissingArtistData() || this.isMissingAudioData();
	}

	onFetchData(newData: Object) {
		const data = this.data;
		if(this.isMissingAlbumData()) {
			this.album = parseAlbum(newData, this.provider);
		}
		if(this.isMissingArtistData()) {
			this.artists = parseArtists(newData, this.provider);
		}
		if(this.isMissingAudioData()) {
			this.audioURL = newData.audioURL;
			data.available = newData.available;
		}
		if(newData.duration != null) {
			this.duration = newData.duration;
		}
		if(data.images == null && newData.images != null) {
			data.images = newData.images;
		}
		if(newData.imageURL != null) {
			data.imageURL = newData.imageURL;
		}
	}
}
