// @flow

import React, { PureComponent } from 'react';
import {
	ActivityIndicator,
	Alert,
	Dimensions,
	Image,
	ScrollView,
	StyleSheet,
	TouchableOpacity,
	View
} from 'react-native';

import Theme from '../../Theme'
import {
	Text
} from '../../components/theme';

import LoadableList from '../../components/LoadableList';
import LoadableView from '../../components/LoadableView';
import MediaItemRow from '../../components/MediaItemRow';
import type { MediaItemMenuOptionKey } from '../../components/MediaItemRow';
import {
	Track,
	TrackCollection,
	TrackCollectionItem
} from '../../library/types';
import type {
	AsyncTrackGenerator,
	MediaProvider
} from '../../library/types';


type Props = {
	navigation: Object,
	fetchCollection: () => Promise<TrackCollection>
}

type State = {
	collection: ?TrackCollection,
	collectionPromise: ?Promise<void>,
	itemGenerator: ?AsyncTrackGenerator,
	hiddenItemMenuOptions: Array<MediaItemMenuOptionKey>,
	imageURL: ?string
}


export default class TrackCollectionScreen extends PureComponent<Props,State> {
	mounted: boolean = false;

	constructor(props: Props) {
		super(props);
		
		this.state = {
			collection: null,
			collectionPromise: null,
			itemGenerator: null,
			hiddenItemMenuOptions: [],
			imageURL: null
		};
	}

	get collection() {
		return this.state.collection;
	}

	componentDidMount() {
		this.mounted = true;
		this.setState({
			collectionPromise: this.loadCollection()
		});
	}

	componentWillUnmount() {
		this.mounted = false;
	}

	async loadCollection() {
		const collection = await this.props.fetchCollection();
		if(!this.mounted) {
			return;
		}
		const image = collection.getImage({size:{y:800}});
		const hiddenItemMenuOptions = [];
		if(collection?.type === 'album') {
			hiddenItemMenuOptions.push('view-album');
		}
		this.setState({
			collection,
			itemGenerator: collection.createItemGenerator(),
			hiddenItemMenuOptions: hiddenItemMenuOptions,
			imageURL: image?.url
		});
	}

	extractItemKey = (item: Track, index: number): string => {
		return "track-"+index;
	}

	getItemLayout = (data: any, index: number) => {
		return {
			length: MediaItemRow.HEIGHT,
			offset: (MediaItemRow.HEIGHT * index),
			index: index
		};
	}

	renderCollectionHeader = () => {
		const imageURL = this.state.imageURL;
		return (
			<View style={styles.collectionHeader}>
				{(imageURL) ? (
					<Image
						style={styles.collectionImage}
						resizeMode={'cover'}
						source={{uri: imageURL}}/>
				) : null}
				<Text style={styles.collectionName}>{this.state.collection?.name || ""}</Text>
			</View>
		);
	}

	renderCollectionItem = ({ item, index }: { item: TrackCollectionItem, index: number }) => {
		return (
			<MediaItemRow
				item={item}
				navigation={this.props.navigation}
				hideThumbnail={true}
				hideType={true}
				hideMenuOptions={this.state.hiddenItemMenuOptions}/>
		);
	}

	renderCollectionFooter = () => {
		return null;
	}

	renderCollection = (collection: TrackCollection) => {
		return (
			<LoadableList
				style={styles.collection}
				generator={this.state.itemGenerator}
				keyExtractor={this.extractItemKey}
				renderItem={this.renderCollectionItem}
				renderHeader={this.renderCollectionHeader}
				renderFooter={this.renderCollectionFooter}
				getItemLayout={this.getItemLayout}/>
		);
	}

	render() {
		return (
			<LoadableView
				style={styles.container}
				promise={this.state.collectionPromise}
				renderContent={this.renderCollection}/>
		);
	}
}


const styles = StyleSheet.create({
	container: {
		width: '100%',
		flex: 1
	},

	collection: {
		width: '100%',
		flex: 1
	},

	collectionHeader: {
		width: '100%',
		alignItems: 'center'
	},

	collectionImage: {
		width: 180,
		height: 180,
		marginTop: 12
	},
	collectionName: {
		fontSize: 24,
		fontWeight: 'bold',
		marginTop: 10,
		marginBottom: 10,
		textAlign: 'center'
	}
});
