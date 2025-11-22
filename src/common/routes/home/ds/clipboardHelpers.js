// Minimal clipboard helper skeleton extracted from DsView
export default function createClipboardHelpers(context) {
  const { getState, setState } = context;

    /**
     * Given a text, this function copies the text to the clipboard.
     * It uses navigator.clipboard for the latest browsers. 
     * In case of older browser, it falls back to document.execCommand.
     * Finally, it shows the modal of success or failure based on the copy to clipboard status.
     */
  function copyTextToClipboard(text) {
    try {
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
        showCopiedNotification(true);
        return true;
      }
    } catch (e) {
      // fall through to fallback
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showCopiedNotification(true);
      return true;
    } catch (err) {
      showCopiedNotification(false);
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }

  function showCopiedNotification(isSuccess) {
    try {
      if (isSuccess) {
        setState({ showNotification: true, notificationMessage: 'Copied to clipboard', notificationType: 'success', showIconsInNotification: true });
      } else {
        setState({ showNotification: true, notificationMessage: 'Copy failed', notificationType: 'danger', showIconsInNotification: true });
      }
      setTimeout(() => {
        setState({ showNotification: false, notificationMessage: '', notificationType: 'success', showIconsInNotification: false });
      }, 2000);
    } catch (e) {
      // ignore
    }
  }

  // The procedure we do in copyFormatted preserves all the styling!
  // Thus, we will use the same html generation function, but copy it
  // to clipboard with the tweaks as in copyFormatted.
  // Ideally, the html for each cell should be copied from it's innerHTML.
  // That will preserve the dynamically generated images like plantuml. See
  // the copyCellToClipboard method. Since we don't have a hook, we are settling
  // for now. Only plantuml images don't appear in table copy.
  // Now fixed. Setting colVisProp to "clipboard" will call the correct
  // formatter in which we clone and use the resolved images! See
  // col.formatterClipboard function below!
  function fixImgSizeForClipboard(output) {
    try {
      let imgList = document.querySelectorAll("img");
      let imgSizes = {};
      for (let i = 0; i < imgList.length; i++) {
        let img = {};
        img.src = imgList[i].getAttribute("src");
        img.width = imgList[i].width;
        img.height = imgList[i].height;
        imgSizes[img.src] = img;
      }
      let e = [...output.matchAll(/<img src="(.*?)"/gi)];
      for (let i = 0; i < e.length; i++) {
        let key = e[i][1];
        if (!imgSizes[key]) continue;
        if (/data:image/.test(key)) continue;
        let str = `<img src="${key}" alt="${key}" width=".*" height=".*"`;
        let rep = `<img src="${key}" alt="${key}" width=${imgSizes[key].width} height=${imgSizes[key].height}`;
        output = output.replace(new RegExp(str), rep);
      }
      output = output.replaceAll('<img src="/attachments/', `<img src="${window.location.origin}/attachments/`);
    } catch (e) {}
    return output;
  }

  function copyFormatted(element, html) {
    // To replace the markup due to the highlightjs badges.
    // The regex arrived by looking at the generated markup
    // and some clever regex as usual.
    // This mostly is needed when html comes from innerHTML!
    var container = document.createElement('div')
    if (element) html = element.innerHTML;
    html = fixImgSizeForClipboard(html);
    html = html.replace(/<pre class="code-badge-pre"[\s\S]*?(<code [\s\S]*?<\/code>)<\/pre>/gi, '<pre>$1</pre>');
    html = html.replace(/<code class="hljs">/gi, '<code class="hljs" style="background-color:white; font-size:12px">');
    container.innerHTML = html
    // Hide element
    container.style.position = 'fixed'
    container.style.pointerEvents = 'none'
    container.style.opacity = 0
    // Detect all style sheets of the page
    var activeSheets = Array.prototype.slice.call(document.styleSheets)
    .filter(function (sheet) { return !sheet.disabled })
    // Mount the container to the DOM to make `contentWindow` available
    document.body.appendChild(container)
    // Copy to clipboard
    window.getSelection().removeAllRanges()
    var range = document.createRange()
    range.selectNode(container)
    window.getSelection().addRange(range)
    document.execCommand('copy')
    // Temporarily disable non-static stylesheets so copied HTML keeps desired look
    for (var i = 0; i < activeSheets.length; i++) {
      if (!/static\/css/.test(activeSheets[i].href))
        activeSheets[i].disabled = true
    }
    document.execCommand('copy')
    // Re-enable stylesheets we disabled earlier
    for (var i = 0; i < activeSheets.length; i++) {
      if (!/static\/css/.test(activeSheets[i].href))
        activeSheets[i].disabled = false
    }
    document.body.removeChild(container)
  }

  function copyFormattedBetter(container) {
    // Copy selecting the provided node to preserve richer markup
    // Copy to clipboard
    window.getSelection().removeAllRanges()
    var range = document.createRange()
    range.selectNode(container)
    window.getSelection().addRange(range)
    document.execCommand('copy')
    window.getSelection().removeAllRanges();
  }

  function copyCellToClipboard(e, cell) {
    let colDef = cell.getColumn().getDefinition();
    // prefer innerHTML for richer content
    // Now use the innerHTML!
    copyFormatted(null, `<div style="font-family:verdana; font-size:12px; background-color: white">${cell.getElement().innerHTML}</div>`);
  }

  function myCopyToClipboard(ref) {
    // Use Tabulator export module to generate HTML for the visible table
    let visible = true, style = true, colVisProp = "clipboard", config = null;
    let html = ref.table.modules.export.getHtml(visible, style, config, colVisProp);
    copyFormatted(null, html);
  }

  function copyToClipboard(ref) {
    // Convenience wrapper
    myCopyToClipboard(ref);
  }

  return {
    copyTextToClipboard,
    showCopiedNotification,
    fixImgSizeForClipboard,
    copyFormatted,
    copyFormattedBetter,
    copyCellToClipboard,
    myCopyToClipboard,
    copyToClipboard
  };
}
