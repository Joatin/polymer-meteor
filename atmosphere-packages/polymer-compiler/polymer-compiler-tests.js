// Import Tinytest from the tinytest Meteor package.
import { chai } from 'meteor/practicalmeteor:chai';

// Import and rename a variable exported by polymer-compiler.js.
import { name as packageName } from "meteor/polymer-compiler";

// Write your tests here!
// Here is an example.
describe('my module', function () {
  it('does something that should be tested', function () {
    chai.expect(packageName).to.be('polymer-compiler');
    // This code will be executed by the test driver when the app is started
    // in the correct mode
  })
});
