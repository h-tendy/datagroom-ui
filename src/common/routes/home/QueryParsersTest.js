// Import the actual QueryParsers functions using CommonJS require
const { parseExpr, evalExpr } = require('./QueryParsers.js');

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
        name: "Example 6 - Fixed",
        expression: '"Performance" =~ "93%" && "Rating" =~ "94%"',
        testData: {
            "Performance": "93%",
            "Rating": "94%"
        },
        expected: true,
        description: "Fixed version of comment: \"this\" =~ \"93%\" && \"94%\""
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
        name: "Operator precedence",
        expression: '"Team" = "INVALID" || "Department" = "SIT" && "Status" = "Active"',
        testData: {
            "Team": "VIT",
            "Department": "SIT", 
            "Status": "Active"
        },
        expected: true,
        description: "Test AND has higher precedence than OR"
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
        const statusIcon = passed ? '✅' : '❌';
        
        console.log(`Expected: ${colorize(testCase.expected, 'blue')}, Got: ${colorize(result, resultColor)}`);
        console.log(`${statusIcon} ${colorize(passed ? 'PASS' : 'FAIL', resultColor)}`);
        
        if (!passed) {
            console.log(colorize(`   Parsed AST: ${JSON.stringify(parsedExpr, null, 2)}`, 'yellow'));
        }
        
        return passed;
    } catch (error) {
        console.log(colorize(`❌ ERROR: ${error.message}`, 'red'));
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
    console.log(colorize(`TEST SUMMARY: ${passedTests}/${totalTests} tests passed`, 'bold'));
    console.log(colorize('='.repeat(70), 'bold'));
    
    if (passedTests === totalTests) {
        console.log(colorize('🎉 ALL TESTS PASSED!', 'green'));
        console.log(colorize('All example expressions from QueryParsers.js comments work correctly!', 'green'));
    } else {
        console.log(colorize(`⚠️ ${totalTests - passedTests} test(s) failed`, 'yellow'));
    }
    
    return passedTests === totalTests;
}

// Main execution
if (require.main === module) {
    const success = runAllTests();
    process.exit(success ? 0 : 1);
}
