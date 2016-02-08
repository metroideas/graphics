(function() {
  var
  data,
  pymChild,
  container    = document.querySelector("#graphic"),
  url          = "data.csv",
  aspect_ratio = { width: 3, height: 2 }
  ;

  function drawGraphic(container_width) {
    if (!container_width) {
      var container_width = +(container.offsetWidth);
    }

    // Removes container's existing children
    container.innerHTML = "";

    var
    x,
    y,
    xAxis,
    yAxis,
    svg,
    bars,
    margin = { top: 32, right: 32, bottom: 48, left: 48 },
    width  = container_width - margin.left - margin.right,
    height = Math.ceil(width * aspect_ratio.height / aspect_ratio.width) - margin.top - margin.bottom
    ;

    // Use smallScreen boolean for layout changes
    if (width <= 512) {
      var smallScreen = true;
    }

    x = d3.scale.ordinal()
      .domain(data.map(function(d) { return d.name; }))
      .rangeRoundBands([0, width], .1);

    y = d3.scale.linear()
      .domain([0, d3.max(data, function(d) { return d.value; })])
      .range([height, 0]);

    xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

    // Removes even xAxis labels/ticks on small screens
    if (smallScreen) {
      xAxis.tickValues(x.domain().filter(function(d, i) { return !(i % 2); }))
    }

    yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")
      .ticks(5);

    svg = d3.select("#graphic").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("g")
      .attr("class", "x axis")
      .call(xAxis)
      .attr("transform", "translate(0," + height + ")")
      .append("text")
        .attr("x", (smallScreen) ? x.rangeBand() : width / 2)
        .attr("y", 40)
        .style("text-anchor", "middle")
        .text("Population (thousands)")
        .classed("label", true);

    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", (smallScreen) ? 0 : -height * .4)
        .attr("y", -48)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text((smallScreen) ? "Cities" : "Number of cities")
        .classed("label", true);

    bars = svg.selectAll("rect")
        .data(data)
      .enter().append("rect")
        .attr("x", function(d) { return x(d.name); })
        .attr("y", function(d) { return y(d.value); })
        .attr("width", x.rangeBand())
        .attr("height", function(d) { return height - y(d.value); });
    

    // Tooltips on larger screens
    if (!smallScreen) {
      console.log("larger width");
      bars.on("mouseover", function(d) {
        var position = {};
        position.x = parseFloat(d3.select(this).attr("x")) ;
        position.y = parseFloat(d3.select(this).attr("y")) / 2 + height * 0.1;

        d3.select(".tooltip")
          .style("left", position.x + "px")
          .style("top", position.y + "px")
          .select("#value")
          .text(d.name);

        d3.select(".tooltip .northeast")
          .text("Northeast: " + d.northeast);

        d3.select(".tooltip .south")
          .text("South: " + d.south);

        d3.select(".tooltip .midwest")
          .text("Midwest: " + d.midwest);

        d3.select(".tooltip .west")
          .text("West: " + d.west);

        d3.select(".tooltip").classed("hidden", false);
      });

      bars.on("mouseout", function() {
        d3.select(".tooltip").classed("hidden", true);
      });
    }
    
  } // End of drawGraphic

  if (pymChild) {
    pymChild.sendHeightToParent();
  }

  d3.csv(url, type, function(error, csv) {
    if (error) throw error;

    data = csv;

    pymChild = new pym.Child({ renderCallback: drawGraphic });
  });

  function type(d) {
    d.value = +d.value;
    return d;
  }  
})();
