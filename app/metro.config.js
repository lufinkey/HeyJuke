
module.exports = {
	resolver: {
		extraNodeModules: {
			dgram: require.resolve('react-native-udp'),
			fs: require.resolve('react-native-fs'),
			http: require.resolve('stream-http'),
			https: require.resolve('https-browserify'),
			net: require.resolve('react-native-tcp'),
			os: require.resolve('react-native-os'),
			process: require.resolve('react-native-process-shim'),
			querystring: require.resolve('query-string'),
			stream: require.resolve('stream-browserify'),
			zlib: require.resolve('browserify-zlib')
		}
	}
};
