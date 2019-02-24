// @flow

import React, { Component } from 'react';
import {
	ActivityIndicator,
	Alert,
	Image,
	SafeAreaView,
	StyleSheet,
	TouchableOpacity,
	View
} from 'react-native';
import {
	createMaterialTopTabNavigator
} from 'react-navigation';

import Theme from '../../Theme';
import {
	Text
} from '../../components/theme';

import SpotifySearchResultsScreen from './spotify/SpotifySearchResultsScreen';
import BandcampSearchResultsScreen from './bandcamp/BandcampSearchResultsScreen';


const createTabBarIcon = (props: Object) => {
	let style = [{
		height: '100%',
		width: 40
	}];
	if(props.style) {
		style = style.concat(props.style);
	}
	return (
		<Image
			resizeMode={'contain'}
			{...props}
			style={style}/>
	);
}

export default createMaterialTopTabNavigator({
	SpotifySearchTab: {
		screen: SpotifySearchResultsScreen,
		navigationOptions: {
			title: "Spotify",
			tabBarIcon: createTabBarIcon({
				source: require('../../../assets/logo-spotify-small.png')
			})
		}
	},
	BandcampSearchTab: {
		screen: BandcampSearchResultsScreen,
		navigationOptions: {
			title: "Bandcamp",
			tabBarIcon: createTabBarIcon({
				source: require('../../../assets/logo-bandcamp-small.png')
			})
		}
	}
}, {
	backBehavior: 'none',
	tabBarOptions: {
		showIcon: true,
		style: {
			backgroundColor: Theme.secondaryBackgroundColor
		},
		tabStyle: {
			flexDirection: 'row'
		},
		indicatorStyle: {
			backgroundColor: Theme.topTabBarHighlightColor
		}
	}
});
