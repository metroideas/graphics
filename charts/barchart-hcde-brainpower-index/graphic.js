(function() {
  var
  data,
  container = document.querySelector("#graphic"),
  chart     = document.querySelector("#graphic .chart") 
  ;

  function drawGraphic(containerWidth) {
    // Clear chart contents on page load and window resize
    chart.innerHTML = "";

    var
    x,
    y,
    xAxis,
    yAxis,
    legend,
    svg,
    margin,
    width,
    height,
    schools = data.map(function(d) { return d.name; })
    ;

    if (!containerWidth) {
      var containerWidth = +container.offsetWidth;
    }

    // Set dimensions, scales and axes for vertical or horizontal bar chart
    // (containerWidth < 768) ? verticalBarChart() : horizontalBarChart();
    verticalBarChart();
    
    // Header adjustments
    // ---------------------------------------------------------------------------
    d3.select(container).select("header").style({
      "margin-left": margin.left + "px",
      "margin-right": margin.right + "px"
    });

    function verticalBarChart() {
      margin = { top: 32, right: 16, bottom: 16, left: 16 };
      width  = calculateWidth(margin.left + margin.right);
      height = (data.length * 26 - margin.top - margin.bottom);

      x = d3.scale.linear()
        .domain([0, 0.4])
        .range([0, width]);

      y = d3.scale.ordinal()
        .domain(schools)
        .rangeRoundBands([0, height], 0.1);

      xAxis = d3.svg.axis()
        .scale(x)
        .orient("top")
        .tickValues([ 0, 0.1, 0.2, 0.3, 0.4, 0.5 ])
        .tickSize(-height, 0, 0);

      yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

      svg = d3.select(chart).append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
        .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      svg.append("g")
        .attr("class", "x axis")
        .call(xAxis);

      svg.selectAll("g.vertical")
          .data(data)
        .enter().append("g")
          .attr("class", "vertical")
          .attr("transform", function(d) {
            return "translate(0," + y(d.name) + ")";
          });

      svg.selectAll("g.vertical").append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", function(d) { return x(d.bpi); })
        .attr("height", y.rangeBand())
        .attr("fill", "steelblue")
        .style("fill-opacity", 0.8);

      svg.selectAll("g.vertical").append("rect")
        .attr("x", 0)
        .attr("y", y.rangeBand() * .33)
        .attr("height", y.rangeBand() * .33)
        .attr("width", function(d) {
          x.domain([0,1]);
          return x(d.econ_disadvantaged);
        })
        .attr("fill", "red")
        .style("fill-opacity", 0.5);

      // Reset x domain
      x.domain([0, 0.4]);

      svg.selectAll("g.vertical").append("text")
        .attr("x", 2)
        .attr("y", y.rangeBand() / 2)
        .attr("dx", function(d) {
          return (d.bpi < 0.19) ? x(d.bpi) : 0;
        })
        .attr("fill", function(d) {
          return (d.bpi < 0.19) ? "black" : "white";
        })
        .style("alignment-baseline", "middle")
        .text(function(d) { return d.name; });
    }

    function horizontalBarChart() {
      margin = { top: 16, right: 48, bottom: 196, left: 48 };
      ratio  = { width: 8, height: 5 };
      width  = calculateWidth(margin.left + margin.right);
      height = calculateHeight(width, ratio.height / ratio.width, margin.top + margin.bottom);

      x = d3.scale.ordinal()
        .domain(schools)
        .rangeRoundBands([0, width], 0.3, 0);

      console.log(x.rangeBand());

      y = d3.scale.linear()
        .domain([0, 0.5])
        .range([height, 0]);

      xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

      yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .tickSize(-width, 0, 0);

      svg = d3.select(chart).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      svg.selectAll("rect")
          .data(data)
        .enter().append("rect")
          .attr("x", function(d) { return x(d.name); })
          .attr("y", function(d) { return y(d.bpi); })
          .attr("width", x.rangeBand())
          .attr("height", function(d) { return height - y(d.bpi); })
          .attr("fill", "steelblue");

      svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

      d3.selectAll(".x.axis text")
        .attr("transform", "rotate(-90)")
        .attr("dx", -8)
        .attr("dy", 0)
        .attr("y", 0)
        .style("alignment-baseline", "middle")
        .style("text-anchor", "end");

      svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
          .append("text")
          .attr("transform", "rotate(-90)")
          .attr("dy", -32)
          .attr("x", -height / 2)
          .style("text-anchor", "middle")
          .text("Brainpower index");
    }

    // Helper functions for chart dimensions
    // ---------------------------------------------------------------------------
      function calculateWidth(margin) {
        if (!containerWidth) {
          var containerWidth = +container.offsetWidth;
        }

        return Math.ceil(containerWidth - margin);
      }
      
      function calculateHeight(width, ratio, margin) {
        return Math.ceil(width * ratio - margin);
      }
    // ---------------------------------------------------------------------------
  } // End of drawGraphic()


  // Load and map data
  // ---------------------------------------------------------------------------
  d3.csv("data.csv", cast, function(error, csv) {
    if (error) throw error;

    data = csv.filter(function(d) { return d.econ_disadvantaged != 0; })
      .sort(function(a, b) { return b.bpi - a.bpi; });
    

    new pym.Child({ renderCallback: drawGraphic });
  });

  function cast(d) {
    for (var key in d) {
      if (key != "name") {
        d[key] = +d[key];
      }
    }

    return d;
  }
})()