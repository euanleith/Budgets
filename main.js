main();

async function main() {
    let budgets = await read('budgets.csv')
    let groupings = await read('groupings.csv')
    let partyGroupings = await read('grouping_by_party.csv') // todo name

    // todo currently negatives are going down, overlapping items beneath them
    groupsStackedBar(budgets, groupings);
    statusSumStackedBar(budgets, partyGroupings);
    statusStackedBar(budgets, partyGroupings, 'To remove');
    policiesStackedBar(budgets);
    policiesTable(budgets);
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

function groupsStackedBar(budgets, groupings) {
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
    plotStackedBar(traces, 'graph1', title='Split of cost by manual groupings', xaxis='Parties', yaxis='Cost (€)')
}

// xaxis: parties
// yaxis: cost
// traces: sum of each status for each party: [[{party1status1: sum}, {party1status2: sum}, ...], [{party2status1: sum}, ...], ...]
//  or [[{party1status1: sum}, {party2status1: sum}, ...], [{party1status2: sum}, ...], ...] // todo this would require predefining statuses
function statusSumStackedBar(budgets, partyGroupings) {
    let traces = []
    let statuses = []
    let statusNames = [] // todo or predefine statuses
    for (let col = 1; col < partyGroupings[0].length; col++) {
        statuses[col-1] = {}
        for (let row = 1; row < partyGroupings.length; row++) {
            let statusName = JSON.parse(partyGroupings[row][col])['status']
            if (!(statusName in statuses[col-1])) {
                statuses[col-1][statusName] = 0
                if (!statusNames.includes(statusName)) {
                    statusNames.push(statusName)
                }
            }
            statuses[col-1][statusName] += parseInt(budgets[row][col])
        }
    }

    let policies = fields(partyGroupings)
    let parties = titles(partyGroupings)
    for (let i in statusNames) {
        let statusTotalCosts = statuses.map(a => a[statusNames[i]])
        if (statusNames[i] == 'Removing' || statusTotalCosts.every(a => a == 0)) continue; // todo figure out negatives
        let name = statuses[0][i]
        traces.push({
            x: parties,
            y: statusTotalCosts,
            type: 'bar',
            name: statusNames[i], // todo remove where none exist
            textposition: 'bottom'
        });
    }
    plotStackedBar(traces, 'graph2', title='Split of cost by status', xaxis='Parties', yaxis='Cost (€)')
}

// todo with predefined statuses, could set default status=statusNames and allow for displaying of multiple custom statuses instead of just one
function statusStackedBar(budgets, partyGroupings, status) {
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
    plotStackedBar(traces, 'graph5', title="Split of cost by status '" + status + "'", xaxis='Parties', yaxis='Cost (€)')
}


function policiesStackedBar(budgets) {
    let traces = []
    let policies = fields(budgets)
    let parties = titles(budgets)
    for (let i = 0; i < policies.length; i++) {
        traces.push({
            x: parties,
            y: fieldVals(budgets, policies[i]),
            type: 'bar',
            name: policies[i],
            textposition: 'bottom'
        });
    }
    plotStackedBar(traces, 'graph3', title='Split by policy', xaxis='Parties', yaxis='Cost (€)')
}

// todo add commas and change to €000
function policiesTable(budgets) {
    let vals = values(budgets)
    vals = vals[0].map((val, index) => vals.map(row => row[index]))
    var data = [{
        type: 'table',
        header: {
            values: budgets[0],
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
    Plotly.newPlot('graph4', data, layout, {displayModeBar: false});
}

