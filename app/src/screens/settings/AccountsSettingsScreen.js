// @flow

import React, { PureComponent } from 'react';
import {
	Alert,
	StyleSheet,
	TouchableHighlight,
	View
} from 'react-native';

import Theme from '../../Theme';
import {
	Text
} from '../../components/theme';

import SpotifyProvider from '../../library/providers/SpotifyProvider';
import BandcampProvider from '../../library/providers/BandcampProvider';
import TableView from '../../components/TableView';


type Props = {
	navigation: Object
}

type State = {
	//
}


export default class AccountsSettingsScreen extends PureComponent<Props,State> {
	static navigationOptions = {
		title: "Accounts"
	};

	sections = [
		{
			data: [
				{
					key: 'spotify',
					icon: require('../../../assets/logo-spotify-small.png'),
					title: "Spotify",
					onPress: () => {
						this.props.navigation.push('SpotifyAccountSettings');
					}
				}
			]
		}
	]

	constructor(props: Props) {
		super(props);
	}

	render() {
		return (
			<TableView style={styles.container} sections={this.sections}/>
		);
	}
}


const styles = StyleSheet.create({
	container: {
		width: '100%',
		//backgroundColor: Theme.secondaryBackgroundColor,
	}
});
