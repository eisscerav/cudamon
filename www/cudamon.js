var palette = new Rickshaw.Color.Palette();

var driver_version = "", nvml_version = "";

var series = {
    temperature: [],
    power: []
};

var graphs = [];

function update(data) {
    driver_version = data.driver_version;
    nvml_version = data.nvml_version;

    for(var i in data.devices) {
        var dev = data.devices[i];

        for(var key in series) {
            var ser = series[key];

            // Just skip if the device doesn't support this operation.
            if(dev[key] == null) continue;

            if(ser[i] == null) {
                ser[i] = {
                    name: dev.name,
                    data: [{x: data.time, y: dev[key]}],
                    color: palette.color()
                };
            } else {
                ser[i].data.push({ x: data.time, y: dev[key]});
            }

            while(ser[i].data.length >= 100) {
                ser[i].data.splice(0,1);
            }
        }
    }

    for(var i in graphs) {
        graphs[i].update();
    }
}

function ajaxUpdate() {
    update($.parseJSON($.ajax({
        type: 'GET',
        dataType: 'json',
        url:"ajax/update",
        async: false,
        data: {},
    }).responseText));
}

function addGraph(key) {

    if(series[key].length == 0) {
        console.log('No GPUs support "' + key + '" disabling...');
        $('#graphs-list').append('<li><del>' + key + '</del></li>');
        return;
    }

    var graph = new Rickshaw.Graph({
        element: document.querySelector('#' + key + " #chart"),
        width: 540,
        height: 200,
        renderer: 'line',
        series: series[key]
    });

    graph.key = key;

    var hoverDetail = new Rickshaw.Graph.HoverDetail( {
        graph: graph
    });

    var time = new Rickshaw.Fixtures.Time();

    var x_axis = new Rickshaw.Graph.Axis.Time({
        graph: graph,
        timeUnit: time.unit('minute')
    });

    var y_axis = new Rickshaw.Graph.Axis.Y( {
        graph: graph,
        tickFormat: function(y) { return y + "C"; },
        element: document.querySelector('#' + key + ' #y_axis'),
    });

    var legend = new Rickshaw.Graph.Legend( {
        element: document.querySelector('#' + key + ' #legend'),
        graph: graph
    } );

    var highlighter = new Rickshaw.Graph.Behavior.Series.Highlight({
        graph: graph,
        legend: legend
    });

    $('#graphs-list').append('<li><a href="#' + key +'">' + key + '</a></li>');

    graph.render();
    graphs.push(graph);
}

// Initialize
ajaxUpdate();

addGraph('temperature');
addGraph('power');

setInterval(ajaxUpdate, 1000);
