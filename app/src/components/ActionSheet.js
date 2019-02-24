// @flow

import React, { PureComponent } from 'react';
import {
	Alert,
	Animated,
	Image,
	Modal,
	ScrollView,
	Slider,
	StyleSheet,
	TouchableOpacity,
	View
} from 'react-native';

import Theme from '../Theme';
import {
	Text
} from './theme';


export type ActionSheetOption = {
	text: string,
	onSelect?: ?() => void
}

type Props = {
	visible?: boolean,
	onRequestClose: () => void,
	options?: Array<ActionSheetOption>
}

type State = {
	//
}


export default class ActionSheet extends PureComponent<Props,State> {
	constructor(props: Props) {
		super(props);
	}

	onPressOption(option: ActionSheetOption, index: number) {
		if(option.onSelect) {
			option.onSelect();
		}
		if(this.props.onRequestClose) {
			this.props.onRequestClose();
		}
	}

	onCancel() {
		if(this.props.onRequestClose) {
			this.props.onRequestClose();
		}
	}
	onCancel = this.onCancel.bind(this);

	render() {
		const options = this.props.options || [];
		return (
			<Modal
				style={styles.container}
				visible={this.props.visible}
				animationType={'slide'}
				onRequestClose={this.props.onRequestClose}
				transparent={true}>
				<ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContentContainer}>
					<View style={styles.optionsContainer}>
						{options.map((option, index) => (
							<View style={styles.option} key={'option-'+index}>
								<TouchableOpacity style={styles.optionButton} onPress={() => {this.onPressOption(option, index)}}>
									<Text style={styles.optionText}>{option.text}</Text>
								</TouchableOpacity>
							</View>
						))}
						<View style={[styles.option, styles.cancelOption]} key={'option-cancel'}>
							<TouchableOpacity style={styles.optionButton} onPress={this.onCancel}>
								<Text style={styles.optionText}>Cancel</Text>
							</TouchableOpacity>
						</View>
					</View>
				</ScrollView>
			</Modal>
		);
	}
}


const styles = StyleSheet.create({
	container: {
		//
	},
	scrollContainer: {
		backgroundColor: Theme.popupBackgroundColor,
		width: '100%',
		flex: 1
	},
	scrollContentContainer: {
		justifyContent: 'flex-end',
		flexGrow: 1
	},
	optionsContainer: {
		flexDirection: 'column',
		width: '100%',
		paddingHorizontal: 20
	},
	option: {
		width: '100%',
		height: 64,
		borderRadius: 8,
		marginVertical: 6,
		backgroundColor: Theme.tertiaryBackgroundColor
	},
	cancelOption: {
		backgroundColor: Theme.cancelColor
	},
	optionButton: {
		width: '100%',
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'transparent'
	},
	optionText: {
		fontSize: 18
	}
})
