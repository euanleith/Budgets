main();

async function main() {
    let budgets = await read('budgets.csv')
    let groupings = await read('groupings.csv') // todo rename grouping_by_policy
    let partyGroupings = await read('grouping_by_party.csv') // todo name

    // todo currently negatives are going down, overlapping items beneath them
    groupsStackedBar(budgets, groupings, 'graph1');
    statusSumStackedBar(partyGroupings, 'graph2');
    //statusStackedBar(budgets, partyGroupings, 'To remove', 'graph3');
    //statusStackedBar(budgets, partyGroupings, 'Removing', 'graph4');
    policiesStackedBar(partyGroupings, 'graph5');
    policiesTable(partyGroupings, 'graph6');
}

function plotStackedBar(traces, div, title='', xaxis='', yaxis='') {
    var layout = {
        title: {
            text: title,
            x: 0.05
        },
        xaxis: {
            title: {
                text: xaxis,
            },
        },
        yaxis: {
            title: {
                text: yaxis,
            }
        },
        autosize: true,
        barmode: 'stack',
        legend: {
            font: {
                size: 10
            },
            traceorder: 'normal'
        }
    };
    Plotly.newPlot(div, traces, layout, {displayModeBar: false});
}

function groupsStackedBar(budgets, groupings, div) {
    let grouped = sumGroups(budgets, groupings)
    let traces = []
    for (let group in Object.values(grouped)[0]) {
        traces.push({
            x: Object.keys(grouped),
            y: Object.values(grouped).map(a => a[group]),
            type: 'bar',
            name: group,
            textposition: 'bottom'
        });
    }
    plotStackedBar(traces, div, title='Split of cost by manual groupings', xaxis='Parties', yaxis='Cost (€)')
}

function statusSumStackedBar(partyGroupings, div) {
    let traces = []
    let statuses = {}
    let statusNames = [] // todo or predefine statuses
    for (let col = 3; col < partyGroupings[0].length; col++) { // todo don't hardcode
        for (let row = 1; row < partyGroupings.length; row++) {
            let party = partyGroupings[row][1]
            let statusName = partyGroupings[row][col]
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
    }

    let policies = fields(partyGroupings)
    for (let i in statusNames) {
        // todo remove 0's and negatives
        let statusTotalCosts = Object.values(statuses).map(a => a[statusNames[i]])
        traces.push({
            x: Object.keys(statuses),
            y: statusTotalCosts,
            type: 'bar',
            name: statusNames[i],
            textposition: 'bottom'
        });
    }
    plotStackedBar(traces, div, title='Split of cost by status', xaxis='Parties', yaxis='Cost (€)')
}

// todo with predefined statuses, could set default status=statusNames and allow for displaying of multiple custom statuses instead of just one
//  though would these be sums or split into policies?
function statusStackedBar(partyGroupings, status, div) {
    let traces = []
    let statuses = []
    let statusNames = [] // todo or predefine statuses
    for (let col = 1; col < partyGroupings[0].length; col++) {
        statuses[col-1] = {}
        for (let row = 1; row < partyGroupings.length; row++) {
            let statusName = JSON.parse(partyGroupings[row][col])['status']
            if (statusName == status) {
                statuses[col-1][budgets[row][0]] = parseInt(budgets[row][col])
            }
        }
    }

    let policies = []
    for (let i = 0; i < statuses.length; i++) {
        for (let key in statuses[i]) {
            if (!policies.includes(key)) policies.push(key)
        }
    }

    let parties = titles(partyGroupings)
    for (let i in policies) {
        let name = statuses[0][i]
        traces.push({
            x: parties,
            y: statuses.map(a => a[policies[i]]),
            type: 'bar',
            name: policies[i],
            textposition: 'bottom'
        });
    }
    plotStackedBar(traces, div, title="Split of cost by status '" + status + "'", xaxis='Parties', yaxis='Cost (€)')
}


function policiesStackedBar(budgets, div) {
    // note this is assuming data is ordered by policy
    let costs = []
    let currentPolicy = ""
    let iPolicy = -1
    for (let row = 1; row < budgets.length; row++) {
        if (budgets[row][0] != currentPolicy) { // todo don't hardcode
            currentPolicy = budgets[row][0] // todo don't hardcode
            costs[++iPolicy] = []
        }
        costs[iPolicy].push(budgets[row][2]) // todo don't hardcode
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
            textposition: 'bottom'
        });
    }
    plotStackedBar(traces, div, title='Split by policy', xaxis='Parties', yaxis='Cost (€)')
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

