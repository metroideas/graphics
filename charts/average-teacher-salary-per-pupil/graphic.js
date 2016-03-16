(function() {
  var
  data,
  chart     = document.querySelector("#chart"),
  container = document.querySelector("#graphic")
  ;

  function graphic(containerWidth) {
    var
    x,
    y,
    x2008,
    x2016,
    axis,
    margin = { top: 24, right: 12, bottom: 12, left: 12 },
    width  = calculateWidth(),
    height = data.length * 24 - margin.top - margin.bottom,
    mobile = (width <= 414),
    svg
    ;

    // Clear existing chart contents
    chart.innerHTML = "";

    // Scales and axes
    // ---------------------------------------------------------------------------
    x = d3.scale.ordinal()
      .rangeRoundBands([0, width])
      .domain(["2008", "School", "2016"]);

    y = d3.scale.ordinal()
      .rangeRoundBands([0, height])
      .domain(data.map(function(d) { return d.name; }));

    x2008 = d3.scale.linear()
      .domain([-1, 1])
      .range([x("2016"), x("2008")]);

    x2016 = d3.scale.linear()
      .domain([-1, 1])
      .range([x("2016"), width]);

    axis = d3.svg.axis()
      .scale(x)
      .orient("top")
      .tickSize(-height, 0, 0);

    svg = d3.select(chart).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("g")
      .attr("class", "x axis")
      .call(axis)
      .attr("transform", "translate(0," + margin.top / 2 + ")")
      ;

    // Lines
    svg.append("path")
      .datum(data)
      .attr("d", function(d) { return line("2008")(d); })
      .attr("fill", "none")
      .attr("stroke", "steelblue");

    svg.append("path")
      .datum(data)
      .attr("d", function(d) { return line("2016")(d); })
      .attr("fill", "none")
      .attr("stroke", "steelblue");

    // Fill area
    svg.append("path")
      .datum(data)
      .attr("class", "area")
      .attr("d", function(d) { return area()(d); })
      .attr("fill", "steelblue")
      .attr("fill-opacity", 0.5);

    // School group
    svg.selectAll("g.school")
        .data(data)
      .enter().append("g")
        .attr("class", "school")
        .attr("transform", function(d) {
          return "translate(0," + y(d.name) + ")";
        });

    // School labels
    svg.selectAll("g.school").append("text")
      .attr("x", x("School") * 1.5)
      .attr("y", y.rangeBand() / 2)
      .style("text-anchor", "middle")
      .style("alignment-baseline", "middle")
      .text(function(d) { return d.name; });

    // Guide lines separating g.school
    svg.selectAll("g.school").append("line")
      .attr("class", "average")
      .attr({ x1: 0, x2: width, y1: y.rangeBand(),  y2: y.rangeBand() })
      ;

    // // Plot differences from 2008/2016 averages
    svg.selectAll("g.school").append("circle")
      .attr("class", "plot")
      .attr("cy", y.rangeBand() / 2)
      .attr("cx", function(d) { return plot(d, "2008"); })
      .attr("r", 2);

    svg.selectAll("g.school").append("circle")
      .attr("class", "plot")
      .attr("cy", y.rangeBand() / 2)
      .attr("cx", function(d) { return plot(d, "2016"); })
      .attr("r", 2);

    function plot(d, year) {
      var value = d.years.filter(function(y) {
        return y.year == year;
      })[0].value;

      return (year == "2008") ? x2008(value) : x2016(value);
    }

    function line(year) {
      return d3.svg.line()
        .x(function(d) { return plot(d, year); })
        .y(function(d) { return y(d.name) + y.rangeBand() / 2; })
        .interpolate("basis");
    }

    function area() {
      return d3.svg.area()
        .x0(function(d) { return plot(d, "2008"); })
        .x1(function(d) { return plot(d, "2016"); })
        .y(function(d)  { return y(d.name) + y.rangeBand() / 2; })
        .interpolate("basis");
    }




    // Helper functions
    // ---------------------------------------------------------------------------
    function calculateWidth() {
      if (!containerWidth) {
       var containerWidth = +container.offsetWidth;
      }
      return containerWidth - margin.left - margin.right;
    }
  } // End of graphic()



  // Load, map data
  // ---------------------------------------------------------------------------
  d3.csv("data.csv", cast, function(error, csv) {
    if (error) throw error;

    var years = ["2008", "2016"];

    data = csv.map(function(row) {
      return {
        nces: row.nces,
        name: row.name,
        years: years.map(function(year) {
          return {
            year: year,
            title: row[year + "_title"],
            value: row[year + "_difference"]  
          };
        })
      };
    });

    console.log(data);

    new pym.Child({ renderCallback: graphic });
  });

  function cast(d) {
    for (var key in d) {
      switch(key) {
        case "nces":
        case "name":
          d[key] = d[key];
          break;
        case "2008_title":
        case "2016_title":
          d[key] = (d[key] == "1");
          break;
        default:
          d[key] = +d[key];
      }
    }
    return d;
  }

})()