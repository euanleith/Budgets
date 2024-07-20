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

function plotStackedBar(definitions, traces, div, title='', xaxis='', yaxis='', legendTitle='', colorScheme=[]) {
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
        barmode: 'relative',
        colorway : colorScheme
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

function addDropdown(options, divBuilder, ...args) {
    let selector = document.querySelector('.groupingdata')

    for (var i = 0; i < options.length;  i++) {
        var currentOption = document.createElement('option');
        currentOption.text = options[i];
        selector.appendChild(currentOption);
    }
    selector.addEventListener('change', () => divBuilder(...args), false);
}