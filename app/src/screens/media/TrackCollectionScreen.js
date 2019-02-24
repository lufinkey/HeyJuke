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
	Album,
	MediaProvider,
	Track,
	TrackCollection,
	TrackCollectionItem
} from '../../providers/types';
import type {
	AsyncTrackGenerator
} from '../../providers/types';


type Props = {
	navigation: Object,
	fetchCollection: (uri: string, provider: MediaProvider) => Promise<TrackCollection>
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

	get collectionURI() {
		return this.props.navigation.getParam('uri');
	}

	get provider() {
		return this.props.navigation.getParam('provider');
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
		const uri = this.collectionURI;
		const provider = this.provider;
		const collection = await this.props.fetchCollection(uri, provider);
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
		return (
			<View style={styles.collectionHeader}>
				<Image
					style={styles.collectionImage}
					resizeMode={'cover'}
					source={{uri: (this.state.imageURL || undefined)}}/>
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
		marginTop: 12,
		marginBottom: 10
	},
	collectionName: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 10,
		textAlign: 'center'
	}
});
