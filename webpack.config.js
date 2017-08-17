const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = env => {
	const config = {
		devtool: (env === 'prod') ? false : '#eval-source-map',
		entry: {
			app: path.join(__dirname, 'assets', 'js', 'index.js'),
			vendor: ['react', 'react-router', 'moment']
		},
		output: {
			path: path.join(__dirname, 'public'),
			filename: '[name].[hash].js'
		},
		plugins: [
			new HtmlWebpackPlugin({
				title: 'Appontment Reminder',
				template: path.join(__dirname, 'assets', 'index.html')
			}),
			new webpack.optimize.CommonsChunkPlugin({
				name: 'vendor',
				filename: 'vendor-[hash].js'
			})
		],
		resolve: {
			alias: {
				'@pages': path.join(__dirname, 'assets', 'js', 'pages'),
				'@components': path.join(__dirname, 'assets', 'js', 'components')
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
				{test: /\.css$/, loader: 'style!css'}
			],
			rules: [ {
				test: /\.js$/,
				loader: 'babel-loader',
				exclude: [/node_modules/, /lib/]
			}]
		}
	};
	if (env === 'prod') {
		config.plugins.push(new webpack.DefinePlugin({
			'process.env': {
				NODE_ENV: '"production"'
			}
		}));
		config.plugins.push(new webpack.optimize.UglifyJsPlugin());
		config.plugins.push(new webpack.LoaderOptionsPlugin({
			minimize: true
		}));
	} else {
		config.plugins.push(new webpack.HotModuleReplacementPlugin());
	}
	return config;
};
