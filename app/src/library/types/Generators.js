
import MediaItem from './MediaItem';
import Track from './Track';
import Album from './Album';
import Artist from './Artist';

export type GeneratorResult<ResultType> = {
	result?: ResultType,
	error?: Error
}

export type ContinuousAsyncGenerator<ResultType, Params = void> =
	AsyncGenerator<GeneratorResult<ResultType>,GeneratorResult<ResultType>,Params>;

export type AsyncMediaItemGenerator = ContinuousAsyncGenerator<Array<MediaItem>>;
export type AsyncTrackGenerator = ContinuousAsyncGenerator<Array<Track>>;
export type AsyncAlbumGenerator = ContinuousAsyncGenerator<Array<Album>>;
export type AsyncArtistGenerator = ContinuousAsyncGenerator<Array<Artist>>;
