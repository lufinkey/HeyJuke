// @flow

import React, { PureComponent } from 'react';
import {
	View,
	StyleSheet,
	TouchableOpacity
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

import Theme from '../../Theme';
import {
	Text
} from '../theme';


type Props = {
	size?: number,
	style?: ?Object | ?Array<Object>
}

type State = {
	playing: boolean,
	propStyle?: ?Object | ?Array<Object>,
	style: Array<Object>,
	iconStyle: Array<Object>
}


export default class PlayButton extends PureComponent<Props,State> {
	static defaultSize = 16;

	mounted: boolean = false;

	constructor(props: Props) {
		super(props);

		const playing = false;
		const { style, iconStyle } = PlayButton.getStyles(props, playing);
		this.state = {
			playing: playing,
			propStyle: props.style,
			style: style,
			iconStyle: iconStyle
		};
	}

	static getDerivedStateFromProps(props: Props, state: State): State {
		if(props.style !== state.propStyle) {
			const playing = state.playing;
			const { style, iconStyle } = PlayButton.getStyles(props, playing);
			return {
				...state,
				propStyle: props.style,
				style: style,
				iconStyle: iconStyle
			};
		}
		return state;
	}

	static getStyles(props: Props, playing: boolean): {style:Array<Object>, iconStyle:Array<Object>} {
		const size = props.size ?? PlayButton.defaultSize;
		const paddingLeft = playing ? 0 : (size >= 36) ? 6 : (size >= 20) ? 4 : 0;
		const customStyle = {
			borderRadius: size / 2.0
		};
		return {
			style: [styles.button, customStyle].concat(props.style || []),
			iconStyle: [styles.icon, {paddingLeft:paddingLeft}]
		};
	}

	setPlaying(playing: boolean) {
		const { style, iconStyle } = PlayButton.getStyles(this.props, playing);
		this.setState({
			playing: playing,
			style: style,
			iconStyle: iconStyle
		});
	}

	onTogglePlay = () => {
		// TODO toggle play
	}

	componentDidMount() {
		this.mounted = true;
		// TODO subscribe to player state
	}

	componentWillUnmount() {
		this.mounted = false;
		// TODO unsubscribe from player state
	}

	render() {
		const size = this.props.size ?? PlayButton.defaultSize;
		return (
			<TouchableOpacity style={this.state.style} onPress={this.onTogglePlay}>
				<Icon name={this.state.playing ? "pause" : "play"} size={size} style={this.state.iconStyle}/>
			</TouchableOpacity>
		);
	}
}


const styles = StyleSheet.create({
	button: {
		borderWidth: 2,
		borderColor: Theme.iconColor,
		justifyContent: 'center',
		alignItems: 'center',
	},
	icon: {
		textAlign: 'center',
		color: Theme.iconColor
	},
})
