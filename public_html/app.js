d3.select(window).on("resize", throttle);

var zoom = d3.behavior.zoom()
    .scaleExtent([1, 8])
    .on("zoom", move);

var width = 960;
var height = width / 2;

var topo,projection,path,svg,g,centered;

var tooltip = d3.select("#container").append("div").attr("class", "tooltip hidden");

setup(width,height);

function setup(width,height){
    projection = d3.geo.mercator()
        .translate([0, 0])
        .scale(width / 2 / Math.PI);

    path = d3.geo.path()
        .projection(projection);

    svg = d3.select("#container").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
        .call(zoom);

    g = svg.append("g");

}

d3.json("world-110m.json", function(error, world) {

    var countries = topojson.feature(world, world.objects.countries).features;

    topo = countries;
    draw(topo);

});

function draw(topo) {

    var country = g.selectAll(".country").data(topo);
    
    country.enter().insert("path")
        .attr("class", "country")
        .attr("d", path)
        .attr("id", function(d,i) { return d.id; })
        .attr("title", function(d,i) { return d.properties.name; });

    //ofsets plus width/height of transform, plsu 20 px of padding, plus 20 extra for tooltip offset off mouse
    var offsetL = document.getElementById('container').offsetLeft+(width/2)+40;
    var offsetT =document.getElementById('container').offsetTop+(height/2)+20;


    //tooltips
    country
        .on("mousemove", function(d,i) {
            var mouse = d3.mouse(svg.node()).map( function(d) { return parseInt(d); } );
            tooltip
                .classed("hidden", false)
                .attr("style", "left:"+(mouse[0]+offsetL)+"px;top:"+(mouse[1]+offsetT)+"px")
                .html(d.properties.name)
        })
        .on("mouseout",  function(d,i) {
            tooltip.classed("hidden", true)
        });

    country.on("click", clicked);



   d3.selectAll('#CountrySelect').on('change',function(){
       var newData = eval(d3.select(this).property('value'));

       var path = g.selectAll('path')
           .filter(function(d) {
               return d.id === newData.id
           }).style("fill", "#50b3df");

      console.log(path.data());
       clicked(path.data()[0]);

    });


    function clicked(d) {
        var x, y, k;

        if (d && centered !== d) {
            var centroid = path.centroid(d);
            x = centroid[0];
            y = centroid[1];
            k = 6;
            centered = d;
        } else {
            x = width / 2;
            y = height /2;
            k = 1;
            centered = null;
        }

        g.selectAll("path")
            .classed("active", centered && function(d) { return d === centered; });

        g.transition()
            .duration(750)
            .attr("transform", "translate(" + x / 2 + "," + y / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
            .style("stroke-width", 1.5 / k + "px")
            .style("fill", "#50b3df");
    }

}

function redraw() {

    d3.select('svg').remove();
    setup(width,height);
    draw(topo);
}

function move() {

    var t = d3.event.translate;
    var s = d3.event.scale;
    var h = height / 3;

    t[0] = Math.min(width / 2 * (s - 1), Math.max(width / 2 * (1 - s), t[0]));
    t[1] = Math.min(height / 2 * (s - 1) + h * s, Math.max(height / 2 * (1 - s) - h * s, t[1]));

    zoom.translate(t);
    g.style("fill", "#50b3df").attr("transform", "translate(" + t + ")scale(" + s + ")");

}

var throttleTimer;
function throttle() {
    window.clearTimeout(throttleTimer);
    throttleTimer = window.setTimeout(function() {
        redraw();
    }, 200);
}


