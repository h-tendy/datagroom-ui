// Given a string (newData), collects fully formed JSONs that
// are in the string as a list. Returns the pointer to the next
// byte to process from when you have new data. Note that this
// can point to somewhere in the middle for incomplete jsons. 
function parseJsonEvents (newData, records) {
    let startRec = -1, endRec = -1; let inRec = false; let openParen = 0;
    for (let i = 0; i < newData.length; i++) {
        if (newData[i] == '{') openParen++;
        if (newData[i] == '}') openParen--;
        if (!inRec && newData[i] == '{') {
            inRec = true; startRec = i;
        }
        if (inRec && newData[i] == '}' && openParen == 0) {
            inRec = false; endRec = i;
            // endRec - startRec + 1 gives length.
            records.push(JSON.parse(newData.substr(startRec, endRec - startRec + 1)));
            //records.push(JSON.parse(newData.modifiedSlice(startRec, endRec + 1)));
        }
    }
    // start of first unprocessed byte. Should be added
    // to seenBytes of xhr. 
    return endRec + 1;
}

function sanitizeString(msg) {
    let lines, line;
    let sanitizeMsg = '';
    if (typeof (msg) === "string") {
        lines = msg.split('\n');
        for (let i = 0; i < lines.length; i++) {
            line = lines[i] + '\n';
            if (!/<b|\/b.*>/.test(line)) {
                line = line.replace(/{/g, '&#123').replace(/}/g, '&#125');
                line = line.replace(/</g, "&lt").replace(/>/g, "&gt");
            }
            sanitizeMsg += line;
        }
    }
    // console.log("msg", msg.length, sanitizeMsg.length, "\n", sanitizeMsg);
    return sanitizeMsg;
}

module.exports = {
    parseJsonEvents,
    sanitizeString
}