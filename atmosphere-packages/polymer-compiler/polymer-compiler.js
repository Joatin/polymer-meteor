// Write your package code here!

// Variables exported by this module can be imported by other packages and
// applications. See polymer-meteor-build-tests.js for an example of importing.
export const name = 'polymer-compiler';

Plugin.registerCompiler({
    extensions: ["html", "htm"],
    filenames: []
}, () => {
    return new PolymerCompiler();
});

class PolymerCompiler extends CachingCompiler{

    processFilesForTarget(files){

    }
}
