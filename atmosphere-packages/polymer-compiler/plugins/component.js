import {BaseHtmlCompiler} from "./base";
import * as $ from 'cheerio';


export class TemplateHtmlCompiler extends BaseHtmlCompiler {
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
