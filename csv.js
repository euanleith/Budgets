// todo wrap this in class CSV

async function read(fname) {
    let str = await fetch(fname)
    str = await str.text()
    return parse(str)
}

// from here: https://stackoverflow.com/questions/1293147/how-to-parse-csv-data
function parse(str) {
    const arr = [];
    let quote = false;  // 'true' means we're inside a quoted field

    // Iterate over each character, keep track of current row and column (of the returned array)
    for (let row = 0, col = 0, c = 0; c < str.length; c++) {
        let cc = str[c], nc = str[c+1];        // Current character, next character
        arr[row] = arr[row] || [];             // Create a new row if necessary
        arr[row][col] = arr[row][col] || '';   // Create a new column (start with empty string) if necessary

        // If the current character is a quotation mark, and we're inside a
        // quoted field, and the next character is also a quotation mark,
        // add a quotation mark to the current column and skip the next character
        if (cc == '"' && quote && nc == '"') { arr[row][col] += cc; ++c; continue; }

        // If it's just one quotation mark, begin/end quoted field
        if (cc == '"') { quote = !quote; continue; }

        // If it's a comma and we're not in a quoted field, move on to the next column
        if (cc == ',' && !quote) { ++col; continue; }

        // If it's a newline (CRLF) and we're not in a quoted field, skip the next character
        // and move on to the next row and move to column 0 of that new row
        if (cc == '\r' && nc == '\n' && !quote) { ++row; col = 0; ++c; continue; }

        // If it's a newline (LF or CR) and we're not in a quoted field,
        // move on to the next row and move to column 0 of that new row
        if (cc == '\n' && !quote) { ++row; col = 0; continue; }
        if (cc == '\r' && !quote) { ++row; col = 0; continue; }

        // Otherwise, append the current character to the current column
        arr[row][col] += cc;
    }
    return arr;
}

// function toObj(arr) {} // todo add ?

function titles(arr) {
    return arr[0].slice(1,arr.length);
}

function fields(arr) {
    let res = []
    for (let i = 1; i < arr.length; i++) {
        res.push(arr[i][0])
    }
    return res
}

function values(arr) {
    return arr.splice(1, arr.length)
}

function fieldVals(arr, field) {
    let res = []
    let i = getIndex(arr, field, 0)
    for (let j = 1; j < arr[i].length; j++) {
        res.push(arr[i][j]);
    }
    return res
}

function getIndex(arr, val) {
    for (let i = 1; i < arr.length; i++) {
        for (let j = 0; j < arr[i].length; j++) {
            if (arr[i][j] == val) return i;
        }
    }
    return -1;
}

function getIndex(arr, val, col) {
    for (let i = 1; i < arr.length; i++) {
        if (arr[i][col] == val) return i;
    }
    return -1;
}

function sumTitles(arr) {
    let res = {}
    for (let i = 1; i < arr[0].length; i++) {
        console.log('next')
        let sum = 0
        for (let j = 1; j < arr.length; j++) {
            sum += parseInt(arr[j][i])
        }
        res[arr[0][i]] = sum
    }
    return res
}

function sumGroups(arr, groups) { // todo add parameter 'group' (e.g. current/capital, groupings, etc.)
    let res = {}
    for (let i = 1; i < arr[0].length; i++) { // for each title
        res[arr[0][i]] = {}
        for (let j = 1; j < arr.length; j++) { // for each field
            iGroups = getIndex(groups, arr[j][0], 0)
            if (!res[arr[0][i]][groups[iGroups][1]]) {
                res[arr[0][i]][groups[iGroups][1]] = 0
            }
            if (parseInt(arr[j][i]) >= 0) { // todo figure out how to deal with negatives
                res[arr[0][i]][groups[iGroups][1]] += parseInt(arr[j][i]) // {title: {group: sum}}
            }
        }
    }
    return res
}

// todo name - this is for grouping_by_party structure
function sumFromDepthOrderedCol(data, orderCol, sumCol) {
    let res = []
    let iGroup = 0;
    for (let i = 1, iGroup = 0; i < data.length; i++, iGroup++) {
        if (data[i][orderCol] == data[1][orderCol]) {
            iGroup = 0
        }
        if (!res[iGroup]) res[iGroup] = 0
        res[iGroup] += parseInt(data[i][sumCol])
    }
    return res
}

function getUniqueFromBreadthOrderedCol(data, col) {
    let res = []
    for (let i = 1; i < data.length; i++) {
        if (data[i][col] != res[res.length-1]) {
            res.push(data[i][col])
        }
    }
    return res
}

function getUniqueFromDepthOrderedCol(data, col) {
    let res = []
    for (let i = 1; i < data.length; i++) {
        if (data[i][col] == res[0]) break
        res.push(data[i][col])
    }
    return res
}
