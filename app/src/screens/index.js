// @flow

import React, { Component } from 'react';
import {
	StyleSheet,
	Text,
	View
} from 'react-native';
import {
	createStackNavigator,
	createSwitchNavigator,
	createBottomTabNavigator
} from 'react-navigation';
import Icon from 'react-native-vector-icons/Ionicons';

import Theme from '../Theme';

import InitialScreen from "./InitialScreen";
import SearchScreen from './SearchScreen';
import AlbumScreen from './media/AlbumScreen';
import ArtistScreen from './media/ArtistScreen';
import PlaylistScreen from './media/PlaylistScreen';
import SettingsScreen from './SettingsScreen';
import AccountsSettingsScreen from './settings/AccountsSettingsScreen';
import SpotifyAccountSettingsScreen from './settings/accounts/SpotifyAccountSettingsScreen';

import PlayerTabBar from '../components/player/PlayerTabBar';


const createNavigator = (routes: Object, options: {cardStyle?:Object, defaultNavigationOptions?:Object, navigationOptions?:Object}) => {
	options = {...options};
	const StackNavigator = createStackNavigator(routes, {
		...options,
		cardStyle: {
			backgroundColor: Theme.backgroundColor,
			...options.cardStyle
		},
		defaultNavigationOptions: {
			headerStyle: {
				backgroundColor: Theme.navBarColor,
			},
			headerTintColor: Theme.navBarTitleColor,
			...options.defaultNavigationOptions
		},
		navigationOptions: {
			...options.navigationOptions
		}
	});
	return StackNavigator;
}


const TabNavigator = createBottomTabNavigator({
	SearchTab: {screen:createNavigator({
		Search: {screen:SearchScreen},
		Artist: {screen:ArtistScreen},
		Album: {screen:AlbumScreen},
		Playlist: {screen:PlaylistScreen}
	}, {
		initialRouteName: 'Search',
		navigationOptions: {
			title: 'Search',
			tabBarIcon: ({ tintColor }) => (
				<Icon name={"ios-search"} size={30} color={tintColor}/>
			)
		}
	}) },
	SettingsTab: {screen:createNavigator({
		Settings: {screen:SettingsScreen},
		AccountsSettings: {screen:AccountsSettingsScreen},
		SpotifyAccountSettings: {screen:SpotifyAccountSettingsScreen}
	}, {
		initialRouteName: 'Settings',
		navigationOptions: {
			title: 'Settings',
			tabBarIcon: ({ tintColor }) => (
				<Icon name={"ios-cog"} size={30} color={tintColor}/>
			)
		}
	}) }
}, {
	backBehavior: 'none',
	tabBarComponent: PlayerTabBar,
	tabBarOptions: {
		activeTintColor: Theme.activeTabColor,
        inactiveTintColor: Theme.inactiveTabColor,
        style: {
            backgroundColor: Theme.tabBarColor // TabBar background
        }
	}
});


const SwitchNavigator = createSwitchNavigator({
	initial: { screen:InitialScreen },
	main: { screen:TabNavigator },
},{
	initialRouteName: 'initial',
	headerMode: 'none'
});


const MainScreen = SwitchNavigator;


export default MainScreen;
