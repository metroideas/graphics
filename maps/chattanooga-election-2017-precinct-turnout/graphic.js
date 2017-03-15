;(function() {
  "use strict";

  var
  data,
  chart = document.querySelector("#chart"),
  turnout = document.querySelector("#tooltip").innerHTML,
  tooltip = document.querySelector("#tooltip")
  ;

  // Map-rendering callback
  // ---------------------------------------------------------------------------
  function draw(containerWidth) {
    var
    map,
    path,
    projection,
    choropleth
    ;

    // Dimensions
    // ---------------------------------------------------------------------------
    var margin = {
      top: 20, right: 16, bottom: 0, left: 16,
      width: function() { return this.right + this.left; },
      height: function() { return this.top + this.bottom; }
    };

    var width = function() {
      if (!containerWidth) {
        var containerWidth = +container.offsetWidth;
      }
      return containerWidth - margin.width();
    }();

    var mobile = (width <= 500);

    var ratio = (mobile) ? { height: 4, width: 5 } : { height: 7, width: 10 };

    var height = function() {
      var f = ratio.height / ratio.width;
      return Math.floor(width * f - margin.height());
    }();

    // Render map
    // ---------------------------------------------------------------------------
    chart.innerHTML = "";

    choropleth = d3.scaleQuantile()
      .domain(d3.extent(data.features, function(d) {
        return +d.properties.turnout;
      }))
      .range(d3.schemeBlues[9]);

    projection = d3.geoIdentity()
      .fitSize([width, height], data);

    path = d3.geoPath()
      .projection(projection);

    map = d3.select(chart).append("svg")
        .attr("id", "map")
        .attr("width", width + margin.width())
        .attr("height", height + margin.height())
      .append("g")
        .attr("class", "precincts")
        .attr("transform", function() {
          return (mobile)
            ? "translate(" + [margin.left, margin.top * 2] + ")"
            : "translate(" + [margin.left, margin.top] + ")";
        });

    map.selectAll("path")
      .data(data.features)
      .enter().append("path")
        .attr("d", path)
        .attr("stroke", "white")
        .attr("fill", function(d) {
          return choropleth(d.properties.turnout)
        })
      .on("mouseover", mouseover)
      .on("mouseout", mouseout);

    // Legend - Adapted from https://bl.ocks.org/mbostock/4573883
    // ---------------------------------------------------------------------------
    var fmtNumber = d3.format(".0f")
    var legendWidth = (mobile) ? width * .75 : width * .5;

    // Define legend scale, axis
    var x = d3.scaleLinear()
      .domain(choropleth.domain())
      .range([0, legendWidth]); 

    var axis = d3.axisBottom(x)
      .ticks(choropleth.quantiles().length)
      .tickSize(12)
      .tickValues(choropleth.quantiles())
      .tickFormat(function(d) { return fmtNumber(100 * d); });

    // Append axis group to svg#map
    var g = d3.select("#map").append("g")
      .attr("id", "legend")
      .call(axis);

    // Replace axis with rects
    g.selectAll("rect")
      .data(choropleth.range().map(function(color) {
        var d = choropleth.invertExtent(color);
        if (d[0] == null) d[0] = x.domain()[0];
        if (d[1] == null) d[1] = x.domain()[1];
        return d;
      }))
      .enter().insert("rect", ".tick")
        .attr("height", 8)
        .attr("x", function(d) { return x(d[0]); })
        .attr("y", 1)
        .attr("width", function(d) { return x(d[1]) - x(d[0]); })
        .attr("height", 11)
        .attr("fill", function(d) { return choropleth(d[0]); });

    g.append("text")
      .attr("fill", "#252525")
      .attr("text-anchor", "start")
      .attr("font-size", 16)
      .attr("font-family", "Avenir Next")
      .attr("y", -6)
      .text("Voter turnout by precinct (%)");

    g.attr("transform", "translate(0," + margin.top + ")");
  } // end of draw(containerWidth) function

  // Tooltip functions
  // ---------------------------------------------------------------------------
  function mouseout(d) {
    tooltip.innerHTML = turnout;
    return ;
  }

  function mouseover(d) {
    var fmtInt  = d3.format(",");
    var fmtPct  = d3.format(".1%");
    var props   = d.properties;
    var name    = props.precinct;
    var voters  = fmtInt(props.voters);
    var ballots = fmtInt(props.ballots);
    var turnout = fmtPct(props.turnout);

    var string = "<strong>" + name + "</strong>" + 
      "<br>Registered voters: " + voters + 
      "<br>Ballots cast: " + ballots +
      "<br>" + turnout + " turnout";

    var x = d3.select(this).attr("x");
    var y = d3.select(this).attr("y");
    
    tooltip.innerHTML = string;
    
    return ;
  }

  // Load topojson data
  // ---------------------------------------------------------------------------
  d3.json("data.topo.json", function(err, json) {
    if (err) throw err;

    data = topojson.feature(json, json.objects.precincts);

    new pym.Child({ renderCallback: draw });
  })
})();
