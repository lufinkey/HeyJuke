// @flow

import React, { PureComponent } from 'react';
import {
	ActivityIndicator,
	Alert,
	StyleSheet,
	Switch,
	TouchableOpacity,
	View
} from 'react-native';
import Spotify from 'rn-spotify-sdk';

import Theme from '../../Theme';
import {
	Text
} from '../../components/theme';

import TableView from '../../components/TableView';

import HeyJukeScanner from '../../playback/HeyJukeScanner';
import type { HeyJukeConnection } from '../../playback/HeyJukeScanner';
import HeyJukeClient from '../../playback/HeyJukeClient';


type Props = {
	//
}

type State = {
	preparingScanState: boolean,
	scanning: boolean,
	connection: ?HeyJukeConnection,
	settingUpSpotify: boolean,
	sections: Array<any>
}

export default class ConnectionSettingsScreen extends PureComponent<Props,State> {
	constructor(props: Props) {
		super(props);

		this.state = {
			preparingScanState: false,
			scanning: HeyJukeScanner.scanning,
			connection: HeyJukeClient.connection,
			settingUpSpotify: false,
			sections: []
		};
	}

	componentDidMount() {
		HeyJukeScanner.addListener('connectionFound', this.onScannerConnectionFound);
		HeyJukeScanner.addListener('connectionUpdated', this.onScannerConnectionUpdated);
		HeyJukeScanner.addListener('connectionExpired', this.onScannerConnectionExpired);
		this.updateSections();
	}

	componentWillUnmount() {
		HeyJukeScanner.removeListener('connectionFound', this.onScannerConnectionFound);
		HeyJukeScanner.removeListener('connectionUpdated', this.onScannerConnectionUpdated);
		HeyJukeScanner.removeListener('connectionExpired', this.onScannerConnectionExpired);
		HeyJukeScanner.stop().catch((error) => {
			Alert.alert("Error", error.message);
		});
	}

	updateSections() {
		const sections = [
			{
				key: 'scan-settings',
				data: [
					{
						key: 'scan-for-connections',
						render: this.renderScanForConnections
					},
					{
						key: 'setup-spotify',
						render: this.renderSetupSpotify
					}
				]
			},
			{
				key: 'current-connection',
				title: "Current Connection",
				data: [
					{
						key: 'current-connection',
						connection: HeyJukeClient.connection
					}
				],
				renderItem: this.renderCurrentConnection
			}
		].concat((HeyJukeScanner.scanning) ? (
			{
				key: 'connections',
				title: "Connections",
				data: HeyJukeScanner.connections.map((connection) => ({
					key: `connection-${connection.address}:${connection.port}`,
					connection: connection
				})),
				renderItem: this.renderConnection
			}
		) : []);
		this.setState({
			sections: sections,
			scanning: HeyJukeScanner.scanning,
			connection: HeyJukeClient.connection
		});
	}



	onScanToggle = (scanning: boolean) => {
		this.setState({
			preparingScanState: true
		});
		if(scanning) {
			HeyJukeScanner.start().catch((error) => {
				Alert.alert("Error", error.message);
			}).finally(() => {
				this.setState({
					preparingScanState: false
				});
				this.updateSections();
			});
		}
		else {
			HeyJukeScanner.stop().catch((error) => {
				Alert.alert("Error", error.message);
			}).finally(() => {
				this.setState({
					preparingScanState: false
				});
				this.updateSections();
			});
		}
	};

	onScannerConnectionFound = (connection: HeyJukeConnection) => {
		this.updateSections();
	};

	onScannerConnectionUpdated = (connection: HeyJukeConnection) => {
		this.updateSections();
	};

	onScannerConnectionExpired = (connection: HeyJukeConnection) => {
		this.updateSections();
	};


	onPressSetupSpotify = async () => {
		this.setState({
			settingUpSpotify: false
		});
		try {
			const connection = HeyJukeClient.connection;
			if(!connection) {
				throw new Error("Not connected to server");
			}
			const { clientId, redirectURL } = await HeyJukeClient.getSetting('spotify');
			const session = await Spotify.authenticate({
				showDialog: true,
				clientID: clientId,
				redirectURL: redirectURL,
				tokenSwapURL: `http://${connection.address}:${connection.port}/settings/spotify/swap`
			});
			if(session) {
				await HeyJukeClient.setSetting('spotify', {
					clientId,
					redirectURL,
					accessToken: session.accessToken,
					refreshToken: session.refreshToken,
					expireTime: session.expireTime
				});
			}
			this.setState({
				settingUpSpotify: false
			});
		}
		catch(error) {
			Alert.alert("Error", error.message);
			this.setState({
				settingUpSpotify: false
			});
		}
	};


	onSelectConnection(connection: HeyJukeConnection) {
		HeyJukeClient.setConnection(connection).catch((error) => {
			Alert.alert("Error", error.message);
		}).finally(() => {
			this.updateSections();
		});
		this.updateSections();
	}



	renderScanForConnections = () => {
		return (
			<View style={styles.scanSwitchRow}>
				<Text>Scan For Connections</Text>
				<View style={styles.scanSwitchContainer}>
					{(this.state.preparingScanState) ? (
						<ActivityIndicator animating={true} size={'small'}/>
					) : (
						<Switch value={this.state.scanning} onValueChange={this.onScanToggle}/>
					)}
				</View>
			</View>
		);
	};

	renderSetupSpotify = () => {
		let RowView: any = View;
		if(!this.state.settingUpSpotify && this.state.connection) {
			RowView = TouchableOpacity;
		}
		return (
			<RowView
				style={styles.setupSpotifyButton}
				onPress={this.onPressSetupSpotify}>
				<Text>Setup Spotify</Text>
				{(this.state.settingUpSpotify) ? (
					<ActivityIndicator animating={true} size={'small'}/>
				) : null}
			</RowView>
		);
	};

	renderCurrentConnection = ({ item, index }: {item: {connection: ?HeyJukeConnection}, index: number}) => {
		const { connection } = item;
		if(connection != null) {
			return (
				<View style={styles.connectionRow}>
					<Text style={styles.connectedToText}>Connected To</Text>
					<View style={styles.connectionDetails}>
						<Text>{connection.name}</Text>
						<Text>{connection.address}:{connection.port}</Text>
					</View>
				</View>
			);
		}
		else {
			return (
				<View style={styles.notConnectedRow}>
					<Text style={styles.notConnectedText}>Not Connected</Text>
				</View>
			);
		}
	};

	renderConnection = ({ item, index}: {item: { connection: HeyJukeConnection }, index: number}) => {
		const { connection } = item;
		return (
			<TouchableOpacity style={styles.connectionRow} onPress={() => {this.onSelectConnection(connection)}}>
				<View style={styles.connectionDetails}>
					<Text>{connection.name}</Text>
					<Text>{connection.address}:{connection.port}</Text>
				</View>
			</TouchableOpacity>
		);
	};

	renderSectionFooter = ({ section }: {section: {key: string, title: string}}) => {
		if(section.key === 'connections') {
			if(!this.state.scanning) {
				return null;
			}
			return (
				<View style={styles.connectionsFooter}>
					<ActivityIndicator animating={true} size={'small'}/>
				</View>
			);
		}
		return null;
	};

	render() {
		return (
			<TableView
				style={styles.container}
				sections={this.state.sections}
				renderSectionFooter={this.renderSectionFooter}/>
		);
	}
}


const styles = StyleSheet.create({
	container: {
		flex: 1,
		width: '100%'
	},

	scanSwitchRow: {
		paddingLeft: 10,
		paddingRight: 10,
		height: 44,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		backgroundColor: Theme.secondaryBackgroundColor
	},
	scanSwitchContainer: {
		//
	},

	setupSpotifyButton: {
		height: 44,
		justifyContent: 'space-between',
		paddingLeft: 10,
		paddingRight: 10,
		justifyContent: 'center',
		backgroundColor: Theme.secondaryBackgroundColor
	},

	connectionRow: {
		height: 64,
		paddingLeft: 10,
		paddingRight: 10,
		backgroundColor: Theme.secondaryBackgroundColor
	},
	connectionDetails: {
		flexDirection: 'column'
	},
	connectedToText: {
		color: 'green',
		fontWeight: 'bold'
	},

	notConnectedRow: {
		height: 64,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: Theme.secondaryBackgroundColor
	},
	notConnectedText: {
		textAlign: 'center',
		color: Theme.secondaryTextColor,
		fontWeight: 'bold'
	},

	connectionsFooter: {
		justifyContent: 'center',
		alignItems: 'center',
		paddingTop: 4,
		paddingBottom: 4
	}
});
