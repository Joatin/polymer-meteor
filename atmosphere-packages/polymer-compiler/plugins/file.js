const assign = require('lodash.assign');

const fileMixin = {
  /**
   * @return {string} package prefix or empty string
   */
  getPackagePrefix: function() {
    const packageName = this.getPackageName();
    return packageName ? `packages/${packageName}/` : '';
  },
  /**
   * @return {string} absolute templateUrl
   */
  getTemplateUrl: function() {
    return this.getPackagePrefix() + this.getPathInPackage();
  },
  /**
   * @return {string} absolute temlateUrl extended by js extension
   */
  getTemplateJS: function() {
    return `${this.getTemplateUrl()}.js`;
  }
};

export function extend(file) {
  assign(file, fileMixin);
}
