// @flow

import EventEmitter from 'events';

import MediaItem from './MediaItem';
import Track from './Track';
import Album from './Album';
import Artist from './Artist';
import Playlist from './Playlist';

import type { PlaybackState } from './PlaybackState';
import type { PlaybackMetadata } from './PlaybackMetadata';


export interface MediaProvider {
	+name: string;
	+displayName: string;

	+events: EventEmitter;

	+login?: () => Promise<boolean>;
	+logout?: () => Promise<void>;
	+isLoggedIn?: boolean;

	+usesStreamPlayer: boolean;

	createMediaItem(data: Object): MediaItem;

	search(text: string, options?: Object): Promise<any>;
	getTrack(uri: string): Promise<Track>;
	getAlbum(uri: string): Promise<Album>;
	getArtist(uri: string): Promise<Artist>;
	getPlaylist(uri: string): Promise<Playlist>;

	+fetchItemData?: (item: MediaItem) => Promise<any>;

	prepare(track: Track): Promise<void>;
	play(track: Track): Promise<void>;
	setPlaying(playing: boolean): Promise<void>;
	stop(): Promise<void>;
	seek(position: number): Promise<void>;

	getPlayerMetadata(): Promise<PlaybackMetadata>;
	getPlayerState(): Promise<PlaybackState>;
}
