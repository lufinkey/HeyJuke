// @flow

import { MediaProvider } from './MediaProvider';


export type MediaItemImage = {
	url: string,
	width?: number,
	height?: number
}


export default class MediaItem {
	type: string;

	_data: Object;
	_provider: MediaProvider;

	_itemDataPromise: ?Promise<void> = null;

	constructor(data: Object, provider: MediaProvider) {
		this._data = data;
		this._provider = provider;
		this.type = data.type;
	}

	get name(): string {
		return this._data.name || this._data.title || "";
	}

	get uri(): ?string {
		return this._data.uri || this._data.url || this._data.id || null;
	}

	get provider(): MediaProvider {
		return this._provider;
	}

	get explicit(): ?boolean {
		return this._data.explicit;
	}

	get data(): Object {
		return this._data;
	}



	getImage(options: {
		size?:{x?:number,y?:number},
		sizeTolerance?: number,
		aspectRatio?: number,
		aspectRatioTolerance?: number,
		allowNull?: boolean
	} = {}): ?MediaItemImage {
		const {
			size,
			sizeTolerance=180,
			aspectRatio,
			aspectRatioTolerance=0.1,
			allowNull=false } = options;
		// get image list from data
		let images = this.images;
		if(images.length === 1 && !allowNull) {
			return images[0];
		}
		else if(images.length > 0) {
			if((size == null || (size.x == null && size.y == null)) && aspectRatio == null) {
				return images[0];
			}
			// since images go biggest to smallest, reverse list so it's easier to parse
			images = images.reverse();
			if(aspectRatio != null) {
				// eliminate images that don't match aspect ratio
				let filteredImages = filterImagesByAspectRatio(images, aspectRatio, aspectRatioTolerance);
				if(filteredImages.length === 0) {
					if(allowNull) {
						return null;
					}
					// we have no images left, so lets try again, but just find the closest match
					filteredImages = sortImagesByAspectRatioDiff(images, aspectRatio);
					return filteredImages[0];
				}
				else if(filteredImages.length === 1) {
					// we only have one image left, so return it
					return filteredImages[1];
				}
				images = filteredImages;
			}
			if(size != null) {
				// sort images by width / height difference from preferred width / height
				images = sortImagesBySizeDiff(images, size);
			}
			let image = images[0];
			if(size != null && ((size.x != null && image.width != null && image.width < size.x) || (size.y != null && image.height != null && image.height < size.y))) {
				let index = 1;
				while(index < images.length) {
					const cmpImage = images[index];
					if((size.x == null || (cmpImage.width || size.x) >= size.x) && (size.y == null || (cmpImage.height || size.y) >= size.y)) {
						const widthDiff = (size.x != null) ? Math.abs((cmpImage.width || size.x) - size.x) : 0;
						const heightDiff = (size.y != null) ? Math.abs((cmpImage.height || size.y) - size.y) : 0;
						if(widthDiff <= sizeTolerance && heightDiff <= sizeTolerance) {
							image = cmpImage;
							break;
						}
					}
					index += 1;
				}
			}
			return image;
		}
		return null;
	}

	get images(): Array<MediaItemImage> {
		if(this._data.images && this._data.images.length > 0) {
			return this._data.images;
		}
		else if(this._data.album && this._data.album.images && this._data.album.images.length > 0) {
			return this._data.album.images;
		}
		else if(this._data.imageURL) {
			return [{
				url: this._data.imageURL,
				size: 'medium'
			}];
		}
		else if(this._data.albumCoverArtURL) {
			return [{
				url: this._data.albumCoverArtURL,
				size: 'medium'
			}];
		}
		else if(this._data.artist && this._data.artist.images && this._data.artist.images.length > 0) {
			return this._data.artist.images;
		}
		return [];
	}



	isMissingData(): boolean {
		return false;
	}

	async fetchItemData(): Promise<void> {
		if(this._itemDataPromise) {
			await this._itemDataPromise;
		}
		else if(!this.isMissingData() || !this.provider.fetchItemData) {
			return;
		}
		this._itemDataPromise = (async () => {
			const data = this.data;
			const itemData = await (this.provider: any).fetchItemData(this);
			this._itemDataPromise = null;
			this.onFetchData(itemData);
		})();
		await this._itemDataPromise;
		this._itemDataPromise = null;
	}

	onFetchData(data: any) {
		// Open for implementation
	}
}



function filterImagesByAspectRatio(images, aspectRatio, tolerance=0.1) {
	images = images.slice(0);
	let index = images.length - 1;
	while(index >= 0) {
		const image = images[index];
		if(image.width == null || image.height == null) {
			index -= 1;
			continue;
		}
		const imageAspectRatio = ((image.width: any) / (image.height: any));
		if(Math.abs(imageAspectRatio / aspectRatio) > tolerance) {
			images.splice(index, 1);
		}
		index -= 1;
	}
	return images;
}

function sortImagesByAspectRatioDiff(images, aspectRatio) {
	images = images.slice(0);
	const taggedImages = images.map((image) => {
		const imageAspectRatio = (image.width != null && image.height != null) ? (image.width/image.height) : 1;
		const imageAspectRatioDiff = Math.abs(imageAspectRatio / aspectRatio);
		return {
			image,
			aspectRatio: imageAspectRatio,
			aspectRatioDiff: imageAspectRatioDiff
		};
	});
	taggedImages.sort((a, b) => {
		if((a.image.width == null && b.image.width == null) || (a.image.height == null && b.image.height == null)) {
			return images.indexOf(a.image) - images.indexOf(b.image);
		}
		return a.aspectRatioDiff - b.aspectRatioDiff;
	});
	return taggedImages.map((image) => (image.image));
}

function filterImagesBySize(images, size, sizeTolerance=50) {
	images = images.slice(0);
	let index = images.length - 1;
	while(index > 0) {
		const image = images[index];
		const widthDiff = (size.x != null) ? Math.abs((image.width || size.x) - size.x) : 0;
		const heightDiff = (size.y != null) ? Math.abs((image.height || size.y) - size.y) : 0;
		if(widthDiff > sizeTolerance || heightDiff > sizeTolerance) {
			images.splice(index, 1);
		}
		index -= 1;
	}
	return images;
}

function sortImagesBySizeDiff(images, size) {
	images = images.slice(0);
	const taggedImages = images.map((image) => {
		const widthDiff = (size.x != null) ? Math.abs((image.width || size.x) - size.x) : 0;
		const heightDiff = (size.y != null) ? Math.abs((image.height || size.y) - size.y) : 0;
		return {
			image,
			widthDiff: widthDiff,
			heightDiff: heightDiff,
			totalDiff: widthDiff + heightDiff
		};
	});
	taggedImages.sort((a, b) => {
		if((a.image.width == null && b.image.width == null) || (a.image.height == null && b.image.height == null)) {
			if((a.image: any).size && (b.image: any).size) {
				return imageSizeValueFromString((a.image: any).size) - imageSizeValueFromString((b.image: any).size);
			}
			else {
				return images.indexOf(a.image) - images.indexOf(b.image);
			}
		}
		return a.totalDiff - b.totalDiff;
	});
	return taggedImages.map((image) => (image.image));
}

function imageSizeValueFromString(str: string) {
	switch(str) {
		case 'extra-large':
			return 5;
		case 'large':
			return 4;
		case 'medium':
			return 3;
		case 'small':
			return 2;
		case 'tiny':
			return 1;
		default:
			return 0;
	}
}
