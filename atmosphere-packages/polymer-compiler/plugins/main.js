import {BaseHtmlCompiler} from "./base";
import * as $ from 'cheerio';

export class MainHtmlCompiler extends BaseHtmlCompiler {
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
