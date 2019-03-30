
import { MediaProvider } from './MediaProvider';
import Artist from './Artist';
import Album from './Album';
import Track from './Track';
import TrackCollectionItem from './TrackCollection';
import type { TrackCollectionOptions } from './TrackCollection';


export const parseAlbum = (data: any, provider: MediaProvider): ?Album => {
	if(data.album) {
		return new Album(data.album, provider);
	}
	else if(data.albumName) {
		return new Album({
			type: 'album',
			name: data.albumName,
			uri: (data.albumURI || data.albumUri || data.albumURL || data.albumId || null)
		}, provider);
	}
	return null;
}



export const parseArtists = (data: any, provider: MediaProvider): ?Array<Artist> => {
	if(data.artists) {
		return data.artists.map((artist) => {
			return new Artist(artist, provider);
		});
	}
	else if(data.artist) {
		const artists = [];
		const artist1 = new Artist(data.artist, provider);
		artists.push(artist1);
		if(data.artistName !== artist1.name) {
			const artist2URI = (data.artistURI || data.artistUri || data.artistURL);
			const artist2 = new Artist({
				type: 'artist',
				name: data.artistName,
				uri: (artist2URI !== artist1.uri) ? artist2URI : undefined
			}, provider);
			artists.push(artist2);
		}
		return artists;
	}
	else if(data.artistName) {
		return [ new Artist({
			type: 'artist',
			uri: (data.artistURI || data.artistUri || data.artistURL || data.artistId || undefined),
			name: data.artistName
		}, provider) ];
	}
	return null;
}



export const parseTrackCollectionItems = (items: Array<any>, provider: MediaProvider, context: TrackCollection, options: TrackCollectionOptions={}): Array<TrackCollectionItem> => {
	for(let i=0; i<items.length; i++) {
		if(!items[i]) {
			delete items[i];
		}
	}
	return items.map((itemData) => {
		if(itemData.type === 'track') {
			itemData = {track:itemData};
		}
		let itemProvider = provider;
		if(options.itemProviderMap) {
			itemProvider = options.itemProviderMap(itemData);
		}
		if(options.itemType) {
			const CollectionItemType = options.itemType;
			return new CollectionItemType(itemData, itemProvider, context);
		}
		else {
			return new TrackCollectionItem(itemData, itemProvider, context);
		}
	});
}
