//let font = getComputedStyle(document.body).getPropertyValue('font-family')

function plotBar(div, x, y, labels=[], title='', xaxis='', yaxis='', xaxisLabelColours=[]) {
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
        margin: {
//            l: 50, // todo looks weird when add margins for legend when there is no legend...
//            r: 250,
            t: 0,
        },
        autosize: true,
        hovermode: 'closest',
        font: {
            family: 'Helvetica Neue'
        },
    };
    Plotly.newPlot(div, data, layout, {displayModeBar: false});

    if (xaxisLabelColours) {
        var ticks = document.getElementsByClassName('xtick');
        for (var i = 0; i < ticks.length; i += 1) {
            ticks[i].getElementsByTagName('text')[0].style.fill = xaxisLabelColours[i % xaxisLabelColours.length];
        }
    }
}

let colorScheme2 = [
    '#ebac23',
    '#b80058',
    '#008cf9',
    '#006e00',
    '#00bbad',
    '#d163e6',
    '#b24502',
    '#ff9287',
    '#5954d6',
    '#00c6f8',
    '#878500',
    '#00a76c',
    '#bdbdbd',
]

function plotStackedBar(definitions, traces, div, title='', xaxis='', yaxis='', legendTitle='', colorScheme=[], hiddenLabels=[], xaxisLabelColours=[]) {
    div = document.getElementById(div);

    for (let i in traces) {
        traces[i].type = 'bar'
        traces[i].textposition = 'bottom'
        if (traces[i].marker) { // todo move colour to here
            traces[i].marker.line = {
                width: 0.05,
                color: '#fff'
            }
        }
        if (hiddenLabels.includes(traces[i].name)) traces[i].visible = 'legendonly'

        // todo when hovertemplate is too long the hover item's position moves from the top of the trace to above the mouse...
        // plotly's 'hoverformat' doesn't allow for 'B = billion' notation, so have to do manually
        const formatter = Intl.NumberFormat("en", {
            notation: "compact" ,
            minimumFractionDigits: 0,
            maximumFractionDigits: 5
        });
        // todo or could have separate hover templates for policy and grouping? - https://stackoverflow.com/questions/68282313/how-to-display-a-extra-hover-text-while-hovering-stacked-bar-graph-in-plotly-js ?
        // todo idk how to format this well...
        let txt = []
        for (let j in traces[i].x) {
            txt.push(
                '<br>€' + formatter.format(groupPartySum(traces, traces[i].legendgroup, traces[i].x)[j]) +
                " - '" + traces[i].name + "' Total" +
                '</br><extra></extra>'
            )
        }
        traces[i].text = txt
        traces[i].hovertemplate += '%{text}'
    }

    sortGroupedTraces(traces)

    var layout = {
        xaxis: {
            title: {
                text: xaxis,
                standoff: 1,
            },
            tickfont: {
                size: 11
            }
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
            t: 0
        },
        legend: {
            font: {
                size: 10
            },
            title: {
                text: legendTitle,
            },
            // todo actually maybe i want this on the left now that description is on the right, so graph is centered and close to both
            traceorder: 'normal',
        },
        hovermode: 'closest',
        barmode: 'relative',
        colorway: colorScheme2,
        font: {
            family: 'Helvetica Neue'
        },
    };
    Plotly.newPlot(div, traces, layout, {displayModeBar: false});

    div.once('plotly_afterplot', () => addLegendHoverWidget(div, definitions));

    if (xaxisLabelColours) {
        var ticks = document.getElementsByClassName('xtick');
        for (var i = 0; i < ticks.length; i += 1) {
            ticks[i].getElementsByTagName('text')[0].style.fill = xaxisLabelColours[i % xaxisLabelColours.length];
        }
    }
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

// todo don't need both groupPartySums and groupSums
// todo maybe do this on init
let groupPartySums = {}
function groupPartySum(traces, group, parties) {
    if (!(group in groupPartySums)) {
        groupPartySums[group] = {}
        let groupTraces = traces.filter(trace => trace.legendgroup === group)
        for (let i in parties) {
            groupPartySums[group][parties[i]] = groupTraces.reduce((acc, val) => {
                if (val.y[i]) return acc + parseInt(val.y[i])
                else return acc
            }, 0)
        }
    }
    return Object.values(groupPartySums[group])
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
    items.on('mouseover', async function (legendItem) {
        if (legendItem[0].trace.visible !== true) return // don't show definition if legend item is hidden

        //await new Promise(resolve => setTimeout(resolve, 750)) // todo add delay
        tooltip.transition()
            .duration(200)
            .style("opacity", 1);

        let key = Object.keys(definitions).filter(key => Object.keys(definitions[key]).includes(legendItem[0].trace.name))
        tooltip.html(definitions[key][legendItem[0].trace.name])

        // todo if goes off the page swap direction
        var matrix = this.getScreenCTM()
            .translate(this.getAttribute("cx"), this.getAttribute("cy"));
        let xPos = d3.event.pageX - (7*parseInt(tooltip.style('width'))/8)
        let yPos = window.pageYOffset + matrix.f - parseInt(tooltip.style('height')) - legendItem[0].lineHeight
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

function prevEvent(prev, next, graphIndex, options, divBuilder, ...args) {
    if (graphIndex > 0) {
        divBuilder(options[--graphIndex], ...args)
        next.style.visibility='visible'
    }
    if (graphIndex == 0) prev.style.visibility='hidden'
    return graphIndex
}

function nextEvent(prev, next, graphIndex, options, divBuilder, ...args) {
    if (graphIndex < options.length-1) {
        divBuilder(options[++graphIndex], ...args)
        prev.style.visibility='visible'
    }
    if (graphIndex == options.length-1) next.style.visibility='hidden'
    return graphIndex
}

function addArrowButtons(options, divBuilder, ...args) {
    let prev = document.querySelector("#prevArrow")
    let next = document.querySelector("#nextArrow")
    let graphIndex = 0;

    prev.style.visibility='hidden'

    prev.addEventListener('click', () => {
            graphIndex = prevEvent(prev, next, graphIndex, options, divBuilder, ...args)
    })
    next.addEventListener('click', () => {
            graphIndex = nextEvent(prev, next, graphIndex, options, divBuilder, ...args)
    })

    var mouseOn = false;
    document.getElementById('mainChart').onmouseover = function() {
        mouseOn = true;
    }
    document.getElementById('mainChart').onmouseleave = function() {
        mouseOn = false;
    }
    document.addEventListener("keydown", function(event) {
        if (mouseOn) {
            if (event.key === 'ArrowRight') {
                graphIndex = nextEvent(prev, next, graphIndex, options, divBuilder, ...args)
            } else if (event.key === 'ArrowLeft') {
                graphIndex = prevEvent(prev, next, graphIndex, options, divBuilder, ...args)
            }
        }
    })
}