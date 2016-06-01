Package.describe({
  name: 'joatin:polymer-compiler',
  version: '0.0.8',
  // Brief, one-line summary of the package.
  summary: 'This package makes it possible to use Polymer with Meteor',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/Joatin/polymer-meteor.git',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.3');

  // Required in order to register plugins
  api.use('isobuild:compiler-plugin@1.0.0');
  api.use('ecmascript');

  // api.mainModule('polymer-compiler.js', 'client');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('practicalmeteor:mocha');
  api.use('joatin:polymer-compiler');
  api.mainModule('polymer-compiler-tests.js', 'client');
});


Package.registerBuildPlugin({
  name: 'Polymer Compilers',
  sources: [
    'polymer-compiler.js'
  ],
  use: [
    // Uses an external packages to get the actual compilers
    'caching-compiler@1.0.0',
    'ecmascript',
    'html-tools@1.0.7'
  ],
  npmDependencies: {
    'cheerio': '0.20.0',
    'html-minifier': '0.8.0',
    'lodash.assign': '4.0.8'
  }
});
