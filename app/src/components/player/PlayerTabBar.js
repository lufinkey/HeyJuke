// @flow

import React, { PureComponent } from 'react';
import {
	Alert,
	Animated,
	BackHandler,
	Dimensions,
	Keyboard,
	Modal,
	Platform,
	StatusBar,
	StyleSheet,
	TouchableHighlight,
	TouchableOpacity,
	View,
} from 'react-native';
import { BottomTabBar } from 'react-navigation-tabs';

import Theme from '../../Theme';
import {
	Text
} from '../theme';

import PlayerBar from './PlayerBar';
import PlayerHeader from './PlayerHeader';
import PlayerView from './PlayerView';

import type {
	PlaybackState,
	PlaybackMetadata
} from '../../providers/types';


const TABBAR_HEIGHT = 50;
const PLAYERBAR_HEIGHT = PlayerBar.DEFAULT_HEIGHT;


type Props = {
	//
}

type State = {
	playerBarAnim: Animated.Value,
	playerIsOpen: boolean
}


export default class PlayerTabBar extends PureComponent<Props,State> {
	constructor(props: Props) {
		super(props);

		this.state = {
			playerBarAnim: new Animated.Value(0),
			playerIsOpen: false,
			queueIsOpen: false
		};
	}

	componentDidMount() {
		// TODO subscribe to player state
	}

	componentWillUnmount() {
		// TODO unsubscribe from player state
	}

	setPlayerOpen(opened: boolean) {
		if(opened) {
			Keyboard.dismiss();
		}
		Animated.spring(
			this.state.playerBarAnim,
			{
				toValue: opened ? 1 : 0
			}
		).start();
		if(opened && !this.state.playerIsOpen) {
			BackHandler.addEventListener('hardwareBackPress', this.onPressHardwareBackButton);
		}
		else if(!opened && this.state.playerIsOpen) {
			BackHandler.removeEventListener('hardwareBackPress', this.onPressHardwareBackButton);
		}
		this.setState({
			playerIsOpen: opened
		});
	}

	onPressHardwareBackButton = () => {
		this.setPlayerOpen(false);
		return true;
	}

	onPressPlayerBar = () => {
		this.setPlayerOpen(true);
	}

	onPressPlayerHeader = () => {
		this.setPlayerOpen(false);
	}

	getStatusbarHeight() {
		return Platform.select({
			ios: 20,
			android: StatusBar.currentHeight,
		});
	}

	render() {
		const tabBarVisible = false;

		let windowSize = Dimensions.get('window');
		let statusBarHeight = this.getStatusbarHeight();
		let playerWindowHeight = windowSize.height - statusBarHeight;
		let playerWindowDisplay = 'none';
		let barFillerHeight = TABBAR_HEIGHT;
		if(tabBarVisible) {
			barFillerHeight += PLAYERBAR_HEIGHT;
			playerWindowDisplay = 'flex';
		}

		let playerContainerTop = this.state.playerBarAnim.interpolate({
			inputRange: [0, 1],
			outputRange: [ playerWindowHeight-(PLAYERBAR_HEIGHT+TABBAR_HEIGHT), 0 ]
		});
		let tabBarContainerBottom = this.state.playerBarAnim.interpolate({
			inputRange: [0, 1],
			outputRange: [ 0, -TABBAR_HEIGHT ]
		});
		let headerOpacity = this.state.playerBarAnim.interpolate({
			inputRange: [0, 1],
			outputRange: [ 0, 1 ]
		});
		let playerBarOpacity = this.state.playerBarAnim.interpolate({
			inputRange: [0, 1],
			outputRange: [ 1, 0 ]
		});

		return (
			<View style={styles.container}>
				{(tabBarVisible) ? (
					<View
						style={[styles.playerWindow, {width:windowSize.width, height:playerWindowHeight, display:playerWindowDisplay}]}
						pointerEvents={'box-none'}>
						<Animated.View style={[styles.playerContainer, {top:playerContainerTop, height:playerWindowHeight}]}>
							<PlayerBar
								style={[styles.playerBar, {opacity:playerBarOpacity}]}
								pointerEvents={this.state.playerIsOpen ? 'none' : undefined}
								onSelect={this.onPressPlayerBar}/>
							<PlayerHeader
								style={[styles.playerHeader, {opacity:headerOpacity}]}
								pointerEvents={this.state.playerIsOpen ? undefined : 'none'}
								onPress={this.onPressPlayerHeader}/>
							<PlayerView
								style={styles.player}/>
						</Animated.View>
					</View>
				) : null}
				<Animated.View style={[styles.tabBarContainer, {bottom:tabBarContainerBottom}]}>
					<BottomTabBar {...this.props}/>
				</Animated.View>
				<Animated.View style={[styles.barFiller, {height:barFillerHeight}]} pointerEvents={'none'}>
				</Animated.View>
			</View>
		);
	}
}


const styles = StyleSheet.create({
	container: {
		//
	},
	playerWindow: {
		position: 'absolute',
		bottom: 0,
	},
	playerContainer: {
		backgroundColor: Theme.backgroundColor,
		zIndex: 1
	},
	playerBar: {
		//
	},
	playerHeader: {
		position: 'absolute'
	},
	player: {
		//
	},
	tabBarContainer: {
		zIndex: 2,
		position: 'absolute',
		width: '100%'
	},
	barFiller: {
		//
	}
});
