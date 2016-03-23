(function() {
  var
  data,
  container = document.querySelector("#graphic"),
  chart     = document.querySelector("#chart")
  ;

  function graphic(containerWidth) {
    // Clear chart contents on page load and window resize
    chart.innerHTML = "";

    var
    y,
    bpi,
    test,
    colors,
    axis,
    mobile  = (+container.offsetWidth < 512),
    margin  = (mobile)
              ? { top: 32, right: 4, bottom: 16, left: 4 }
              : { top: 32, right: 4, bottom: 16, left: 180 },
    width   = calculateWidth(),
    height  = (data.length * 32 - margin.top - margin.bottom),
    svg,
    schools 
    ;

    // Scales
    // --------------------------------------------------------------------------- 
    y = d3.scale.ordinal()
      .domain(data.map(function(d) { return d.name; }))
      .rangeRoundBands([0, height], 0.1);

    bars = d3.scale.ordinal()
      .domain(["bpi", "test"])
      .rangeRoundBands([0, y.rangeBand()]);

    colors = d3.scale.ordinal()
      .domain(bars.domain())
      .range(["#0961ae", "#c2d7eb"]);

    bpi = d3.scale.linear()
      .domain([0, d3.max(data, function(d) { return d.bpi; })])
      .range([0, width])
      .nice();

    test = d3.scale.linear()
      .domain([0, d3.max(data, function(d) { return d.test; })])
      .range([0, width]);

    axis = d3.svg.axis()
      .scale(test)
      .orient("top")
      .tickValues([0,2.5,5])
      .tickSize(-height, 0, 0)
      .tickFormat(d3.format("d"));

    // Bars
    // --------------------------------------------------------------------------- 
    svg = d3.select(chart).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("g")
      .attr("class", "axis")
      .call(axis);

    d3.select("g.axis").selectAll(".tick:last-of-type text")
      .style("font-size", "14px")
      .text("+");

    schools = svg.selectAll("g.school")
        .data(data)
      .enter().append("g")
        .attr("class", "school")
        .attr("transform", function(d) {
          return "translate(0," + y(d.name) + ")";
        });

    bars.domain().forEach(function(k) {
      schools.append("rect")
        .attr("class", k)
        .attr("fill-opacity", 0.85)
        .attr("fill", colors(k))
        .attr("x", 0)
        .attr("y", bars(k))
        .attr("height", bars.rangeBand())
        .attr("width", function(d) {
          return (k == "bpi") ? bpi(d.bpi) : test(d.test);
        });
    });

    // Labels
    // ---------------------------------------------------------------------------
    schools.append("text")
      .attr("class", "label")
      .attr("dominant-baseline", "hanging")
      .text(function(d) { return d.name; });

    if (mobile) {
      schools.selectAll("text.label")
        .attr("x", function(d) {
          if (bpi(d.bpi) < 141 )
            return bpi(d.bpi);
          else {
            return 0;
          }
        })
        .attr("y", bars(bars.domain()[0]))
        .attr("dx", 2)
        .attr("dy", 2)
        .style("fill", function(d) { return (bpi(d.bpi) < 141) ? "" : "white"; });
    } else {
      schools.selectAll("text.label")
        .attr("x", 0)
        .attr("y", bars.rangeBand() * .5)
        .attr("dx", -2)
        .attr("text-anchor", "end");
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

  // Load and map data
  // ---------------------------------------------------------------------------
  d3.csv("data.csv", cast, function(error, csv) {
    if (error) throw error;

    data = csv.sort(function(a, b) { return b.bpi - a.bpi; })
      .map(function(row) {
        return {
          name: row.name,
          bpi:  row.bpi,
          test: row.composite
        }
      });
    
    new pym.Child({ renderCallback: graphic });
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