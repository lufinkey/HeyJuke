// @flow

import EventEmitter from 'events';
import type { ContinuousAsyncGenerator } from '../library/types/Generators';



export const sleep = (time: number): Promise<void> => {
	return new Promise<void>((resolve, reject) => {
		setTimeout(() => {
			resolve();
		}, time);
	});
}



export const capitalizeString = (str: string): string => {
	return str.charAt(0).toUpperCase() + str.slice(1);
}



export const cloneContinuousAsyncGenerator = async function * (
	generator: ContinuousAsyncGenerator,
	options: {
		initialResults?:Array<any>,
		done?:boolean,
		onYieldResult?: (result: any) => void,
		onYieldError?: (error: Error) => void,
		onYield?: (error: ?Error, result: ?any) => void
	} = {}): ContinuousAsyncGenerator {
	if(options.initialResults) {
		if(options.done) {
			return { result: options.initialResults };
		}
		else {
			yield { result: options.initialResults };
		}
	}
	while(true) {
		const { value, done } = await generator.next();
		if(options.onYield) {
			options.onYield(value.error, value.result);
		}
		if(value.error) {
			if(options.onYieldError) {
				options.onYieldError(value.error);
			}
		}
		else {
			if(options.onYieldResult) {
				options.onYieldResult(value.result);
			}
		}
		if(done) {
			return value;
		}
		else {
			yield value;
		}
	}
}



export const formatLogDate = (date: Date): string => {
	return ""+
		(""+(date.getMonth()+1)).padStart(2,'0')+
		'/'+(""+date.getDate()).padStart(2,'0')+
		'/'+date.getFullYear()+
		" "+(""+date.getHours()).padStart(2,'0')+
		':'+(""+date.getMinutes()).padStart(2,'0')+
		':'+(""+date.getSeconds()).padStart(2,'0')+
		'.'+(""+date.getMilliseconds()).padStart(3,'0');
}



export const waitForEvent = (eventEmitter: EventEmitter, eventName: string, handler: function, options: {timeout?:number,} = {}): Promise<void> => {
	return new Promise<void>((resolve, reject) => {
		let timeoutHandle = null;
		const listener = (...args) => {
			if(timeoutHandle != null) {
				clearTimeout(timeoutHandle);
			}
			try {
				handler(...args);
				resolve();
			}
			catch(error) {
				reject(error);
			}
		};
		if(options.timeout != null) {
			timeoutHandle = setTimeout(() => {
				eventEmitter.removeListener(eventName, listener);
				reject(new Error("timed out waiting for event "+eventName));
			}, options.timeout);
		}
		eventEmitter.once(eventName, listener);
	});
}
