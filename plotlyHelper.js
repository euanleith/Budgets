function plotBar(div, x, y, labels=[], title='', xaxis='', yaxis='') {
    var data = [
        {
            x: x,
            y: y,
            type: 'bar',
            text: labels,
            textposition: 'auto',
        }
    ];

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
        hovermode: 'closest',
    };
    Plotly.newPlot(div, data, layout, {displayModeBar: false});
}

function plotStackedBar(definitions, traces, div, title='', xaxis='', yaxis='', legendTitle='', colorScheme=[], hiddenLabels=[]) {
    div = document.getElementById(div);

    for (let i in traces) {
        traces[i].type = 'bar'
        traces[i].textposition = 'bottom'
        if (traces[i].marker) { // todo move colour to here
            traces[i].marker.line = {
                width: 0.5
            }
        }
        if (hiddenLabels.includes(traces[i].name)) traces[i].visible = 'legendonly'
        if (!traces[i].hovertemplate) traces[i].hovertemplate = '€%{y}' // todo get rid of this eventually
        else {
            // todo when hovertemplate is too long the hover item's position moves from the top of the trace to above the mouse...
            // plotly's 'hoverformat' doesn't allow for 'B = billion' notation, so have to do manually
            const formatter = Intl.NumberFormat("en", {
                notation: "compact" ,
                minimumFractionDigits: 0,
                maximumFractionDigits: 5
            });
            // todo or could have separate hover templates for policy and grouping?
            // todo idk how to format this well...
            traces[i].hovertemplate = 'Policy: ' + traces[i].hovertemplate +
                '<br>Grouping total: €' +
                    formatter.format(groupSum(traces, traces[i].legendgroup)) +
                    ' - ' + traces[i].name +
                '</br><extra></extra>'
        }

    }

    sortGroupedTraces(traces)

    var layout = {
        title: {
            text: title,
            x: 0.05,
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
        autosize: false,
        barmode: 'stack',
        margin: {
            l: 50,
            r: 250,
        },
        legend: {
            font: {
                size: 10
            },
            title: {
                text: legendTitle,
            },
            traceorder: 'normal',
        },
        hovermode: 'closest',
        barmode: 'relative',
        colorway: colorScheme
    };
    Plotly.newPlot(div, traces, layout, {displayModeBar: false});

    div.once('plotly_afterplot', () => addLegendHoverWidget(div, definitions));
}

// todo maybe have global var groupSums {group1: sum, group2: sum, ...} ?
//  this would be okay as long as no two groups have the same name
//  though makes this no longer a static class, if that matters
//      i could store the var in main.js instead if i want that...
let groupSums = {}
function groupSum(traces, group) {
    if (!(group in groupSums)) {
        // todo i think theres a more efficient way of doing this
        groupSums[group] = traces.filter(trace => trace.legendgroup === group).reduce((acc, val) => acc + arrSum(val.y), 0)
    }
    return groupSums[group]
}

// sort traces by avg of y values
function sortTraces(traces) {
    traces.sort((a,b) => arrAvg(b.y) - arrAvg(a.y))
}

// sort traces by avg of y values and by legendgroup
function sortGroupedTraces(traces) {
    traces.sort((a,b) => {
        totalA = groupSum(traces, a.legendgroup)
        totalB = groupSum(traces, b.legendgroup)
        return totalB - totalA
    })
}

function arrSum(arr) {
    return arr.reduce((c,d)=>parseInt(c)+parseInt(d), 0)
}

function arrAvg(arr) {
    return arrSum(arr) / arr.length
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

function getIndexOfKey(obj, key, val) {
    return obj.findIndex((elem) => elem[key] === val)
}

function addDropdown(options, divBuilder, ...args) {
    let dropdown = document.querySelector('.groupingdata')

    for (var i = 0; i < options.length;  i++) {
        var currentOption = document.createElement('option');
        currentOption.text = options[i].name;
        dropdown.appendChild(currentOption);
    }
    dropdown.addEventListener('change', () => divBuilder(
        options[getIndexOfKey(options, 'name', dropdown.value)],...args),
    );
    // todo this will mess up arrow button index
}

function addArrowButtons(options, divBuilder, ...args) {
    let prev = document.querySelector("#prevArrow")
    let next = document.querySelector("#nextArrow")
    let graphIndex = 0;


    prev.addEventListener('click', () => {
        if (graphIndex > 0) {
            divBuilder(options[--graphIndex], ...args)
        }
    })
    next.addEventListener('click', () => {
        if (graphIndex < options.length-1) {
            divBuilder(options[++graphIndex], ...args)
        }
    })
}