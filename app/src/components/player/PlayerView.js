// @flow

import React, { PureComponent } from 'react';
import {
	Alert,
	Animated,
	Image,
	Slider,
	StyleSheet,
	TouchableOpacity,
	View
} from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';
import FAIcon from 'react-native-vector-icons/FontAwesome';
import Spotify from 'rn-spotify-sdk';

import Theme from '../../Theme';
import {
	Text
} from '../theme';

import PlayButton from './PlayButton';
import {
	Track
} from '../../library/types';
import type {
	MediaItemImage,
	PlaybackState,
	PlaybackMetadata
} from '../../library/types';


type Props = {
	playbackState?: ?PlaybackState,
	playbackMetadata?: ?PlaybackMetadata
}

type State = {
	seeking: boolean,
	currentTrack: ?Track,
	coverImage: ?MediaItemImage,
	playerError: ?Error,
	playerMessage: ?string
}


export default class PlayerView extends PureComponent<Props,State> {
	static defaultCoverSize: number = 400;

	constructor(props: Props) {
		super(props);

		const currentTrack = props.playbackMetadata?.currentTrack;
		this.state = {
			seeking: false,
			currentTrack: currentTrack,
			coverImage: currentTrack ? currentTrack.getImage({size:{y:PlayerView.defaultCoverSize}}) : null,
			playerError: null,
			playerMessage: null,
			temporaryPlayerIssues: false
		};
	}

	static getDerivedStateFromProps(props: Props, state: State): State {
		const currentTrack = props.playbackMetadata?.currentTrack;
		if(currentTrack !== state.currentTrack) {
			return {
				...state,
				currentTrack: currentTrack,
				coverImage: currentTrack ? currentTrack.getImage({size:{y:PlayerView.defaultCoverSize}}) : null,
			};
		}
		return state;
	}

	componentDidMount() {
		// TODO subscribe to player events
	}

	componentWillUnmount() {
		// TODO unsubscribe from player events
	}

	getPositionString(duration: number): string {
		if(duration == null) {
			return '0:00';
		}
		else if(duration < 0) {
			duration = 0;
		}
		const seconds = Math.floor(duration % 60);
		const minutes = Math.floor(duration / 60);
		return minutes+':'+(""+seconds).padStart(2, '0');
	}

	onPlayerError = (error: Error) => {
		this.setState({
			playerError: error
		});
	}

	onClosePlayerError = () => {
		this.setState({
			playerError: null
		});
	}

	onPlayerMessage = (message: string) => {
		this.setState({
			playerMessage: message
		});
	}

	onClosePlayerMessage = () => {
		this.setState({
			playerMessage: null
		});
	}

	onSeekValueChange = (value: number) => {
		this.setState({
			seeking: true
		});
	}

	onSeekComplete = (value: number) => {
		this.setState({
			seeking: false
		});
		const { playbackMetadata } = this.props;
		if(playbackMetadata && playbackMetadata.currentTrack) {
			const position = value * playbackMetadata.currentTrack.duration;
			// TODO seek player to position
		}
	}

	onPressNext = () => {
		// TODO skip to next track
	}

	onPressPrevious = () => {
		// TODO skip to previous track
	}

	render() {
		const { playbackMetadata, playbackState } = this.props;
		const currentTrack = playbackMetadata?.currentTrack;

		return (
			<View style={styles.container}>
				<View style={styles.popupContainer}>
					{this.state.playerError ? (
						<View style={[styles.popupRow, styles.errorContainer]}>
							<Text style={styles.popupText}>{this.state.playerError.message}</Text>
							<TouchableOpacity style={styles.popupCloseButton} onPress={this.onClosePlayerError}>
								<IonIcon name={'md-close'} size={16} color={Theme.textColor}/>
							</TouchableOpacity>
						</View>
					) : null}
					{this.state.playerMessage ? (
						<View style={[styles.popupRow, styles.messageContainer]}>
							<Text style={styles.popupText}>{this.state.playerMessage}</Text>
							<TouchableOpacity style={styles.popupCloseButton} onPress={this.onClosePlayerMessage}>
								<IonIcon name={'md-close'} size={16} color={Theme.textColor}/>
							</TouchableOpacity>
						</View>
					) : null}
				</View>
				<View style={styles.albumCoverContainer}>
					<Image
						source={{uri:(this.state.coverImage?.url || undefined)}}
						style={styles.albumCover}
						resizeMode={'contain'}>
					</Image>
				</View>
				<View style={styles.metaTextContainer}>
					<Text style={styles.titleMarquee}>{
						(playbackMetadata?.currentTrack?.name || "")
					}</Text>
					<Text style={styles.artistMarquee}>{
						(playbackMetadata?.currentTrack?.artist?.name || "")
					}</Text>
				</View>
				<View style={styles.seekContainer}>
					<Text style={styles.songPos}>{
						(playbackState) ? this.getPositionString(playbackState.position) : "0:00"
					}</Text>
					<Slider
						maximumTrackTintColor='gray'
						style={styles.seekSlider}
						value={(playbackMetadata?.currentTrack && playbackState && !this.state.seeking) ? (playbackState?.position / (currentTrack?.duration || NaN)) : undefined}
						onValueChange={this.onSeekValueChange}
						onSlidingComplete={this.onSeekComplete}/>
					<Text style={styles.songLength}>{
						currentTrack ? this.getPositionString(currentTrack.duration) : "0:00"
					}</Text>
				</View>
				<View style={styles.playbackControlContainer}>
					<TouchableOpacity
						style={[styles.skipButton, styles.prevButton]}
						onPress={this.onPressPrevious}
						disabled={(playbackMetadata?.previousTrack == null)}>
						<FAIcon name='step-backward' size={24} style={styles.playControlIcon}/>
					</TouchableOpacity>
					<PlayButton style={styles.playButton} size={42}/>
					<TouchableOpacity
						style={[styles.skipButton, styles.nextButton]}
						onPress={this.onPressNext}
						disabled={(playbackMetadata?.nextTrack == null)}>
						<FAIcon name='step-forward' size={24} style={styles.playControlIcon}/>
					</TouchableOpacity>
				</View>
			</View>
		);
	}
}


const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingTop: 20
	},

	popupContainer: {
		position: 'absolute',
		zIndex: 2,
		top: 0,
		left: 0,
		right: 0
	},
	popupRow: {
		width: '100%',
		flexDirection: 'row',
		paddingTop: 4,
		paddingBottom: 4,
		paddingLeft: 8,
		paddingRight: 14
	},
	popupText: {
		flex: 1,
		fontSize: 14
	},
	popupCloseButton: {
		//
	},
	errorContainer: {
		backgroundColor: Theme.errorColor
	},
	messageContainer: {
		backgroundColor: Theme.tertiaryBackgroundColor
	},
	issuesContainer: {
		backgroundColor: Theme.warningColor
	},

	albumCoverContainer: {
		paddingHorizontal: '5%',
		width: '100%',
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center'
	},
	albumCover: {
		width: '100%',
		height: '100%'
	},
	metaTextContainer: {
		flexDirection: 'column',
		alignItems: 'center',
		width: '100%',
		marginTop: 14
	},
	titleMarquee: {
		textAlign: 'center',
		color: Theme.textColor,
		width: '80%'
	},
	artistMarquee: {
		textAlign: 'center',
		color: Theme.secondaryTextColor,
		maxWidth: 240,
		marginTop: 2
	},


	seekContainer: {
		flexDirection: 'row',
		marginTop: 20,
	},
	songPos: {
		color: Theme.textColor,
		marginLeft: 14,
	},
	songLength: {
		color: Theme.textColor,
		marginRight: 14,
	},
	seekSlider: {
		flex: 1,
	},


	playbackControlContainer: {
		flex: 1,
		maxHeight: 120,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center'
	},
	playControlIcon: {
		textAlign: 'center',
		color: Theme.iconColor
	},
	playButton: {
		width: 80,
		height: 80,
		borderRadius: 40
	},
	skipButton: {
		//borderColor: 'red',
		//borderWidth: 1,
		width: 36,
		height: 36,
		borderRadius: 15,
		justifyContent: 'center',
		alignItems: 'center',
	},
	prevButton: {
		marginRight: 18,
	},
	nextButton: {
		marginLeft: 18,
	},
	shuffleButton: {
		//borderColor: 'green',
		//borderWidth: 1,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 10,
		width: 44,
		height: 44
	},
	repeatButton: {
		//borderColor: 'green',
		//borderWidth: 1,
		justifyContent: 'center',
		alignItems: 'center',
		marginLeft: 10,
		width: 44,
		height: 44
	},
});
