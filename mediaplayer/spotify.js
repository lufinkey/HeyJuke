window.onSpotifyWebPlaybackSDKReady = () => {
    const token = 'BQDe59jfoT2whKmy2o1W837c0uI9Yb2tTa6jzxAOyyppjY0GGPrXrabeZZUPh5H2m-ajgo3mt-vlkhqynv9zTZm-3wdzZZs5W2ThcoA4inPcSO-FBuCu5DwHeUkUGZzgwg9FyzgszFhs-7C16el0GMp5Jwk_TBVpaci3ic0';

    window.player = new Spotify.Player({
        name: 'Web Playback SDK Quick Start Player',
        getOAuthToken: cb => { cb(token); }
    });

    // Error handling
    window.player.addListener('initialization_error', ({ message }) => { console.error(message); });
    window.player.addListener('authentication_error', ({ message }) => { console.error(message); });
    window.player.addListener('account_error', ({ message }) => { console.error(message); });
    window.player.addListener('playback_error', ({ message }) => { console.error(message); });

    // Playback status updates
    window.player.addListener('player_state_changed', state => { console.log(state); });

    // Ready
    window.player.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
    });

    // Not Ready
    window.player.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
    });

    // Connect to the player!
    window.player.connect();
};