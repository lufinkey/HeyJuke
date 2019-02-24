// @flow

import React, { PureComponent } from 'react';
import {
	ActivityIndicator,
	Alert,
	ScrollView,
	StyleSheet,
	TouchableHighlight,
	TouchableOpacity,
	View
} from 'react-native';

import Theme from '../../../Theme';
import {
	Text
} from '../../../components/theme';

import SpotifyProvider from '../../../providers/SpotifyProvider';
import Spotify from 'rn-spotify-sdk';


type Props = {
	//
}

type State = {
	loggedIn: boolean,
	sessionExpireSeconds: ?number,
	renewingSession: boolean
}


export default class SpotifyAccountSettingsScreen extends PureComponent<Props,State> {
	static navigationOptions = {
		title: "Spotify"
	};

	sessionInterval: ?any;
	
	constructor(props: Props) {
		super(props);

		const currentTime = (new Date()).getTime();
		this.state = {
			loggedIn: SpotifyProvider.isLoggedIn,
			sessionExpireSeconds: null,
			renewingSession: false
		};
	}

	componentDidMount() {
		if(this.state.loggedIn) {
			this.startSessionTimer();
		}
	}

	componentWillUnmount() {
		this.stopSessionTimer();
	}

	startSessionTimer() {
		if(this.sessionInterval) {
			clearInterval(this.sessionInterval);
			this.sessionInterval = null;
		}
		const onFire = (async () => {
			const auth = await Spotify.getAuth();
			const currentTime = (new Date()).getTime();
			this.setState({
				sessionExpireSeconds: Math.floor((auth.expireTime - currentTime) / 1000.0)
			});
		});
		this.sessionInterval = setInterval(() => {
			onFire();
		}, 1000);
		onFire();
	}

	stopSessionTimer() {
		if(this.sessionInterval) {
			clearInterval(this.sessionInterval);
			this.sessionInterval = null;
		}
	}

	didPressLogin = () => {
		SpotifyProvider.login().then((loggedIn) => {
			this.setState({
				loggedIn: loggedIn
			});
			if(loggedIn) {
				this.startSessionTimer();
			}
		}).catch((error) => {
			Alert.alert("Error", error.message);
		});
	}

	didPressLogout = () => {
		SpotifyProvider.logout().then(() => {
			this.setState({
				loggedIn: SpotifyProvider.isLoggedIn
			});
			this.stopSessionTimer();
		}).catch((error) => {
			Alert.alert("Error", error.message);
		});
	}

	didPressRenew = () => {
		if(this.state.renewingSession) {
			return;
		}
		this.setState({
			renewingSession: true
		});
		Spotify.renewSession().then(() => {
			this.setState({
				renewingSession: false
			});
		}).catch((error) => {
			this.setState({
				renewingSession: false
			});
			Alert.alert("Error", error.message);
		});
	}

	render() {
		return (
			<ScrollView style={styles.container}>
				{ this.state.loggedIn ? (
					<View style={styles.row}>
						<Text style={styles.label}>
							Logged into Spotify
						</Text>
						<TouchableHighlight onPress={this.didPressLogout} style={[styles.roundedButton, styles.logoutButton]}>
							<Text style={styles.roundedButtonText}>Log out</Text>
						</TouchableHighlight>
					</View>
				) : (
					<View style={styles.row}>
						<TouchableHighlight onPress={this.didPressLogin} style={[styles.roundedButton, styles.loginButton]}>
							<Text style={styles.roundedButtonText}>Log into Spotify</Text>
						</TouchableHighlight>
					</View>
				)}
				{ this.state.loggedIn ? (
					<View style={styles.row}>
						{(this.state.sessionExpireSeconds != null) ? (
							<Text style={styles.label}>
								Session expiring in {this.state.sessionExpireSeconds}
							</Text>
						) : (
							<Text style={styles.label}>
								Checking session renewal time...
							</Text>
						)}
						{(this.state.renewingSession) ? (
							<ActivityIndicator
								animating={true}
								color={Theme.textColor}
								size={'small'}
								style={styles.renewSessionLoader}/>
						) : (
							<TouchableOpacity onPress={this.didPressRenew} style={styles.renewSessionButton}>
								<Text style={styles.renewSessionText}>Renew</Text>
							</TouchableOpacity>
						)}
					</View>
				) : null}
			</ScrollView>
		);
	}
}


const styles = StyleSheet.create({
	container: {
		width: '100%',
		flex: 1
	},

	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: 'black',
		backgroundColor: Theme.secondaryBackgroundColor,
		height: 80,
	},

	roundedButtonText: {
		fontSize: 20,
		textAlign: 'center',
		color: 'white',
	},
	roundedButton: {
		justifyContent: 'center',
		borderRadius: 18,
		overflow: 'hidden',
		width: 200,
		height: 40,
	},

	loginButton: {
		backgroundColor: 'green',
		marginLeft: 'auto',
		marginRight: 'auto',
	},
	logoutButton: {
		backgroundColor: 'red',
		marginLeft: 'auto',
		marginRight: 10,
	},

	label: {
		marginLeft: 10,
	},

	renewSessionButton: {
		paddingTop: 10,
		paddingBottom: 10,
		paddingLeft: 10,
		paddingRight: 10,
		marginRight: 32,
		borderRadius: 16,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: Theme.secondaryTextColor
	},
	renewSessionText: {
		color: Theme.backgroundColor
	},
	renewSessionLoader: {
		marginRight: 56
	}
});
