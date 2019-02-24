// @flow

import React, { PureComponent } from 'react';
import {
	ActivityIndicator,
	Alert,
	Image,
	SectionList,
	StyleSheet,
	TouchableOpacity,
	View
} from 'react-native';

import Theme from '../Theme';
import {
	Text
} from '../components/theme';


type Props = {
	promise?: ?Promise<any>,
	onResolve?: ?(result: any) => void,
	onReject?: ?(error: Error) => void,
	renderLoading?: ?() => any,
	renderError?: ?(error: Error) => any,
	renderContent?: ?(result: any) => any,
	style?: ?Object | ?Array<Object>
}

type State = {
	promise?: ?Promise<any>,
	done: boolean,
	result: ?any,
	error: ?Error
}


export default class LoadableView extends PureComponent<Props,State> {
	mounted: boolean = false;

	constructor(props: Props) {
		super(props);

		this.state = {
			promise: props.promise,
			done: false,
			result: null,
			error: null
		};
	}

	static getDerivedStateFromProps(props: Props, state: State): State {
		if(props.promise !== state.promise) {
			return {
				...state,
				promise: props.promise,
				done: false,
				result: null,
				error: null
			};
		}
		return state;
	}

	componentDidMount() {
		this.mounted = true;
		this.load();
	}

	componentDidUpdate(prevProps: Props) {
		if(this.props.promise !== prevProps.promise) {
			this.load();
		}
	}

	componentWillUnmount() {
		this.mounted = false;
	}

	async load() {
		const promise = this.props.promise;
		this.setState({
			done: false,
		});
		if(!promise) {
			return;
		}
		try {
			const result = await promise;
			if(promise !== this.props.promise || !this.mounted) {
				return;
			}
			if(this.props.onResolve) {
				this.props.onResolve(result);
			}
			this.setState({
				result: result,
				done: true
			});
		}
		catch(error) {
			if(promise !== this.props.promise || !this.mounted) {
				return;
			}
			if(this.props.onReject) {
				this.props.onReject(error);
			}
			this.setState({
				error: error
			});
		}
	}

	render() {
		if(!this.state.done && !this.state.error) {
			// loading
			return (
				<View style={this.props.style}>
					{(this.props.renderLoading) ? (
						this.props.renderLoading()
					) : (
						<ActivityIndicator animating={true} size={'large'} style={styles.loadIndicator}/>
					)}
				</View>
			);
		}
		else if(this.state.error) {
			// error
			return (
				<View style={this.props.style}>
					{(this.props.renderError) ? (
						this.props.renderError(this.state.error)
					) : (
						<View style={styles.errorContainer}>
							<Text style={styles.errorText}>{this.state.error.message}</Text>
						</View>
					)}
				</View>
			);
		}
		else {
			// content
			return (
				<View style={this.props.style}>
					{(this.props.renderContent) ? (
						this.props.renderContent(this.state.result)
					) : null}
				</View>
			);
		}
	}
}


const styles = StyleSheet.create({
	// loading
	loadIndicator: {
		alignSelf: 'center',
		flex: 1
	},

	// error
	errorContainer: {
		flex: 1,
		width: '100%',
		justifyContent: 'center',
		alignItems: 'center'
	},
	errorText: {
		color: Theme.errorColor
	}
});
