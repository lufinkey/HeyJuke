// @flow

import EventEmitter from 'events';
import { sleep } from './misc';
import AwaitableGenerator from "./AwaitableGenerator";

type Options = {
	cancelUnfinishedTasks?: boolean
}

type AsyncQueueTaskOptions = {
	tag?: string,
	name?: string,
	initialProgress?: number,
	initialStatus?: string
}

export type TaskPromise = Promise<any> & {
	+cancel: (() => void),
	+progress: ?number,
	+status: ?string,
	+events: EventEmitter
}

export class AsyncQueueTask {
	+tag: ?string;
	+name: ?string;
	+promise: TaskPromise;
	+events: EventEmitter = new EventEmitter();
	_progress: ?number = null;
	_status: ?string = null;
	_cancelled: boolean = false;
	_done: boolean = false;
	_error: ?Error = null;

	constructor(options: AsyncQueueTaskOptions, promise: Promise<void>) {
		this.tag = options.tag ?? null;
		this.name = options.name ?? null;
		this._progress = options.initialProgress ?? null;
		this._status = options.initialStatus ?? null;
		this.promise = Object.defineProperties((promise: any), ({
			cancel: {
				writable: false,
				value: () => {this.cancel()}
			},
			progress: {
				get: () => (this.progress)
			},
			status: {
				get: () => (this.status)
			},
			done: {
				get: () => (this.done)
			},
			events: {
				writable: false,
				value: this.events
			}
		}: any));
		this.promise.then(() => {
			this._done = true;
		}).catch((error) => {
			this._error = error;
			this._done = true;
		});
	}

	get progress(): ?number {
		return this._progress;
	}

	set progress(value: number) {
		this._progress = value;
		this.events.emit('progress');
	}

	get status(): ?string {
		return this._status;
	}

	set status(value: ?string) {
		this._status = value;
		this.events.emit('statusChange');
	}

	async join(task: TaskPromise): Promise<void> {
		const onCancel = () => {
			task.cancel();
		};
		let taskError: ?Error = null;
		this.events.addListener('cancel', onCancel);
		try {
			await task;
		}
		catch(error) {
			taskError = error;
		}
		this.events.removeListener('cancel', onCancel);
		if(taskError != null) {
			throw taskError;
		}
	}

	cancel() {
		if(!this._cancelled) {
			this._cancelled = true;
			this.events.emit('cancel');
		}
	}

	get cancelled() {
		return this._cancelled;
	}

	get done(): boolean {
		return this._done;
	}
}


export type AsyncQueueFunction = (task: AsyncQueueTask) => (AsyncGenerator<any,any,void> | AwaitableGenerator<any,any,void> | Promise<any> | void);

type RunOptions = {
	tag?: string;
	cancelMatchingTags?: boolean;
	cancelTags?: Array<string>;
	cancelAll?: boolean;
}

export default class AsyncQueue {
	static Task = AsyncQueueTask;

	_options: Options;

	_taskQueue: Array<AsyncQueueTask> = [];
	_taskQueuePromise: ?Promise<any> = null;
	_taskCounter = 0;

	constructor(options: Options = {}) {
		this._options = options;
	}

	_createTask(options: AsyncQueueTaskOptions, promise: Promise<void>): AsyncQueueTask {
		const task = new AsyncQueueTask(options, promise);
		this._taskCounter += 1;
		return task;
	}

	_removeTask(task: AsyncQueueTask) {
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

	get taskCount(): number {
		return this._taskQueue.length;
	}

	getTaskWithTag(tag: string): ?AsyncQueueTask {
		for(const task of this._taskQueue) {
			if(task.tag === tag) {
				return task;
			}
		}
		return null;
	}

	getTasksWithTag(tag: string): Array<AsyncQueueTask> {
		const tasks = [];
		for(const task of this._taskQueue) {
			if(task.tag === tag) {
				tasks.push(task);
			}
		}
		return tasks;
	}

	async runUntilNextTask(func: () => AsyncGenerator<void,void,void>) {
		const taskCounter = this._taskCounter;
		const generator = func();
		while(true) {
			const { done } = await generator.next();
			if(done) {
				return;
			}
			else if(taskCounter !== this._taskCounter) {
				return;
			}
		}
	}

	async * generateUntilNextTask(func: () => AsyncGenerator<void,void,void>): AsyncGenerator<void,void,void> {
		const taskCounter = this._taskCounter;
		const generator = func();
		while(true) {
			const { done } = await generator.next();
			if(done) {
				return;
			}
			else if(taskCounter !== this._taskCounter) {
				return;
			}
			yield;
		}
	}

	run: ((options: RunOptions, func: AsyncQueueFunction) => TaskPromise)
		& ((func: AsyncQueueFunction) => TaskPromise);
	run(...args: Array<any>): TaskPromise {
		const firstArgType = typeof args[0];
		const options: RunOptions = ((firstArgType === 'object') ? args[0] : null) ?? {};
		const func: AsyncQueueFunction = (firstArgType === 'function') ? args[0] : args[1];
		if(this._options.cancelUnfinishedTasks || options.cancelAll) {
			this.cancelAllTasks();
		}
		if(options.tag != null && options.cancelMatchingTags) {
			this.cancelTasksWithTag(options.tag);
		}
		if(options.cancelTags) {
			this.cancelTasksWithTags(options.cancelTags);
		}
		let resolveTask: ((value: any) => void) = (null: any);
		let rejectTask: ((error: Error) => void) = (null: any);
		const task = this._createTask({tag: options.tag}, new Promise<any>((resolve, reject) => {
			resolveTask = resolve;
			rejectTask = reject;
		}));
		this._taskQueue.push(task);
		this._taskQueuePromise = (this._taskQueuePromise || Promise.resolve()).then(() => ((async () => {
			await sleep(0);
			// stop if task is cancelled
			if(task.cancelled) {
				this._removeTask(task);
				resolveTask();
				// emit events
				task.events.emit('resolve');
				task.events.emit('finish');
				return;
			}
			// run task
			let taskError = null;
			let taskResult = undefined;
			try {
				const retVal = func(task);
				if(retVal) {
					if(retVal instanceof Promise) {
						taskResult = await retVal;
					}
					else if((typeof retVal === 'object') && typeof retVal.next === 'function') {
						let done: boolean = false;
						while(!task.cancelled && !done) {
							const retYield = await retVal.next();
							done = retYield.done;
							if(!done) {
								task.events.emit('yield', retYield);
							}
							else {
								taskResult = retYield.value;
							}
						}
					}
					else {
						taskResult = retVal;
					}
				}
				else {
					taskResult = retVal;
				}
			}
			catch(error) {
				taskError = error;
			}
			// remove task from queue
			this._removeTask(task);
			// resolve / reject
			if(taskError) {
				rejectTask(taskError);
				task.events.emit('reject');
			}
			else {
				resolveTask(taskResult);
				task.events.emit('resolve');
			}
			// emit event
			task.events.emit('finish');
		})()));
		return task.promise;
	}

	runOne(options: {tag: string} & RunOptions, func: AsyncQueueFunction): TaskPromise {
		const task = this.getTaskWithTag(options.tag);
		if(task != null) {
			return task.promise;
		}
		return this.run({tag: options.tag}, func);
	}

	cancelTasksWithTag(tag: string) {
		for(const task of this._taskQueue) {
			if(task.tag === tag) {
				task.cancel();
			}
		}
	}

	cancelTasksWithTags(tags: Array<string>) {
		for(const task of this._taskQueue) {
			if(tags.includes(task.tag)) {
				task.cancel();
			}
		}
	}

	cancelAllTasks() {
		for(const task of this._taskQueue) {
			task.cancel();
		}
	}

	async waitForCurrentTasks() {
		await this._taskQueuePromise;
	}

	async waitForTasksWithTag(tag: string) {
		await Promise.all(this._taskQueue.filter((task: AsyncQueue.Task) => (
			(task.tag === tag)
		)).map((task: AsyncQueue.Task) => (
			(task.promise)
		)));
	}
}
