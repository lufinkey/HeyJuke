// @flow

import React, { PureComponent } from 'react';
import {
	ActivityIndicator,
	Alert,
	StyleSheet,
	TouchableOpacity,
	View
} from 'react-native';

import Theme from '../Theme';
import {
	Text
} from '../components/theme';


type Props = {
	style?: Object | Array<Object>,
	tabBarStyle?: Object,
	tabs: Array<Object>
};

type State = {
	tabIndex: number
};


export default class TabSwitcher extends PureComponent<Props, State> {
	constructor(props: Props) {
		super(props);

		this.state = {
			tabIndex: 0
		};
	}

	onPressTab = ({ index }: Object) => {
		this.setTabIndex(index);
	}

	setTabIndex(index: number) {
		this.setState({
			tabIndex: index
		});
	}

	render() {
		const tabs = this.props.tabs || [];
		return (
			<View style={this.props.style}>
				<View style={[styles.tabBar, (this.props.tabBarStyle || {})]}>
					{ tabs.map((tab, index) => {
						const selected = (index === this.state.tabIndex);
						const TabComponent = tab.tabComponent;
						return (
							(TabComponent) ? (
								<TabComponent key={'tab-'+index} selected={selected} onPress={() => {this.onPressTab({ index })}}/>
							) : (tab.label) ? (
								<View key={'tab-'+index} style={[styles.tab, (selected ? styles.tabActive : styles.tabInactive)]}>
									<TouchableOpacity style={styles.tabButton} onPress={() => {this.onPressTab({ index })}}>
										<Text style={[styles.tabLabel, (selected ? styles.tabLabelActive : styles.tabLabelInactive)]}>{tab.label}</Text>
									</TouchableOpacity>
								</View>
							) : null
						);
					}) }
				</View>
				<View style={styles.contentContainer}>
					{ tabs.map((tab, index) => {
						const selected = (index === this.state.tabIndex);
						const ContentComponent = tab.component;
						return (
							<View 
								key={'content-'+index}
								pointerEvents={selected ? undefined : 'none'}
								style={[
									styles.content,
									selected ? {} : {
										opacity: 0,
										zIndex: -99999
									}
								]}>
								<ContentComponent/>
							</View>
						);
					}) }
				</View>
			</View>
		)
	}
}


export const createTabSwitcher = (options: Props) => {
	return (props: Props) => (
		<TabSwitcher {...options} {...props}/>
	);
}


const styles = StyleSheet.create({
	tabBar: {
		flexDirection: 'row',
		width: '100%',
		height: 36
	},
	tab: {
		backgroundColor: Theme.backgroundColor,
		flex: 1
	},
	tabActive: {
		//
	},
	tabInactive: {
		backgroundColor: Theme.tertiaryBackgroundColor
	},
	tabButton: {
		paddingLeft: 8,
		paddingRight: 8,
		width: '100%',
		height: '100%',
		flexDirection: 'row',
		alignItems: 'center'
	},
	tabLabel: {
		//
	},
	tabLabelActive: {
		//
	},
	tabLabelInactive: {
		color: Theme.inactiveTabColor
	},
	contentContainer: {
		flex: 1,
		width: '100%'
	},
	content: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0
	}
});
