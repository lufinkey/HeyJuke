// @flow

import React, { PureComponent } from 'react';
import {
	ActivityIndicator,
	Alert,
	FlatList,
	Image,
	StyleSheet,
	TouchableOpacity,
	View
} from 'react-native';

import Theme from '../Theme';
import {
	Text
} from '../components/theme';

import type { ContinuousAsyncGenerator } from '../providers/types';
import { sleep } from '../util/misc';


type Props = {
	generator?: ?ContinuousAsyncGenerator<Array<any>>,
	onUpdateItems?: ?({items: Array<any>}) => void,
	onError?: ?(error: Error) => void,
	preloadOffset?: ?number,
	style?: ?Object | ?Array<Object>,
	getItemLayout?: (data: any, index: number) => {length: number, offset: number, index: number},
	renderItem: (info: { item: any, index: number }) => any,
	keyExtractor: (item: any, index: number) => string,
	renderHeader?: () => any,
	renderFooter?: () => any,
	forceMaintainScroll?: boolean
}

type State = {
	error: ?Error,
	loading: boolean,
	done: boolean,
	generator?: ?ContinuousAsyncGenerator<Array<any>>,
	items: ?Array<any>
}


export default class LoadableList extends PureComponent<Props,State> {
	mounted: boolean = false;

	flatList: any = null;
	scrollOffset: ?number = null;

	constructor(props: Props) {
		super(props);

		this.state = {
			error: null,
			loading: true,
			done: false,
			generator: props.generator,
			items: null
		};
	}

	static getDerivedStateFromProps(props: Props, state: State): State {
		if(props.generator !== state.generator) {
			return {
				...state,
				generator: props.generator,
				loading: false,
				done: false,
				error: null,
				items: null,
			};
		}
		return state;
	}

	get preloadOffset(): number {
		return this.props.preloadOffset ?? 6;
	}

	componentDidMount() {
		this.mounted = true;
		this.loadMore();
	}

	componentDidUpdate(prevProps: Props) {
		if(!this.props.forceMaintainScroll && prevProps.forceMaintainScroll) {
			this.scrollOffset = null;
		}
		if(this.props.generator !== prevProps.generator) {
			this.loadMore();
		}
	}

	componentWillUnmount() {
		this.mounted = false;
	}

	async loadMore() {
		const generator = this.props.generator;
		if(!generator || this.state.done) {
			return;
		}
		this.setState({
			loading: true,
			error: null
		});
		try {
			const { value: { result, error }, done } = await generator.next();
			if(generator !== this.props.generator || !this.mounted) {
				return;
			}
			if(error) {
				this.setState({
					loading: false,
					done: done,
					error: error
				});
				return;
			}
			const items = (this.state.items || []).concat(result || []);
			this.setState({
				loading: false,
				done: done,
				items: items
			});
			if(this.props.onUpdateItems) {
				this.props.onUpdateItems({ items });
			}
		}
		catch(error) {
			if(generator !== this.props.generator || !this.mounted) {
				return;
			}
			this.setState({
				loading: false,
				done: true,
				error: error
			});
			if(this.props.onError) {
				this.props.onError(error);
			}
		}
	}

	refFlatList = (flatList: any) => {
		const oldFlatList = this.flatList;
		this.flatList = flatList;
		if(this.props.forceMaintainScroll) {
			setTimeout(() => {
				if(!oldFlatList && flatList && this.flatList && this.scrollOffset != null) {
					flatList.scrollToOffset({offset: this.scrollOffset, animated: false});
				}
			}, 0);
		}
	}

	onScroll = (event: Object) => {
		if(this.flatList) {
			this.scrollOffset = event.nativeEvent.contentOffset.y;
		}
	}

	onMomentumScrollEnd = (event: Object) => {
		if(this.flatList) {
			this.scrollOffset = event.nativeEvent.contentOffset.y;
		}
	}

	onViewableItemsChanged = ({ viewableItems, changed }: { viewableItems: Array<any>, changed: Array<any> }) => {
		const last = (viewableItems.length > 0) ? viewableItems[viewableItems.length-1] : null;
		const preloadOffset = this.preloadOffset;
		if(!this.state.loading && !this.state.done && this.state.items && last && last.index >= (this.state.items.length-preloadOffset)) {
			this.loadMore();
		}
	}

	renderHeader = () => {
		if(this.props.renderHeader) {
			return this.props.renderHeader();
		}
		return null;
	}
	
	renderFooter = () => {
		if(this.state.done) {
			if(this.props.renderFooter) {
				return this.props.renderFooter();
			}
			return null;
		}
		else {
			return (
				<View style={styles.footer}>
					{(this.state.error) ? (
						<Text style={styles.footerErrorText}>{this.state.error.message}</Text>
					) : (this.state.loading) ? (
						<ActivityIndicator animating={true} size={'small'} color={Theme.textColor} style={styles.footerLoadIndicator}/>
					) : null}
				</View>
			);
		}
	}

	render() {
		if(!this.state.items && !this.state.error) {
			// loading
			return (
				<View style={this.props.style}>
					<ActivityIndicator animating={true} size={'large'} color={Theme.textColor} style={styles.loadIndicator}/>
				</View>
			);
		}
		else if(this.state.error && !this.state.items) {
			// error
			return (
				<View style={this.props.style}>
					<View style={styles.errorContainer}>
						<Text style={styles.errorText}>{this.state.error.message}</Text>
					</View>
				</View>
			);
		}
		else {
			// list results
			return (
				<FlatList
					ref={this.refFlatList}
					style={this.props.style}
					onViewableItemsChanged={this.onViewableItemsChanged}
					renderItem={this.props.renderItem}
					getItemLayout={this.props.getItemLayout}
					ListHeaderComponent={this.renderHeader}
					ListFooterComponent={this.renderFooter}
					keyExtractor={this.props.keyExtractor}
					data={this.state.items || []}
					onScroll={this.props.forceMaintainScroll ? this.onScroll : undefined}
					onMomentumScrollEnd={this.props.forceMaintainScroll ? this.onMomentumScrollEnd : undefined}
					extraData={{
						loading: this.state.loading,
						error: this.state.error
					}}/>
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
	},

	// footer
	footer: {
		width: '100%',
		height: 36,
		justifyContent: 'center',
		alignItems: 'center'
	},
	footerErrorText: {
		color: Theme.errorColor,
		marginVertical: 6
	},
	footerLoadIndicator: {
		//
	}
})
