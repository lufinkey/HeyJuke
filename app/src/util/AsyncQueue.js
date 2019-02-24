// @flow

type Options = {
	cancelUnfinishedTasks?: boolean
}


class AsyncQueueTask {
	id: number;
	_cancelled: boolean = false;

	constructor(id: number) {
		this.id = id;
	}

	cancel() {
		if(!this._cancelled) {
			this._cancelled = true;
		}
	}

	get cancelled() {
		return this._cancelled;
	}
}


type AsyncQueueFunction = (task: AsyncQueueTask) => any;


export default class AsyncQueue {
	static Task = AsyncQueueTask;

	_options: Options;

	_taskQueue: Array<AsyncQueueTask> = [];
	_taskQueuePromise: ?Promise<any> = null;
	_nextTaskId = 0;

	constructor(options: Options = {}) {
		this._options = options;
	}

	_createTask(): AsyncQueueTask {
		const task = new AsyncQueueTask(this._nextTaskId);
		this._nextTaskId += 1;
		return task;
	}

	_removeTask(task: AsyncQueueTask) {
		task.cancel();
		// remove task from queue
		const taskIndex = this._taskQueue.indexOf(task);
		if(taskIndex !== -1) {
			this._taskQueue.splice(taskIndex, 1);
		}
		// end task promise if there are no more tasks in queue
		if(this._taskQueue.length === 0) {
			this._taskQueuePromise = null;
		}
	}

	get nextTaskId() {
		return this._nextTaskId;
	}

	async run(func: AsyncQueueFunction): Promise<void> {
		if(this._options.cancelUnfinishedTasks) {
			for(const task of this._taskQueue) {
				task.cancel();
			}
		}
		const task = this._createTask();
		this._taskQueue.push(task);
		await new Promise((resolve, reject) => {
			this._taskQueuePromise = (this._taskQueuePromise || Promise.resolve()).then(() => {
				return (async () => {
					// stop if task is cancelled
					if(task.cancelled) {
						this._removeTask(task);
						resolve();
						return;
					}
					// run task
					let taskError = null;
					try {
						const retVal = func(task);
						if(retVal) {
							if(retVal instanceof Promise) {
								await retVal;
							}
							else if(retVal.next && typeof retVal.next === 'function') {
								let done = false;
								while(!task.cancelled && !done) {
									done = (await retVal.next()).done;
								}
							}
						}
					}
					catch(error) {
						taskError = error;
					}
					// remove task from queue
					this._removeTask(task);
					// resolve / reject
					if(taskError) {
						reject(taskError);
					}
					else {
						resolve();
					}
				})();
			});
		});
	}

	cancelAllTasks() {
		for(const task of this._taskQueue) {
			task.cancel();
		}
	}

	async waitForCurrentTasks() {
		await this._taskQueuePromise;
	}
}
