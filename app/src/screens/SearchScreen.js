// @flow

import React, { PureComponent } from 'react';
import {
	ActivityIndicator,
	Alert,
	Image,
	SafeAreaView,
	StyleSheet,
	TouchableOpacity,
	View
} from 'react-native';
import SearchBox from 'react-native-search-box';
import Icon from 'react-native-vector-icons/Ionicons';

import Theme from '../Theme';
import {
	Text
} from '../components/theme';

import SearchTabNavigator from './search';
import { sleep } from '../util/misc';


type Props = {
	navigation: any
}

type State = {
	query: ?string
}


export default class SearchScreen extends PureComponent<Props,State> {
	static navigationOptions = {
		header: null
	};

	static router = SearchTabNavigator.router;

	constructor(props: Props) {
		super(props);

		this.state = {
			query: null
		};
	}

	/*onChangeSearchText = (text: string) => {
		(async () => {
			const query = text;
			await new Promise((resolve, reject) => {
				this.setState({ pendingQuery: query }, () => {
					resolve();
				});
			});
			// wait for a bit in case the search text changes again
			await sleep(400);
			if(this.state.pendingQuery !== query) {
				return;
			}
			this.setState({
				pendingQuery: null,
				query: query
			});
		})();
	}*/

	onSearch = (text: string) => {
		if(text.length > 0) {
			this.setState({
				query: text
			});
		}
		else {
			this.setState({
				query: null
			});
		}
	}

	onSearchCancel = () => {
		this.setState({
			query: null
		});
	}

	render() {
		return (
			<SafeAreaView style={styles.container}>
				<SearchBox
					style={styles.searchBox}
					onSearch={this.onSearch}
					onCancel={this.onSearchCancel}
					backgroundColor={Theme.secondaryBackgroundColor}>
				</SearchBox>
				<SearchTabNavigator {...this.props} screenProps={{query:this.state.query}}/>
			</SafeAreaView>
		);
	}
}


const styles = StyleSheet.create({
	container: {
		width: '100%',
		flex: 1
	},
	searchBox: {
		//
	},

	contentContainer: {
		flex: 1,
		width: '100%'
	},

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
