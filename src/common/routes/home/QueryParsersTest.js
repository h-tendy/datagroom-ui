// Import the actual QueryParsers functions using CommonJS require
const { parseExpr, evalExpr, validateExpr } = require('./QueryParsers.js');

// Test cases with embedded test data - each test is self-contained
const testCases = [
    {
        name: "Example 1",
        expression: '"Team" = "VIT"',
        testData: {
            "Team": "VIT",
            "Department": "SIT", 
            "Score": "95%"
        },
        expected: true,
        description: "Basic equality from comment: '\"Team\" = \"VIT\"'"
    },
    {
        name: "Example 2", 
        expression: ' "Team" = "SIT" ',
        testData: {
            "Team": "VIT",
            "Department": "SIT"
        },
        expected: false,
        description: "Equality with spaces from comment: ' \"Team\" = \"SIT\" '"
    },
    {
        name: "Example 3",
        expression: '"Department" = "SIT"',
        testData: {
            "Team": "VIT",
            "Department": "SIT"
        },
        expected: true,
        description: "Simpler syntax from comment: \"Team\" = \"VIT\" (simpler) - testing different field"
    },
    {
        name: "Example 4 - Fixed Pattern",
        expression: '"this" =~ "9\\d%" && "sanity_G32" =~ "92%"',
        testData: {
            "Score": "95%",
            "sanity_G32": "92%"
        },
        thisValue: "Score",
        expected: true,
        description: "Complex AND from comment (fixed regex to match 9X%): \"this\" =~ \">9\\d%\" && \"sanity_G32\" =~ \"92%\""
    },
    {
        name: "Example 5 - Original Pattern Analysis",
        expression: '"this" =~ ">9\\d%" && "sanity_G32" =~ "92%"',
        testData: {
            "Score": "95%",
            "sanity_G32": "92%"
        },
        thisValue: "Score", 
        expected: false,
        description: "Original pattern expects literal '>' character in data"
    },
    {
        name: "Example 6 - Valid expression",
        expression: '"this" =~ "93%" && "this" =~ "94%"',
        testData: {
            "Performance": "93%"
        },
        thisValue: "Performance",
        expected: false,
        description: "\"this\" =~ \"93%\" && \"this\" =~ \"94%\""
    },
    {
        name: "Example 7 - Fixed Pattern",
        expression: '(("this" =~ "9\\d%" && "sanity_G32" =~ "92%") && ("this" =~ "93%" || "this" =~ "94%"))',
        testData: {
            "Score": "95%",
            "sanity_G32": "92%"
        },
        thisValue: "Score",
        expected: false,
        description: "Complex nested from comment (fixed regex): Score=95% matches 9\\d%, sanity_G32=92% matches, but 95% doesn't match 93% or 94%"
    },
    {
        name: "Basic OR operation",
        expression: '"Team" = "VIT" || "Team" = "INVALID"',
        testData: {
            "Team": "VIT"
        },
        expected: true,
        description: "OR with first condition true"
    },
    {
        name: "Basic AND operation", 
        expression: '"Team" = "VIT" && "Status" = "Active"',
        testData: {
            "Team": "VIT",
            "Status": "Active"
        },
        expected: true,
        description: "AND with both conditions true"
    },
    {
        name: "Regex percentage pattern",
        expression: '"Score" =~ "9[0-9]%"',
        testData: {
            "Score": "95%"
        },
        expected: true,
        description: "Regex matching 90-99% range"
    },
    {
        name: "This keyword usage",
        expression: '"this" =~ "Active"',
        testData: {
            "Status": "Active"
        },
        thisValue: "Status",
        expected: true,
        description: "This keyword resolving to Status field"
    },
    {
        name: "Operator precedence without brackets (INVALID)",
        expression: '"Team" = "INVALID" || "Department" = "SIT" && "Status" = "Active"',
        testData: {
            "Team": "VIT",
            "Department": "SIT", 
            "Status": "Active"
        },
        expected: false,
        description: "Cannot mix && and || at same level without brackets - should be gracefully rejected"
    },
    {
        name: "Operator precedence with brackets (VALID)",
        expression: '("Team" = "INVALID" || "Department" = "SIT") && "Status" = "Active"',
        testData: {
            "Team": "VIT",
            "Department": "SIT", 
            "Status": "Active"
        },
        expected: true,
        description: "With brackets, mixing && and || is allowed and should work correctly"
    },
    {
        name: "Invalid syntax graceful handling",
        expression: '"this" =~ "93%" && "94%"',
        testData: {
            "Score": "93%"
        },
        thisValue: "Score",
        expected: false,
        description: "Invalid syntax should be gracefully rejected (no styling applied) - missing field and operator in second part"
    },
    {
        name: "Standalone string graceful handling",
        expression: '"94%"',
        testData: {
            "Score": "94%"
        },
        expected: false,
        description: "Standalone strings without operators should be gracefully rejected (no styling applied)"
    },
    {
        name: "Mixed operators without brackets",
        expression: '"Team" = "INVALID" || "Department" = "SIT" && "Status" = "Active"',
        testData: { "Team": "VIT", "Department": "SIT", "Status": "Active" },
        expected: false,
        description: "This is confusing for non-programmers - requires brackets for clarity"
    },
    {
        name: "Same expression with proper brackets",
        expression: '("Team" = "INVALID" || "Department" = "SIT") && "Status" = "Active"',
        testData: { "Team": "VIT", "Department": "SIT", "Status": "Active" },
        expected: true,
        description: "Clear intention: (OR condition) AND another condition"
    },
    {
        name: "Alternative bracketing", 
        expression: '"Team" = "INVALID" || ("Department" = "SIT" && "Status" = "Active")',
        testData: { "Team": "VIT", "Department": "SIT", "Status": "Active" },
        expected: true,
        description: "Clear intention: OR condition OR (AND condition)"
    },
    {
        name: "NOT operator - simple negation",
        expression: '!"Team" = "VIT"',
        testData: { "Team": "SIT" },
        expected: true,
        description: "Negation of equality: Team is NOT VIT"
    },
    {
        name: "NOT operator - simple negation false case",
        expression: '!"Team" = "VIT"',
        testData: { "Team": "VIT" },
        expected: false,
        description: "Negation of equality fails when value matches"
    },
    {
        name: "NOT operator with regex",
        expression: '!"Score" =~ "9[0-9]%"',
        testData: { "Score": "85%" },
        expected: true,
        description: "Negation of regex: Score is NOT in 90-99% range"
    },
    {
        name: "NOT operator with regex false case",
        expression: '!"Score" =~ "9[0-9]%"',
        testData: { "Score": "95%" },
        expected: false,
        description: "Negation of regex fails when value matches pattern"
    },
    {
        name: "NOT operator with this keyword",
        expression: '!"this" = "Active"',
        testData: { "Status": "Inactive" },
        thisValue: "Status",
        expected: true,
        description: "Negation with 'this' keyword - status is NOT Active"
    },
    {
        name: "NOT operator with this keyword false case",
        expression: '!"this" = "Active"',
        testData: { "Status": "Active" },
        thisValue: "Status",
        expected: false,
        description: "Negation with 'this' keyword fails when value matches"
    },
    {
        name: "NOT operator with parentheses",
        expression: '!("Team" = "VIT")',
        testData: { "Team": "SIT" },
        expected: true,
        description: "Negation with parentheses for clarity"
    },
    {
        name: "NOT operator with complex AND expression",
        expression: '!("Team" = "VIT" && "Status" = "Active")',
        testData: { "Team": "VIT", "Status": "Inactive" },
        expected: true,
        description: "Negation of AND: NOT (Team=VIT AND Status=Active)"
    },
    {
        name: "NOT operator with complex AND expression false case",
        expression: '!("Team" = "VIT" && "Status" = "Active")',
        testData: { "Team": "VIT", "Status": "Active" },
        expected: false,
        description: "Negation of AND fails when both conditions are true"
    },
    {
        name: "NOT operator with complex OR expression",
        expression: '!("Team" = "VIT" || "Team" = "SIT")',
        testData: { "Team": "MIT" },
        expected: true,
        description: "Negation of OR: Team is neither VIT nor SIT"
    },
    {
        name: "NOT operator with complex OR expression false case",
        expression: '!("Team" = "VIT" || "Team" = "SIT")',
        testData: { "Team": "VIT" },
        expected: false,
        description: "Negation of OR fails when one condition is true"
    },
    {
        name: "NOT operator in AND combination",
        expression: '!"Team" = "VIT" && "Status" = "Active"',
        testData: { "Team": "SIT", "Status": "Active" },
        expected: true,
        description: "NOT Team=VIT AND Status=Active"
    },
    {
        name: "NOT operator in AND combination false case 1",
        expression: '!"Team" = "VIT" && "Status" = "Active"',
        testData: { "Team": "VIT", "Status": "Active" },
        expected: false,
        description: "Fails when Team is VIT (first condition false)"
    },
    {
        name: "NOT operator in AND combination false case 2",
        expression: '!"Team" = "VIT" && "Status" = "Active"',
        testData: { "Team": "SIT", "Status": "Inactive" },
        expected: false,
        description: "Fails when Status is not Active (second condition false)"
    },
    {
        name: "NOT operator in OR combination",
        expression: '!"Team" = "VIT" || "Status" = "Active"',
        testData: { "Team": "VIT", "Status": "Active" },
        expected: true,
        description: "NOT Team=VIT OR Status=Active (second condition saves it)"
    },
    {
        name: "NOT operator in OR combination true case 2",
        expression: '!"Team" = "VIT" || "Status" = "Active"',
        testData: { "Team": "SIT", "Status": "Inactive" },
        expected: true,
        description: "NOT Team=VIT OR Status=Active (first condition saves it)"
    },
    {
        name: "NOT operator in OR combination false case",
        expression: '!"Team" = "SIT" || "Status" = "Active"',
        testData: { "Team": "SIT", "Status": "Inactive" },
        expected: false,
        description: "Both conditions fail: Team IS SIT (NOT fails) and Status is not Active"
    },
    {
        name: "Multiple NOT operators with AND",
        expression: '!"Team" = "VIT" && !"Status" = "Active"',
        testData: { "Team": "SIT", "Status": "Inactive" },
        expected: true,
        description: "Team is NOT VIT AND Status is NOT Active"
    },
    {
        name: "Multiple NOT operators with AND false case",
        expression: '!"Team" = "VIT" && !"Status" = "Active"',
        testData: { "Team": "SIT", "Status": "Active" },
        expected: false,
        description: "Second NOT condition fails when Status is Active"
    },
    {
        name: "Multiple NOT operators with OR",
        expression: '!"Team" = "VIT" || !"Status" = "Active"',
        testData: { "Team": "VIT", "Status": "Inactive" },
        expected: true,
        description: "Team is VIT (first fails) OR Status is NOT Active (second succeeds)"
    },
    {
        name: "NOT with nested parentheses",
        expression: '!(("Team" = "VIT" || "Team" = "SIT") && "Status" = "Active")',
        testData: { "Team": "VIT", "Status": "Inactive" },
        expected: true,
        description: "Negation of complex nested expression"
    },
    {
        name: "NOT with nested parentheses false case",
        expression: '!(("Team" = "VIT" || "Team" = "SIT") && "Status" = "Active")',
        testData: { "Team": "VIT", "Status": "Active" },
        expected: false,
        description: "Negation fails when nested expression is true"
    },
    {
        name: "NOT with regex pattern matching",
        expression: '!"Score" =~ "[8-9][0-9]%"',
        testData: { "Score": "75%" },
        expected: true,
        description: "Score is NOT in 80-99% range"
    },
    {
        name: "NOT with regex pattern matching false case",
        expression: '!"Score" =~ "[8-9][0-9]%"',
        testData: { "Score": "85%" },
        expected: false,
        description: "Negation fails when score matches 80-99% range"
    },
    {
        name: "Complex NOT with multiple conditions",
        expression: '!("Team" = "VIT" && "Score" =~ "9[0-9]%" && "Status" = "Active")',
        testData: { "Team": "VIT", "Score": "95%", "Status": "Inactive" },
        expected: true,
        description: "NOT of three AND conditions - one fails so NOT succeeds"
    },
    {
        name: "Complex NOT with multiple conditions false case",
        expression: '!("Team" = "VIT" && "Score" =~ "9[0-9]%" && "Status" = "Active")',
        testData: { "Team": "VIT", "Score": "95%", "Status": "Active" },
        expected: false,
        description: "All conditions true, so NOT fails"
    },
    {
        name: "NOT operator with 'this' and regex",
        expression: '!"this" =~ "9[0-9]%"',
        testData: { "Score": "85%" },
        thisValue: "Score",
        expected: true,
        description: "This (Score) does NOT match 90-99% pattern"
    },
    {
        name: "Double negation (NOT of NOT) - not supported",
        expression: '!!("Team" = "VIT")',
        testData: { "Team": "VIT" },
        expected: false,
        description: "Double negation with !! is not a valid pattern and should be gracefully rejected"
    },
    {
        name: "Double negation alternative - nested NOT with parens - not supported",
        expression: '!(!("Team" = "VIT"))',
        testData: { "Team": "VIT" },
        expected: false,
        description: "Nested double negation !(!(...)) is not currently supported and should be gracefully rejected"
    },
    {
        name: "NOT in complex bracketed expression",
        expression: '(!"Team" = "VIT" && "Score" =~ "9[0-9]%") || "Status" = "Active"',
        testData: { "Team": "SIT", "Score": "95%", "Status": "Inactive" },
        expected: true,
        description: "First part true: NOT Team=VIT AND high score"
    },
    {
        name: "NOT expression with empty/missing field",
        expression: '!"NonExistent" = "Value"',
        testData: { "Team": "VIT" },
        expected: true,
        description: "NOT on non-existent field should be true (undefined != Value)"
    },
    {
        name: "Another mixed example",
        expression: '"Score" =~ "9[0-9]%" && "Grade" = "A" || "Bonus" = "Yes"',
        testData: { "Score": "95%", "Grade": "A", "Bonus": "No" },
        expected: false,
        description: "Ambiguous - could be (Score AND Grade) OR Bonus, or Score AND (Grade OR Bonus)"
    },
    {
        name: "Same with brackets (interpretation 1)",
        expression: '("Score" =~ "9[0-9]%" && "Grade" = "A") || "Bonus" = "Yes"',
        testData: { "Score": "95%", "Grade": "A", "Bonus": "No" },
        expected: true,
        description: "Clear: High score with A grade, OR has bonus"
    },
    {
        name: "Same with brackets (interpretation 2)",
        expression: '"Score" =~ "9[0-9]%" && ("Grade" = "A" || "Bonus" = "Yes")',
        testData: { "Score": "95%", "Grade": "A", "Bonus": "No" },
        expected: true,
        description: "Clear: High score AND (has A grade OR has bonus)"
    },
    {
        name: "Invalid partial expression",
        expression: '"this" =~ "92%" || "94%"',
        testData: { "Score": "92%" },
        thisValue: "Score",
        expected: false,
        description: "Invalid expression should be gracefully rejected"
    },
    {
        name: "Another invalid partial expression",
        expression: '"this" =~ "93%" && "94%"',
        testData: { "Score": "93%" },
        thisValue: "Score",
        expected: false,
        description: "Invalid expression should be gracefully rejected"
    },
    {
        name: "Standalone string validation",
        expression: '"standalone"',
        testData: { "Field": "standalone" },
        expected: false,
        description: "Standalone string should be gracefully rejected"
    },
    {
        name: "Valid simple expression check",
        expression: '"Team" = "VIT"',
        testData: { "Team": "VIT" },
        expected: true,
        description: "Simple valid expression"
    },
    {
        name: "Completely invalid syntax",
        expression: 'invalid expression',
        testData: { "Field": "value" },
        expected: false,
        description: "Invalid syntax should be gracefully rejected"
    },
    {
        name: "Incomplete expression",
        expression: '"Team" = ',
        testData: { "Team": "VIT" },
        expected: false,
        description: "Incomplete expression should be gracefully rejected"
    },
    {
        name: "Mixed operators without brackets validation",
        expression: '"Team" = "VIT" || "Department" = "SIT" && "Status" = "Active"',
        testData: { "Team": "VIT", "Department": "SIT", "Status": "Active" },
        expected: false,
        description: "Mixed operators without brackets should be rejected"
    },
    {
        name: "Mixed operators with brackets validation",
        expression: '("Team" = "VIT" || "Department" = "SIT") && "Status" = "Active"',
        testData: { "Team": "VIT", "Department": "SIT", "Status": "Active" },
        expected: true,
        description: "Mixed operators with proper brackets should be valid"
    },
    {
        name: "Another mixed operators pattern validation",
        expression: '"Team" = "VIT" && "Department" = "SIT" || "Status" = "Active"',
        testData: { "Team": "VIT", "Department": "SIT", "Status": "Active" },
        expected: false,
        description: "Mixed operators without brackets should be rejected"
    },
    {
        name: "Mixed operators with brackets alternate validation",
        expression: '"Team" = "VIT" && ("Department" = "SIT" || "Status" = "Active")',
        testData: { "Team": "VIT", "Department": "SIT", "Status": "Active" },
        expected: true,
        description: "Mixed operators with proper brackets should be valid"
    },
    {
        name: "Invalid NOT - missing expression after NOT",
        expression: '!',
        testData: { "Team": "VIT" },
        expected: false,
        description: "Invalid: NOT operator without expression should be gracefully rejected"
    },
    {
        name: "Invalid NOT - NOT with standalone string",
        expression: '!"standalone"',
        testData: { "Field": "standalone" },
        expected: false,
        description: "Invalid: NOT with just a string should be gracefully rejected"
    },
    {
        name: "Invalid NOT - incomplete expression after NOT",
        expression: '!"Team" = ',
        testData: { "Team": "VIT" },
        expected: false,
        description: "Invalid: Incomplete expression after NOT should be gracefully rejected"
    },
    {
        name: "Invalid NOT - misplaced NOT operator",
        expression: '"Team" ! = "VIT"',
        testData: { "Team": "VIT" },
        expected: false,
        description: "Invalid: Misplaced NOT operator should be gracefully rejected"
    },
    {
        name: "Depth limit test - deeply nested NOT",
        expression: '!(!(!(!(!(!(!(!(!(!("Team" = "VIT"))))))))',
        testData: { "Team": "VIT" },
        expected: false,
        description: "Even depth of NOTs (10 levels) - should equal original if not too deep"
    },
    {
        name: "NOT with mixed operators requiring brackets",
        expression: '!"Team" = "VIT" || "Department" = "SIT" && "Status" = "Active"',
        testData: { "Team": "SIT", "Department": "SIT", "Status": "Active" },
        expected: false,
        description: "Mixed operators without brackets should be rejected even with NOT"
    },
    {
        name: "NOT with properly bracketed mixed operators",
        expression: '(!"Team" = "VIT" || "Department" = "SIT") && "Status" = "Active"',
        testData: { "Team": "SIT", "Department": "MIT", "Status": "Active" },
        expected: true,
        description: "NOT with properly bracketed mixed operators should work"
    }
];

// Console colors for better output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m', 
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function colorize(text, color) {
    return `${colors[color]}${text}${colors.reset}`;
}

function runTest(testCase, index) {
    console.log(colorize(`\n${index + 1}. ${testCase.name}`, 'bold'));
    console.log(`Expression: ${colorize(testCase.expression, 'cyan')}`);
    console.log(`Description: ${testCase.description}`);
    console.log(`Test Data: ${colorize(JSON.stringify(testCase.testData), 'blue')}`);
    if (testCase.thisValue) {
        console.log(`This Value: ${colorize(testCase.thisValue, 'yellow')}`);
    }
    
    try {
        // Parse the expression
        const parsedExpr = parseExpr(testCase.expression);
        
        // Evaluate the expression using the test case's own data
        const result = evalExpr(parsedExpr, testCase.testData, testCase.thisValue);
        
        // Check if test passed
        const passed = result === testCase.expected;
        const resultColor = passed ? 'green' : 'red';
        
        console.log(`Expected: ${colorize(testCase.expected, 'blue')}, Got: ${colorize(result, resultColor)}`);
        console.log(colorize(passed ? 'PASS' : 'FAIL', resultColor));
        
        if (!passed) {
            console.log(colorize(`   Parsed AST: ${JSON.stringify(parsedExpr, null, 2)}`, 'yellow'));
        }
        
        return passed;
    } catch (error) {
        console.log(colorize(`UNEXPECTED ERROR: ${error.message}`, 'red'));
        console.log(colorize(`   This should not happen with graceful error handling!`, 'red'));
        return false;
    }
}

function runAllTests() {
    console.log(colorize('='.repeat(70), 'bold'));
    console.log(colorize('QUERYPARSER EXPRESSION TEST SUITE', 'bold'));
    console.log(colorize('Testing all examples from QueryParsers.js comments', 'bold'));
    console.log(colorize('Each test case includes its own test data', 'bold'));
    console.log(colorize('='.repeat(70), 'bold'));
    
    let passedTests = 0;
    let totalTests = testCases.length;
    
    testCases.forEach((testCase, index) => {
        if (runTest(testCase, index)) {
            passedTests++;
        }
    });
    
    console.log(colorize('\n' + '='.repeat(70), 'bold'));
    console.log(colorize(`OVERALL TEST SUMMARY: ${passedTests}/${totalTests} tests passed`, 'bold'));
    console.log(colorize('='.repeat(70), 'bold'));
    
    if (passedTests === totalTests) {
        console.log(colorize('ALL TESTS PASSED!', 'green'));
    } else {
        console.log(colorize(`${totalTests - passedTests} test(s) failed`, 'yellow'));
    }
    
    return passedTests === totalTests;
}

// Main execution
if (require.main === module) {
    const success = runAllTests();
    process.exit(success ? 0 : 1);
}
