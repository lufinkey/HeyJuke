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
	createStackNavigator
} from 'react-navigation';

import Theme from '../../../Theme';
import {
	Text
} from '../../../components/theme';

import SpotifyProvider from '../../../library/providers/SpotifyProvider';
import SpotifyAllSearchResultsScreen from './SpotifyAllSearchResultsScreen';
import SpotifySingleTypeSearchResultsScreen from './SpotifySingleTypeSearchResultsScreen';


const StackNavigator = createStackNavigator({
	SpotifyAllSearchResults: {
		screen: SpotifyAllSearchResultsScreen
	},
	SpotifySingleTypeSearchResults: {
		screen: SpotifySingleTypeSearchResultsScreen
	}
}, {
	initialRouteName: 'SpotifyAllSearchResults',
	cardStyle: {
		backgroundColor: Theme.backgroundColor
	},
	defaultNavigationOptions: {
		headerForceInset: {top: 'never'},
		headerStyle: {
			height: 36,
			paddingTop: 0,
			backgroundColor: Theme.navBarColor
		},
		headerTintColor: Theme.navBarTitleColor
	}
});


type Props = {
	screenProps?: {
		query: ?string,
	},
	navigation: any
}

type State = {
	query?: ?string,
	results: ?any,
	error: ?Error
}


export default class SpotifySearchResultsView extends PureComponent<Props,State> {
	static router = StackNavigator.router;

	mounted: boolean = false;

	constructor(props: Props) {
		super(props);

		const query = props.screenProps?.query;
		this.state = {
			query: query,
			results: null,
			error: null
		};
	}

	static getDerivedStateFromProps(props: Props, state: State) {
		const query = props.screenProps?.query;
		if(state.query !== query) {
			return {
				...state,
				query: query,
				results: null,
				error: null
			};
		}
		return state;
	}

	async loadResults() {
		const query = this.state.query;
		if(!query) {
			return;
		}
		try {
			const limit = 24;
			const types = ['track', 'artist', 'album', 'playlist'];
			const searchResults = await SpotifyProvider.search(query, {
				types: types,
				limit: limit
			});
			if(this.state.query !== query || !this.mounted) {
				return;
			}
			const results = {};
			for(const type of types) {
				const searchTypeResults = searchResults[type+'s'];
				if(searchTypeResults) {
					const typeResults: any = {
						items: searchTypeResults.items,
						generator: null,
						done: (searchTypeResults.next == null)
					};
					if(!typeResults.done) {
						typeResults.generator = (async function * () {
							let offset = typeResults.items.length;
							while(!typeResults.done) {
								try {
									const searchResults = await SpotifyProvider.search(query, {
										types: [type],
										offset: offset,
										limit: limit
									});
									const searchTypeResults = searchResults[type+'s'];
									offset += searchTypeResults.items.length;
									typeResults.items.push(...searchTypeResults.items);
									if(searchTypeResults.next == null) {
										typeResults.done = true;
										return { result: searchTypeResults.items };
									}
									else {
										yield { result: searchTypeResults.items };
									}
								}
								catch(error) {
									yield { error };
								}
							}
							return [];
						})();
					}
					results[type+'s'] = typeResults;
				}
			}
			this.setState({
				results: results
			});
		}
		catch(error) {
			if(this.state.query !== query || !this.mounted) {
				return;
			}
			this.setState({
				error: error
			});
		}
	}

	componentDidMount() {
		this.mounted = true;
		this.loadResults();
	}

	componentDidUpdate(prevProps: Props) {
		if(this.state.query !== prevProps.screenProps?.query) {
			this.loadResults();
		}
	}

	componentWillUnmount() {
		this.mounted = false;
	}

	renderTab(props: {selected:boolean, onPress?:?() => void, label: string}) {
		return (
			<TouchableOpacity
				style={[styles.tab, (props.selected ? styles.tabActive : styles.tabInactive)]}
				onPress={props.onPress}>
				<Text style={[styles.tabLabel, (props.selected ? styles.tabLabelActive : styles.tabLabelInactive)]}>{
					(props.label)
				}</Text>
			</TouchableOpacity>
		);
	}

	render() {
		return (
			(this.state.query && !this.state.results && !this.state.error) ? (
				// loading
				<View style={styles.container}>
					<ActivityIndicator animating={true} size={'large'} style={styles.searchLoadingIndicator}/>
				</View>
			) : (this.state.error) ? (
				// error
				<View style={styles.container}>
					<View style={styles.errorContainer}>
						<Text style={styles.errorText}>{this.state.error.message}</Text>
					</View>
				</View>
			) : (!this.state.query) ? (
				// no text
				<View style={styles.container}>
					<View style={styles.searchPromptContainer}>
						<View style={styles.searchPrompt}>
							<Text>Search for some shit, yo</Text>
						</View>
					</View>
				</View>
			) : (
				<StackNavigator {...this.props}
					initialRouteName={'SpotifyAllSearchResults'}
					screenProps={{
						...this.props.screenProps,
						results: this.state.results
					}}/>
			)
		);
	}
}


const styles = StyleSheet.create({
	container: {
		width: '100%',
		flex: 1
	},

	// loading
	searchLoadingIndicator: {
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

	// no search text
	searchPromptContainer: {
		flex: 1,
		width: '100%',
		alignItems: 'center',
		justifyContent: 'center'
	},
	searchPrompt: {
		//
	},

	tabBar: {
		paddingTop: 4,
		paddingBottom: 4,
		paddingLeft: 4,
		paddingRight: 4,
		justifyContent: 'space-between',
		height: 36
	},

	tab: {
		width: 72,
		height: '100%',
		marginHorizontal: 4,
		flexShrink: 1,
		borderRadius: 18,
		alignItems: 'center',
		justifyContent: 'center'
	},
	tabActive: {
		backgroundColor: Theme.secondaryBackgroundColor
	},
	tabInactive: {
		backgroundColor: Theme.tertiaryBackgroundColor
	},
	
	tabLabel: {
		fontSize: 14
	},
	tabLabelActive: {
		//
	},
	tabLabelInactive: {
		//
	}
});
