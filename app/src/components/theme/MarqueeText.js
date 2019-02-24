// @flow

import React, { PureComponent } from 'react';
import ReactNative, {
	StyleSheet
} from 'react-native';
import Theme from '../../Theme';
import Marquee from 'react-native-marquee';


type Props = {
	style?: ?Object | ?Array<Object>
}

type State = {
	propStyle?: ?Object | ?Array<Object>,
	style: Array<Object>
}


export default class MarqueeText extends PureComponent<Props,State> {
	constructor(props: Props) {
		super(props);

		this.state = {
			propStyle: props.style,
			style: [styles.text].concat(props.style || [])
		};
	}

	static getDerivedStateFromProps(props: Props, state: State): State {
		if(props.style !== state.propStyle) {
			return {
				...state,
				propStyle: props.style,
				style: [styles.text].concat(props.style || [])
			};
		}
		return state;
	}

	render() {
		return (
			<Marquee {...this.props} style={this.state.style}/>
		);
	}
}


const styles = StyleSheet.create({
	text: {
		color: Theme.textColor
	}
});
