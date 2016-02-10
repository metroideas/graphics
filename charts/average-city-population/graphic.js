(function() {
  var
  data,
  pymChild,
  container    = document.querySelector("#graphic"),
  url          = "data.csv",
  aspect_ratio = { width: 1, height: 1 }
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
    r,
    xAxis,
    yAxis,
    svg,
    circles,
    margin = { top: 64, right: 64, bottom: 48, left: 48 },
    width  = container_width - margin.left - margin.right,
    height = Math.ceil(width * aspect_ratio.height / aspect_ratio.width) - margin.top - margin.bottom
    ;

    // Use smallScreen boolean for layout changes
    if (width <= 512) {
      var smallScreen = true;
    }

    x = d3.scale.log()
      .domain([60000, 600000])
      .range([0, width])

    y = d3.scale.linear()
      .domain([0, 550000])
      .range([height, 0]);

    r = d3.scale.linear()
      .domain([0, d3.max(data, function(d) { return d.value; })])
      .range([0, height / 5]);

    xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom")
      .ticks(3);

    yAxis = d3.svg.axis()
      .scale(y)
      .orient("right")
      .ticks(3);

    svg = d3.select("#graphic").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
      .append("text")
        .text("Population")
        .attr("transform", "rotate(-90)")
        .attr("y", -6)
        .attr("x", -85);

    circles = svg.selectAll("g.city")
        .data(data)
      .enter().append("g")
        .classed("city", true);

    circles.append("circle")
        .attr("cx", function(d) { return x(d.value); })
        .attr("cy", function(d) { return y(d.value); })
        .attr("r", function(d) { return r(d.value); })
        ;

    circles.append("text")
      .text(function(d) { return d.name; })
      .attr("x", function(d) {
        var xPosition = x(d.value);

        if (d.value < 115000) {
          return xPosition + 5;
        } else if (d.value < 200000) {
          return xPosition + 15;
        } else {
          return xPosition - 100;
        }
      })
      .attr("y", function(d) {
        var yPosition = y(d.value);

        if (d.value < 100000) {
          return yPosition + 10;
        } else if (d.value < 115000) {
          return yPosition + 5;
        } else {
          return yPosition;
        }
        // return y(d.value) + 10;
      })
      .attr("text-anchor", "start");

    
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
