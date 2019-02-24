// @flow

import React, { PureComponent } from 'react';
import {
	Alert,
	Animated,
	Image,
	StyleSheet,
	TouchableOpacity,
	View
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

import Theme from '../../Theme';
import {
	Text,
	MarqueeText
} from '../theme';

import PlayButton from './PlayButton';
import {
	Track
} from '../../providers/types';
import type {
	MediaItemImage,
	PlaybackState,
	PlaybackMetadata
} from '../../providers/types';


type Props = {
	onSelect?: ?() => void,
	onTogglePlay?: ?() => void,
	playbackState?: ?PlaybackState,
	playbackMetadata?: ?PlaybackMetadata,
	pointerEvents?: string,
	style?: ?Object | ?Array<Object>
}

type State = {
	currentTrack: ?Track,
	coverImage: ?MediaItemImage,
	propStyle?: ?Object | ?Array<Object>,
	style: Array<Object>
}


export default class PlayerBar extends PureComponent<Props,State> {
	static DEFAULT_HEIGHT = 44;

	constructor(props: Props) {
		super(props);

		const currentTrack = props.playbackMetadata?.currentTrack;
		this.state = {
			currentTrack: currentTrack,
			coverImage: currentTrack ? currentTrack.getImage({size:{y:PlayerBar.DEFAULT_HEIGHT}}) : null,
			propStyle: props.style,
			style: [styles.container].concat(props.style || [])
		}
	}

	static getDerivedStateFromProps(props: Props, state: State): State {
		let styleChanged = false;
		let style = state.style;
		if(props.style !== state.propStyle) {
			styleChanged = true;
			style = [styles.container].concat(props.style || [])
		}
		const currentTrack = props.playbackMetadata?.currentTrack;
		if(currentTrack !== state.currentTrack) {
			return {
				...state,
				currentTrack: currentTrack,
				coverImage: currentTrack ? currentTrack.getImage({size:{y:PlayerBar.DEFAULT_HEIGHT}}) : null,
				propStyle: props.style,
				style: style
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

	onSelect = () => {
		if(this.props.onSelect) {
			this.props.onSelect();
		}
	}

	onTogglePlay = () => {
		if(this.props.onTogglePlay) {
			this.props.onTogglePlay();
		}
	}

	render() {
		const { playbackMetadata, playbackState } = this.props;
		return (
			<Animated.View style={this.state.style} pointerEvents={this.props.pointerEvents}>
				<TouchableOpacity style={styles.mainBarButton} onPress={this.onSelect}>
					<Image
						style={styles.thumbnail}
						source={{uri:(this.state.coverImage?.url || undefined)}}/>
					<View style={styles.metadataContainer}>
						<View style={styles.contentRow}>
							<MarqueeText style={styles.titleText} numberOfLines={1}>{
								(this.state.currentTrack?.name || "")
							}</MarqueeText>
						</View>
						<View style={styles.contentRow}>
							<Text style={styles.artistText} numberOfLines={1}>{
								(this.state.currentTrack?.artist?.name || "")
							}</Text>
						</View>
					</View>
					<View style={styles.playButtonPadding}>
					</View>
				</TouchableOpacity>
				<View style={styles.togglePlayButtonContainer}>
					<PlayButton style={styles.togglePlayButton} size={20}/>
				</View>
			</Animated.View>
		);
	}
}


const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		height: PlayerBar.DEFAULT_HEIGHT,
		backgroundColor: Theme.playerBarColor,
	},
	mainBarButton: {
		width: '100%',
		height: '100%',
		flexDirection: 'row'
	},
	togglePlayButtonContainer: {
		zIndex: 2,
		position: 'absolute',
		right: 4,
		width: PlayerBar.DEFAULT_HEIGHT,
		height: '100%'
	},
	togglePlayButton: {
		borderRadius: PlayerBar.DEFAULT_HEIGHT / 2.0,
		width: '70%',
		height: '70%',
		margin: '15%',
		flex: 1
	},
	playButtonPadding: {
		width: PlayerBar.DEFAULT_HEIGHT,
		height: '100%'
	},
	thumbnail: {
		height: '100%',
		aspectRatio: 1
	},
	metadataContainer: {
		flexDirection: 'column',
		flex: 1,
		marginLeft: 10
	},
	contentRow: {
		flexDirection: 'row',
		width: '100%',
		flex: 1
	},
	titleText: {
		//
	},
	artistText: {
		color: Theme.secondaryTextColor
	}
});
