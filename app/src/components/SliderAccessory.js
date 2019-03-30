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

import Theme from '../Theme';
import {
	Text
} from './theme';


type Props = {
	set: (value: number) => void,
	get: () => number,
	minValue: number,
	maxValue: number,
	step: number,
	labelWidth?: number,
	createLabelString?: ((value: number) => string),
	style?: ?Object | ?Array<Object>
}

type State = {
	value: number,
	propStyle?: ?Object | ?Array<Object>,
	style: Array<Object>
}


export default class SliderAccessory extends PureComponent<Props,State> {
	constructor(props: Props) {
		super(props);

		this.state = {
			value: props.get(),
			propStyle: props.style,
			style: [styles.container].concat(props.style || [])
		};
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
		return (
			<View style={this.state.style}>
				<Slider
					style={styles.slider}
					minimumValue={this.props.minValue}
					maximumValue={this.props.maxValue}
					step={this.props.step}
					value={this.props.get()}
					onValueChange={(value: number) => {
						this.setState({
							value
						});
					}}
					onSlidingComplete={(value: number) => {
						this.props.set(value);
						this.setState({
							value
						});
					}}/>
				<Text style={[styles.text, {width: this.props.labelWidth}]}>{
					this.props.createLabelString ? this.props.createLabelString(this.state.value) : (""+this.state.value)
				}</Text>
			</View>
		);
	}
}


const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center'
	},
	slider: {
		flex: 1,
	},
	text: {
		minWidth: 14,
		paddingLeft: 4,
		textAlign: 'right'
	}
});
