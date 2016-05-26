
//import $ from 'cheerio';
//import utils from './utils';
//import {MainHtmlCompiler} from './main';
//import {TemplateHtmlCompiler} from './component';


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
      if (!!file.getPathInPackage().startsWith('node_modules') || !!file.getPathInPackage().startsWith('public')) {
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

export const staticHtmlCompiler = new StaticHtmlCompiler();
