import { extend } from'./file';

export class BaseHtmlCompiler extends CachingCompiler {
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
