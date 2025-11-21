function parseExpr (exprStr) {
    let expr = {};
    // Example strings. 
    // '"Team" = "VIT"'
    // ' "Team" = "SIT" '
    // "Team" = "VIT" (simpler)
    // "this" =~ ">9\d%" && "sanity_G32" =~ "92%" -> { "backgroundColor": "green"}
    // "this" =~ "92%" && "94%" -> { "backgroundColor": "yellow"} (INVALID: gracefully rejected)
    // "this" =~ "92%" && "this" =~ "94%" -> { "backgroundColor": "yellow"} (CORRECTED: valid syntax)
    // (("this" =~ ">9\d%" && "sanity_G32" =~ "94%") && ("this" =~ "93%" || "this" =~ "94%")) -> { "backgroundColor": "orange"}
    // More examples can be added in QueryParsersTest.js file
    exprStr = exprStr.trim();
    
    // Remove outer quotes if they exist
    exprStr = exprStr.replace(/^\s*'/, '');
    exprStr = exprStr.replace(/\s*'$/, '');
    
    return parseExpressionWithBraces(exprStr, false);
}

// New function to validate expressions more strictly and provide detailed error information
function validateExpr(exprStr) {
    
    exprStr = exprStr.replace(/^\s*'/, '');
    exprStr = exprStr.replace(/\s*'$/, '');
    
    return parseExpressionWithBraces(exprStr, true);
}

// Shared function implementing mongoFilters.js logic
function parseExpressionWithBraces(exprStr, isValidation, visited) {
    // Initialize visited set to track expressions and prevent infinite recursion
    if (!visited) {
        visited = new Set();
    }
    
    // Check if we've seen this expression before (infinite loop detection)
    if (visited.has(exprStr)) {
        return isValidation ? 
            { isValid: false, error: 'Invalid expression' } : 
            {};
    }
    visited.add(exprStr);
    
    let expr = {};
    let terms = [], type = '', inBrackets = 0;
    let curTerm = '';
    
    try {
        for (let i = 0; i < exprStr.length; i++) {
            if (exprStr[i] == '(') { inBrackets++ }
            if (exprStr[i] == ')') { inBrackets-- }
            if (exprStr[i] == '&' && exprStr[i+1] == '&' && inBrackets == 0) {
                terms.push(curTerm.trim()); curTerm = ''; i++;
                if (!type) {
                    type = '&&'; 
                } else if (type != '&&') {
                    // Cannot mix && and || at same level
                    return isValidation ? 
                        { isValid: false, error: 'Cannot mix && and || at same level' } : 
                        {};
                }
                continue;
            }
            if (exprStr[i] == '|' && exprStr[i+1] == '|' && inBrackets == 0) {
                terms.push(curTerm.trim()); curTerm = ''; i++;
                if (!type) {
                    type = '||'; 
                } else if (type != '||') {
                    // Cannot mix && and || at same level
                    return isValidation ? 
                        { isValid: false, error: 'Cannot mix && and || at same level' } : 
                        {};
                }
                continue;
            }
            if (!curTerm && exprStr[i] == ' ') {
                ; // skip white-space at start of new terms.
            } else {
                curTerm += exprStr[i];
            }
            if (i == exprStr.length - 1) {
                terms.push(curTerm.trim()); curTerm = '';
            }
        }
    } catch (e) {
        return isValidation ? 
            { isValid: false, error: 'Invalid expression syntax' } : 
            {};
    }

    if (terms.length == 1) {
        // Single term - recursively parse it (might contain nested expressions)
        let term = terms[0];
        let regex = term, negate = false;
        let m = regex.match(/^\s*!(.*)$/);
        if (m && m.length >= 1) {
            negate = true;
            regex = m[1];
        }
        // trim matching outer brackets only
        while (regex.trim().startsWith('(') && regex.trim().endsWith(')')) {
            let trimmed = regex.trim();
            let inner = trimmed.slice(1, -1);
            // Check if removing these parens keeps the expression balanced
            let parenCount = 0;
            let isBalanced = true;
            for (let i = 0; i < inner.length; i++) {
                if (inner[i] === '(') parenCount++;
                if (inner[i] === ')') parenCount--;
                if (parenCount < 0) {
                    isBalanced = false;
                    break;
                }
            }
            if (isBalanced && parenCount === 0) {
                regex = inner;
            } else {
                break;
            }
        }
        if (/&&/.test(regex) || /\|\|/.test(regex)) {
            if (isValidation) {
                return parseExpressionWithBraces(regex, true, visited);
            } else {
                if (negate) {
                    let nestedExpr = parseExpressionWithBraces(regex, false, visited);
                    if (Object.keys(nestedExpr).length === 0) {
                        return {};
                    }
                    expr["$not"] = nestedExpr;
                } else {
                    return parseExpressionWithBraces(regex, false, visited);
                }
            }
        } else {
            if (isValidation) {
                // Handle basic comparison operations for validation
                if (isValidComparison(regex)) {
                    return { isValid: true };
                } else {
                    return { isValid: false, error: 'Invalid expression' };
                }
            } else {
                // Handle basic comparison operations for parsing
                let m = regex.match(/^\s*"(.*?)"\s*=\s*"(.*?)"\s*$/);
                if (m && (m.length >= 2)) {
                    let comparisonExpr = {};
                    comparisonExpr["="] = {};
                    let key = m[1], value = m[2];
                    comparisonExpr["="].key = key;
                    comparisonExpr["="].value = value;
                    if (negate) {
                        expr["$not"] = comparisonExpr;
                    } else {
                        expr = comparisonExpr;
                    }
                    return expr;
                }
                m = regex.match(/^\s*"(.*?)"\s*=~\s*"(.*?)"\s*$/);
                if (m && (m.length >= 2)) {
                    let comparisonExpr = {};
                    comparisonExpr["=~"] = {};
                    let key = m[1], regexValue = m[2];
                    comparisonExpr["=~"].key = key;
                    comparisonExpr["=~"].regex = regexValue;
                    if (negate) {
                        expr["$not"] = comparisonExpr;
                    } else {
                        expr = comparisonExpr;
                    }
                    return expr;
                }
                // If we reach here, the expression didn't match any valid pattern
                return {};
            }
        }
    } else if (type == '&&' || type == '||') {
        if (isValidation) {
            // Validate all child terms
            for (let i = 0; i < terms.length; i++) {
                let validation = parseExpressionWithBraces(terms[i], true, visited);
                if (!validation.isValid) {
                    return validation; // Return first invalid term
                }
            }
            return { isValid: true };
        } else {
            // Parse all child terms
            let childFilters = [];
            for (let i = 0; i < terms.length; i++) {
                let childFilter = parseExpressionWithBraces(terms[i], false, visited);
                if (Object.keys(childFilter).length === 0) {
                    return {}; // graceful rejection if any child is invalid
                }
                childFilters.push(childFilter);
            }
            expr[type] = childFilters;
        }
    } else {
        // No operators found but multiple terms - shouldn't happen with proper parsing
        return isValidation ? 
            { isValid: false, error: 'Invalid expression' } : 
            {};
    }
    
    return isValidation ? { isValid: true } : expr;
}

// Helper function to check if expression is a valid comparison
function isValidComparison(exprStr) {
    // Check for = operator
    let m = exprStr.match(/^\s*"(.*?)"\s*=\s*"(.*?)"\s*$/);
    if (m && (m.length >= 2)) {
        return true;
    }
    // Check for =~ operator
    m = exprStr.match(/^\s*"(.*?)"\s*=~\s*"(.*?)"\s*$/);
    if (m && (m.length >= 2)) {
        return true;
    }
    return false;
}

function evalExpr (expr, data, thisValue) {
    if (!expr || Object.keys(expr).length === 0) {
        return false;
    }  
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
        if (key === "$not") {
            // Return the negation of the nested expression
            return !evalExpr(expr["$not"], data, thisValue);
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
    return false;
}

module.exports = {
    parseExpr,
    evalExpr,
    validateExpr
};