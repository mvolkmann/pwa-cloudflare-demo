module.exports = {
	globDirectory: 'public/',
	globPatterns: [
		'**/*.{js,png,jpg,gif,html,json,css}'
	],
	swDest: 'public/sw.js',
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	]
};