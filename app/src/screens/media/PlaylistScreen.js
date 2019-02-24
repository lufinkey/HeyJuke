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
	Playlist,
	MediaProvider
} from '../../providers/types';


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

	fetchCollection = async (uri: string, provider: MediaProvider): Promise<Playlist> => {
		const playlist = await provider.getPlaylist(uri);
		return playlist;
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
