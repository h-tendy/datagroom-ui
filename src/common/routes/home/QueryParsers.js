// @ts-check
function parseExpr (exprStr) {
    let expr = {};
    // Example strings. 
    // '"Team" = "VIT"'
    // ' "Team" = "SIT" '
    // "Team" = "VIT" (simpler)
    // "this" =~ ">9\d%" && "sanity_G32" =~ "92%" -> { "backgroundColor": "green"}
    // "this" =~ "93%" && "94%" -> { "backgroundColor": "yellow"}
    // (("this" =~ ">9\d%" && "sanity_G32" =~ "94%") && ("this" =~ "93%" || "this" =~ "94%")) -> { "backgroundColor": "orange"}
    exprStr = exprStr.trim();
    
    // Remove outer quotes if they exist
    exprStr = exprStr.replace(/^\s*'/, '');
    exprStr = exprStr.replace(/\s*'$/, '');
    
    // Handle parentheses grouping first
    if (exprStr.startsWith('(') && exprStr.endsWith(')')) {
        // Check if the parentheses are balanced and represent the entire expression
        let parenCount = 0;
        let isOuterParen = true;
        for (let i = 0; i < exprStr.length; i++) {
            if (exprStr[i] === '(') parenCount++;
            if (exprStr[i] === ')') parenCount--;
            // If we reach 0 before the end, the outer parens don't wrap everything
            if (parenCount === 0 && i < exprStr.length - 1) {
                isOuterParen = false;
                break;
            }
        }
        if (isOuterParen) {
            return parseExpr(exprStr.slice(1, -1));
        }
    }
    
    // Handle '||' operations (lower precedence)
    let orParts = splitByOperator(exprStr, '||');
    if (orParts.length > 1) {
        expr["||"] = orParts.map(part => parseExpr(part.trim()));
        return expr;
    }
    
    // Handle '&&' operations (higher precedence)
    let andParts = splitByOperator(exprStr, '&&');
    if (andParts.length > 1) {
        expr["&&"] = andParts.map(part => parseExpr(part.trim()));
        return expr;
    }
    
    // Handle basic comparison operations
    let m = exprStr.match(/^\s*"(.*?)"\s*=\s*"(.*?)"\s*$/);
    if (m && (m.length >= 2)) {
        expr["="] = {};
        let key = m[1], value = m[2];
        expr["="].key = key;
        expr["="].value = value;
        return expr;
    }
    m = exprStr.match(/^\s*"(.*?)"\s*=~\s*"(.*?)"\s*$/);
    if (m && (m.length >= 2)) {
        expr["=~"] = {};
        let key = m[1], regex = m[2];
        expr["=~"].key = key;
        expr["=~"].regex = regex;
        return expr;
    }
    return expr;
}

// Helper function to split expression by operator while respecting parentheses
function splitByOperator(exprStr, operator) {
    let parts = [];
    let currentPart = '';
    let parenCount = 0;
    let i = 0;
    
    while (i < exprStr.length) {
        let char = exprStr[i];
        
        if (char === '(') {
            parenCount++;
            currentPart += char;
        } else if (char === ')') {
            parenCount--;
            currentPart += char;
        } else if (parenCount === 0 && exprStr.substring(i, i + operator.length + 2) === ` ${operator} `) {
            // Found operator at top level (not inside parentheses)
            parts.push(currentPart);
            currentPart = '';
            i += operator.length + 1; // Skip the operator and spaces
        } else {
            currentPart += char;
        }
        i++;
    }
    
    if (currentPart) {
        parts.push(currentPart);
    }
    
    return parts;
}

function evalExpr (expr, data, thisValue) {
    let key;
    for (key in expr) {
        if (key === "=") {
            let equalsExpr = expr[key];
            let equalsExprKey = equalsExpr["key"];
            if (equalsExprKey === "this") {
                equalsExprKey = thisValue;
            }
            let rowValue = data[equalsExprKey];
            return rowValue === equalsExpr["value"];
        }
        if (key === "=~") {
            let equalsExpr = expr[key];
            let equalsExprKey = equalsExpr["key"];
            if (equalsExprKey === "this") {
                equalsExprKey = thisValue;
            }
            let rowValue = data[equalsExprKey];
            let regex = new RegExp(equalsExpr["regex"], "i");
            return regex.test(rowValue);
        }
        if (key === "||") {
            // Return true if any sub-expression is true
            return expr["||"].some(subExpr => evalExpr(subExpr, data, thisValue));
        }
        if (key === "&&") {
            // Return true only if all sub-expressions are true
            return expr["&&"].every(subExpr => evalExpr(subExpr, data, thisValue));
        }
    }
}

export default {
    parseExpr, 
    evalExpr
}