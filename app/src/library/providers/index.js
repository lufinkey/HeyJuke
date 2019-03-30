
import BandcampProvider from './BandcampProvider';
import SpotifyProvider from './SpotifyProvider';
import type { SpotifyUserLibraryResumeId } from './SpotifyProvider';
import {
	MediaItem
} from '../types';
import {
	MediaProvider
} from '../types';

export type MediaProviderName = 'bandcamp' | 'spotify';

export const getMediaProvider = (name: MediaProviderName): MediaProvider => {
	switch(name) {
		case 'bandcamp':
			return BandcampProvider;
		case 'spotify':
			return SpotifyProvider;
		default:
			throw new Error(`invalid provider name ${name}`);
	}
};

export const createMediaItem = (data: Object, providerName: MediaProviderName): MediaItem => {
	const provider = getMediaProvider(providerName);
	return provider.createMediaItem(data);
};

export {
	BandcampProvider,
	SpotifyProvider
};

export type {
	SpotifyUserLibraryResumeId
};
