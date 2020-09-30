function MyTextArea(cell, onRendered, success, cancel, editorParams) {
    var self = this,
        cellValue = cell.getValue(),
        vertNav = editorParams.verticalNavigation || "hybrid",
        value = String(cellValue !== null && typeof cellValue !== "undefined" ? cellValue : ""),
        count = (value.match(/(?:\r\n|\r|\n)/g) || []).length + 1,
        input = document.createElement("textarea"),
        scrollHeight = 0;

    //create and style input
    input.style.display = "block";
    input.style.padding = "2px";
    input.style.height = "100%";
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

    input.value = value;

    onRendered(function () {
        input.focus({
            preventScroll: true
        });
        input.style.height = "100%";
    });

    function onChange(e) {

        if (((cellValue === null || typeof cellValue === "undefined") && input.value !== "") || input.value !== cellValue) {

            if (success(input.value)) {
                cellValue = input.value; //persist value if successfully validated incase editor is used as header filter
            }

            setTimeout(function () {
                cell.getRow().normalizeHeight();
            }, 300)
        } else {
            cancel();
        }
    }

    //submit new value on blur or change
    input.addEventListener("change", onChange);
    input.addEventListener("blur", onChange);
    // This is how you can retain focus while editing. 
    // You also have to disable blur I think. 
    // This is experimental. 
    //window.addEventListener("mousedown", onChange);
    //input.addEventListener("mousedown", function (e) {
    //    e.stopPropagation();
    //})
    input.addEventListener("keyup", function () {

        // Jayaram: 8/23 change, only set height if it is different in the
        // below block. 
        //input.style.height = "";

        var heightNow = input.scrollHeight;

        //input.style.height = heightNow + "px";

        if (!scrollHeight) scrollHeight = heightNow;
        if (heightNow != scrollHeight) {
            console.log("ScrollHeight, heightNow", scrollHeight, heightNow);
            input.style.height = heightNow + "px";
            scrollHeight = heightNow;
            cell.getRow().normalizeHeight();
        }
    });

    input.addEventListener("keydown", function (e) {

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
                if (vertNav == "editor" || (vertNav == "hybrid" && input.selectionStart)) {
                    e.stopImmediatePropagation();
                    e.stopPropagation();
                }

                break;

            case 40: //down arrow
                if (vertNav == "editor" || (vertNav == "hybrid" && input.selectionStart !== input.value.length)) {
                    e.stopImmediatePropagation();
                    e.stopPropagation();
                }
                break;
            default:
                break;

        }
    });

    if (editorParams.mask) {
        this.table.modules.edit.maskInput(input, editorParams);
    }

    return input;
}

export default MyTextArea;