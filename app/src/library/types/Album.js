// @flow

import { MediaProvider } from './MediaProvider';
import TrackCollection, {
	TrackCollectionItem
} from './TrackCollection';
import type {
	TrackCollectionData
} from './TrackCollection';

import Artist from './Artist';

import {
	parseArtists,
} from './parse';


export class AlbumItem extends TrackCollectionItem {
	constructor(data: Object, provider: MediaProvider, context: Album) {
		super(data, provider, context);

		const track = this.track;
		const albumData = context.data;
		const trackData = track.data;
		if(!trackData.images) {
			trackData.images = albumData.images;
		}
		if(!trackData.imageURL) {
			trackData.imageURL = albumData.imageURL;
		}
		track.album = context;
		if(!track.artists) {
			delete track.artists;
			// lazy-load track artists
			const descriptor: any = {
				get: (): ?Array<Artist> => {
					delete track.artists;
					let artists = context.artists;
					if(artists) {
						artists = artists.slice(0);
						track.artists = artists;
						return artists;
					}
					else {
						track.artists = null;
					}
					return null;
				},
				set: (value: ?Array<Artist>) => {
					delete track.artists;
					track.artists = value;
				},
				configurable: true
			};
			Object.defineProperty(track, 'artists', descriptor);
		}
	}

	matchesItem(item: TrackCollectionItem): boolean {
		if(this.track.uri === item.track.uri) {
			return true;
		}
		return false;
	}
}


export type AlbumData = TrackCollectionData & {
	artists: Array<{
		uri: string,
		provider: string,
		type: string,
		name: string
	}>
}


export default class Album extends TrackCollection {
	static Item = AlbumItem;

	type: string = 'album';

	artists: ?Array<Artist>;

	constructor(data: Object, provider: MediaProvider) {
		super(data, provider, {
			itemType: AlbumItem
		});

		// artists
		this.artists = parseArtists(data, provider);
	}

	get artist(): ?Artist {
		if(!this.artists || this.artists.length === 0) {
			return null;
		}
		return this.artists[0];
	}

	isSingle(): boolean {
		const data = this.data;
		if(data.album_type) {
			if(data.album_type === 'single') {
				return true;
			}
			else if(data.album_type === 'album') {
				return false;
			}
		}
		const items = this.items;
		if(items && items.length === 1) {
			return true;
		}
		return false;
	}

	toData(options: {includeTracks?: boolean | {startIndex:number, endIndex:number}} = {}): AlbumData {
		const data = (super.toData(): any);
		return Object.assign(data, {
			artists: this.artists ? this.artists.map((artist: Artist) => ({
				type: artist.type,
				uri: artist.uri,
				provider: artist.provider.name,
				name: artist.name
			})) : null
		});
	}
}
