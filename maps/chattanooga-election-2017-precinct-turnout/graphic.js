;(function() {
  "use strict";

  var
  chart    = document.querySelector("#chart"),
  margin   = { top: 20, right: 16, bottom: 0, left: 16 },
  width    = +chart.offsetWidth - margin.left - margin.right,
  mobile   = (width <= 500),
  height   = function() {
    return (mobile)
      ? Math.floor(+chart.offsetWidth * .8) - margin.top - margin.bottom
      : Math.floor(+chart.offsetWidth * .7) - margin.top - margin.bottom;
  }(),
  citywide = document.querySelector("#tooltip").innerHTML,
  map,
  path,
  projection,
  choropleth
  ;

  chart.innerHTML = "";

  choropleth = d3.scaleQuantile()
    .range(d3.schemeBlues[7]);
  
  map = d3.select(chart).append("svg")
      .attr("id", "map")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("class", "precincts")
      .attr("transform", function() {
        return (mobile)
          ? "translate(" + [margin.left, margin.top * 2] + ")"
          : "translate(" + [margin.left, margin.top] + ")";
      })

  d3.json("data.topo.json", function(err, data) {
    if (err) throw err;

    // Topology data
    var topology = topojson.feature(data, data.objects.precincts);

    choropleth.domain(d3.extent(topology.features, function(d) {
      return +d.properties.turnout;
    }));

    projection = d3.geoIdentity()
      .fitSize([width, height], topology);

    path = d3.geoPath()
      .projection(projection);

    map.selectAll("path")
      .data(topology.features)
      .enter().append("path")
        .attr("d", path)
        .attr("stroke", "white")
        .attr("stroke-width", "0.5px")
        .attr("fill", function(d) {
          var turnout = +d.properties.turnout || 0;
          return choropleth(turnout);
        })
        .on("mouseover", mouseover)
        .on("mouseout", mouseout);

    // Legend
    var formatNumber = d3.format(".0f");

    var legendWidth = (mobile) ? width * .75 : width * .5;

    var x = d3.scaleLinear()
      .domain([0, choropleth.domain()[1]])
      .range([0, legendWidth]);

    var xAxis = d3.axisBottom(x)
      .ticks(choropleth.quantiles().length)
      .tickSize(12)
      .tickValues(choropleth.quantiles())
      .tickFormat(function(d) { return formatNumber(100 * d); });

    var g = d3.select("#map")
      .append("g")
      .attr("id", "legend")
      .call(xAxis);

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
      .attr("fill", "#000")
      .attr("text-anchor", "start")
      .attr("font-size", 16)
      .attr("font-family", "Avenir Next")
      .attr("y", -6)
      .text("Voter turnout by precinct (%)");

    g.attr("transform", "translate(0," + margin.top + ")"); 
  });

  function mouseout(d) {
    var tooltip = document.querySelector('#tooltip');
    tooltip.innerHTML = citywide;
    return d;
  }

  function mouseover(d) {
    var tooltip = document.querySelector('#tooltip');
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
    
    return d;
  }
})()