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
	Album
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


export default class AlbumScreen extends PureComponent<Props,State> {
	constructor(props: Props) {
		super(props);
	}

	fetchCollection = async (): Promise<Album> => {
		const uri: string = this.props.navigation.getParam('uri');
		const provider: MediaProvider = this.props.navigation.getParam('provider');
		if(!provider.getAlbum) {
			throw new Error("cannot get album from provider");
		}
		return await provider.getAlbum(uri);
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
