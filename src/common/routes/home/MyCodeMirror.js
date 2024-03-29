import ModalEditor from './ModalEditor';
const React = require('react');
const ReactDOM = require('react-dom');

function MyCodeMirror(cell, onRendered, success, cancel, editorParams, ctrlKey) {
    var self = this,
        cellValue = cell.getValue(),
        vertNav = editorParams.verticalNavigation || "hybrid",
        value = String(cellValue !== null && typeof cellValue !== "undefined" ? cellValue : ""),
        count = (value.match(/(?:\r\n|\r|\n)/g) || []).length + 1,
        input = document.createElement("textarea"),
        scrollHeight = 0;
    var editor;

    //create and style input
    input.style.display = "block";
    input.style.padding = "2px";
    input.style.height = "50%";
    input.style.width = "100%";
    input.style.boxSizing = "border-box";
    input.style.whiteSpace = "pre-wrap";
    input.style.resize = "none";

    if (editorParams.elementAttributes && typeof editorParams.elementAttributes == "object") {
        for (let key in editorParams.elementAttributes) {
            if (key.charAt(0) == "+") {
                key = key.slice(1);
                input.setAttribute(key, input.getAttribute(key) + editorParams.elementAttributes["+" + key]);
            } else {
                input.setAttribute(key, editorParams.elementAttributes[key]);
            }
        }
    }

    if (!value) value = "";
    input.value = value;

    if (ctrlKey) {
        let cellWidth = cell._cell.element.style.width;    
        let div = document.createElement("div");
        document.body.appendChild(div);
        let cmRef = {};
        const PopupContent = () => {
            return (
                <ModalEditor show={true} 
                    title={"Edit"} text={value} onClose={clear} editorParams={editorParams}
                    cancel={"Cancel"} ok={"Done"} cmRef={cmRef} width={cellWidth}>
                </ModalEditor>
            );
        };
        
        const clear = (ok, value) => {
            ReactDOM.unmountComponentAtNode(div);
            div.remove();
            if (ok && (input.value != value)) {
                success(value);
                cellValue = value;
            } else {
                cancel();
            }
        }
        ReactDOM.render(<PopupContent/>, div);
    }


    /*
    var editor = window.CodeMirror(document.body, {
        lineNumbers: true
      });    */
      /*
    var editor = window.CodeMirror.fromTextArea(input, {
        lineNumbers: true
      });
    */
   onRendered(function () {
        if (!ctrlKey) {
            input.focus({
                preventScroll: true
            });
        }
        input.style.height = "100%";
        window.CodeMirrorSpellChecker({
            codeMirrorInstance: window.CodeMirror,
        });        
        editor = window.CodeMirror.fromTextArea(input, {
            lineNumbers: true,
            lineWrapping: true,
            mode: "spell-checker",
	        backdrop: "markdown",
            highlightFormatting: true
          });
        window.inlineAttachment.editors.codemirror4.attach(editor, {
            uploadUrl: '/uploadAttachments', 
            urlText: '<img src="{filename}" alt="{filename}" width="100%" height="100%"/>', fileUrlText: '[{filename}]({filename})',
            allowedTypes: '*',
            extraParams: {
                dsName: editorParams.dsName
            }
        });

        let initialHeight = cell._cell.element.style.height;
        initialHeight = initialHeight.replace('px', '');
        initialHeight = parseInt(initialHeight);

        let vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
        if (vh > 0) {
            // Deduct some for browser header. 
            vh = vh - 70;
        }
        // Ensure the initialHeight is not more than the view port height. 
        // codemirror has an issue if this is the case. 
        initialHeight = Math.min(vh, initialHeight);

        /*let h;
        if (editor.getDoc().lineCount() === 1)
            h = 25;
        else 
            h = (editor.getDoc().lineCount() + 1) * 18;
        */
        cell._cell.setHeightSpecial(initialHeight);
        cell.getRow().normalizeHeight();
        editor.scrollIntoView({line: editor.getDoc().lineCount() - 1, ch: 0}, 50)
        editor.getDoc().setCursor({line: editor.getDoc().lineCount() - 1, ch:0});
        editor.refresh();
        editor.on("keyup", function (cm, e) {
            if (true) {
                //console.log("current input height:", input.style.height);
                //console.log("cell element: ", cell._cell.element);
                //console.log("current input scroll height: ", input.scrollHeight);
                //console.log("current input offsetheight: ", input.offsetHeight);
                let h = cell._cell.element.style.height;
                //console.log('h:', h);
                //h = h.replace('px', '');
                //h = parseInt(h) + 25;
                if (editor.getDoc().lineCount() === 1)
                    h = 25;
                else 
                    h = (editor.getDoc().lineCount() + 1) * 18;
                if (h > vh) h = vh;
                cell._cell.setHeightSpecial(Math.max(h, initialHeight));
                cell.getRow().normalizeHeight();
                // refresh() was jarring the view sometimes. The scrollIntoView
                // seems to be much more smoother. 
                editor.scrollIntoView();
                //editor.refresh();
            }
            return;
        });
        editor.on("keydown", function (cm, e) {
            let pos = cm.getCursor();
            switch (e.keyCode) {
                case 13:
                    if (e.ctrlKey) {
                        onChange(e);
                    }
                    break;
                case 27:
                    cancel();
                    break;    
                case 38: //up arrow
                    if (vertNav == "editor" || (vertNav == "hybrid" && (pos.line !== 0 || pos.ch !== 0) )) {
                        e.stopImmediatePropagation();
                        e.stopPropagation();
                    }
                    break;
                case 40: //down arrow
                    if (vertNav == "editor" || (vertNav == "hybrid" && pos.outside !== 1)) {
                        e.stopImmediatePropagation();
                        e.stopPropagation();
                    }
                    break;
                default:
                    e.stopImmediatePropagation();
                    e.stopPropagation();        
                    break;    
            }
        });
        editor.on("blur", function (e) {
            if (!cell.mouseDownDate) cell.mouseDownDate = 0;
            //console.log("Blur event. Date, mousedowndate: ", Date.now(), cell.mouseDownDate);
            //console.log("Blur event diff: ", Date.now() - cell.mouseDownDate);
            if (Date.now() - cell.mouseDownDate > 50) {
                onChange(e);
            }
        });
        /*
        window.addEventListener("mousedown", onChange); */

        cell.getElement().addEventListener("mousedown", function (e) {
            cell.mouseDownDate = Date.now();
            //console.log("mousedown element...: ", cell.mouseDownDate);
            e.stopImmediatePropagation();
            e.stopPropagation();
        }) /*
        editor.on("mousedown", function (cm, e) {
            cell.mouseDownDate = Date.now();
            //console.log("mousedown editor: ", cell.mouseDownDate);
            e.stopImmediatePropagation();
            e.stopPropagation();
        }) */
        
    });

    function onChange(e) {
        if (!editor) return;
        let curValue = editor.getValue();
        if (((cellValue === null || typeof cellValue === "undefined") && curValue !== "") || curValue !== cellValue) {
            if (success(curValue)) {
                cellValue = curValue; //persist value if successfully validated incase editor is used as header filter
            }
            /*
            setTimeout(function () {
                cell.getRow().normalizeHeight();
            }, 300)
            */
        } else {
            cancel();
        }
    }

    //submit new value on blur or change
    //input.addEventListener("change", onChange);
    //input.addEventListener("blur", onChange);
    //window.addEventListener("mousedown", onChange);
    //input.addEventListener("mousedown", function (e) {
    //    e.stopPropagation();
    //})

    /*
    input.addEventListener("keyup", function () {
        console.log("keyup...");
        // Jayaram: 8/23 change, only set height if it is different in the
        // below block. 
        //input.style.height = "";

        var heightNow = input.scrollHeight;

        input.style.height = heightNow + "px";

        if (!scrollHeight) scrollHeight = heightNow;
        if (heightNow != scrollHeight) {
            console.log("ScrollHeight, heightNow", scrollHeight, heightNow);
            input.style.height = heightNow + "px";
            scrollHeight = heightNow;
            cell.getRow().normalizeHeight();
        }
    });


    input.addEventListener("keydown", function (e) {
        console.log("Keydown here")
        switch (e.keyCode) {
            case 27:
                cancel();
                break;

            // Jayaram: Copied from 'textarea' handling within the source. 
            // Added the below keycodes (Home/End: 35/36) to not leave the editor. 
            case 33:
            case 34:
                //e.stopImmediatePropagation();
                //e.stopPropagation();
                e.preventDefault();
                const cursorPosition = e.key === 'PageUp' ? 0 : e.target.textLength;
                e.target.setSelectionRange(cursorPosition, cursorPosition);
                // Intentional that break is commented here. To make sure you don't leave
                // editing when you press pgup/pgdown. 
                //break;
            case 35:
            case 36:
                e.stopImmediatePropagation();
                e.stopPropagation();
                break;

            case 38: //up arrow
            e.stopImmediatePropagation();
            e.stopPropagation();
                break;

            case 40: //down arrow
                e.stopImmediatePropagation();
                e.stopPropagation();
                break;
            default:
                break;

        }
    }); */

    if (editorParams.mask) {
        this.table.modules.edit.maskInput(input, editorParams);
    }

    return input;
}

export default MyCodeMirror;