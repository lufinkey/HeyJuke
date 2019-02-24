// @flow

import { MediaProvider } from './MediaProvider';
import MediaItem from './MediaItem';

import Album from './Album';


export default class Artist extends MediaItem {
	type: string = 'artist';

	albums: ?Array<Album> = null;

	constructor(data: Object, provider: MediaProvider) {
		super(data, provider);

		// albums
		if(data.albums) {
			this.albums = data.albums.map((album) => {
				return new Album(album, provider);
			});
		}
	}
}
