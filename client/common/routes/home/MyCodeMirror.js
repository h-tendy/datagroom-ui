function MyCodeMirror(cell, onRendered, success, cancel, editorParams) {
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
        input.focus({
            preventScroll: true
        });
        input.style.height = "100%";
        editor = window.CodeMirror.fromTextArea(input, {
            lineNumbers: true,
            lineWrapping: true,
            mode: "markdown",
            highlightFormatting: true
          });
        //editor.refresh();
            editor.on("keyup", function () {

                // Dynamic resizing isn't working yet for 
                // code-mirror. See MyTextArea on what happens here. 

                //console.log(editor.getScrollInfo());
                //editor.setSize("100%", 200);
                /*
                console.log("current input height:", input.style.height);
                console.log("current input scroll height: ", input.scrollHeight);
                console.log("current input offsetheight: ", input.offsetHeight);
                input.style.height = "400px";
                input.value = editor.getValue();
                editor.refresh();
                let orgFn = cell.getHeight;
                cell.getHeight = () => {
                    console.log("I got called...");
                    return 400;
                }
                cell.height = 400;
                cell.getRow().normalizeHeight();
                cell.getHeight = orgFn;
                */
                return;
            });
            editor.on("keydown", function (cm, e) {
            let pos = cm.getCursor();
            switch (e.keyCode) {
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
        console.log("Onchange now");
        if (!editor) return;
        console.log("On change past !editor check");
        let curValue = editor.getValue();
        console.log("Onchange curValue:", curValue);
        if (((cellValue === null || typeof cellValue === "undefined") && curValue !== "") || curValue !== cellValue) {
            console.log("Will call success function now!");
            if (success(curValue)) {
                console.log("Success value true");
                cellValue = curValue; //persist value if successfully validated incase editor is used as header filter
            } else {
                console.log("Success value is false!");
            }

            setTimeout(function () {
                cell.getRow().normalizeHeight();
            }, 300)
        } else {
            console.log("Onchange cancel..");
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