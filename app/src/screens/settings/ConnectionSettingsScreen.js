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
	connections: Array<HeyJukeConnection>,
	currentConnection: ?HeyJukeConnection,
	sections: Array<any>
}

export default class ConnectionSettingsScreen extends PureComponent<Props,State> {
	constructor(props: Props) {
		super(props);

		this.state = {
			preparingScanState: false,
			scanning: false,
			connections: [],
			currentConnection: null,
			sections: []
		};
	}

	componentDidMount() {
		HeyJukeScanner.addListener('connectionFound', this.onScannerConnectionFound);
		HeyJukeScanner.addListener('connectionUpdated', this.onScannerConnectionUpdated);
		HeyJukeScanner.addListener('connectionExpired', this.onScannerConnectionExpired);
		this.updateConnections();
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
			sections: sections
		});
	}

	updateConnections = () => {
		this.setState({
			scanning: HeyJukeScanner.scanning,
			connections: HeyJukeScanner.connections,
			currentConnection: HeyJukeClient.connection
		});
	};

	onScanToggle = (scanning: boolean) => {
		this.setState({
			preparingScanState: true
		});
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
		this.updateSections();
	};

	onScannerConnectionUpdated = (connection: HeyJukeConnection) => {
		this.updateConnections();
		this.updateSections();
	};

	onScannerConnectionExpired = (connection: HeyJukeConnection) => {
		this.updateConnections();
		this.updateSections();
	};

	onSelectConnection(connection: HeyJukeConnection) {
		HeyJukeClient.setConnection(connection).then(() => {
			this.updateConnections();
			this.updateSections();
		}).catch((error) => {
			Alert.alert("Error", error.message);
			this.updateConnections();
			this.updateSections();
		});
		this.updateConnections();
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
				<View style={styles.connectionRow}>
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

	render() {
		return (
			<TableView sections={this.state.sections}/>
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
