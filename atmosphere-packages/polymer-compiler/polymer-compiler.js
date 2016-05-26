
// Write your package code here!

// Variables exported by this module can be imported by other packages and
// applications. See polymer-compiler-tests.js for an example of importing.
export const name = 'polymer-compiler';

const parse5 = Npm.require('parse5');
const fs = Npm.require('fs');
const path = Npm.require('path');
const Future = Npm.require('fibers/future');
const _ = Npm.require('lodash');

const throwCompileError = TemplatingTools.throwCompileError;

class PolymerCachingHtmlCompiler extends CachingHtmlCompiler {

}

const parseHtml = (arg)=> {
  const contents = arg.contents;
  const parsed = parse5.parse(contents);
  //parsed is a json object
  const tag = {
    tagName: "template",
    attribs: {
      id: arg.sourceName
    },
    contents: parsed,
    fileContents: arg.contents,
    sourceName: arg.sourceName
  };
  return tag;
};

const handleTags = (tags)=> {
  const handler = new dissectHtml();
  handler.dissect(tags);
  return handler.dissected;
};


class JSGenerator{
  constructor(settings){
    this.settings = settings;
  }
  generateJS(html,toHead){
    toHead = Boolean(toHead);
    const htmlStr = JSON.stringify(html);
    return `
    htmlImporter.render(${htmlStr},${toHead});
    `
  }

}

class dissectHtml {
  constructor() {
    this.dissected = {
      head: '',
      body: '',
      js: '//*polymer-meteor*//\n\n',
      tailJs: '', //tailJs is appened last
      bodyAttrs: {}
    };
  }

  dissect(tag) {
    this.document = tag.contents;
    this.sourceName = tag.sourceName;
    const self = this;
    const childNodes = this.document.childNodes || [];
    childNodes.forEach((node) => {
      if(node.nodeName === 'html'){
        const htmlNodes = node.childNodes || [];
        htmlNodes.forEach((htmlNode)=>{
          if(htmlNode.nodeName === 'head'){
            htmlNode.childNodes = _.compact(_.map(htmlNode.childNodes, (child) => {
              switch (child.nodeName) {
                case "link": {
                  child = self.processLinks(child);
                  if (child) {
                    return child;
                  }
                  break;
                }
                case "script": {
                  const result = self.processScripts(child);
                  if (result) {
                    return result;
                  }
                  break;
                }
                default: {
                  return child;
                }
              }
            }));
            const headContents = parse5.serialize(htmlNode);
            //for files inside client folder html contents can be directly added to dissected.html
            if (self.sourceName.match(/^client\//)) {
              self.dissected.head += headContents;
            }
            else {
              let gen = new JSGenerator();
              self.dissected.js += "\n\n" + gen.generateJS(headContents, true) + "\n\n";
            }
          }
          else if(htmlNode.nodeName === 'body'){
            const body = htmlNode;
            body.attrs.forEach((attr) => {
              if (self.dissected.bodyAttrs.hasOwnProperty(attr.name) && self.dissected.bodyAttrs[attr.name] !== attr.value) {
              }
              else {
                self.dissected.bodyAttrs[attr.name] = attr.value;
              }
            });
            delete body.attrs;
            body.childNodes = self.processChildNodes(body.childNodes);
            const bodyContents = parse5.serialize(body);
            if (self.sourceName.match(/^client\//)) {
              self.dissected.body += bodyContents;
            }
            else {
              let gen = new JSGenerator();
              self.dissected.js += "\n\n" + gen.generateJS(bodyContents) + "\n\n";
            }
          }
        });
      }
    });
    this.dissected.js += "\n\n" + this.dissected.tailJs + "\n\n";

  }

  processChildNodes(childNodes) {
    const self = this;
    return _.compact(_.map(childNodes, (child) => {
      switch (child.nodeName) {
        case "template":
          const isWalkable = child.content && child.content.nodeName == "#document-fragment" && child.content.childNodes;
          if (isWalkable) {
            child.content.childNodes = self.processChildNodes(child.content.childNodes);
          }
          return child;
        case "link":
          child = self.processLinks(child);
          if (child) {
            return child;
          }
          break;
        case "script":
          const result = self.processScripts(child);
          if (result) {
            return result;
          }
          break;
        case "dom-module":
          if (child.childNodes) {
            child.childNodes = self.processChildNodes(child.childNodes);
          }
          return child;

        default:
          return child;
      }
    }));


  }

  processScripts(child) {
    const self = this;
    const importSource = _.find(child.attrs, (v) => {
      return (v.name == "src");
    });
    if (importSource && importSource.value) {
      const importableUrl = self.importableUrl(importSource.value);
      if (!importableUrl) {
        return child;
      }
      else {
        self.dissected.tailJs += `\n\nrequire('${importableUrl}');\n\n`;
      }
    }
    else {

      self.dissected.tailJs += "\n\n" + parse5.serialize(child) + "\n\n";
    }

  }

  importableUrl(url) {
    if (url.match(/^(\/|https?:\/)/)) {
      return false;
    }
    return url.match(/^(\.\/|\.\.\/)/) ? url : './' + url;
  }

  processLinks(child) {
    const self = this;
    if (child.attrs) {
      //<link rel="import"...> and <link rel="stylesheet"...>
      const supportedRels = ["import", "stylesheet"];
      const ifImport = _.find(child.attrs, (v) => {
        return (v.name == "rel" && supportedRels.indexOf(v.value) > -1)
      });
      if (ifImport) {
        const hrefAttr = _.find(child.attrs, (v) => {
          return v.name == "href";
        });
        if (hrefAttr) {
          if (hrefAttr.value) {
            const url = self.importableUrl(hrefAttr.value);
            if (!url) {
              return child;
            }
            else {
              switch (ifImport.value) {
                case "import":
                  //file is imported using require
                  const link = `require('${url}');`;
                  self.dissected.tailJs += "\n\n" + link + "\n\n";

                  break;
                //Processing <link rel="stylesheet" href="filename.css">
                case "stylesheet":
                  //absolute file path
                  const url = path.resolve(self.sourceName, '../', hrefAttr.value);
                  //checks if file exists
                  if (fs.existsSync(url)) {
                    const contents = fs.readFileSync(url, "utf8");
                    //css is inlined
                    const minified = contents.replace(/\r?\n|\r/g, "");
                    if (minified) {
                      //link tag is replaced with style tag
                      child = _.extend(child, {
                        nodeName: "style",
                        tagName: "style",
                        attrs: [],
                        childNodes: [
                          {
                            nodeName: "#text",
                            value: minified
                          }
                        ]
                      });
                      return child;
                    }

                  }
                  return child;

                  break;

              }
            }
          }
          else {
            throwCompileError("link import href is blank");
          }
        }
        else {
          throwCompileError("No href for link import");
        }
      }
      else {
        return child;
      }
    }
    else {
      return child;
    }

  }

}

Plugin.registerCompiler({
  extensions: ["html", "htm"],
  archMatching: 'web',
  isTemplate: true
}, () => {
  return new PolymerCachingHtmlCompiler("polymer-compiler", parseHtml, handleTags);
});
