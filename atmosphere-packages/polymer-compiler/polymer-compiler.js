
const assign = require('lodash.assign');
const $ = require('cheerio');
const htmlMinifier = require('html-minifier');

Plugin.registerCompiler({
  extensions: ['html'],
  archMatching: 'web',
  isTemplate: true
}, () => {
  return new StaticHtmlCompiler();
});

export const name = 'polymer-compiler';

class BaseHtmlCompiler extends CachingCompiler {
  constructor(compilerName) {
    super({
      compilerName,
      defaultCacheSize: 1024 * 1024 * 10
    });
  }

  getCacheKey(file) {
    return file.getSourceHash();
  }

  processFilesForTarget(files) {
    files.forEach((file) => {
      extend(file)
    });
    super.processFilesForTarget(files);
  }
}

class MainHtmlCompiler extends BaseHtmlCompiler {
  constructor() {
    super('main-static-html-compiler');
  }

  compileResultSize(result) {
    return result.head.length + result.body.length;
  }

  compileOneFile(file) {
    const $contents = $(file.getContentsAsString());
    const $head = $contents.closest('head');
    const $body = $contents.closest('body');

    return {
      head: {
        contents: $head.html() || ''
      },
      body: {
        contents: $body.html() || '',
        attrs: $body[0] ? $body[0].attribs : undefined
      }
    };
  }

  addCompileResult(file, result) {
    try {
      file.addHtml({
        data: result.head.contents,
        section: 'head'
      });

      file.addHtml({
        data: result.body.contents,
        section: 'body'
      });

      if (result.body.attrs) {
        file.addJavaScript({
          path: file.getTemplateJS(),
          data: `
            Meteor.startup(function() {
              var attrs = ${JSON.stringify(result.body.attrs)};
              for (var prop in attrs) {
                document.body.setAttribute(prop, attrs[prop]);
              }
            });
          `
        });
      }
    } catch (e) {
      //
    }
  }
}

class TemplateHtmlCompiler extends BaseHtmlCompiler {
  constructor() {
    super('template-static-html-compiler');
  }

  compileResultSize(result) {
    return result.length;
  }

  compileOneFile(file) {
    return minify(file.getContentsAsString());
  }

  /**
   * @param  {string} contents minified html
   * @return {string}          javascript code
   */
  compileContents(file, contents) {
    return `module.exports = "${clean(contents)}";`;
  }

  addCompileResult(file, result) {
    file.addJavaScript({
      data: this.compileContents(file, result),
      path: file.getPathInPackage()
    });
  }
}

class StaticHtmlCompiler {

  constructor(
    mainHtmlCompiler,
    templateHtmlCompiler
  ) {
    this.mainHtmlCompiler = mainHtmlCompiler || new MainHtmlCompiler();
    this.templateHtmlCompiler = templateHtmlCompiler || new TemplateHtmlCompiler();
  }

  processFilesForTarget(files) {
    const mainFiles = [];
    const templateFiles = [];

    files.forEach((file) => {
      // skips files from node_modules
      if (!!file.getPathInPackage().startsWith('node_modules') || !!file.getPathInPackage().includes('bower_components')) {
        return;
      }

      const $contents = $(file.getContentsAsString());
      const isMain = $contents.closest('head,body').length;
      const isTemplate = $contents.closest(':not(head,body)').length;

      if (isMain && isTemplate) {
        const fileName = file.getBasename();
        const errorMsg = `${fileName} has wrong layout`;
        throw Error(errorMsg);
      }

      if (isMain > 0) {
        mainFiles.push(file);
      }
      else {
        templateFiles.push(file);
      }
    });

    // Use each compiler with it's files and compile them
    this.mainHtmlCompiler.processFilesForTarget(mainFiles);
    this.templateHtmlCompiler.processFilesForTarget(templateFiles);
  }
}

const fileMixin = {
  /**
   * @return {string} package prefix or empty string
   */
  getPackagePrefix() {
    const packageName = this.getPackageName();
    return packageName ? `packages/${packageName}/` : '';
  },
  /**
   * @return {string} absolute templateUrl
   */
  getTemplateUrl() {
    return this.getPackagePrefix() + this.getPathInPackage();
  },
  /**
   * @return {string} absolute temlateUrl extended by js extension
   */
  getTemplateJS() {
    return `${this.getTemplateUrl()}.js`;
  }
};

export function extend(file) {
  assign(file, fileMixin);
}

export function minify(html) {
  // Just parse the html to make sure it is correct before minifying
  HTMLTools.parseFragment(html);

  return htmlMinifier.minify(html, {
    collapseWhitespace: true,
    conservativeCollapse: true,
    minifyCSS: true,
    minifyJS: true,
    processScripts: ['text/template'],
    removeAttributeQuotes: false,
    caseSensitive: true,
    customAttrSurround: [[/#/, /(?:)/], [/\*/, /(?:)/], [/\[?\(?/, /(?:)/]],
    customAttrAssign: [/\)?\]?=/]
  });
}

export function clean(src) {
  return JSON.stringify(src).replace(/^\"/, '').
  replace(/\"$/, '');
}

