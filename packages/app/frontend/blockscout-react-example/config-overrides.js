const webpack = require('webpack');

module.exports = function override(config) {
  const fallback = config.resolve.fallback || {};
  Object.assign(fallback, {
    "crypto": require.resolve("crypto-browserify"),
    "stream": require.resolve("stream-browserify"),
    "assert": require.resolve("assert"),
    "http": require.resolve("stream-http"),
    "https": require.resolve("https-browserify"),
    "os": require.resolve("os-browserify/browser"),
    "url": require.resolve("url"),
    "path": require.resolve("path-browserify"),
    "fs": false,
    "vm": false,
    "process": false,
    "buffer": require.resolve("buffer")
  });
  config.resolve.fallback = fallback;

  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: require.resolve("process/browser"),
      Buffer: ["buffer", "Buffer"]
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    })
  ]);

  config.resolve.alias = {
    ...config.resolve.alias,
    process: "process/browser"
  };

  return config;
}; 