// @flow

import EventEmitter from 'events';

import MediaItem from './MediaItem';
import Track from './Track';
import Album from './Album';
import Artist from './Artist';
import Playlist from './Playlist';

import type { ContinuousAsyncGenerator } from '../../util/Generators';

import type { PlaybackState } from './PlaybackState';
import type { PlaybackMetadata } from './PlaybackMetadata';
import type { MediaLibraryItem } from './MediaLibraryItem';


export type MediaPlaybackProvider = {
	+events: EventEmitter;

	prepare(track: Track): Promise<void>;
	play(track: Track, position?: number): Promise<void>;
	setPlaying(playing: boolean): Promise<void>;
	stop(): Promise<void>;
	seek(position: number): Promise<void>;

	getMetadata(): Promise<PlaybackMetadata>;
	getState(): Promise<PlaybackState>;
}


export interface MediaProvider {
	+name: string;
	+displayName: string;

	+usesStreamPlayer: boolean;

	+events: EventEmitter;

	+api: Object;

	+login?: () => Promise<boolean>;
	+logout?: () => Promise<void>;
	+isLoggedIn?: boolean;

	createMediaItem(data: Object): MediaItem;

	+search?: (text: string, options?: Object) => Promise<Object>;
	+getTrack?: (uri: string) => Promise<Track>;
	+getAlbum?: (uri: string) => Promise<Album>;
	+getArtist?: (uri: string) => Promise<Artist>;
	+getPlaylist?: (uri: string) => Promise<Playlist>;

	+generateUserLibrary?: (resumeId?: ?Object) => ContinuousAsyncGenerator<{ resumeId: Object, items: Array<MediaLibraryItem>, progress: number }>;

	+fetchItemData?: (item: MediaItem) => Promise<Object>;

	+player?: MediaPlaybackProvider;
}
