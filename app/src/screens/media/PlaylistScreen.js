// @flow

import React, { PureComponent } from 'react';
import {
	ActivityIndicator,
	Alert,
	Dimensions,
	Image,
	ScrollView,
	StyleSheet,
	TouchableOpacity,
	View
} from 'react-native';

import Theme from '../../Theme'
import {
	Text
} from '../../components/theme';

import TrackCollectionScreen from './TrackCollectionScreen';
import {
	Playlist
} from '../../library/types';
import type {
	MediaProvider
} from '../../library/types';


type Props = {
	navigation: Object
}

type State = {
	//
}


export default class PlaylistScreen extends PureComponent<Props,State> {
	constructor(props: Props) {
		super(props);
	}

	fetchCollection = async (): Promise<Playlist> => {
		const uri: string = this.props.navigation.getParam('uri');
		const provider: MediaProvider = this.props.navigation.getParam('provider');
		if(!provider.getPlaylist) {
			throw new Error("cannot get playlist from provider");
		}
		return await provider.getPlaylist(uri);
	}

	render() {
		return (
			<TrackCollectionScreen
				navigation={this.props.navigation}
				fetchCollection={this.fetchCollection}/>
		);
	}
}


const styles = StyleSheet.create({
	//
});
