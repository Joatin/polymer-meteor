
class HtmlImporter{
  render(str,head) {
    if(document.body){
      const el = head ? document.head : document.body;
      const div = document.createElement('div');
      div.innerHTML = str;
      while (div.children.length > 0) {
        el.appendChild(div.children[0]);
      }

    }
    else{
      document.write(str);
    }
  }
}

export const htmlImporter = new HtmlImporter();
