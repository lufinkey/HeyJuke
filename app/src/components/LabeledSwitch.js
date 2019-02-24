// @flow

import React, { PureComponent } from 'react';
import {
	Alert,
	Animated,
	Image,
	ScrollView,
	StyleSheet,
	Switch,
	TouchableOpacity,
	View
} from 'react-native';

import Theme from '../Theme';
import {
	Text
} from '../components/theme';


type Props = {
	initialValue: boolean,
	onValueChange?: (value: boolean) => void,
	label?: string,
	style?: ?Object | ?Array<Object>
}

type State = {
	value: boolean,
	propStyle?: ?Object | ?Array<Object>,
	style: Array<Object>
}


export default class LabeledSwitch extends PureComponent<Props,State> {
	constructor(props: Props) {
		super(props);

		this.state = {
			value: props.initialValue,
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

	onValueChange = (value: boolean) => {
		this.setState({
			value
		});
		if(this.props.onValueChange) {
			this.props.onValueChange(value);
		}
	}

	render() {
		return (
			<View style={this.state.style}>
				{(this.props.label != null) ? (
					<Text style={styles.label}>{this.props.label}</Text>
				) : null}
				<Switch value={this.state.value} onValueChange={this.onValueChange}/>
			</View>
		);
	}
}


const styles = StyleSheet.create({
	container: {
		flexDirection: 'column',
		alignItems: 'center'
	},

	label: {
		fontSize: 8,
		paddingBottom: 1
	},

	switch: {
		//
	}
})
