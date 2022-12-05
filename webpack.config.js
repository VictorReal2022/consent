const path = require('path');
const webpack = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    default: './src/assets/js/default.js',
    login: './src/assets/js/login.js',
    patient: './src/assets/js/patient.js',
    protocol: './src/assets/js/protocol.js',
    quiz: './src/assets/js/quiz.js',
    decision: './src/assets/js/decision.js',
    required: './src/assets/js/required.js',
    contact: './src/assets/js/contact.js',
    reply: './src/assets/js/reply.js',
    consent: './src/assets/js/consent.js',
    logout: './src/assets/js/logout.js',
    survey: './src/assets/js/survey.js',
    docusign: './src/assets/js/docusign.js',
    docusigncomplete: './src/assets/js/docusigncomplete.js',
    docusignconsent: './src/assets/js/docusignconsent.js',
  },
  plugins: [
    new CleanWebpackPlugin(),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
    }),
    new CopyWebpackPlugin([
      { from: 'src/assets/img', to: 'img/' },
      { from: 'src/assets/font', to: 'font/' },
      { from: 'src/assets/project', to: 'project/' },
    ]),
  ],
  output: {
    filename: 'js/[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: {
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            outputPath: 'img/',
          },
        },
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: {
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            outputPath: 'font/',
          },
        },
      },
    ],
  },
  target: 'node',
};
