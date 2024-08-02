main();
enumerateCitations()

async function main() {
    let budgets = await read('budgets.csv') //  todo remove
    let groupings = await read('groupings.csv') // todo rename grouping_by_policy
    let partyGroupings = await read('grouping_by_party.csv') // todo name
    let definitions = parseDefinitions(await read('definitions.csv'))

    // todo add graph with all REV items which are in grouping 'new social housing'
    // todo maybe add graph with just policies which have differences in spending between parties
//    currentCapitalStackedBar(partyGroupings, definitions, 'currentCapitalBar');
//    policiesStackedBar(partyGroupings, definitions, 'policiesBar');
//    policiesTable(partyGroupings, 'policiesTable');

    // todo 'more detail' charts; (link to these, which contain the graphs & discussions in the main chart, along with additional stuff'
    // todo maybe add graph showing increasing in spending towards HAP/RAS over time
    // todo also have a 'new build social housing' group of charts, with;
    //  projected vs. actual built social housing
    //  projected vs. actual spending on new build social housing
    //  number of new plans/constructions for social housing

    // todo should probably structure this as a class
    let graphs = [
        {name: 'Total', startHidden: [], ignoreNegatives: true, title: 'Total expenditure by party', subtitle: 'The total housing expenditure proposed by each party.', descriptionId: 'totalsDescription'},
        {name: 'Groupings', startHidden: [], ignoreNegatives: true, title: 'Split of expenditure', subtitle: 'The proposed expenditure towards housing policies, split into groups.', descriptionId: 'groupingsBarDescription'},
        {name: 'Status', startHidden: ['Existing', 'New'], ignoreNegatives: false, title: 'Policies being reduced/removed', subtitle: 'Policies which opposition parties have proposed removal or a reduction in spending.', descriptionId: 'removePoliciesDescription'},
        {name: 'Status', startHidden: ['Existing', 'Planned for removal', 'Removing', 'Planned for reduction', 'Reducing'], ignoreNegatives: true, title: 'New policies being proposed', subtitle: 'New policies proposed by opposition parties.', descriptionId: 'newPoliciesDescription'},
        {name: 'Status', startHidden: [], ignoreNegatives: false, title: 'Split of expenditure by policy status', subtitle: 'The proposed expenditure towards housing policies, sorted by status.', descriptionId: 'statusBarDescription'},
    ]
    policiesStackedBar2(graphs[0], partyGroupings, definitions, 'colouredGroupingsBar')

    // todo idk if should keep, removing for now
//    addDropdown(graphs,
//        policiesStackedBar2,
//        partyGroupings,
//        definitions,
//        'colouredGroupingsBar'
//    );

    addArrowButtons(graphs,
        policiesStackedBar2,
        partyGroupings,
        definitions,
        'colouredGroupingsBar'
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

// todo can i do this under policiesStackedBar2?
function sumsStackedBar(groupings, div) {
    let sums = {};
    for (let i = 1; i < groupings.length; i++) {
        let party = wrap(groupings[i][1], 12)
        if (!(party in sums)) sums[party] = 0
        sums[party] += parseInt(groupings[i][2])
    }

    let labels = []
    // plotly's 'hoverformat' doesn't allow for 'B = billion' notation, so have to do manually
    const formatter = Intl.NumberFormat("en", {
        notation: "compact" ,
        minimumFractionDigits: 0,
        maximumFractionDigits: 5
    });
    Object.values(sums).forEach((sum) => {
        labels.push(formatter.format(sum))
    })

    plotBar(div,
        Object.keys(sums),
        Object.values(sums),
        labels=labels,
        title='Total expenditure by party',
        xaxis='Parties',
        yaxis='Cost (€)'
    );
}

// todo replace with old format
// output format: {'grouping1': [cost1, cost2, ...], 'grouping2': [...], ...}
// where order of values corresponds to order of parties (i.e. [FFG, SF, ...]) todo assuming these are ordered
function sumGroups2(data, grouping, ignoreNegatives=false, col=3) {
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
    parties = parties.map((elem) => wrap(elem, 12))
    let data = [current, capital]
    let names = ['Current', 'Capital']
    let traces = []
    for (let i = 0; i < data.length; i++) {
        traces.push({
            x: parties,
            y: data[i],
            name: names[i],
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
    parties = parties.map((elem) => wrap(elem, 12))
    for (let i = 0; i < policies.length; i++) {
        traces.push({
            x: parties,
            y: costs[i],
            name: policies[i],
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

function setDescription(grouping) {
    for (let description of document.querySelector('#descriptions').children) {
        description.style.display = 'none'
    }
    document.querySelector('#' + grouping.descriptionId).style.display = 'block'
}

function wrap(str, len, br='<br>') {
    words = str.split(' ')
    let wrapped = []
    let row = words[0]

    for (var i = 1; i < words.length; i++) {
        if (row.length + words[i].length > len) {
            wrapped += row + br
            row = words[i]
        } else {
            row += ' ' + words[i]
        }
    }
    wrapped += row
    return wrapped
}

// todo all of these array/csv functions should be generalised
// todo name
function policiesStackedBar2(grouping, budgets, definitions, div) {
    setDescription(grouping)
    document.getElementById('chartTitle').innerHTML = grouping.title
//    document.getElementById('chartSubtitle').innerHTML = grouping.subtitle // todo removing for now

    if (grouping.name == 'Total') return sumsStackedBar(budgets, div) // todo maybe not a good way of doing this

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
        if (!grouping.ignoreNegatives || cost > 0) {
            costs[iPolicy].push(cost)
        } else {
            costs[iPolicy].push(0)
        }
    }

    let groupingCol = getColFromName(budgets, grouping.name)
    let groups = getUniqueFromCol(budgets, groupingCol)
    let groupingColours = getGroupingColours(groups)

    let traces = []
    let policies = getUniqueFromBreadthOrderedCol(budgets, 0) // todo don't hardcode
    let parties = getUniqueFromDepthOrderedCol(budgets, 1) // todo don't hardcode
    parties = parties.map((elem) => wrap(elem, 12))
    let legendGroupings = []
    for (let i = 0; i < policies.length; i++) {
        let groupings = {}
        for (let j = 0; j < costs[i].length; j++) {
            let group = budgets[j+i*costs[i].length+1][groupingCol] // todo this is such a roundabout way of doing indexing
            if (!(group in groupings)) groupings[group] = new Array(costs[i].length)
            groupings[group][j] = costs[i][j]
        }
        for (let group in groupings) {
            // todo move plotly specific stuff to plotlyHelper.js
            traces.push({
                x: parties,
                y: groupings[group],
                name: group,
                hovertemplate: '€%{y} - ' + policies[i], // todo also show total sum for grouping... maybe could do after traces is fully created? like traces[i].hovertemplate = traces[i].hovertemplate + sum(traces[i].grouping)
                marker: {
                    color: groupingColours[group]
                },
                legendgroup: group,
            });
            if (legendGroupings.includes(group)) {
                traces[traces.length-1].showlegend = false
            } else {
                legendGroupings.push(group)
            }
        }
    }
    plotStackedBar(
        definitions,
        traces,
        div,
        title=grouping.title,
        xaxis='Parties',
        yaxis='Cost (€)',
        legendTitle=grouping.name,
        colorScheme=[],
        hiddenLabels=grouping.startHidden
    )

}

function generateGroupingColours(groups) {
    function getRandomInt(max) {
        return Math.floor(Math.random() * max)
    }
    let groupingColours = {}
    for (let i in groups) {
        groupingColours[groups[i]] = 'rgb(' + getRandomInt(256) + ',' + getRandomInt(256) + ',' + getRandomInt(256) + ')' // todo ew
    }
    return groupingColours
}

// todo can i move this to plotlyHelper?
function getGroupingColours(groups) {
    groupingColours = {}
    for (let i in groups) {
        groupingColours[groups[i]] = colorScheme2[i]
    }
    return groupingColours
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

// todo order sources programatically as well?
// todo and order inline citations by number
function enumerateCitations() {
    var citations = document.getElementsByClassName('citation')
    let hrefIds = {}
    let cnt = 1
    for (let i = 0; i < citations.length; i++) {
        let href = citations[i].href
        if (!(href in hrefIds)) hrefIds[href] = cnt++
        citations[i].innerHTML = ('[' + hrefIds[href] + ']').sup()
    }
}
