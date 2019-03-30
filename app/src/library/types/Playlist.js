// @flow

import TrackCollection, {
	TrackCollectionItem
} from './TrackCollection';
import type { TrackCollectionOptions } from './TrackCollection';
import { MediaProvider } from './MediaProvider';

import Track from './Track';
import Artist from './Artist';

import {
	parseAlbum,
	parseArtists,
	parseTrackCollectionItems
} from './parse';
import AsyncList from '../../util/AsyncList';


export class PlaylistItem extends TrackCollectionItem {
	addedAt: ?number;
	addedBy: ?{
		id: string,
		uri: string,
		name: string
	};

	constructor(data: Object, provider: MediaProvider, context: Playlist) {
		super(data, provider, context);

		if(data.added_at && data.added_at !== 'null') {
			this.addedAt = (new Date(data.added_at)).getTime();
		}
		else if(typeof data.addedAt === 'number') {
			this.addedAt = data.addedAt;
		}
		else {
			this.addedAt = null;
		}

		if(data.added_by && data.added_by !== 'null') {
			this.addedBy = data.added_by;
		}
		else if(data.addedBy) {
			this.addedBy = data.addedBy;
		}
		else {
			this.addedBy = null;
		}
	}

	matchesItem(item: TrackCollectionItem): boolean {
		if(!(item instanceof PlaylistItem)) {
			return false;
		}
		if(this.track.uri !== item.track.uri || this.addedAt !== item.addedAt || this.addedBy?.uri !== item.addedBy?.uri) {
			return false;
		}
		return true;
	}
}


export default class Playlist extends TrackCollection {
	type: string = 'playlist';

	constructor(data: Object, provider: MediaProvider, options: TrackCollectionOptions = {}) {
		super(data, provider, {
			itemType: PlaylistItem,
			...options
		});
	}
}
