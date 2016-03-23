(function() {
  var
  data,
  chart     = document.querySelector("#chart"),
  container = document.querySelector("#graphic")
  ;

  function graphic(containerWidth) {
    var
    rows    = rows(),
    quads   = d3.set(data.map(function(d) { return d.quad; })).values(), // [1 .. 4]
    desktop = (+container.offsetWidth >= 768),
    mobile  = !desktop,
    margin  = (mobile)
              ? { top: 30, right: 0, bottom: 16, left: 0 }
              : { top: 36, right: 0, bottom: 16, left: 0 },
    width   = calculateWidth(),
    height  = calculateHeight(24),
    bars    = {},
    color,
    x,
    y,
    svg,
    schools
    ;

    // Scales
    // ---------------------------------------------------------------------------
    color = d3.scale.ordinal()
      .domain(["2008", "2016"])
      .range(["#c2d7eb", "#0961ae"]);
    
    x = d3.scale.ordinal()
      .domain(["label", "bars"])
      .range([0, width * .35]);

    y = d3.scale.ordinal()
      .domain(d3.range(0, rows))
      .rangeRoundBands([0, height]);

    bars.x = d3.scale.linear()
      .domain([
        d3.min(data, function(d) { return d3.min(d.years, function(y) { return y.value; })}),
        d3.max(data, function(d) { return d3.max(d.years, function(y) { return y.value; })})
      ])
      .range([x("bars"), width])
      .nice();

    bars.y = d3.scale.ordinal()
      .domain(color.domain())
      .rangeRoundBands([3, y.rangeBand() - 3]);
    
    // Generate quadrant chart
    // ---------------------------------------------------------------------------
    quads.forEach(function(quad) {
      var selector = ".q" + quad;

      // Clear existing content
      document.querySelector(selector).innerHTML = "";

      svg = d3.select(selector).append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
        .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      // Quadrant description
      svg.append("text")
        .attr("fill", "#6d6e70")
        .attr("x", 0)
        .attr("y", -margin.top * .65)
        .attr("font-size", "14px")
        .text(["Further from average, spending increased", "Closer to average, spending increased",
                "Further from average, spending decreased",   "Closer to average, spending decreased"][quad-1]);

      // Bar chart axis
      svg.append("text")
        .attr("class", "axis")
        .attr("x", bars.x(bars.x.domain()[0] / 2))
        .attr("y", -5)
        .attr("text-anchor", "middle")
        .text("—");

      svg.append("text")
        .attr("class", "axis")
        .attr("x", bars.x(bars.x.domain()[0] / -2))
        .attr("y", -5)
        .attr("text-anchor", "middle")
        .text("+");

      svg.append("text")
        .attr("class", "axis")
        .attr("x", bars.x(0))
        .attr("y", -5)
        .attr("text-anchor", "middle")
        .text("Avg.");

      // School group determines y position, data filtered by d.quad
      schools = svg.selectAll("g.school")
          .data(data.filter(function(d) { return d.quad == quad; }))
        .enter().append("g")
          .attr("class", "school")
          .attr("transform", function(d,i) {
            return "translate(0," + y(i) + ")";
          });

      schools.append("line").attr("class", "divider")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", 0)
        .attr("y2", 0);

      schools.append("text")
        .attr("class", function(d) {
          return (d.title) ? "title-i label" : "label";
        })
        .attr("x", x("label"))
        .attr("y", y.rangeBand() * .5)
        .attr("dy", 1)
        .attr("dominant-baseline", "middle")
        .text(function(d) { return d.name; });

      // Bar graphs
      bars.y.domain().forEach(function(year) {
        schools.append("rect")
          .attr("x", function(d) { return rect(d, year).x; })
          .attr("y", bars.y(year))
          .attr("width", function(d) { return rect(d, year).width; })
          .attr("height", bars.y.rangeBand())
          .attr("fill", color(year));
      });

      // 0 line on bar graph
      schools.append("line")
        .attr("class", "divider")
        .attr("x1", bars.x(0))
        .attr("x2", bars.x(0))
        .attr("y1", bars.y.range()[0])
        .attr("y2", bars.y.range()[1]);
    });
    
    // Helper functions
    // ---------------------------------------------------------------------------
    // Chart width
    function calculateWidth() {
      if (!containerWidth) {
        var containerWidth = +container.offsetWidth;
      }

      return (mobile)
             ? Math.ceil(containerWidth - margin.left - margin.right)
             : Math.ceil(containerWidth - margin.left - margin.right) / 2;
    }

    // Chart height
    function calculateHeight(height) { return rows * height; }

    // Determines number of rows for each quad chart
    function rows() {
      var lt = 0, rt = 0, lb = 0, rb = 0;
      
      data.forEach(function(d) {
        switch(d.quad) {
          case 1: lt++; break;
          case 2: rt++; break;
          case 3: lb++; break;
          case 4: rb++; break;
        }
      });

      return Math.max(lt, rt, lb, rb);
    }

    // Accessor queries each school's 2008 and 2016 objects
    function plot(d, year) {
      var value = d.years.filter(function(y) {
        return y.year == year;
      })[0].value;

      return value;
    }

    // Bar graph function handles x and width based on whether a value is 
    // greater than or less than zero
    function rect(d, year) {
      var start = bars.x(plot(d, year));
      
      return (start < bars.x(0))
             ? { x: start, width: bars.x(0) - start  }
             : { x: bars.x(0),  width: start - bars.x(0) };
    }
  } // End graphic()

  // Load and map data
  // ---------------------------------------------------------------------------
  d3.csv("data.csv", cast, function(error, csv) {
    if (error) throw error;

    
    data = csv.sort(function(a,b) { return b.net_difference - a.net_difference; })
      .map(function(row) {
        return {
          name: row.school,
          quad: row.quad,
          value: row["net_difference"],
          title: row.title,
          years: ["2008", "2016"].map(function(y) {
            return {
              year: y,
              value: row[y + "_difference"]
            };
          })
        };
      });

    new pym.Child({ renderCallback: graphic });
  });

  function cast(d) {
    for (var k in d) {
      switch(k) {
        case "description":
        case "school":
        case "column":
          d[k] = d[k];
          break;
        default:
          d[k] = +d[k];
          break;
      }
    }

    return d;
  }
})()