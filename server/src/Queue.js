
const EventEmitter = require('events');


class Queue extends EventEmitter {
	constructor() {
		super();

		this._queue = [];
		this._nextQueueId = 0;
	}

	add(track) {
		const queueId = this._nextQueueId;
		this._nextQueueId += 1;
		this._queue.push({
			queueId,
			track
		});
		return queueId;
	}

	remove(queueId) {
		for(let i=0; i<this._queue.length; i++) {
			const queueItem = this._queue[i];
			if(queueItem.queueId == queueId) {
				this._queue.splice(i, 1);
				return true;
			}
		}
		return false;
	}
}


module.exports = Queue;
