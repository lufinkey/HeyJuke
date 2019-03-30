
import type { PlaybackState } from './PlaybackState';
import type { PlaybackMetadata } from './PlaybackMetadata';

export type PlaybackEvent = {
	state: ?PlaybackState,
	metadata: ?PlaybackMetadata
}
