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

import YoutubeProvider from '../../../library/providers/YoutubeProvider';
import MediaItemRow from '../../../components/MediaItemRow';
import LoadableList from '../../../components/LoadableList';
import {
	MediaItem,
	AsyncMediaItemGenerator
} from '../../../library/types';


type Props = {
	screenProps?: {
		query: ?string
	},
	onPressItem?: ?(item: MediaItem) => void,
	navigation: any,
	style?: ?Object | ?Array<Object>
}

type State = {
	query?: ?string,
	generator: AsyncMediaItemGenerator
}


export default class YoutubeSearchResultsScreen extends PureComponent<Props,State> {
	constructor(props: Props) {
		super(props);

		const query = props.screenProps?.query;
		this.state = {
			query: query,
			generator: YoutubeSearchResultsScreen.createSearchResultsGenerator(query || "")
		};
	}

	static async * createSearchResultsGenerator(query: string): AsyncMediaItemGenerator {
		if(!query) {
			return { result: [] };
		}
		let pageToken = null;
		while(true) {
			try {
				const options: Object = {
					maxResults: 24
				};
				if(pageToken != null) {
					options.pageToken = pageToken;
				}
				const { items, nextPageToken } = await YoutubeProvider.search(query, options);
				pageToken = nextPageToken;
				if(nextPageToken != null) {
					yield { result: items };
				}
				else {
					return { result: items };
				}
			}
			catch(error) {
				yield { error };
			}
		}
	}

	static getDerivedStateFromProps(props: Props, state: State): State {
		const query = props.screenProps?.query;
		if(state.query !== query) {
			return {
				...state,
				query: query,
				generator: YoutubeSearchResultsScreen.createSearchResultsGenerator(query || "")
			};
		}
		return state;
	}

	onPressItem = (item: MediaItem) => {
		if(this.props.onPressItem) {
			this.props.onPressItem(item);
		}
	};

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
		if(!this.state.query) {
			// no text
			return (
				<View style={styles.container}>
					<View style={styles.searchPromptContainer}>
						<View style={styles.searchPrompt}>
							<Text>Search for some shit, yo</Text>
						</View>
					</View>
				</View>
			);
		}
		else {
			// list results
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
}


const styles = StyleSheet.create({
	container: {
		width: '100%',
		flex: 1
	},

	// no search text
	searchPromptContainer: {
		flex: 1,
		width: '100%',
		alignItems: 'center',
		justifyContent: 'center'
	},
	searchPrompt: {
		//
	}
});
