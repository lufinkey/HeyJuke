// @flow

export type AwaitableGeneratorExecutor<Yield, Return, Next> = ((callbacks: { yield: ((value: Yield) => Promise<Next>) }) => (Return | Promise<Return>));

export default class AwaitableGenerator<Yield, Return, Next> {
	_executor: AwaitableGeneratorExecutor<Yield,Return,Next>;
	_started: boolean = false;
	_done: boolean = false;
	_resolveYield: ?((value?: Next) => void) = null;
	_resolveNext: ?((value: Yield | Return) => void) = null;
	_rejectNext: ?((error: Error) => void) = null;

	constructor(executor: AwaitableGeneratorExecutor<Yield,Return,Next>) {
		this._executor = executor;
	}

	async _execute() {
		if(this._started) {
			throw new Error("cannot call execute more than once");
		}
		this._started = true;
		let executeError: ?Error = null;
		try {
			const retVal = await this._executor({
				yield: this._yield.bind(this)
			});
			const resolveNext = this._resolveNext;
			this._resolveNext = null;
			this._rejectNext = null;
			this._done = true;
			if(!resolveNext) {
				executeError = new Error("executor returned outside of using \"next\"");
			}
			else {
				resolveNext(retVal);
			}
		}
		catch(error) {
			const rejectNext = this._rejectNext;
			this._resolveNext = null;
			this._rejectNext = null;
			this._done = true;
			if(!rejectNext) {
				executeError = new Error("executor threw error outside of using \"next\"");
			}
			else {
				rejectNext(error);
			}
		}
		if(executeError) {
			throw executeError;
		}
	}

	async _yield(value?: any): Promise<Next> {
		const resolveNext = this._resolveNext;
		if(!resolveNext) {
			throw new Error("cannot yield without calling next. You must await yield");
		}
		return await new Promise<Next>((resolve, reject) => {
			this._resolveYield = resolve;
			this._resolveNext = null;
			resolveNext(value);
		});
	}

	async next(param?: Next): Promise<{ value: (Yield | Return | void), done: boolean }> {
		if(this._done) {
			return { value: undefined, done: true };
		}
		const nextVal = await new Promise<(Yield | Return | void)>((resolve, reject) => {
			const resolveYield = this._resolveYield;
			if(resolveYield) {
				this._resolveYield = null;
				resolveYield(param);
			}
			this._resolveNext = resolve;
			this._rejectNext = reject;
			if(!this._started) {
				this._execute();
			}
		});
		return { value: nextVal, done: this._done };
	}
}
