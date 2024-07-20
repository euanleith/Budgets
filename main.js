main();

async function main() {
    let budgets = await read('budgets.csv') //  todo remove
    let groupings = await read('groupings.csv') // todo rename grouping_by_policy
    let partyGroupings = await read('grouping_by_party.csv') // todo name
    let definitions = parseDefinitions(await read('definitions.csv'))

    sumsStackedBar(partyGroupings, 'graph9');
    groupsStackedBar(partyGroupings, groupings, definitions, 'graph1'); // todo shouldn't use budgets
    statusSumStackedBar(partyGroupings, definitions, 'graph2');
    statusStackedBar(partyGroupings, definitions, 'To remove', 'graph3');
    statusStackedBar(partyGroupings, definitions, 'Removing', 'graph4');
    currentCapitalStackedBar(partyGroupings, definitions, 'graph8');
    policiesStackedBar(partyGroupings, definitions, 'graph5');
    //policiesStackedBar2(partyGroupings, definitions, 'graph7');
    policiesTable(partyGroupings, 'graph6');

    addDropdown(['option1', 'option2', 'option3'],
        groupsStackedBar,
        budgets,
        groupings,
        definitions,
        'graph1'
    );
}

// todo generalise and move to csv.js?
function parseDefinitions(data) {
    let res = {}
    // res: {type: {name: definition}}
    for (let i = 1; i < data.length; i++) {
        if (!res[data[i][2]]) res[data[i][2]] = {}
        res[data[i][2]][data[i][0]] = data[i][1]
    }
    return res
}

function sumsStackedBar(groupings, div) {
    let sums = {};
    for (let i = 1; i < groupings.length; i++) {
        let party = groupings[i][1]
        if (!(party in sums)) sums[party] = 0
        sums[party] += parseInt(groupings[i][2])
    }

    let labels = []
    const formatter = Intl.NumberFormat("en", {
        notation: "compact" ,
        minimumFractionDigits: 5 // plotly default
    });
    Object.values(sums).forEach((sum) => {
        labels.push(formatter.format(sum))
    })

    plotBar(div,
        Object.keys(sums),
        Object.values(sums),
        labels=labels,
        title='Total cost for each party',
        xaxis='Parties',
        yaxis='Total cost (€)'
    );
}

function groupsStackedBar(budgets, groupings, definitions, div) {
    let grouped = sumGroups2(budgets, groupings, ignoreNegatives=true)
    let parties = getUniqueFromDepthOrderedCol(budgets, 1)
    let traces = []
    for (let group in grouped) {
        // todo all of this plotly config stuff should in in plotStackedBar
        traces.push({
            x: parties,
            y: grouped[group],
            type: 'bar',
            name: group,
            textposition: 'bottom',
            hovertemplate: '€%{y}'
        });
    }
    plotStackedBar(definitions['Grouping'],
        traces,
        div,
        title='Split of expenditure by manual groupings',
        xaxis='Parties',
        yaxis='Cost (€)',
        legendTitle='Groupings'
    )
}

// todo replace with old format
// output format: {'grouping1': [cost1, cost2, ...], 'grouping2': [...], ...}
// where order of values corresponds to order of parties (i.e. [FFG, SF, ...]) todo assuming these are ordered
function sumGroups2(data, grouping, ignoreNegatives=false, col=2) {
    let res = {}
    let current = {name: '', grouping: '', index: 1} // todo current policy
    for (let iData = 1, iParty = 0; iData < data.length; iData++, iParty++) {
        let next = data[iData][0]
        if (next != current.name) {
            current.name = next
            current.grouping = grouping[current.index++][col]
            iParty = 0
        }
        if (!res[current.grouping]) res[current.grouping] = []
        if (!res[current.grouping][iParty]) res[current.grouping][iParty] = 0
        let val = parseInt(data[iData][2])
        if (!ignoreNegatives || val > 0) {
            res[current.grouping][iParty] += val
        }
    }
    return res
}

// sorts an object by its average values
// where object is of structure {key1: [num1, num2, ...], key2: [...], ...}
// e.g. {key1: [1,1], key2: [1,3,5], key3: [2,2]} returns {key2: [1,3,5], key3: [2,2], key1: [1,1]}
function sortByAvgVals(obj, len) {
    return Object.fromEntries(
        Object.entries(obj).sort(([,a],[,b]) =>
            (b.reduce((c,d)=>c+d)/len) - (a.reduce((c,d)=>c+d)/len)
        )
    )
}

// returns list of keys of an object sorted by its average values
function sortKeysByAvgVals(obj, len) {
    return Object.keys(obj).sort((a,b) => {
        return (obj[b].reduce((c,d)=>c+d)/len) - (obj[a].reduce((c,d)=>c+d)/len)
    })
}

// returns list of keys of an object sorted by its values
function sortKeysByVals(obj) {
    return Object.keys(obj).sort((a,b) => {
        return (obj[b] - obj[a])
    })
}



function statusSumStackedBar(partyGroupings, definitions, div) {
    let traces = []
    let statuses = {}
    let statusNames = [] // todo or predefine statuses
    for (let row = 1; row < partyGroupings.length; row++) {
        let party = partyGroupings[row][1]
        let statusName = partyGroupings[row][3]
        if (!(party in statuses)) {
            statuses[party] = {}
        }
        if (!(statusName in statuses[party])) {
            statuses[party][statusName] = 0
            if (!statusNames.includes(statusName)) {
                statusNames.push(statusName)
            }
        }
        statuses[party][statusName] += parseInt(partyGroupings[row][2]) // todo don't hardcode
    }

    let policies = fields(partyGroupings)
    for (let i in statusNames) {
        let statusTotalCosts = Object.values(statuses).map(a => a[statusNames[i]])
        traces.push({
            x: Object.keys(statuses),
            y: statusTotalCosts,
            type: 'bar',
            name: statusNames[i],
            textposition: 'bottom',
            hovertemplate: '€%{y}'
        });
    }
    plotStackedBar(definitions['Status'],
        traces,
        div,
        title='Split of expenditure by policy status',
        xaxis='Parties',
        yaxis='Cost (€)',
        legendTitle='Status',
        colorScheme=['#f3cec9', '#e7a4b6', '#cd7eaf', '#a262a9', '#6f4d96', '#3d3b72', '#182844']
    )
}

// todo with predefined statuses, could set default status=statusNames and allow for displaying of multiple custom statuses instead of just one
//  though would these be sums or split into policies?
function statusStackedBar(partyGroupings, definitions, status, div) {
    let traces = []
    let statuses = {}
    for (let row = 1; row < partyGroupings.length; row++) {
        let party = partyGroupings[row][1]
        let statusName = partyGroupings[row][3]
        if (!(party in statuses)) {
            statuses[party] = {}
        }
        if (statusName == status) {
            statuses[party][partyGroupings[row][0]] = parseInt(partyGroupings[row][2]) // todo don't hardcode
        }
    }

    let policies = []
    for (let party in statuses) {
        for (let policy in statuses[party]) {
            if (!policies.includes(policy)) policies.push(policy)
        }
    }

    for (let i in policies) {
        traces.push({
            x: Object.keys(statuses),
            y: Object.values(statuses).map(a => a[policies[i]]),
            type: 'bar',
            name: policies[i],
            textposition: 'bottom',
            hovertemplate: '€%{y}'
        });
    }
    plotStackedBar(definitions['Policy'],
        traces,
        div,
        title="Split of expenditure by policy status '" + status + "'",
        xaxis='Parties',
        yaxis='Cost (€)',
        legendTitle='Policy'
    )
}

// todo graphs for current/capital;
//  stack of current and capital
//      maybe also do this one excluding local authority housing?
//          would i be able to allow the user to manually remove individual policies for this?
//  stacked column of current and capital side by side with each individual policy still visible
//  'to remove' policies by current/capital
//      same for 'new', and any other if they seem interesting
function currentCapitalStackedBar(budgets, definitions, div) {
    let current = sumFromDepthOrderedCol(budgets, 1, 4, ignoreNegatives=true) // todo don't hardcode
    let capital = sumFromDepthOrderedCol(budgets, 1, 5, ignoreNegatives=true) // todo don't hardcode

    let parties = getUniqueFromDepthOrderedCol(budgets, 1) // todo don't hardcode
    let data = [current, capital]
    let names = ['Current', 'Capital']
    let traces = []
    for (let i = 0; i < data.length; i++) {
        traces.push({
            x: parties,
            y: data[i],
            type: 'bar',
            name: names[i],
            textposition: 'bottom',
            hovertemplate: '€%{y}'
        });
    }
    plotStackedBar(definitions['Terms'],
        traces,
        div,
        title='Current vs. Capital expenditure',
        xaxis='Parties',
        yaxis='Cost (€)',
        legendTitle='Expenditure type'
    )
}

function policiesStackedBar(budgets, definitions, div) {
    // note this is assuming data is ordered by policy
    let costs = []
    let currentPolicy = ""
    let iPolicy = -1
    for (let row = 1; row < budgets.length; row++) {
        if (budgets[row][0] != currentPolicy) { // todo don't hardcode
            currentPolicy = budgets[row][0] // todo don't hardcode
            costs[++iPolicy] = []
        }
        let cost = budgets[row][2] // todo don't hardcode
        if (cost > 0) {
            costs[iPolicy].push(cost)
        } else {
            costs[iPolicy].push(0)
        }
    }

    let traces = []
    let policies = getUniqueFromBreadthOrderedCol(budgets, 0) // todo don't hardcode
    let parties = getUniqueFromDepthOrderedCol(budgets, 1) // todo don't hardcode
    for (let i = 0; i < policies.length; i++) {
        traces.push({
            x: parties,
            y: costs[i],
            type: 'bar',
            name: policies[i],
            textposition: 'bottom',
            hovertemplate: '€%{y}'
        });
    }
    plotStackedBar(
        definitions,
        traces,
        div,
        title='Split of expenditure by policy',
        xaxis='Parties',
        yaxis='Cost (€)',
        legendTitle='Policy'
    )
}

// todo all of these array/csv functions should be generalised
// todo name
function policiesStackedBar2(budgets, definitions, div) {
    // note this is assuming data is ordered by policy
    let costs = []
    let currentPolicy = ""
    let iPolicy = -1
    for (let row = 1; row < budgets.length; row++) {
        if (budgets[row][0] != currentPolicy) { // todo don't hardcode
            currentPolicy = budgets[row][0] // todo don't hardcode
            costs[++iPolicy] = []
        }
        let cost = budgets[row][2] // todo don't hardcode
        if (cost > 0) {
            costs[iPolicy].push(cost)
        } else {
            costs[iPolicy].push(0)
        }
    }

    // todo maybe have colours = {type: colour}, then marker: {color: colours[partyGroupings[i][iType]]
    //  where iType = 3 for status, 4/5 for current/capital, etc.
    //  current/capital is annoying :')
    //  also will have to move groupings.csv to grouping_by_party.csv
    //  todo then have to sort policies by grouping :')
    //      won't this will be weird if the policies keep bouncing around then?
    //  todo also have to change legend aaaaa
    //  maybe should make a separate function for this

    let groupingCol = 3 // todo get from dropdown
    let groupingNames = getUniqueFromCol(budgets, groupingCol)

    function getRandomInt(max) {
        return Math.floor(Math.random() * max)
    }
    let groupingColours = {}
    for (let i in groupingNames) {
        groupingColours[groupingNames[i]] = 'rgb(' + getRandomInt(256) + ',' + getRandomInt(256) + ',' + getRandomInt(256) + ')' // todo ew
    }

    let traces = []
    let policies = getUniqueFromBreadthOrderedCol(budgets, 0) // todo don't hardcode
    let parties = getUniqueFromDepthOrderedCol(budgets, 1) // todo don't hardcode
    for (let i = 0; i < policies.length; i++) {
        let colours = []
        for (let j = 0; j < parties.length; j++) {
            colours.push(groupingColours[budgets[j+i*parties.length+1][groupingCol]]) // todo this is such a roundabout way of doing indexing
        }
        traces.push({
            x: parties,
            y: costs[i],
            type: 'bar',
            name: policies[i],
            textposition: 'bottom',
            hovertemplate: '€%{y}',
            marker: {
                color: colours
            }
        });
    }
    plotStackedBar(
        definitions,
        traces,
        div,
        title='Split of expenditure by policy',
        xaxis='Parties',
        yaxis='Cost (€)',
        legendTitle='Policy'
    )
}

function policiesTable(budgets, div) {
    let vals = []
    // todo make these parameters
    vals[0] = getUniqueFromBreadthOrderedCol(budgets, 0) // todo don't hardcode
    let parties = getUniqueFromDepthOrderedCol(budgets, 1) // todo don't hardcode
    for (let row = 1, iParty = 1; row < budgets.length; row++, iParty++) {
        if (iParty == parties.length+1) {
            iParty = 1;
        }
        if (!vals[iParty]) vals[iParty] = []
        vals[iParty].push(budgets[row][2]) // todo don't hardcode
    }

    var data = [{
        type: 'table',
        header: {
            values: [''].concat(parties),
            align: "left",
            line: {width: 1, color: 'black'},
            fill: {color: "grey"},
            font: {color: "white"}
        },
        cells: {
            values: vals,
            align: "left",
        }
    }]
    var layout = {
        title: {
            text: 'Table',
            x: 0.05
        },
    };
    Plotly.newPlot(div, data, layout, {displayModeBar: false});
}

