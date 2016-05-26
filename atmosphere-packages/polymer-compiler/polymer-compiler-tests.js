// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from "meteor/tinytest";

// Import and rename a variable exported by polymer-meteor-build.js.
import { name as packageName } from "meteor/polymer-compiler";

// Write your tests here!
// Here is an example.
Tinytest.add('polymer-compiler - example', function (test) {
  test.equal(packageName, "polymer-compiler");
});
