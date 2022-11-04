import ModalEditor from './ModalEditor';
const React = require('react');
const ReactDOM = require('react-dom');

function MyModalCodeMirror(cell, onRendered, success, cancel, editorParams, ctrlKey) {
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
    input.value = value;

    console.log("ctrlKey: ", ctrlKey);
    if (ctrlKey) {
        let div = document.createElement("div");
        document.body.appendChild(div);
        let cmRef = {};
        const PopupContent = () => {
            return (
                <ModalEditor show={true} 
                    title={"Edit"} text={value} onClose={clear} editorParams={editorParams}
                    cancel={"Cancel"} ok={"Done"} cmRef={cmRef}>
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
    onRendered(function () {
        /*
        input.focus({
            preventScroll: true
        });
        input.style.height = "100%"; */
        /*
        if (cmRef.ref) {
            cmRef.ref.refresh();
        }
        */
    });

    function onChange(e) {

        if (((cellValue === null || typeof cellValue === "undefined") && input.value !== "") || input.value !== cellValue) {

            if (success(input.value)) {
                cellValue = input.value; //persist value if successfully validated incase editor is used as header filter
            }
            /*
            setTimeout(function () {
                cell.getRow().normalizeHeight();
            }, 300) */
        } else {
            cancel();
        }
    }

    //submit new value on blur or change
    //input.addEventListener("change", onChange);

    if (editorParams.mask) {
        this.table.modules.edit.maskInput(input, editorParams);
    }

    return input;
}

export default MyModalCodeMirror;