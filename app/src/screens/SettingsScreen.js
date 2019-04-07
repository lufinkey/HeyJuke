// @flow

import React, { PureComponent } from 'react';
import {
	Alert,
	ScrollView,
	StyleSheet,
	TouchableHighlight,
	View
} from 'react-native';

import Theme from '../Theme';
import {
	Text
} from '../components/theme';

import TableView from '../components/TableView';


type Props = {
	navigation: Object
}

type State = {
	//
}


export default class SettingsScreen extends PureComponent<Props,State> {
	static navigationOptions = {
		title: "Settings"
	};

	sections = [
		{
			data: [
				{
					key: 'accounts',
					title: "Accounts",
					onPress: () => {
						this.props.navigation.push('AccountsSettings');
					}
				},
				{
					key: 'connection',
					title: "Connection",
					onPress: () => {
						this.props.navigation.push('ConnectionSettings');
					}
				}
			]
		}
	];

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
		width: '100%'
	}
});
