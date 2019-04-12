// @flow

import EventEmitter from 'events';
import type { ContinuousAsyncGenerator } from '../library/types/Generators';



export const sleep = (time: number): Promise<void> => {
	return new Promise<void>((resolve, reject) => {
		setTimeout(() => {
			resolve();
		}, time);
	});
};



export const capitalizeString = (str: string): string => {
	return str.charAt(0).toUpperCase() + str.slice(1);
};



export type GeneratorCloneOptions = {
	initialResults?:Array<any>,
	done?:boolean,
	onYield?: (value: any) => void
};

export const cloneAsyncGenerator = async function *(generator: AsyncGenerator<any,any,any>, options: GeneratorCloneOptions = {}): AsyncGenerator<any,any,any> {
	let params = null
	if(options.initialResults) {
		if(options.done) {
			return { result: options.initialResults };
		}
		else {
			params = yield { result: options.initialResults };
		}
	}
	while(true) {
		const { value, done } = await generator.next(params);
		if(options.onYield) {
			options.onYield(value);
		}
		if(done) {
			return value;
		}
		else {
			params = yield value;
		}
	}
};



export const formatLogDate = (date: Date): string => {
	return ""+
		(""+(date.getMonth()+1)).padStart(2,'0')+
		'/'+(""+date.getDate()).padStart(2,'0')+
		'/'+date.getFullYear()+
		" "+(""+date.getHours()).padStart(2,'0')+
		':'+(""+date.getMinutes()).padStart(2,'0')+
		':'+(""+date.getSeconds()).padStart(2,'0')+
		'.'+(""+date.getMilliseconds()).padStart(3,'0');
};



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
};


export const arrayEquals = <T>(array1: Array<T>, array2: Array<T>, eq: (a:T,b:T) => boolean): boolean => {
	if(array1.length !== array2.length) {
		return false;
	}
	for(let i=0; i<array1.length; i++) {
		if(!eq(array1[i],array2[i])) {
			return false;
		}
	}
	return true;
};
