
import BandcampProvider from './BandcampProvider';
import SpotifyProvider from './SpotifyProvider';
import { MediaProvider } from './types';

type MediaProviderName = 'bandcamp' | 'spotify';

export const getMediaProvider = (name: MediaProviderName): MediaProvider => {
	switch(name) {
		case 'bandcamp':
			return BandcampProvider;
		case 'spotify':
			return SpotifyProvider;
		default:
			throw new Error("invalid media provider");
	}
}

export const createMediaItem = (data: Object): MediaItem => {
	const providerName = data.provider;
	if(!(typeof providerName === 'string')) {
		throw new Error(`No provider for media item with name ${data.name}`);
	}
	const provider = getMediaProvider(providerName);
	return provider.createMediaItem(data);
}

export {
	BandcampProvider,
	SpotifyProvider
};
