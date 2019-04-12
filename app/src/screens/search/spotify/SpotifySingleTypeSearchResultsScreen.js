// @flow

import React, { PureComponent } from 'react';
import {
	ActivityIndicator,
	Alert,
	Image,
	FlatList,
	StyleSheet,
	TouchableOpacity,
	View
} from 'react-native';

import Theme from '../../../Theme';
import {
	Text
} from '../../../components/theme';

import SpotifyProvider from '../../../library/providers/SpotifyProvider';
import MediaItemRow from '../../../components/MediaItemRow';
import LoadableList from '../../../components/LoadableList';
import {
	MediaItem,
	AsyncMediaItemGenerator
} from '../../../library/types';
import {
	capitalizeString,
	cloneAsyncGenerator
} from '../../../util/misc';


type Props = {
	screenProps?: {
		query: ?string,
		results: ?Object
	},
	navigation: Object,
	style?: ?Object | ?Array<Object>
}

type State = {
	query?: ?string,
	itemType: string,
	results: ?Object,
	generator: AsyncMediaItemGenerator
}


export default class SpotifySingleTypeSearchResultsView extends PureComponent<Props,State> {
	static navigationOptions = ({ navigation, screenProps }: Object) => ({
		title: '"'+screenProps.query+'" in '+capitalizeString(navigation.getParam('itemType')+'s')
	});

	constructor(props: Props) {
		super(props);

		const itemType = props.navigation.getParam('itemType');
		const { query, results } = (props.screenProps || {});
		const typeResults = (results ? results[itemType+'s'] : null);
		this.state = {
			query: query,
			itemType: itemType,
			results: typeResults,
			generator: typeResults ? SpotifySingleTypeSearchResultsView.createSearchResultsGenerator(typeResults) : null
		};
	}
	
	static getDerivedStateFromProps(props: Props, state: State): State {
		const itemType = props.navigation.getParam('itemType');
		const { query, results } = (props.screenProps || {});
		const typeResults = (results ? results[itemType+'s'] : null);
		if(query !== state.query || typeResults !== state.results) {
			return {
				...state,
				query: query,
				itemType: itemType,
				results: typeResults,
				generator: typeResults ? SpotifySingleTypeSearchResultsView.createSearchResultsGenerator(typeResults) : null
			};
		}
		return state;
	}

	static createSearchResultsGenerator(results: Object): AsyncMediaItemGenerator {
		return cloneAsyncGenerator(results.generator, {
			done: results.done,
			initialResult: results.items.slice(0)
		});
	}

	extractItemKey = (item: MediaItem, index: number) => {
		return 'searchResult-'+index;
	};

	getItemLayout = (data: any, index: number) => {
		return {
			length: MediaItemRow.HEIGHT,
			offset: (MediaItemRow.HEIGHT * index),
			index: index
		};
	};

	renderItem = ({ item, index }: {item: MediaItem, index: number}) => {
		return (
			<MediaItemRow item={item} navigation={this.props.navigation}/>
		);
	};

	render() {
		return (
			<LoadableList
				style={styles.container}
				generator={this.state.generator}
				renderItem={this.renderItem}
				getItemLayout={this.getItemLayout}
				keyExtractor={this.extractItemKey}/>
		);
	}
}


const styles = StyleSheet.create({
	container: {
		width: '100%',
		flex: 1
	}
});
