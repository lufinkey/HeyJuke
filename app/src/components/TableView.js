// @flow

import React, { PureComponent } from 'react';
import {
	Alert,
	Image,
	SectionList,
	StyleSheet,
	TouchableHighlight,
	View
} from 'react-native';
import type { SectionBase } from 'react-native/Libraries/Lists/SectionList';

import Theme from '../Theme';
import {
	Text
} from '../components/theme';


export type Item = {
	key?: string,
	icon?: any,
	title?: string,
	onPress?: () => void,
	render?: () => any,
	renderAccessory?: () => any
}

export type Section = SectionBase<Item> & {
	key?: string,
	title?: string
}


type Props = {
	sections: Array<Section>,
	keyExtractor?: (item: Item, index: number) => string,
	renderItem?: (info: {
		item: Item,
		index: number,
		section: Section }) => any,
	renderSectionHeader?: (info: { section: Section}) => any,
	renderSectionFooter?: (info: { section: Section}) => any,
	style?: ?Object | ?Array<Object>,
	extraData?: Object
}

type State = {
	propStyle?: ?Object | ?Array<Object>,
	style: Array<Object>
}


export default class TableView extends PureComponent<Props,State> {
	constructor(props: Props) {
		super(props);

		this.state = {
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

	renderSectionHeader = ({ section }: {section: Section}) => {
		if(this.props.renderSectionHeader) {
			return this.props.renderSectionHeader({ section });
		}
		if(section.title == null) {
			return null;
		}
		return (
			<View style={styles.sectionHeader}>
				<Text style={styles.sectionTitle}>{section.title}</Text>
			</View>
		);
	};

	renderItem = ({ item, index, section }: {item: Item, index: number, section: Section}) => {
		if(item.render) {
			return item.render();
		}
		else if(this.props.renderItem) {
			return this.props.renderItem({ item, index, section });
		}
		let ItemView: any = View;
		if(item.onPress) {
			ItemView = TouchableHighlight;
		}
		return (
			<ItemView
				onPress={item.onPress}
				style={styles.rowButton}>
				<View style={styles.rowContent}>
					<View style={styles.rowLeft}>
						{(item.icon) ? (
							<Image source={item.icon} style={styles.icon} resizeMode={'contain'}/>
						) : null}
						<Text>{item.title || ""}</Text>
					</View>
					{(item.renderAccessory) ? (
						item.renderAccessory()
					) : null}
				</View>
			</ItemView>
		);
	};

	render() {
		return (
			<SectionList
				{...this.props}
				style={this.state.style}
				renderItem={this.renderItem}
				renderSectionHeader={this.renderSectionHeader}
				renderSectionFooter={this.props.renderSectionFooter}/>
		);
	}
}


const styles = StyleSheet.create({
	container: {
		//
	},
	rowButton: {
		height: 44,
		borderBottomWidth: 1,
		borderBottomColor: 'black',
		backgroundColor: Theme.secondaryBackgroundColor
	},
	rowLeft: {
		height: '100%',
		flexDirection: 'row',
		alignItems: 'center'
	},
	rowContent: {
		width: '100%',
		height: '100%',
		paddingLeft: 20,
		paddingRight: 20,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center'
	},
	icon: {
		width: 32,
		height: 32,
		marginRight: 10
	},
	sectionHeader: {
		backgroundColor: Theme.backgroundColor,
		paddingLeft: 10,
		paddingRight: 10,
		paddingTop: 4,
		paddingBottom: 4
	},
	sectionTitle: {
		fontWeight: 'bold'
	}
});
