
function parseExpr (exprStr) {
    let expr = {};
    // Example strings. 
    // '"Team" = "VIT"'
    // ' "Team" = "SIT" '
    // "Team" = "VIT" (simpler)
    exprStr = exprStr.replace(/^\s*'/, '');
    exprStr = exprStr.replace(/\s*'$/, '');
    let m = exprStr.match(/^\s*"(.*?)"\s*=\s*"(.*?)"\s*$/);
    if (m && (m.length >= 2)) {
        expr["="] = {};
        let key = m[1], value = m[2];
        /*
        let quotesMatch = m[0].match(/^"(.*)"$/);
        if (quotesMatch && quotesMatch.length >= 1)
            key = quotesMatch[0];
        quotesMatch = m[1].match(/^"(.*)"$/);
        if (quotesMatch && quotesMatch.length >= 1)
            value = quotesMatch[0];
        */
        expr["="].key = key;
        expr["="].value = value;
    }
    return expr;
}

function evalExpr (expr, data) {
    for (let key in expr) {
        if (key === "=") {
            let equalsExpr = expr[key];
            let rowValue = data[equalsExpr["key"]];
            if (rowValue === equalsExpr["value"]) {
                return true;
            } else {
                return false;
            }
        }
        // For other operators like 'and', 'or' - recurse here. 
    }
}

export default {
    parseExpr, 
    evalExpr
}