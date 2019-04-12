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
import {
	StackActions,
	NavigationActions
} from 'react-navigation';

import Theme from '../../../Theme';
import {
	Text
} from '../../../components/theme';

import SpotifyProvider from '../../../library/providers/SpotifyProvider';
import MediaItemRow from '../../../components/MediaItemRow';
import {
	MediaItem
} from '../../../library/types';


type Props = {
	screenProps?: {
		query: ?string,
		results: ?Object
	},
	navigation: any,
	onPressSeeAll?: ?(itemType: string) => void,
	style?: ?Object | ?Array<Object>
}

type State = {
	query: ?string,
	results: ?Object,
	sections: Array<Object>
}


export default class SpotifyAllSearchResultsView extends PureComponent<Props,State> {
	static navigationOptions = {
		header: null
	};

	needsStackReset: boolean = false;

	constructor(props: Props) {
		super(props);

		const { query, results } = (props.screenProps || {});
		this.state = {
			query: query,
			results: results,
			sections: SpotifyAllSearchResultsView.getSections(results)
		};
	}

	static getDerivedStateFromProps(props: Props, state: State) {
		const { query, results } = (props.screenProps || {});
		if(state.query !== query || state.results !== results) {
			return {
				...state,
				query: query,
				results: results,
				sections: SpotifyAllSearchResultsView.getSections(results)
			};
		}
		return state;
	}

	static getSections(results: ?Object) {
		let sections = [];
		if(results) {
			if(results.tracks && results.tracks.items.length > 0) {
				sections.push({
					title: "Tracks",
					itemType: 'track',
					hasMore: (results.tracks.next != null || results.tracks.items.length > 5),
					data: results.tracks.items.slice(0, 5)
				});
			}
			if(results.artists && results.artists.items.length > 0) {
				sections.push({
					title: "Artists",
					itemType: 'artist',
					hasMore: (results.artists.next != null || results.artists.items.length > 5),
					data: results.artists.items.slice(0, 5)
				});
			}
			if(results.albums && results.albums.items.length > 0) {
				sections.push({
					title: "Albums",
					itemType: 'album',
					hasMore: (results.albums.next != null || results.albums.items.length > 5),
					data: results.albums.items.slice(0, 5)
				});
			}
			if(results.playlists && results.playlists.items.length > 0) {
				sections.push({
					title: "Playlists",
					itemType: 'playlist',
					hasMore: (results.playlists.next != null || results.playlists.items.length > 5),
					data: results.playlists.items.slice(0, 5)
				});
			}
		}
		return sections;
	}

	resetStack() {
		this.props.navigation.navigate('SpotifyAllSearchResults');
	}

	componentDidMount() {
		if(!this.props.navigation.isFocused()) {
			const parent = this.props.navigation.dangerouslyGetParent();
			if(parent.isFocused()) {
				this.resetStack();
			}
			else {
				const listener = parent.addListener('willFocus', () => {
					listener.remove();
					this.resetStack();
				});
			}
		}
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

	onPressSeeAll = (itemType: string) => {
		this.props.navigation.push('SpotifySingleTypeSearchResults', {
			itemType: itemType
		});
	};

	renderSectionHeader = ({ section: { title } }: {section: any}) => {
		return (
			<View style={styles.sectionHeader}>
				<Text style={styles.sectionHeaderText}>{title}</Text>
			</View>
		);
	};

	renderSectionFooter = ({ section: { title, itemType, hasMore } }: {section: any}) => {
		return (
			<View style={styles.sectionFooter}>
				{(hasMore) ? (
					<TouchableOpacity style={styles.seeAllButton} onPress={() => {this.onPressSeeAll(itemType)}}>
						<Text style={styles.seeAllText}>See all {itemType}s</Text>
					</TouchableOpacity>
				) : null}
			</View>
		);
	};

	renderItem = ({ item, index, section }: {item: MediaItem, index: number, section: any}) => {
		return (
			<MediaItemRow item={item} navigation={this.props.navigation}/>
		);
	};

	render() {
		const sections = this.state.sections;
		if(sections.length === 0) {
			return (
				<View style={styles.container}>
					<Text>No results found</Text>
				</View>
			);
		}
		else {
			return (
				<SectionList
					style={styles.container}
					renderSectionHeader={this.renderSectionHeader}
					renderItem={this.renderItem}
					getItemLayout={this.getItemLayout}
					renderSectionFooter={this.renderSectionFooter}
					keyExtractor={this.extractItemKey}
					sections={sections}/>
			);
		}
	}
}


const styles = StyleSheet.create({
	container: {
		width: '100%',
		flex: 1,
		backgroundColor: Theme.backgroundColor
	},
	sectionHeader: {
		width: '100%',
		alignItems: 'center',
		marginTop: 8,
		marginBottom: 8
	},
	sectionFooter: {
		width: '100%',
		marginBottom: 24
	},
	sectionHeaderText: {
		fontWeight: 'bold',
		fontSize: 16
	},
	seeAllButton: {
		width: '100%',
		height: 36,
		paddingHorizontal: 12,
		justifyContent: 'center'
	},
	seeAllText: {
		fontSize: 16
	}
});
