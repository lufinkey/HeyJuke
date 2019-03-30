// @flow

import React, { PureComponent } from 'react';
import {
	Animated,
	StyleSheet,
	TouchableOpacity,
	View
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import Theme from '../../Theme';
import {
	Text
} from '../theme';

import PlayerBar from './PlayerBar';
import type {
	PlaybackState,
	PlaybackMetadata
} from '../../library/types';


type Props = {
	onPress?: () => void,
	onPressQueue?: () => void,
	playbackState?: ?PlaybackState,
	playbackMetadata?: ?PlaybackMetadata,
	pointerEvents?: string,
	style?: ?Object | ?Array<Object>
}

type State = {
	propStyle?: ?Object | ?Array<Object>,
	style: Array<Object>
}


export default class PlayerHeader extends PureComponent<Props,State> {
	constructor(props: Props) {
		super(props);

		this.state = {
			propStyle: props.style,
			style: [styles.container].concat(props.style || [])
		}
	}

	static getDerivedStateFromProps(props: Props, state: State): State {
		if(props.style !== state.propStyle) {
			return {
				...state,
				propStyle: props.style,
				style: [styles.container].concat(props.style || [])
			};
		}
		return state;
	}

	render() {
		const metadata = this.props.playbackMetadata;
		return (
			<Animated.View style={this.state.style} pointerEvents={this.props.pointerEvents}>
				<View style={styles.headerLeft}>
				</View>
				<TouchableOpacity style={styles.closeButton} onPress={this.props.onPress}>
					{ (metadata && metadata.currentTrack) ? (
						<View style={styles.headerCenter}>
							<View style={styles.headerRow}>
								<Text>Playing from {(metadata.currentTrack.isSingle()) ? 'Single' : 'Album'}</Text>
							</View>
							<View style={styles.headerRow}>
								<Text style={styles.albumName}>{metadata.currentTrack.album?.name || metadata.currentTrack.name}</Text>
							</View>
						</View>
					) : (
						<View style={styles.headerCenter}>
							<Text>Close</Text>
						</View>
					)}
				</TouchableOpacity>
				<View style={styles.headerRight}>
					<TouchableOpacity style={styles.queueButton} onPress={this.props.onPressQueue}>
						<Icon name={"playlist-play"} color={Theme.textColor} size={26} style={styles.queueIcon}/>
					</TouchableOpacity>
				</View>
			</Animated.View>
		);
	}
}


const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		justifyContent: 'center',
		width: '100%',
		height: PlayerBar.DEFAULT_HEIGHT
	},
	closeButton: {
		flex: 1
	},
	
	headerLeft: {
		height: '100%',
		width: 50
	},
	headerRight: {
		height: '100%',
		width: 50
	},
	headerCenter: {
		flexDirection: 'column',
		width: '100%',
		flex: 1
	},
	headerRow: {
		flexDirection: 'row',
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center'
	},

	albumName: {
		fontWeight: 'bold',
		fontSize: 16
	},

	queueButton: {
		width: '100%',
		height: '100%',
		justifyContent: 'center',
		alignItems: 'center'
	},
	queueIcon: {
		//
	}
});
