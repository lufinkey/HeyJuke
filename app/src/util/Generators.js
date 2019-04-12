// @flow

import AwaitableGenerator from './AwaitableGenerator';

export type GeneratorResult<ResultType> = {
	result?: ResultType,
	error?: Error
}

export type ContinuousAsyncGenerator<ResultType> =
	AsyncGenerator<GeneratorResult<ResultType>,GeneratorResult<ResultType>,void>;
