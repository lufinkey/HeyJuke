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

import Theme from '../Theme'
import {
	Text
} from '../components/theme';

import {
	Album
} from '../providers/types';


type Props = {
	album?: ?Album,
	navigation: any,
	style?: ?Object | ?Array<Object>
}

type State = {
	album: ?Album,
	imageURL: ?string,
	propStyle?: ?Object | ?Array<Object>,
	style: Array<Object>
}


export default class AlbumButton extends PureComponent<Props, State> {
	constructor(props: Props) {
		super(props);

		const album = props.album || null;
		const thumbnail = album ? album.getImage({size:{y:140}}) : null;
		this.state = {
			album: album,
			imageURL: thumbnail?.url,
			propStyle: props.style,
			style: [styles.container].concat(props.style || [])
		};
	}

	static getDerivedStateFromProps(props: Props, state: State): State {
		let styleChanged = false;
		let style = state.style;
		if(props.style !== state.propStyle) {
			styleChanged = true;
			style = [styles.container].concat(props.style || [])
		}
		if(props.album !== state.album) {
			const album = props.album;
			const thumbnail = album ? album.getImage({size:{y:140}}) : null;
			const thumbnailURL = thumbnail ? thumbnail.url : undefined;
			return {
				...state,
				propStyle: props.style,
				style: style,
				album: album,
				imageURL: thumbnailURL
			};
		}
		else if(styleChanged) {
			return {
				...state,
				propStyle: props.style,
				style: style
			};
		}
		return state;
	}

	get album(): ?Album {
		return this.state.album;
	}

	onPress = () => {
		const album = this.album;
		if(this.props.navigation && album) {
			this.props.navigation.push('Album', {
				uri: album.uri,
				provider: album.provider
			});
		}
	}

	render() {
		const album = this.album || {};
		return (
			<TouchableOpacity
				style={this.state.style}
				onPress={this.onPress}>
				<Image
					resizeMode={'contain'}
					style={styles.albumCover}
					source={{uri:(this.state.imageURL || undefined)}}/>
				<View style={styles.albumDetails}>
					<View style={styles.albumTitleContainer}>
						<Text style={styles.albumName}>{album.name || ""}</Text>
					</View>
				</View>
			</TouchableOpacity>
		);
	}
}


const styles = StyleSheet.create({
	container: {
		flexDirection: 'column',
		alignItems: 'center'
	},
	albumCover: {
		width: '94%',
		aspectRatio: 1,
		marginBottom: 4
	},
	albumDetails: {
		//
	},
	albumTitleContainer: {
		//
	},
	albumName: {
		//
	}
})
