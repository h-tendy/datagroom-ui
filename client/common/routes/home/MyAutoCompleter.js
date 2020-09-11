import QueryParsers from './QueryParsers';

function MyAutoCompleter (cell, onRendered, success, cancel, editorParams){
    var self = this,
    cellEl = cell.getElement(),
    // Jayaram - setting to null initially
    initialValue = cell.getValue(),
    //initialValue = null,
    vertNav = editorParams.verticalNavigation || "editor",
    initialDisplayValue = typeof initialValue !== "undefined" || initialValue === null ? initialValue : (typeof editorParams.defaultValue !== "undefined" ? editorParams.defaultValue : ""),
    input = document.createElement("input"),
    listEl = document.createElement("div"),
    allItems = [],
    displayItems = [],
    values = [],
    currentItem = false,
    blurable = true,
    uniqueColumnValues = false;

    // Store initial value. 
    var curVal = cell.getValue();
    console.log("curVal: ", curVal);
    initialValue = null;
    console.log("initialValue: ", initialValue);
    console.log("initialDisplayValue: ");

    if (editorParams.conditionalValues) {
        editorParams.values = [];
        let rowData = cell.getRow().getData();
        for (let i = 0; i < editorParams.conditionalExprs.length; i++) {
            // XXX: Add more error checking here
            let exprStr = editorParams.conditionalExprs[i].split(':')[0].trim();
            //console.log("exprStr is: ", exprStr);
            let expr = QueryParsers.parseExpr(exprStr);
            //console.log("expr is: ", expr);
            if (QueryParsers.evalExpr(expr, rowData)) {
                let values = editorParams.conditionalExprs[i].split(':')[1].trim();
                values = JSON.parse(values);
                //console.log("eval true: ", values);
                editorParams.values = values;
                break;
            } else {
                ;//console.log("eval false");
            }
        }
    }

    //style input
    input.setAttribute("type", "search");

    input.style.padding = "4px";
    input.style.width = "100%";
    input.style.boxSizing = "border-box";

    if(editorParams.elementAttributes && typeof editorParams.elementAttributes == "object"){
        for (let key in editorParams.elementAttributes){
            if(key.charAt(0) == "+"){
                key = key.slice(1);
                input.setAttribute(key, input.getAttribute(key) + editorParams.elementAttributes["+" + key]);
            }else{
                input.setAttribute(key, editorParams.elementAttributes[key]);
            }
        }
    }

    //style list element
    listEl.classList.add("tabulator-edit-select-list");

    listEl.addEventListener("mousedown", function(e){
        blurable = false;

        setTimeout(function(){
            blurable = true;
        }, 10);
    });


    function genUniqueColumnValues(){
        if(editorParams.values === true){
            uniqueColumnValues = getUniqueColumnValues();
        }else if(typeof editorParams.values === "string"){
            uniqueColumnValues = getUniqueColumnValues(editorParams.values);
        }
    }

    function getUniqueColumnValues(field){
        var output = {},
        data = self.table.getData(),
        column;

        if(field){
            column = self.table.columnManager.getColumnByField(field);
        }else{
            column = cell.getColumn()._getSelf();
        }

        if(column){
            data.forEach(function(row){
                var val = column.getFieldValue(row);

                if(val !== null && typeof val !== "undefined" && val !== ""){
                    output[val] = true;
                }
            });

            if(editorParams.sortValuesList){
                if(editorParams.sortValuesList == "asc"){
                    output = Object.keys(output).sort();
                }else{
                    output = Object.keys(output).sort().reverse();
                }
            }else{
                output = Object.keys(output);
            }
        }else{
            console.warn("unable to find matching column to create autocomplete lookup list:", field);
        }


        return output;
    }

    function subtractArray(matches, selectedCsvs) {
        let filteredMatches = [];
        for (let i = 0; i < matches.length; i++) {
            let found = false;
            for (let j = 0; j < selectedCsvs.length; j++) {
                if (matches[i].value === selectedCsvs[j].trim()) {
                    found = true; 
                    break;
                }
            }
            if (!found) filteredMatches.push(matches[i]);
        }
        return filteredMatches;
    }

    function filterList(term, intialLoad, selectedCsvs){
        var matches = [],
        values, items, searchEl;

        //lookup base values list
        if(uniqueColumnValues){
            values = uniqueColumnValues;
        }else{
            values = editorParams.values || [];
        }

        if(editorParams.searchFunc){
            matches = editorParams.searchFunc(term, values);

            if(matches instanceof Promise){

                addNotice(typeof editorParams.searchingPlaceholder !== "undefined" ? editorParams.searchingPlaceholder : "Searching...");

                matches.then((result) => {
                    result = parseItems(result);
                    let filteredResult = subtractArray(result, selectedCsvs);
                    fillListIfNotEmpty(filteredResult, intialLoad);
                }).catch((err) => {
                    console.err("error in autocomplete search promise:", err);
                });

            }else{
                matches = parseItems(matches);
                let filteredMatches = subtractArray(matches, selectedCsvs);
                fillListIfNotEmpty(filteredMatches, intialLoad);
            }
        }else{
            items = parseItems(values);

            // Jayaram, added term as null. 
            if(term === "" || term === null){
                if(editorParams.showListOnEmpty){
                    matches = items;
                }
            }else{
                items.forEach(function(item){
                    if(item.value !== null || typeof item.value !== "undefined"){
                        if(String(item.value).toLowerCase().indexOf(String(term).toLowerCase()) > -1 || String(item.title).toLowerCase().indexOf(String(term).toLowerCase()) > -1){
                            matches.push(item);
                        }
                    }
                });
            }
            let filteredMatches = subtractArray(matches, selectedCsvs);
            fillListIfNotEmpty(filteredMatches, intialLoad);
        }
    }

    function filterInvalids(selectedCsvs){
        var matches = [],
        values;

        //lookup base values list
        if(uniqueColumnValues){
            values = uniqueColumnValues;
        }else{
            values = editorParams.values || [];
        }
        if(editorParams.searchFunc){
            matches = editorParams.searchFunc("", values);
            // XXX: Doesn't work for Promises
            if(matches instanceof Promise){
                matches = [];
            }else{
                ;
            }
        }else{
            matches = values;
        }

        if (!Array.isArray(matches)) {
            matches = Object.keys(matches);
        }
        // You have matches now. Ensure selectedCsvs are all in matches. 
        let filteredValidCsvs = [];
        for (let i = 0; i < selectedCsvs.length; i++) {
            let found = false;
            for (let j = 0; j < matches.length; j++) {
                //console.log(`Cmp: ..${selectedCsvs[i].trim()}.. and ..${matches[j]}..`);
                if (selectedCsvs[i].trim() === matches[j]) {
                    found = true; break;
                }
            }
            if (found) filteredValidCsvs.push(selectedCsvs[i].trim());
        }
        return filteredValidCsvs;
    }

    function eliminateDups (values) {
        // Eliminate duplicates.
        let filteredMap = {};
        for (let i = 0; i < values.length; i++) {
            filteredMap[values[i]] = 1;
        }
        return Object.keys(filteredMap);
    }

    function addNotice(notice){
        var searchEl = document.createElement("div");

        clearList();

        if(notice !== false){
            searchEl.classList.add("tabulator-edit-select-list-notice");
            searchEl.tabIndex = 0;

            if(notice instanceof Node){
                searchEl.appendChild(notice);
            }else{
                searchEl.innerHTML = notice;
            }

            listEl.appendChild(searchEl);
        }
    }

    function parseItems(inputValues){
        var itemList = [];

        if(Array.isArray(inputValues)){
            inputValues.forEach(function(value){

                var item = {};

                if(typeof value === "object"){
                    item.title = editorParams.listItemFormatter ? editorParams.listItemFormatter(value.value, value.label) : value.label;
                    item.value = value.value;
                }else{
                    item.title = editorParams.listItemFormatter ? editorParams.listItemFormatter(value, value) : value;
                    item.value = value;
                }

                itemList.push(item);
            });
        }else{
            for(var key in inputValues){
                var item = {
                    title:editorParams.listItemFormatter ? editorParams.listItemFormatter(key, inputValues[key]) : inputValues[key],
                    value:key,
                };

                itemList.push(item);
            }
        }

        return itemList;
    }

    function clearList(){
        while(listEl.firstChild) listEl.removeChild(listEl.firstChild);
    }

    function fillListIfNotEmpty(items, intialLoad){
        if(items.length){
            fillList(items, intialLoad);
        }else{
            if(editorParams.emptyPlaceholder){
                addNotice(editorParams.emptyPlaceholder);
            }
        }
    }

    function fillList(items, intialLoad){
        var current = false;

        clearList();

        displayItems = items;

        displayItems.forEach(function(item){
            var el = item.element;

            if(!el){
                el = document.createElement("div");
                el.classList.add("tabulator-edit-select-list-item");
                el.tabIndex = 0;
                el.innerHTML = item.title;

                el.addEventListener("click", function(e){
                    setCurrentItem(item);
                    chooseItem();
                });

                el.addEventListener("mousedown", function(e){
                    blurable = false;

                    setTimeout(function(){
                        blurable = true;
                    }, 10);
                });

                item.element = el;

                if(intialLoad && item.value == initialValue){
                    input.value = item.title;
                    item.element.classList.add("active");
                    current = true;
                }

                if(item === currentItem){
                    item.element.classList.add("active");
                    current = true;
                }
            }

            listEl.appendChild(el);
        });

        if(!current){
            setCurrentItem(false);
        }
    }

    function isExactMatch(term){
        var matches = [],
        values, items, searchEl;

        //lookup base values list
        if(uniqueColumnValues){
            values = uniqueColumnValues;
        }else{
            values = editorParams.values || [];
        }

        if(editorParams.searchFunc){
            matches = editorParams.searchFunc(term, values);
            // Not ready for Promises
            if(matches instanceof Promise) {
                return {status: false, match: ""};
            }else{
                ;
            }
        }else{
            items = parseItems(values);

            if(term === ""){
                if(editorParams.showListOnEmpty){
                    matches = items;
                }
            }else{
                items.forEach(function(item){
                    if(item.value !== null || typeof item.value !== "undefined"){
                        if(String(item.value).toLowerCase().indexOf(String(term).toLowerCase()) > -1 || String(item.title).toLowerCase().indexOf(String(term).toLowerCase()) > -1){
                            matches.push(item);
                        }
                    }
                });
            }
        }
        if (matches.length === 1) {
            return {status: true, match: matches[0].value}
        } else {
            return {status: false, match: ""};
        }
    }

    function chooseItem(){
        hideList();

        if(currentItem){
            if(initialValue !== currentItem.value){
                //initialValue = currentItem.value;
                //input.value = currentItem.title;
                let successVal = "";
                let csvs = input.value.split(',');
                for (let i = 0; i < csvs.length - 1; i++) {
                    if (successVal) successVal += ', ';
                    successVal += csvs[i].trim();
                }
                if (successVal) successVal += ', '
                successVal += currentItem.value.trim();
                let vals = successVal.split(',');
                vals = eliminateDups (vals);
                if (!editorParams.freetext) {
                    vals = filterInvalids(vals);
                }
                successVal = vals.join(', ');
                success(successVal);
            }else{
                cancel();
            }
        } else {
            let successVal = "";
            let csvs = input.value.split(',');
            for (let i = 0; i < csvs.length - 1; i++) {
                if (successVal) successVal += ', ';
                successVal += csvs[i].trim();
            }
            // Deal with 'auto-complete' of last term. 
            let lastTerm = csvs[csvs.length - 1];
            let { status, match } = isExactMatch (lastTerm);
            if (status) {
                if (successVal) successVal += ', ';
                successVal += match;
            }

            if (csvs.length === 1 && editorParams.freetext) {
                if (successVal) successVal += ', ';
                successVal += input.value.trim();
            }
            if (successVal === "" && editorParams.allowEmpty) {
                success(successVal);
            } else if (successVal) {
                let vals = successVal.split(',');
                vals = eliminateDups (vals);
                if (!editorParams.freetext) {
                    vals = filterInvalids(vals);
                }
                successVal = vals.join(', ');
                success(successVal);
            } else {
                cancel();
            }
        }
    }
    
	function elOffset(el) {
		var box = el.getBoundingClientRect();

		return {
			top: box.top + window.pageYOffset - document.documentElement.clientTop,
			left: box.left + window.pageXOffset - document.documentElement.clientLeft
		};
	}

    function showList(){
        if(!listEl.parentNode){
            while(listEl.firstChild) listEl.removeChild(listEl.firstChild);

            var offset = elOffset(cellEl);

            listEl.style.minWidth = cellEl.offsetWidth + "px";

            listEl.style.top = (offset.top + cellEl.offsetHeight) + "px";
            listEl.style.left = offset.left + "px";
            document.body.appendChild(listEl);
        }
    }

    function setCurrentItem(item, showInputValue){
        if(currentItem && currentItem.element){
            currentItem.element.classList.remove("active");
        }

        currentItem = item;

        if(item && item.element){
            item.element.classList.add("active");
        }
    }

    function hideList(){
        if(listEl.parentNode){
            listEl.parentNode.removeChild(listEl);
        }

        removeScrollListener();
    }


    function cancelItem(){
        hideList();
        cancel();
    }

    function removeScrollListener() {
        self.table.rowManager.element.removeEventListener("scroll", cancelItem);
    }

    //allow key based navigation
    input.addEventListener("keydown", function(e){
        var index;

        switch(e.keyCode){
            case 38: //up arrow
            index = displayItems.indexOf(currentItem);

            if(vertNav == "editor" || (vertNav == "hybrid" && index)){
                e.stopImmediatePropagation();
                e.stopPropagation();
                e.preventDefault();

                if(index > 0){
                    setCurrentItem(displayItems[index - 1]);
                }else{
                    setCurrentItem(false);
                }
            }
            break;

            case 40: //down arrow

            index = displayItems.indexOf(currentItem);

            if(vertNav == "editor" || (vertNav == "hybrid" && index < displayItems.length - 1)){

                e.stopImmediatePropagation();
                e.stopPropagation();
                e.preventDefault();

                if(index < displayItems.length - 1){
                    if(index == -1){
                        setCurrentItem(displayItems[0]);
                    }else{
                        setCurrentItem(displayItems[index + 1]);
                    }
                }
            }
            break;


            case 37: //left arrow
            case 39: //right arrow
            e.stopImmediatePropagation();
            e.stopPropagation();
            // e.preventDefault();
            break;

            case 13: //enter
            chooseItem();
            break;

            case 27: //escape
            cancelItem();
            break;

            case 36: //home
            case 35: //end
            //prevent table navigation while using input element
            e.stopImmediatePropagation();
            break;
            default:
                break;
        }
    });

    input.addEventListener("keyup", function(e){

        switch(e.keyCode){
            case 38: //up arrow
            case 37: //left arrow
            case 39: //up arrow
            case 40: //right arrow
            case 13: //enter
            case 27: //escape
            break;

            default:
            let csvs = input.value.split(',');
            let selectedCsvs = [];
            if (csvs.length > 1) selectedCsvs = csvs.slice(0, csvs.length-1)
            filterList(csvs[csvs.length-1].trim(), false, selectedCsvs);
        }

    });

    input.addEventListener("search", function(e){
        // Appears to not be useful. 
        filterList(input.value, false, []);
    });

    input.addEventListener("blur", function(e){
        if(blurable){
            chooseItem();
        }
    });

    input.addEventListener("focus", function(e){
        genUniqueColumnValues();
        showList();

        input.value = (initialDisplayValue !== '' && initialDisplayValue !== null) ? initialDisplayValue + ',': '';

        let csvs = input.value.split(',');
        let selectedCsvs = [];
        if (csvs.length > 1) selectedCsvs = csvs.slice(0, csvs.length-1)
        filterList('', true, selectedCsvs);
    });


    onRendered(function(){
        input.style.height = "100%";
        input.focus({preventScroll: true});
    });

    if(editorParams.mask){
        this.table.modules.edit.maskInput(input, editorParams);
    }

    setTimeout(() => {
        this.table.rowManager.element.addEventListener("scroll", cancelItem);
    }, 10);

    genUniqueColumnValues();
    input.value = initialDisplayValue + ',';
    let csvs = input.value.split(',');
    let selectedCsvs = [];
    if (csvs.length > 1) selectedCsvs = csvs.slice(0, csvs.length-1)
    filterList('', true, selectedCsvs);

    return input;
}

export default MyAutoCompleter;