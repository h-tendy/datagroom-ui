// DOM helpers extracted from DsView to keep component smaller
export default function createDomHelpers(context) {
  const { component, ref, timers } = context;
  // Since we generate html after editing, we need to attach
  // the handlers again. Preserved from `DsView.js` fallback implementation.
  // The original implementation attached click/focus handlers to links and
  // highlight-badge icons inside the Tabulator container. It also flipped
  // component flags `mouseDownOnHtmlLink` and `mouseDownOnBadgeCopyIcon` and
  // used short timeouts to reset them. Keeping these comments here so the
  // behavior is documented even though the component delegates to the helper.
  function applyHtmlLinkAndBadgeClickHandlers() {
    const me = component;
    let splElements = [];
    if (document.getElementById("tabulator")) {
      splElements = document.getElementById("tabulator").getElementsByTagName('a');
    }
    for (var i = 0, len = splElements.length; i < len; i++) {
      splElements[i].onclick = function (e) {
        me.mouseDownOnHtmlLink = true;
        // Caution: This is a must, otherwise you are getting the click after returning to the tab!
        e.stopPropagation();
        // Caution: To clear this out after a second to ensure that the next click is honored properly.
        setTimeout(() => me.mouseDownOnHtmlLink = false, 1000);
        return true;
      }
    }

    // This querySelectorAll is borrowed from highlightjs-badge.js code
    if (document.getElementById("tabulator")) {
      splElements = document.getElementById("tabulator").querySelectorAll(".code-badge-copy-icon");
    }
    for (i = 0, len = splElements.length; i < len; i++) {
      // Have to setup for 'focus' event because that fires first! And
      // tabulator already has this setup on the cell.
      splElements[i].setAttribute("tabindex", 0);
      splElements[i].addEventListener("focus",
        function(e) {
          let clickedEl = e.srcElement;
          if (clickedEl.classList.contains("code-badge-copy-icon")) {
            me.mouseDownOnBadgeCopyIcon = true;
            // Caution: To clear this out after a second to ensure that the next click is honored properly.
            setTimeout(() => me.mouseDownOnBadgeCopyIcon = false, 1000);
            return true;
          }
        });
    }
  }

  function applyHighlightJsBadge() {
    const me = component;
    if (timers && timers["applyHighlightJsBadge"]) {
      clearTimeout(timers["applyHighlightJsBadge"]);
      timers["applyHighlightJsBadge"] = null;
    }
    if (timers) {
      timers["applyHighlightJsBadge"] = setTimeout(() => {
        if (window.highlightJsBadge) window.highlightJsBadge();
        applyHtmlLinkAndBadgeClickHandlers();
      }, 1000);
    } else {
      setTimeout(() => {
        if (window.highlightJsBadge) window.highlightJsBadge();
        applyHtmlLinkAndBadgeClickHandlers();
      }, 1000);
    }
  }

  function normalizeAllImgRows() {
    const me = component;
    if (timers && timers["normalizeAllImgRows"]) {
      clearInterval(timers["normalizeAllImgRows"]);
      timers["normalizeAllImgRows"] = null;
    }
    let extraIters = 0;
    if (timers) {
      timers["normalizeAllImgRows"] = setInterval(function () {
        if (document.readyState === 'complete') {
          let imgList = document.querySelectorAll("img");
          let allImgsRead = true;
          for (let i = 0; i < imgList.length; i++) {
            if (!(imgList[i].complete)) {
              allImgsRead = false;
              extraIters = 0;
              break;
            }
          }
          if (allImgsRead) {
            if (extraIters === 2) {
              // The original behavior: after a couple of successful image loads
              // normalize each Tabulator row height and then adjust the table size
              // so the UI lays out correctly. Preserve the logic here.
              if (imgList.length && !me.cellImEditing && ref && ref() && ref().table) {
                let rows = ref().table.getRows();
                for (let i = 0; i < rows.length; i++) {
                  rows[i].normalizeHeight();
                }
                ref().table.rowManager.adjustTableSize(false);
              }
            }
            if (extraIters >= 10) {
              extraIters = 0;
              clearInterval(timers["normalizeAllImgRows"]);
              timers["normalizeAllImgRows"] = null;
            }
            extraIters++;
          }
        }
      }, 300);
    }
  }

  function renderPlotlyInCells() {
    const plots = document.querySelectorAll('.plotly-graph');
    if (plots.length === 0) return;
    
    const renderPromises = [];
    
    plots.forEach((div) => {
      const data = div.getAttribute('data-plot');
      try {
        const json = JSON.parse(decodeURIComponent(data));
        if (window.Plotly) {
          // Plotly.newPlot returns a promise that resolves when rendering is complete
          const promise = window.Plotly.newPlot(div, json.data, json.layout, json.config || {})
            .then(() => {
              // Also listen for the afterplot event as a secondary check
              return new Promise((resolve) => {
                div.on('plotly_afterplot', () => resolve());
                // Fallback timeout in case event doesn't fire
                setTimeout(resolve, 100);
              });
            });
          renderPromises.push(promise);
        } else {
          div.innerHTML = `<div style="color:red;">Plotly CDN not loaded</div>`;
        }
      } catch (e) {
        div.innerHTML = `<div style="color:red;">Invalid Plotly JSON</div>`;
      }
    });
    
    // Wait for all Plotly graphs to finish rendering, then normalize heights
    if (renderPromises.length > 0) {
      Promise.all(renderPromises)
        .then(() => {
          if (ref && ref() && ref().table) {
            let rows = ref().table.getRows();
            for (let i = 0; i < rows.length; i++) {
              rows[i].normalizeHeight();
            }
            ref().table.rowManager.adjustTableSize(false);
          }
        })
        .catch((err) => {
          console.error('Error rendering Plotly graphs:', err);
          // Still normalize heights even if there's an error
          if (ref && ref() && ref().table) {
            let rows = ref().table.getRows();
            for (let i = 0; i < rows.length; i++) {
              rows[i].normalizeHeight();
            }
            ref().table.rowManager.adjustTableSize(false);
          }
        });
    }
  }

  return {
    applyHtmlLinkAndBadgeClickHandlers,
    applyHighlightJsBadge,
    normalizeAllImgRows,
    renderPlotlyInCells
  };
}
