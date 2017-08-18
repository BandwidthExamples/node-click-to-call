const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = env => {
	const config = {
		devtool: (env === 'prod') ? false : '#eval-source-map',
		entry: {
			app: path.join(__dirname, 'assets', 'index.js'),
			vendor: [
				'react',
				'redux',
				'react-dom',
				'react-redux',
				'react-router',
				'react-router-redux',
				'redux-thunk',
				'history',
				'object-assign',
				'moment',
				'prop-types',
				'whatwg-fetch',
				'promise',
				'redbox-react',
				'@bandwidth/shared-components'
			]
		},
		output: {
			path: path.join(__dirname, 'public'),
			filename: '[name].[hash].js'
		},
		plugins: [
			new HtmlWebpackPlugin({
				title: 'Click to call',
				template: path.join(__dirname, 'assets', 'index.html')
			}),
			new webpack.optimize.CommonsChunkPlugin({
				name: 'vendor',
				filename: 'vendor-[hash].js'
			})
		],
		resolve: {
			alias: {
				'@components': path.join(__dirname, 'assets', 'components')
			}
		},
		devServer: {
			contentBase: path.join(__dirname, 'public'),
			hot: true,
			proxy: {
				'/': 'http://localhost:5000'
			},
			historyApiFallback: true,
			noInfo: true,
			port: 9000
		},
		performance: {
			hints: false
		},
		module: {
			loaders: [
				{test: /\.css$/, loader: 'style!css'},
				{test: /\.(jpe?g|gif|png|svg|woff|ttf|wav|mp3)$/, loader: 'file-loader'}
			],
			rules: [{
				test: /\.jsx?$/,
				loader: 'babel-loader',
				exclude: [/node_modules/, /lib/]
			}]
		}
	};
	config.plugins.push(new webpack.DefinePlugin({
		ENV: JSON.stringify((env === 'prod') ? 'production' : (process.env.NODE_ENV || 'development'))
	}));
	if (env === 'prod') {
		config.plugins.push(new webpack.optimize.UglifyJsPlugin());
		config.plugins.push(new webpack.LoaderOptionsPlugin({
			minimize: true
		}));
	} else {
		config.plugins.push(new webpack.HotModuleReplacementPlugin());
	}
	return config;
};
