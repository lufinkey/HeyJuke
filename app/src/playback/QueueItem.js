// @flow

import {
	Track
} from '../library/types';
import type {
	TrackData
} from '../library/types';


export default class QueueItem {
	track: Track;

	constructor(track: Track) {
		this.track = track;
	}

	toData(): TrackData {
		return this.track.toData();
	}
}
