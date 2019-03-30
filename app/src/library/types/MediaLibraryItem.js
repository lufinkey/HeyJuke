// @flow

import Track from './Track';

export type MediaLibraryItem = {
	track: Track,
	libraryProvider: string,
	addedAt: ?number
}
