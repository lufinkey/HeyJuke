// @flow

import MediaItem from './MediaItem';
import { MediaProvider } from './MediaProvider';
import type { ContinuousAsyncGenerator } from './Generators';
import Track from './Track';
import { parseTrackCollectionItems } from './parse';
import { cloneContinuousAsyncGenerator, sleep } from '../../util/misc';
import AsyncList from '../../util/AsyncList';


export type AsyncTrackCollectionItemGenerator = ContinuousAsyncGenerator<Array<TrackCollectionItem>>

export class TrackCollectionItem {
	track: Track;
	context: TrackCollection;

	constructor(data: {track: Track | Object}, provider: MediaProvider, context: TrackCollection) {
		if(data.track instanceof Track) {
			this.track = data.track;
		}
		else {
			const track = new Track(data.track, provider);
			this.track = track;
		}
		this.context = context;
	}

	get indexInContext(): ?number {
		const items = this.context.items;
		if(!items) {
			return null;
		}
		const index = items.indexOf(this);
		if(index === -1) {
			return null;
		}
		return index;
	}

	matchesItem(item: TrackCollectionItem) {
		return false;
	}
}

export type TrackCollectionOptions = {
	itemType?: any,
	itemProviderMap?: (itemData: Object) => MediaProvider
}


export default class TrackCollection extends MediaItem {
	static Item = TrackCollectionItem;

	_items: ?Array<TrackCollectionItem> = null;
	_asyncItems: ?AsyncList<TrackCollectionItem> = null;

	_trackGeneratorDone: boolean = false;
	_options: TrackCollectionOptions;

	constructor(data: Object, provider: MediaProvider, options: TrackCollectionOptions = {}) {
		super(data, provider);
		this._options = options;
		this._parseTrackCollectionData(data);
	}

	_parseTrackCollectionData(data: Object) {
		// tracks
		let items = null;
		let offset = 0;
		if(data.tracks) {
			let tracksArray = null;
			if(data.tracks instanceof Array) {
				tracksArray = data.tracks;
			}
			else if(data.tracks.items instanceof Array) {
				tracksArray = data.tracks.items;
				if(data.tracks.offset != null) {
					offset = data.tracks.offset;
				}
			}
			if(tracksArray) {
				items = parseTrackCollectionItems(tracksArray, this.provider, this, this._options);
			}
		}
		else if(data.type === 'track') {
			items = parseTrackCollectionItems([data], this.provider, this, this._options);
		}

		// async list + mutators
		const asyncLoad = data.asyncLoad;
		if(asyncLoad) {
			if(typeof asyncLoad.loader !== 'function') {
				throw new Error("data.asyncLoad.loader is not a function");
			}
			else if(typeof asyncLoad.length !== 'number') {
				throw new Error("data.asyncLoad.length is not a number");
			}
			this._asyncItems = new AsyncList({
				initialItems: items || [],
				initialItemsOffset: offset || 0,
				loader: async (index: number, count: number): Promise<Array<TrackCollectionItem>> => {
					return parseTrackCollectionItems(await asyncLoad.loader(index, count), this.provider, this, this._options);
				},
				// TODO send events when overwriting will occur
				// TODO or mark certain sections as ready for overwrite?
				noOverwrite: true,
				length: asyncLoad.length,
				chunkSize: asyncLoad.chunkSize || 24,
				mutators: asyncLoad.mutators
			});
		}
		else {
			this._items = items;
		}
	}


	get items(): ?Array<?TrackCollectionItem> {
		if(this._asyncItems) {
			return this._asyncItems.items;
		}
		else if(this._items) {
			return (this._items : any);
		}
		return null;
	}

	get itemCount(): ?number {
		if(this._asyncItems) {
			return this._asyncItems.items.length;
		}
		else if(this._items) {
			return this._items.length;
		}
		const data = this.data;
		if(data.itemCount != null) {
			return data.itemCount;
		}
		else if(data.numTracks != null) {
			return data.numTracks;
		}
		else if(data.total_tracks != null) {
			return data.total_tracks;
		}
		return null;
	}

	getItem(index: number): ?TrackCollectionItem | Promise<?TrackCollectionItem> {
		if(this._asyncItems) {
			return this._asyncItems.getItem(index);
		}
		else if(this._items) {
			return this._items[index];
		}
		return null;
	}

	getItemAsync(index: number): Promise<?TrackCollectionItem> {
		const item = this.getItem(index);
		if(item instanceof Promise) {
			return item;
		}
		return Promise.resolve(item);
	}


	async loadItemsInRange(index: number, count: number) {
		const asyncItems = this._asyncItems;
		if(!asyncItems) {
			return;
		}
		else if(count === 0) {
			return;
		}
		const promises = [];
		const startChunkIndex = asyncItems.getChunkIndexForItemIndex(index);
		const endChunkIndex = Math.min(
			asyncItems.getChunkIndexForItemIndex(index + (count-1)),
			asyncItems.chunkCount-1);
		for(let i=startChunkIndex; i<=endChunkIndex; i++) {
			promises.push(asyncItems.loadChunkIndex(i));
		}
		await Promise.all(promises);
	}

	getChunkIndexForItemIndex(index: number): ?number {
		if(this._asyncItems) {
			return this._asyncItems.getChunkIndexForItemIndex(index);
		}
		return null;
	}

	isItemLoaded(index: number): boolean {
		if(this._asyncItems) {
			return this._asyncItems.isItemLoaded(index);
		}
		else if(this._items) {
			return this._items[index] ? true : false;
		}
		return false;
	}

	areItemsLoaded(index: number, count: number): boolean {
		if(this._asyncItems) {
			return this._asyncItems.areItemsLoaded(index, count);
		}
		else if(this._items) {
			return true;
		}
		return false;
	}

	getLoadedItems(startIndex: number = 0): Array<TrackCollectionItem> {
		const asyncItems = this._asyncItems;
		if(!asyncItems) {
			const items = this._items;
			return items ? items.slice(startIndex) : [];
		}
		return asyncItems.getLoadedItems(startIndex);
	}


	async * createItemGenerator(): AsyncTrackCollectionItemGenerator {
		const asyncItems = this._asyncItems;
		if(!asyncItems) {
			return { result: (this._items || []) };
		}
		const data = this.data;
		const chunkSize = asyncItems.chunkSize;
		let index = 0;
		let chunkIndex = 0;
		while(chunkIndex < asyncItems.chunkCount) {
			try {
				await asyncItems.loadChunkIndex(chunkIndex);
				const yieldedItems = asyncItems.items.slice(index, Math.min(index+chunkSize, asyncItems.items.length));
				if(chunkIndex >= (asyncItems.chunkCount-1)) {
					return { result: yieldedItems };
				}
				else {
					yield { result: yieldedItems };
				}
				index += chunkSize;
				chunkIndex += 1;
			}
			catch(error) {
				yield { error };
			}
		}
		return { result: [] };
	}


	hasItemData(): boolean {
		if(this.items || !this.provider.fetchItemData) {
			return true;
		}
		return false;
	}

	onFetchData(data: Object) {
		this._parseTrackCollectionData(data);
	}


	map<R>(func: (item: TrackCollectionItem, index: number) => R): Array<R> {
		const items = this.items;
		if(!items) {
			return [];
		}
		return items.map((func: any));
	}
}
