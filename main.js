main();

async function main() {
    let budgets = await read('budgets.csv')
    let groupings = await read('groupings.csv') // todo rename grouping_by_policy
    let partyGroupings = await read('grouping_by_party.csv') // todo name
    let definitions = parseDefinitions(await read('definitions.csv'))

    groupsStackedBar(budgets, groupings, definitions, 'graph1');
    statusSumStackedBar(partyGroupings, definitions, 'graph2');
    statusStackedBar(partyGroupings, definitions, 'To remove', 'graph3');
    statusStackedBar(partyGroupings, definitions, 'Removing', 'graph4');
    currentCapitalStackedBar(partyGroupings, definitions, 'graph7');
    policiesStackedBar(partyGroupings, definitions, 'graph5');
    policiesTable(partyGroupings, 'graph6');
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

function plotStackedBar(definitions, traces, div, title='', xaxis='', yaxis='', legendTitle='') {
    div = document.getElementById(div);
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
            title: {
                text: legendTitle
            },
            traceorder: 'normal'
        },
        hovermode: 'closest',
        barmode: 'relative'
    };
    Plotly.newPlot(div, traces, layout, {displayModeBar: false});
    div.once('plotly_afterplot', () => addLegendHoverWidget(div, definitions));
}

// todo shouldn't have to include definitions as parameter
function addLegendHoverWidget(div, definitions) {
    var d3 = Plotly.d3;
    var items = d3.select(div)
        .selectAll('g.legend')
        .selectAll('g.traces');
    var tooltip = d3.selectAll('.legendTooltip');

    // todo want to be able to click on the popup to expand it / go to definition page
    items.on('mouseover', async function (d) {
        //await new Promise(resolve => setTimeout(resolve, 750)) // todo add delay
        tooltip.transition()
            .duration(200)
            .style("opacity", 1);

        tooltip.html(definitions[d[0].trace.name])

        // todo if goes off the page swap direction
        var matrix = this.getScreenCTM()
            .translate(this.getAttribute("cx"), this.getAttribute("cy"));
        let xPos = d3.event.pageX - (7*parseInt(tooltip.style('width'))/8)
        let yPos = window.pageYOffset + matrix.f - parseInt(tooltip.style('height')) - d[0].lineHeight
        tooltip.style("left", xPos + "px")
            .style("top", yPos + "px");
    });

    items.on('mouseout', () => {
        tooltip.transition()
            .duration(500)
            .style("opacity", 0);
    })
}

function groupsStackedBar(budgets, groupings, definitions, div) {
    let grouped = sumGroups(budgets, groupings, ignoreNegatives=true)
    let traces = []
    for (let group in Object.values(grouped)[0]) {
        let groupCosts = Object.values(grouped).map(a => a[group])
        traces.push({
            x: Object.keys(grouped),
            y: groupCosts,
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
        legendTitle='Status'
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

