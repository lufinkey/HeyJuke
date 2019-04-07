// @flow

import React, { PureComponent } from 'react';
import {
	Alert,
	Image,
	StyleSheet,
	TouchableOpacity,
	View
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import Theme from '../Theme';
import {
	Text
} from './theme';

import {
	MediaItem,
	Track,
	Album,
	TrackCollectionItem
} from '../library/types';
import QueueItem from '../playback/QueueItem';

import ActionSheet from './ActionSheet';
import type { ActionSheetOption } from './ActionSheet';
import { capitalizeString } from '../util/misc';
import HeyJukeClient from '../playback/HeyJukeClient';


export type MediaItemMenuOptionKey =
	'add-to-queue' |
	'remove-from-queue' |
	'view-album' |
	'view-artist';


type ItemType = MediaItem | TrackCollectionItem | QueueItem;

type MediaItemRowActions = {
	viewAlbum: () => Promise<void>,
	viewArtist: () => Promise<void>
}


type Props = {
	item: ItemType,
	navigation?: any,
	hideThumbnail?: boolean,
	hideType?: boolean,
	hideArtists?: boolean,
	hideMenuOptions?: Array<MediaItemMenuOptionKey>,
	menuOptions?: Array<ActionSheetOption>
}

type State = {
	item: ItemType,
	thumbnailURL: ?string,
	showMore: boolean,
	actions: MediaItemRowActions,
	menuOptions?: Array<ActionSheetOption>
}


export default class MediaItemRow extends PureComponent<Props,State> {
	static HEIGHT = 48;

	constructor(props: Props) {
		super(props);

		const actions: MediaItemRowActions = {
			viewAlbum: () => (this.viewAlbum()),
			viewArtist: () => (this.viewArtist())
		};

		this.state = {
			showMore: false,
			item: props.item,
			thumbnailURL: MediaItemRow.getThumbnailURL(props.item),
			menuOptions: MediaItemRow.getMenuOptions(actions, props),
			actions: actions
		};
	}

	static getDerivedStateFromProps(props: Props, state: State): State {
		if(props.item !== state.item) {
			return {
				...state,
				item: props.item,
				thumbnailURL: MediaItemRow.getThumbnailURL(props.item),
				menuOptions: MediaItemRow.getMenuOptions(state.actions, props)
			};
		}
		return state;
	}

	static getThumbnailURL(item: ItemType): ?string {
		const mediaItem = this.getMediaItem(item);
		const thumbnail = mediaItem.getImage({size:{y:48}});
		return thumbnail?.url;
	}

	static getMediaItem(item: ItemType): MediaItem {
		if(item instanceof QueueItem || item instanceof TrackCollectionItem) {
			return item.track;
		}
		return item;
	}

	static getMenuOptions(rowActions: MediaItemRowActions, props: Props): Array<ActionSheetOption> {
		if(props.menuOptions) {
			return props.menuOptions;
		}
		const menuOptions = [];
		const item = props.item;
		const mediaItem = MediaItemRow.getMediaItem(item);
		if(mediaItem instanceof Track) {
			menuOptions.push({
				key: 'add-to-queue',
				text: "Add to Queue",
				onSelect: () => {
					HeyJukeClient.addTrackToQueue(mediaItem).catch((error) => {

					});
				}
			});
		}
		if(item instanceof QueueItem) {
			menuOptions.push({
				'key': 'remove-from-queue',
				'text': "Remove from Queue",
				onSelect: () => {
					// TODO remove from queue
				}
			});
		}
		if(mediaItem instanceof Track) {
			menuOptions.push({
				key: 'view-album',
				text: "View Album",
				onSelect: () => {
					rowActions.viewAlbum().catch((error) => {
						Alert.alert("Error", error.message);
					});
				}
			});
		}
		if((mediaItem: any).artists) {
			menuOptions.push({
				key: 'view-artist',
				text: "View Artist",
				onSelect: () => {
					rowActions.viewArtist().catch((error) => {
						Alert.alert("Error", error.message);
					});
				}
			});
		}
		if(props.hideMenuOptions) {
			const hideMenuOptions = props.hideMenuOptions;
			for(const menuKey of hideMenuOptions) {
				for(let i=0; i<menuOptions.length; i++) {
					const menuOption = menuOptions[i];
					if(menuOption.key === menuKey) {
						menuOptions.splice(i, 1);
						break;
					}
				}
				if(menuOptions.length === 0) {
					return menuOptions;
				}
			}
		}
		return menuOptions;
	}

	get mediaItem(): MediaItem {
		return MediaItemRow.getMediaItem(this.state.item);
	}

	async viewAlbum() {
		const mediaItem = this.mediaItem;
		if(!(mediaItem instanceof Track)) {
			throw new Error("item is not a track or album");
		}
		if(!mediaItem.album || !mediaItem.album.uri) {
			await mediaItem.fetchItemData();
		}
		if(!mediaItem.album) {
			throw new Error("item has no album");
		}
		if(this.props.navigation) {
			this.props.navigation.push('Album', {
				uri: mediaItem.album.uri,
				provider: mediaItem.provider
			});
		}
	}

	async viewArtist() {
		const mediaItem = this.mediaItem;
		if(!(mediaItem instanceof Track) && !(mediaItem instanceof Album)) {
			throw new Error("item is not a track or album");
		}
		if(!mediaItem.artist || !mediaItem.artist.uri) {
			await mediaItem.fetchItemData();
		}
		if(!mediaItem.artist) {
			throw new Error("item has no artist");
		}
		if(this.props.navigation) {
			this.props.navigation.push('Artist', {
				uri: mediaItem.artist.uri,
				provider: mediaItem.provider
			});
		}
	}

	onPress() {
		const item = this.props.item;
		if(item instanceof Track || item instanceof TrackCollectionItem || item instanceof QueueItem) {
			// TODO main press action
		}
		else if(item.type === 'album') {
			if(this.props.navigation) {
				this.props.navigation.push('Album', {
					uri: item.uri,
					provider: item.provider
				});
			}
		}
		else if(item.type === 'artist' || item.type === 'label') {
			if(this.props.navigation) {
				this.props.navigation.push('Artist', {
					uri: item.uri,
					provider: item.provider
				});
			}
		}
		else if(item.type === 'playlist') {
			if(this.props.navigation) {
				this.props.navigation.push('Playlist', {
					uri: item.uri,
					provider: item.provider
				});
			}
		}
	}
	onPress = this.onPress.bind(this);

	onPressMore() {
		this.setState({
			showMore: true
		});
	}
	onPressMore = this.onPressMore.bind(this);

	onRequestCloseMoreMenu() {
		this.setState({
			showMore: false
		});
	}
	onRequestCloseMoreMenu = this.onRequestCloseMoreMenu.bind(this);

	render() {
		const mediaItem = this.mediaItem;

		let disabled = false;
		if(mediaItem instanceof Track) {
			disabled = !mediaItem.isPlayable();
		}

		let customStyles = {
			icon: {},
			detailContainer: {}
		};

		if(!this.state.thumbnailURL) {
			customStyles.icon.backgroundColor = 'gray';
		}
		if(mediaItem.type === 'artist') {
			customStyles.icon.borderRadius = 24;
		}
		if(disabled) {
			customStyles.detailContainer.opacity = 0.4;
		}

		// build subtitle items
		let subtitleItems = [];
		if(!this.props.hideType) {
			subtitleItems.push((
				<Text key={'subtitle-itemType'} style={[styles.detailText, styles.itemType]}>{capitalizeString(mediaItem.type)}</Text>
			));
		}
		if(!this.props.hideArtists && (mediaItem: any).artists) {
			subtitleItems.push((
				<Text key={'subtitle-artists'} style={[styles.detailText, styles.artistsContainer]}>
					{(mediaItem: any).artists.map((artist, index) => {
						let artistText = artist.name;
						if(index < ((mediaItem: any).artists.length - 1)) {
							artistText += ", ";
						}
						return artistText;
					}).join("")}
				</Text>
			));
		}

		// add dots between subtitle items
		let subtitleIndex = 0;
		while(subtitleIndex < subtitleItems.length) {
			const dotIndex = subtitleIndex + 1;
			if(dotIndex < subtitleItems.length) {
				subtitleItems.splice(dotIndex, 0, (
					<Text key={'subtitle-dot-'+(subtitleIndex+1)} style={[styles.detailText, styles.dot]}>{" \u2022 "}</Text>
				));
			}
			subtitleIndex = dotIndex + 1;
		}

		// render
		return (
			<View style={styles.container}>
				<TouchableOpacity style={styles.button} onPress={this.onPress} disabled={disabled}>
					{(!this.props.hideThumbnail) ? (
						<Image
							style={[
								styles.icon,
								customStyles.icon
							]}
							resizeMode={'cover'}
							source={{uri: this.state.thumbnailURL}}/>
					) : null}
					<View style={[styles.detailContainer, customStyles.detailContainer]}>
						<View style={styles.detailRow}>
							<Text style={styles.titleText} numberOfLines={1}>{mediaItem.name}</Text>
							{ (mediaItem.explicit) ? (
								<View style={styles.explicit}>
									<Text style={styles.explicitText}>EXPLICIT</Text>
								</View>
							) : null }
						</View>
						<View style={styles.detailRow}>
							<Text numberOfLines={1} style={styles.detailText}>
								{subtitleItems}
							</Text>
						</View>
					</View>
				</TouchableOpacity>
				<TouchableOpacity style={styles.menuButton} onPress={this.onPressMore}>
					<Icon name={'md-more'} size={32} style={styles.moreIcon}/>
				</TouchableOpacity>
				{this.state.showMore ? (
					<ActionSheet
						visible={this.state.showMore}
						options={this.state.menuOptions}
						onRequestClose={this.onRequestCloseMoreMenu}/>
				) : null}
			</View>
		);
	}
}


const styles = StyleSheet.create({
	container: {
		height: MediaItemRow.HEIGHT,
		width: '100%',
		flexDirection: 'row'
	},
	button: {
		flex: 1,
		flexDirection: 'row',
		marginVertical: 6,
		paddingLeft: 12
	},
	icon: {
		aspectRatio: 1,
		height: '100%'
	},
	detailContainer: {
		flex: 1,
		height: '100%',
		flexDirection: 'column',
		overflow: 'hidden',
		marginLeft: 12
	},
	detailRow: {
		flexDirection: 'row',
		width: '100%',
		alignItems: 'center',
		flex: 1,
		fontSize: 13
	},
	titleText: {
		flexShrink: 1,
		fontSize: 14
	},
	explicit: {
		flexShrink: 0,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: Theme.secondaryTextColor,
		paddingHorizontal: 4,
		height: 16,
		borderRadius: 4,
		marginHorizontal: 6
	},
	explicitText: {
		color: Theme.backgroundColor,
		fontSize: 12,
		textAlign: 'center'
	},
	detailText: {
		color: Theme.secondaryTextColor
	},
	dot: {
		//
	},
	itemType: {
		//
	},
	artistsContainer: {
		//
	},
	menuButton: {
		width: 48,
		height: '100%',
		justifyContent: 'center',
		alignItems: 'center'
	},
	moreIcon: {
		color: Theme.textColor
	}
});
