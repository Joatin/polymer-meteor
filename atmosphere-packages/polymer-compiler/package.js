Package.describe({
  name: 'joatin:polymer-compiler',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: 'This package makes it possible to use Polymer with Meteor',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/Joatin/polymer-meteor.git',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});


Package.registerBuildPlugin({
  name: 'Polymer Compilers',
  sources: [
    'plugin/register.js'
  ],
  use: [
    // Uses an external packages to get the actual compilers
    'ecmascript@0.1.6',
    'caching-compiler@1.0.0'
  ]
});

Package.onUse(function(api) {
  api.versionsFrom('1.3.2.4');

  // Required in order to register plugins
  api.use('isobuild:compiler-plugin@1.0.0');
  api.use('isobuild:linter-plugin@1.0.0');
  api.use('ecmascript');

  api.mainModule('polymer-compiler.js');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('joatin:polymer-compiler');
  api.mainModule('polymer-compiler-tests.js');
});
