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

import AlbumButton from '../../components/AlbumButton';
import LoadableView from '../../components/LoadableView';
import MediaItemRow from '../../components/MediaItemRow';
import {
	Artist,
	Album
} from '../../providers/types';


type Props = {
	navigation: Object
}

type State = {
	artistPromise: ?Promise<void>,
	artist: ?Artist
}


export default class ArtistScreen extends PureComponent<Props,State> {
	static navigationOptions = {
		//
	};

	mounted: boolean = false;

	constructor(props: Props) {
		super(props);

		this.state = {
			artistPromise: null,
			artist: null
		};
	}

	get artistURI() {
		return this.props.navigation.getParam('uri');
	}

	get provider() {
		return this.props.navigation.getParam('provider');
	}

	get artist() {
		return this.state.artist;
	}

	componentDidMount() {
		this.mounted = true;
		this.setState({
			artistPromise: this.loadArtist()
		});
	}

	componentWillUnmount() {
		this.mounted = false;
	}

	async loadArtist() {
		const artistURI = this.artistURI;
		const provider = this.provider;
		const artist = await provider.getArtist(artistURI);
		if(provider.getArtistAlbums && !artist.albums) {
			let albums = [];
			const albumGenerator = provider.getArtistAlbums(artistURI);
			let hasMore = true;
			do {
				const { value: {result, error}, done } = await albumGenerator.next();
				hasMore = !done;
				if(error) {
					throw error;
				}
				if(result) {
					albums.push(...result);
				}
			}
			while(hasMore);
			artist.albums = albums;
		}

		this.setState({
			artist
		});
	}

	renderContent = () => {
		// artist
		const artist = this.state.artist;
		const image = artist ? artist.getImage({size:{y:180}}) : null;
		const albums: Array<?Album> = ((artist?.albums || []).slice(0): Array<any>);
		const windowSize = Dimensions.get('window');
		const albumWidth = styles.album.width + (2 * styles.album.marginHorizontal);
		const albumCols = Math.floor(windowSize.width / albumWidth);
		const albumsRemaining = albums.length % albumCols;
		const maxAlbumCount = albumCols * 2;
		for(let i=0; i<albumsRemaining; i++) {
			albums.push(null);
		}
		return (
			<ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
				<Image
					style={styles.artistImage}
					resizeMode={'cover'}
					source={{uri: (image?.url || undefined)}}/>
				<Text style={styles.artistName}>{artist?.name || ""}</Text>
				<View style={styles.albumsContainer}>
					{(albums || [])/*.slice(0,maxAlbumCount)*/.map((album, index) => {
						if(!album) {
							return (
								<View key={'album-filler-'+index} style={styles.album}/>
							);
						}
						return (
							<AlbumButton
								key={'album-'+index}
								album={album}
								navigation={this.props.navigation}
								style={styles.album}/>
						);
					})}
				</View>
			</ScrollView>
		);
	}

	render() {
		return (
			<LoadableView
				style={styles.loader}
				promise={this.state.artistPromise}
				renderContent={this.renderContent}/>
		);
	}
}


const styles = StyleSheet.create({
	loader: {
		width: '100%',
		flex: 1
	},

	container: {
		width: '100%',
		flex: 1
	},

	scrollContent: {
		width: '100%',
		alignItems: 'center'
	},

	// artist
	artistImage: {
		width: 180,
		height: 180,
		marginTop: 12,
		marginBottom: 10,
		borderRadius: 90
	},
	artistName: {
		fontSize: 24,
		fontWeight: 'bold'
	},

	// albums
	albumsContainer: {
		flexDirection: 'row',
		justifyContent: 'space-evenly',
		flexWrap: 'wrap',
		marginVertical: 12,
		marginHorizontal: 2
	},
	album: {
		width: 148,
		marginVertical: 8,
		marginHorizontal: 2
	}
});
