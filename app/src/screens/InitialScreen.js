// @flow

import React, { PureComponent } from 'react';
import {
	ActivityIndicator,
	Alert,
	Image,
	Platform,
	StyleSheet,
	TouchableHighlight,
	View
} from 'react-native';
import Spotify from 'rn-spotify-sdk';
import { sleep } from '../util/misc';

import {
	Text
} from '../components/theme';

const SpotifyCredentials = require('../../credentials/Spotify.json');


type Props = {
	navigation: any
}

type State = {
	//
}


export default class InitialScreen extends PureComponent<Props,State> {
	loadState = 'preparing';

	constructor(props: Props) {
		super(props);
	}

	goToHomeScreen() {
		this.props.navigation.navigate('main');
	}

	async initializeSpotifyIfNeeded() {
		if(await Spotify.isInitializedAsync()) {
			return await Spotify.isLoggedInAsync();
		}
		else {
			return await Spotify.initialize(SpotifyCredentials);
		}
	}

	async load() {
		this.loadState = 'spotify';
		await this.initializeSpotifyIfNeeded();
		this.loadState = 'finished';
	}

	componentDidMount() {
		this.load().then(() => {
			this.goToHomeScreen();
		}).catch((error) => {
			Alert.alert("Error while loading "+this.loadState, error.message);
		});
	}

	render() {
		return (
			<View style={styles.container}>
				<View style={styles.topArea}>
				</View>
				<View style={styles.centerArea}>
					<Text>Hey, Juke</Text>
				</View>
				<View style={styles.bottomArea}>
					<ActivityIndicator animating={true} size={'small'} style={styles.loadIndicator}/>
				</View>
			</View>
		);
	}
}


const styles = StyleSheet.create({
	container: {
		width: '100%',
		flex: 1
	},
	topArea: {
		width: '100%',
		height: 48
	},
	centerArea: {
		width: '100%',
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingLeft: 32,
		paddingRight: 32,
		paddingTop: 32,
		paddingBottom: 32
	},
	bottomArea: {
		width: '100%',
		height: 48,
		justifyContent: 'center',
		alignItems: 'center'
	},
	logo: {
		width: '100%',
		height: '100%'
	},
	loadIndicator: {
		//
	}
});
