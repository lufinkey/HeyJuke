
import MediaItem from './MediaItem';
import Track from './Track';
import Album from './Album';
import Artist from './Artist';
import type { ContinuousAsyncGenerator } from '../../util/Generators';

export type AsyncMediaItemGenerator = ContinuousAsyncGenerator<Array<MediaItem>>;
export type AsyncTrackGenerator = ContinuousAsyncGenerator<Array<Track>>;
export type AsyncAlbumGenerator = ContinuousAsyncGenerator<Array<Album>>;
export type AsyncArtistGenerator = ContinuousAsyncGenerator<Array<Artist>>;
