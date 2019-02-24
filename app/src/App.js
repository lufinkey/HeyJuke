// @flow

import './imports';
import React, { Component } from 'react';
import {
	Platform,
	StatusBar,
	StyleSheet,
	View
} from 'react-native';
import {
	createAppContainer
} from 'react-navigation';
import SplashScreen from 'react-native-splash-screen'

import MainScreen from './screens';

import Theme from './Theme';


class App extends Component<any,{}> {
	static router = MainScreen.router;

	componentDidMount() {
		SplashScreen.hide();
	}

	render() {
		return (
			<View style={styles.container}>
				<StatusBar
					hidden={false}
					barStyle={'light-content'}
					backgroundColor={'black'}/>
				<MainScreen {...this.props}/>
			</View>
		);
	}
}

const AppContainer = createAppContainer(App);


const styles = StyleSheet.create({
	container: {
		flex: 1,
		width: '100%',
		backgroundColor: Theme.backgroundColor
	},
	statusBarContainer: {
		height: Platform.select({
			ios: 20,
			android: undefined
		}),
	}
});


export default AppContainer;
