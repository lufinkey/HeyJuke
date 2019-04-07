// @flow

import React, { PureComponent } from 'react';
import {
	ActivityIndicator,
	Alert,
	FlatList,
	StyleSheet,
	Switch,
	TouchableOpacity,
	View
} from 'react-native';

import Theme from '../../Theme';
import {
	Text
} from '../../components/theme';

import HeyJukeScanner from '../../playback/HeyJukeScanner';
import type { HeyJukeConnection } from '../../playback/HeyJukeScanner';
import HeyJukeClient from '../../playback/HeyJukeClient';


type Props = {
	//
}

type State = {
	preparingScanState: boolean,
	scanning: boolean,
	connections: Array<HeyJukeConnection>,
	currentConnection: ?HeyJukeConnection
}

export default class ConnectionSettingsScreen extends PureComponent<Props,State> {
	constructor(props: Props) {
		super(props);

		this.state = {
			preparingScanState: false,
			scanning: false,
			connections: [],
			currentConnection: null
		};
	}

	componentDidMount() {
		HeyJukeScanner.addListener('connectionFound', this.onScannerConnectionFound);
		HeyJukeScanner.addListener('connectionUpdated', this.onScannerConnectionUpdated);
		HeyJukeScanner.addListener('connectionExpired', this.onScannerConnectionExpired);
		this.setState({
			scanning: HeyJukeScanner.scanning,
			connections: HeyJukeScanner.connections,
			currentConnection: HeyJukeClient.connection
		});
	}

	componentWillUnmount() {
		HeyJukeScanner.removeListener('connectionFound', this.onScannerConnectionFound);
		HeyJukeScanner.removeListener('connectionUpdated', this.onScannerConnectionUpdated);
		HeyJukeScanner.removeListener('connectionExpired', this.onScannerConnectionExpired);
		HeyJukeScanner.stop().catch((error) => {
			Alert.alert("Error", error.message);
		});
	}

	onScanToggle = (scanning: boolean) => {
		this.setState({
			preparingScanState: true
		});
		console.log("preparing scan state ", scanning);
		if(scanning) {
			HeyJukeScanner.start().then(() => {
				this.setState({
					preparingScanState: false,
					scanning: true
				});
			}).catch((error) => {
				Alert.alert("Error", error.message);
				this.setState({
					preparingScanState: false
				});
			});
		}
		else {
			HeyJukeScanner.stop().then(() => {
				this.setState({
					preparingScanState: false,
					scanning: false
				});
			}).catch((error) => {
				Alert.alert("Error", error.message);
				this.setState({
					preparingScanState: false
				});
			});
		}
	};

	onScannerConnectionFound = (connection: HeyJukeConnection) => {
		this.updateConnections();
	};

	onScannerConnectionUpdated = (connection: HeyJukeConnection) => {
		this.updateConnections();
	};

	onScannerConnectionExpired = (connection: HeyJukeConnection) => {
		this.updateConnections();
	};

	updateConnections = () => {
		const connections = HeyJukeScanner.connections;
		const currentConnection = HeyJukeClient.connection;
		this.setState({
			connections,
			currentConnection
		});
	};

	onSelectConnection(connection: HeyJukeConnection) {
		HeyJukeClient.connection = connection;
		this.updateConnections();
	}

	extractItemKey = (item: HeyJukeConnection, index: number) => {
		return `connection-${index}`;
	};

	renderConnection = ({ item, index}: {item: HeyJukeConnection, index: number}) => {
		return (
			<TouchableOpacity style={styles.connectionRow} onPress={() => {this.onSelectConnection(item)}}>
				<View style={styles.connectionDetails}>
					<Text>{item.name}</Text>
					<Text>{item.address}:{item.port}</Text>
				</View>
			</TouchableOpacity>
		)
	};

	render() {
		const currentConnection = this.state.currentConnection;
		return (
			<View style={styles.container}>
				{(currentConnection) ? (
					<View style={styles.connectionRow}>
						<Text style={styles.connectedToText}>Connected To</Text>
						<View style={styles.connectionDetails}>
							<Text>{currentConnection.name}</Text>
							<Text>{currentConnection.address}:{currentConnection.port}</Text>
						</View>
					</View>
				) : (
					<View style={styles.connectionRow}>
						<Text style={styles.notConnectedText}>Not Connected</Text>
					</View>
				)}
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
				<FlatList
					style={styles.connectionList}
					keyExtractor={this.extractItemKey}
					data={this.state.connections}
					renderItem={this.renderConnection}/>
			</View>
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
		alignItems: 'center'
	},
	scanSwitchContainer: {
		//
	},
	connectionList: {
		flex: 1,
		width: '100%'
	},
	connectionRow: {
		height: 64,
		paddingLeft: 10,
		paddingRight: 10
	},
	connectionDetails: {
		flexDirection: 'column'
	},
	connectedToText: {
		color: 'green',
		fontWeight: 'bold'
	},
	notConnectedText: {
		alignSelf: 'center',
		textAlign: 'center',
		color: Theme.secondaryTextColor,
		fontWeight: 'bold',
		flex: 1
	}
});
