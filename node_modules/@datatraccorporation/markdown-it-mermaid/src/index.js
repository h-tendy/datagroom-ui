import Mermaid from 'mermaid';
import Murmur from './murmurhash3_gc.js';


const htmlEntities = (str) =>
    String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');


const MermaidChart = (code, title='') => {
  try {
    var needsUniqueId = "render" + Murmur(code, 42).toString();
    var pngUniqueId = needsUniqueId.replace("render", "png");
    Mermaid.mermaidAPI.render(needsUniqueId, code, sc => {code=sc});
    var width = ""; // J:
    if (title && String(title).length) {
        // J:
        let m = title.match(/(\d+%)/);
        if (m && m.length > 1) {
          width = m[1];
        }
        title = `<div class="mermaid-title">${htmlEntities(title)}</div>`;
    }

    // J:
    /*
    code = code.replaceAll('font-size:14px', 'font-size:12px');
    code = code.replaceAll('font-size:16px', 'font-size:14px');
    let r = `<div class="mermaid"><img src="data:image/svg+xml;base64,${btoa(code)}" width=${width} height="100%"/></div>`;
    console.log("svg code is: ", code);
    return r;
    */

    // J:
    {
      code = code.replaceAll('font-size:14px', 'font-size:12px');
      code = code.replaceAll('font-size:16px', 'font-size:14px');
      var img = new Image();
      img.crossOrigin = 'Anonymous';
      img.decoding = 'sync';
      img.src = `data:image/svg+xml;base64,${btoa(code)}`;
      img.onload = function () {
        var canvas = document.createElement('CANVAS');
        var ctx = canvas.getContext('2d');
        var pngBase64;
        canvas.height = img.naturalHeight;
        canvas.width = img.naturalWidth;
        console.log("Width, height: ", canvas.height, canvas.width);
        ctx.drawImage(img, 0, 0);
        pngBase64 = canvas.toDataURL("image/png", 1.0);
        let widthStr = width ? `width=${width}` : '';
        document.querySelector(`#${pngUniqueId}`).innerHTML = `<img src="`+pngBase64+`" ${widthStr}/>`;
      }
    }
    //let r = `<div class="mermaid"><img src="data:image/png;base64,${dataURL}" width=${width} height="100%"/></div>`;
    let r = `<div class="mermaid" id="${pngUniqueId}"></div>`;
    console.log("r is: ", r);
    return r;


    return `<div class="mermaid">${title}${code}</div>`;
  } catch (err) {
    return `<pre>${htmlEntities(err.name)}: ${htmlEntities(err.message)}</pre>`;
  }
}


const MermaidPlugIn = (md, opts) => {
  Mermaid.initialize(Object.assign(MermaidPlugIn.default, opts));

  const defaultRenderer = md.renderer.rules.fence.bind(md.renderer.rules);

  md.renderer.rules.fence = (tokens, idx, opts, env, self) => {
    const token = tokens[idx];
    const code = token.content.trim();
    if (token.info.startsWith('mermaid')) {
      let title;
      const spc = token.info.indexOf(' ', 7);
      if (spc > 0) {
          title = token.info.slice(spc + 1);
      }
      return MermaidChart(code, title);
    }
    return defaultRenderer(tokens, idx, opts, env, self);
  }
}


MermaidPlugIn.default = {
  startOnLoad: false,
  securityLevel: 'true',
    theme: "default",
    flowchart:{
      htmlLabels: false,
      useMaxWidth: true,
    }
};

export default MermaidPlugIn;
