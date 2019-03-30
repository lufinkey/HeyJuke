// @flow

import { sleep } from './misc';
import AsyncQueue from './AsyncQueue';
import type { AsyncQueueFunction } from './AsyncQueue';
import EventEmitter from 'events';


type ChunkType = Promise<void> | true | void;

export type AsyncListOptions<ItemType> = {
	initialItems?: Array<ItemType>,
	initialItemsOffset?: number,
	length: ?number,
	chunkSize: number,
	loader: (index: number, count: number, list: AsyncList<ItemType>) => Promise<Array<ItemType>>,
	noOverwrite?: boolean,
	mutators?: {
		// mutators apply the mutation to the server/source, and then call a flush event to apply the mutations to the AsyncList
		flushEvents: EventEmitter,
		insert: (items: Array<ItemType>, before: ?ItemType, array: AsyncList<ItemType>) => Promise<void>,
		remove: (items: Array<ItemType>, array: AsyncList<ItemType>) => Promise<void>,
		move: (items: Array<ItemType>, before: ?ItemType, array: AsyncList<ItemType>) => Promise<void>
	}
}


export default class AsyncList<ItemType> {
	items: Array<?ItemType>;

	_options: AsyncListOptions<ItemType>;

	_chunks: Array<ChunkType>;
	_chunkReEvaluationPromise: ?Promise<void> = null;
	_itemPromises: Object = {};

	_mutationQueue: AsyncQueue = new AsyncQueue();

	constructor(options: AsyncListOptions<ItemType>) {
		this._options = {...options};

		const initialItems = options.initialItems || [];
		const initialItemsOffset = options.initialItemsOffset || 0;
		const chunkSize = options.chunkSize;
		this.items = [];
		this.items.length = options.length ?? (initialItemsOffset + initialItems.length);

		// get chunk range
		this._chunks = [];
		this._chunks.length = Math.ceil(this.items.length / chunkSize);
		let startLoadedChunkIndex = Math.ceil(initialItemsOffset / chunkSize);
		let endLoadedChunkIndex = Math.floor((initialItemsOffset + initialItems.length) / chunkSize);
		if(initialItemsOffset === 0 && initialItems.length === this.items.length) {
			startLoadedChunkIndex = 0;
			endLoadedChunkIndex = this._chunks.length;
		}
		// set initial items
		for(let i=0; i<initialItems.length; i++) {
			const item = initialItems[i];
			if(item) {
				this.items[initialItemsOffset + i] = item;
			}
		}
		// set loaded chunks
		for(let i=startLoadedChunkIndex; i<endLoadedChunkIndex; i++) {
			const startIndex = i * chunkSize;
			const endIndex = (i + 1) * chunkSize;
			let chunkLoaded = true;
			for(let j=startIndex; j<endIndex; j++) {
				if(!this.items[j]) {
					chunkLoaded = false;
					break;
				}
			}
			if(chunkLoaded) {
				this._chunks[i] = chunkLoaded;
			}
		}

		// listen to flush events
		const mutators = options.mutators;
		if(mutators) {
			if(!mutators.flushEvents || !mutators.insert || !mutators.remove || !mutators.move) {
				throw new Error("Missing required mutator field");
			}
			mutators.flushEvents.addListener('insert', this._onInsert);
			mutators.flushEvents.addListener('remove', this._onRemove);
		}
	}

	get chunkSize(): number {
		return this._options.chunkSize;
	}

	get chunkCount(): number {
		return this._chunks.length;
	}

	isItemLoaded(index: number): boolean {
		return (this.items[index] ? true : false);
	}

	areItemsLoaded(index: number, count: number): boolean {
		let endIndex = index + count - 1;
		if(endIndex >= this.items.length) {
			endIndex = this.items.length - 1;
		}
		if(endIndex < 0) {
			endIndex = 0;
		}
		const chunkSize = this.chunkSize;
		const startChunkIndex = this.getChunkIndexForItemIndex(index);
		const endChunkIndex = this.getChunkIndexForItemIndex(endIndex);
		for(let i=startChunkIndex; i<=endChunkIndex; i++) {
			if(!this.isChunkLoaded(i)) {
				const chunkStartIndex = i * chunkSize;
				const chunkEndIndex = Math.min((i+1) * chunkSize, endIndex);
				for(let j=chunkStartIndex; j<chunkEndIndex; j++) {
					if(!this.isItemLoaded(j)) {
						return false;
					}
				}
			}
		}
		return true;
	}

	getItem(index: number): ?ItemType | Promise<?ItemType> {
		const item = this.items[index];
		if(item) {
			return item;
		}
		let promise = this._itemPromises[index];
		if(promise) {
			return promise;
		}
		promise = (async () => {
			try {
				await this.loadChunkForItemIndex(index);
			}
			finally {
				const cmpPromise = this._itemPromises[index];
				if(promise === cmpPromise) {
					delete this._itemPromises[index];
				}
			}
			return (this.items[index]: any);
		})();
		this._itemPromises[index] = promise;
		return promise;
	}

	getLoadedItems(startIndex: number = 0): Array<ItemType> {
		let chunkIndex = this.getChunkIndexForItemIndex(startIndex);
		const chunkSize = this.chunkSize;
		const chunkCount = this.chunkCount;
		while(chunkIndex < chunkCount) {
			if(this.isChunkLoaded(chunkIndex)) {
				chunkIndex += 1;
			}
			else {
				const itemsStartIndex = chunkIndex * chunkSize;
				const itemsEndIndex = Math.min(itemsStartIndex + chunkSize, this.items.length);
				for(let i=itemsStartIndex; i<itemsEndIndex; i++) {
					const item = this.items[i];
					if(!item) {
						return (this.items.slice(startIndex, i): any);
					}
				}
				this._chunks[chunkIndex] = true;
				chunkIndex += 1;
			}
		}
		return (this.items.slice(startIndex): any);
	}

	getChunkIndexForItemIndex(index: number) {
		return Math.floor(index / this.chunkSize);
	}

	isChunkLoaded(chunkIndex: number): boolean {
		const chunk = this._chunks[chunkIndex];
		if(!chunk || chunk instanceof Promise) {
			return false;
		}
		return true;
	}

	async loadChunkForItemIndex(index: number): Promise<void> {
		return await this.loadChunkIndex(this.getChunkIndexForItemIndex(index));
	}

	async _loadChunkIndex(chunkIndex: number, options: {force?: boolean} = {}): Promise<void> {
		if(this._chunkReEvaluationPromise) {
			await this._chunkReEvaluationPromise;
		}
		if(!options.force) {
			let chunk = this._chunks[chunkIndex];
			if(chunk instanceof Promise) {
				return await chunk;
			}
			else if(chunk) {
				return;
			}
		}
		const chunkSize = this.chunkSize;
		const chunkStartIndex = chunkIndex * chunkSize;
		const chunk = (async () => {
			try {
				const newItems = await this._options.loader(chunkStartIndex, chunkSize, this);
				const cmpPromise = this._chunks[chunkIndex];
				if(chunk === cmpPromise) {
					// chunk was loaded, so add the items and set the chunk to `true`
					let itemIndex = chunkStartIndex;
					for(let i=0; i<newItems.length; i++) {
						const newItem = newItems[i];
						const prevItem = this.items[itemIndex];
						if(this._options.noOverwrite) {
							if(!prevItem) {
								this.items[itemIndex] = newItem;
							}
						}
						else {
							this.items[itemIndex] = newItem;
						}
						itemIndex += 1;
					}
					if(newItems.length > 0) {
						this._chunks[chunkIndex] = true;
					}
					else {
						delete this._chunks[chunkIndex];
					}
				}
			}
			finally {
				// clean up if there was an error and we weren't able to set the chunk to `true`
				const cmpChunk = this._chunks[chunkIndex];
				if(chunk === cmpChunk) {
					delete this._chunks[chunkIndex];
				}
			}
		})();
		this._chunks[chunkIndex] = chunk;
		return await chunk;
	}

	async loadChunkIndex(chunkIndex: number): Promise<void> {
		// check if there's already a chunk loaded or loading
		let chunk = this._chunks[chunkIndex];
		if(chunk instanceof Promise) {
			return await chunk;
		}
		else if(chunk) {
			return;
		}
		// wait for mutation access
		await this.lock(async (task: AsyncQueue.Task) => {
			await this._loadChunkIndex(chunkIndex);
		});
	}

	async invalidateChunkForItemIndex(index: number): Promise<void> {
		return await this.invalidateChunkIndex(this.getChunkIndexForItemIndex(index));
	}

	async invalidateChunkIndex(chunkIndex: number): Promise<void> {
		return await this.lock(async (task: AsyncQueue.Task) => {
			const chunk = this._chunks[chunkIndex];
			if(chunk instanceof Promise) {
				await chunk;
				delete this._chunks[chunkIndex];
			}
			else if(chunk) {
				delete this._chunks[chunkIndex];
			}
		});
	}

	async lock(handler: AsyncQueueFunction) {
		await this._mutationQueue.run(handler);
	}

	_setNeedsChunkReEvaluation() {
		for(const chunkKey of Object.keys((this._chunks: any))) {
			delete this._chunks[chunkKey];
		}
		if(!this._chunkReEvaluationPromise) {
			this._chunkReEvaluationPromise = (async () => {
				await sleep(0);
				this._reEvaluateChunks();
				this._chunkReEvaluationPromise = null;
			})();
		}
	}

	_reEvaluateChunks() {
		const chunkSize = this.chunkSize;
		this._chunks = [];
		this._chunks.length = Math.ceil(this.items.length / chunkSize);
		let currentChunkIndex = 0;
		let currentIndex = 0;
		let currentChunkLastIndex = Math.min(chunkSize - 1, this.items.length);
		let chunkDead = false;
		const resetChunkIndex = (chunkIndex: number) => {
			currentChunkIndex = chunkIndex;
			currentIndex = chunkIndex * chunkSize;
			currentChunkLastIndex = Math.min(currentIndex + chunkSize, this.items.length) - 1;
			chunkDead = false;
		};
		let itemIndex = 0;
		for(const item of this.items) {
			const index = itemIndex;
			itemIndex += 1;
			if(item === undefined) {
				continue;
			}
			const chunkIndex = this.getChunkIndexForItemIndex(index);
			if(chunkIndex === currentChunkIndex) {
				if(chunkDead) {
					continue;
				}
				else if(index === (currentIndex+1)) {
					currentIndex = index;
					if(index === currentChunkLastIndex) {
						this._chunks[chunkIndex] = true;
					}
					continue;
				}
				chunkDead = true;
			}
			else {
				resetChunkIndex(chunkIndex);
				if(index !== currentIndex) {
					chunkDead = true;
				}
			}
		}
	}

	_insert(items: Array<ItemType>, index: number) {
		this.items.splice(index, 0, ...items);
		this._setNeedsChunkReEvaluation();
	}

	_push(items: Array<ItemType>) {
		this.items.push(...items);
		this._setNeedsChunkReEvaluation();
	}

	_remove(index: number, count: number) {
		this.items.splice(index, count);
		this._setNeedsChunkReEvaluation();
	}

	async insertBefore(items: Array<ItemType>, before: ?ItemType) {
		await this.lock(async (task: AsyncQueue.Task) => {
			if(this._options.mutators) {
				await this._options.mutators.insert(items, before, this);
			}
			else {
				if(before == null) {
					this._push(items);
				}
				else {
					const index = this.items.indexOf(before);
					if(index === -1) {
						throw new Error("No instance of before marker in array");
					}
					this._insert(items, index);
				}
			}
		});
	}

	async append(items: ItemType | Array<ItemType>) {
		if(!(items instanceof Array)) {
			items = [items];
		}
		return await this.insertBefore(items, null);
	}

	async remove(items: ItemType | Array<ItemType>) {
		await this.lock(async (task: AsyncQueue.Task) => {
			if(!(items instanceof Array)) {
				items = [items];
			}
			if(this._options.mutators) {
				await this._options.mutators.remove(items, this);
			}
			else {
				for(const item of items) {
					const index = this.items.indexOf(item);
					if(index !== -1) {
						this._remove(index, 1);
					}
				}
			}
		});
	}

	_onInsert({items, index}: {items: Array<ItemType>, index: number}) {
		this._insert(items, index);
	}
	_onInsert = this._onInsert.bind(this);

	_onRemove({index, count}: {index: number, count: number}) {
		this._remove(index, count);
	}
	_onRemove = this._onRemove.bind(this);
}
