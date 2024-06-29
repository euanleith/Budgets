main();

async function main() {
    let budgets = await read('budgets.csv')
    let groupings = await read('groupings.csv')

    // todo i think negatives aren't being done right
    groupsStackedBar(budgets, groupings);
    policiesStackedBar(budgets);
    policiesTable(budgets);
}

// todo generalise
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

    data = traces;
    var layout = {
        title: {
            text: 'Grouped',
            x: 0.05
        },
        xaxis: {
            title: {
                text: 'Parties',
            },
        },
        yaxis: {
            title: {
                text: 'Cost (€)',
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
    Plotly.newPlot('graph1', data, layout, {displayModeBar: false});
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

    data = traces;
    var layout = {
        title: {
            text: 'Split by policy',
            x: 0.05
        },
        xaxis: {
            title: {
                text: 'Parties',
            },
        },
        yaxis: {
            title: {
                text: 'Cost (€)',
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
    Plotly.newPlot('graph2', data, layout, {displayModeBar: false});
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
    Plotly.newPlot('graph3', data, layout, {displayModeBar: false});
}

