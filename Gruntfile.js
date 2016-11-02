"use strict";

const path = require("path");
const fs = require("fs");
const pkg = require("./package");
const webpack = require("webpack");
const webpackConfig = require("./webpack.config.js");
const SmartBannerPlugin = require("smart-banner-webpack-plugin");
const UnminifiedWebpackPlugin = require("unminified-webpack-plugin");

module.exports = function(grunt) {

  const pkg_info = grunt.file.readJSON("package.json");

  grunt.initConfig({
    pkg: pkg_info,
    clean: {
      build: ["build/"]
    },
    webpack: {
      options: webpackConfig,
      dev: {
        devtool: "eval",
        debug: true
      },
      build: {
        devtool: "source-map",
        output: { 
          path: path.join(__dirname, "build"), 
          filename: 'auth0.min.js' 
        },
        watch: false,
        keepalive: false,
        inline: false,
        hot: false,
        devtool: 'source-map',
        plugins: [
          new webpack.DefinePlugin({
            'process.env': {
              'NODE_ENV': JSON.stringify('production')
            }
          }),
          new webpack.optimize.DedupePlugin(),
          new webpack.optimize.OccurrenceOrderPlugin(),
          new webpack.optimize.AggressiveMergingPlugin(),
          new webpack.optimize.UglifyJsPlugin({ 
            compress: { warnings: false, screw_ie8: true },
            comments: false
          }),
          new UnminifiedWebpackPlugin(),
          new SmartBannerPlugin(
            `[filename] v${pkg_info.version}\n\nAuthor: ${pkg_info.author}\nDate: ${new Date().toLocaleString()}\nLicense: ${pkg_info.license}\n`,
            { raw: false, entryOnly: true }
          )
        ]
      }
    }
  });

  grunt.loadNpmTasks("grunt-webpack");
  grunt.loadNpmTasks("grunt-contrib-clean");

  grunt.registerTask("build", ["clean:build", "webpack:build"]);
  grunt.registerTask("dev", ["webpack:dev"]);
};
