(function() {
  var
  data,
  chart     = document.querySelector("#chart"),
  container = document.querySelector("#graphic")
  ;

  function graphic(containerWidth) {
    chart.innerHTML = "";

    // Dimensions
    var
    row,
    column,
    bar      = {},
    svg,
    schools,
    color    = { "2008": "#df2027", "2016": "#0961ae" }
    margin   = { top: 24, right: 24, bottom: 0, left: 0 },
    width    = calculateWidth(),
    large    = (width >= 768),      // Breakpoint
    small    = !large,              // Breakpoint
    height   = calculateHeight(48)  // Row is ~48px high
    ;

    // Scales, svg setup
    // ---------------------------------------------------------------------------
    row = d3.scale.ordinal()
      .domain(data.map(function(d) { return d.position.row; }))
      .rangeRoundBands([0, height]);

    column = d3.scale.ordinal()
      .domain(["left", "right"])
      .range([0, width]);

    bar.x = d3.scale.linear()
      .domain([
        d3.min(data, function(d) {
          return d3.min(d.years, function(y) { return y.value; })
        }),
        d3.max(data, function(d) {
          return d3.max(d.years, function(y) { return y.value; })
        })
      ])
      .range([0, width * .25])
      .nice();

    bar.y = d3.scale.ordinal()
      .domain(["2008", "2016"])
      .rangeRoundBands([row.rangeBand() * .25, row.rangeBand() * .75]);

    svg = d3.select(chart).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Quadrant divider
    svg.append("line")
      .attr("class", "quadrant")
      .attr("x1", width / 2)
      .attr("x2", width / 2)
      .attr("y1", 0)
      .attr("y2", height);

    // Row dividers
    row.domain().forEach(function(d) {
      svg.append("line")
        .attr("class", "divider")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", row(d))
        .attr("y2", row(d));
    });

    // Schools 
    // ---------------------------------------------------------------------------
    schools = svg.selectAll("g.school")
        .data(data)
      .enter().append("g")
        .attr("class", "school")
        .attr("transform", function(d) {
          var x = column(d.position.column),
              y = row(d.position.row);

          return "translate(" + x + "," + y + ")";
        });

    schools.append("text")
      .attr("class", "label")
      .attr("x", 0)
      .attr("y", 0)
      .attr("dx", function(d) {
        var x = (d.position.column == "left") ? 1 : -1;
        
        return x * 2;
      })
      .attr("dy", 12)
      .attr("text-anchor", function(d) {
        return (d.position.column == "left") ? "start" : "end";
      })
      .text(function(d) { return d.name; })

    schools.append("g").attr("class", "bar-graph")
      .attr("transform", function(d) {
        var x = (d.position.column == "left") 
                ? 0 :
                -width * .25;

        return "translate(" + x + ",8)";
      })
      ;

    schools.selectAll("g.bar-graph").append("line")
      .style({
        "stroke": "black",
        "stroke-width": "1px"
      })
      .attr("x1", bar.x(0))
      .attr("x2", bar.x(0))
      .attr("y1", bar.y("2008"))
      .attr("y2", bar.y("2016"));

    // 2008 bar
    
    schools.selectAll("g.bar-graph").append("rect")
      .attr("fill", color["2008"])
      .attr("x", function(d) { return bar.x(rect(d, "2008").x); })
      .attr("y", bar.y("2008"))
      .attr("height", bar.y.rangeBand())
      .attr("width", function(d) { return bar.x(rect(d, "2008").width); });
    
    schools.selectAll("g.bar-graph").append("rect")
      .attr("fill", color["2016"])
      .attr("x", function(d) { return bar.x(rect(d, "2016").x); })
      .attr("y", bar.y("2016"))
      .attr("height", bar.y.rangeBand())
      .attr("width", function(d) { return bar.x(rect(d, "2016").width); });

    // Helper functions
    // ---------------------------------------------------------------------------
    // Accessor queries each school's 2008 and 2016 objects
    function plot(d, year) {
      return d.years.filter(function(y) { return y.year == year; })[0].value;
    }

    // Bar graph function handles x and width based on whether a value is 
    // greater than or less than zero
    function rect(d, year) {

      var start = plot(d, year);
      
      return (start < 0)
             ? { x: start, width: 0 }
             : { x: 0,  width: start };
    }

    // Chart width
    function calculateWidth() {
      if (!containerWidth) {
        var containerWidth = +container.offsetWidth;
      }
      
      return Math.ceil(containerWidth - margin.left - margin.right);
    }

    // Returns height for 2-column chart
    function calculateHeight(height) {
      var rows = d3.max(data, function(d) { return d.position.row + 1; });

      return rows * height;
    }


  }

  d3.csv("data.csv", cast, function(error, csv) {
    if (error) throw error;

    var l = 0, r = 0;

    data = csv.map(function(row) {
      return {
        name: row.school,
        quad: row.quad,
        value: row["net_difference"],
        years: ["2008", "2016"].map(function(y) {
          return {
            year: y,
            value: row[y + "_difference"]
          };
        }),
        position: {
          column: (row.quad % 2 == 0) ? "right" : "left",
          row: (row.quad % 2 == 0) ? r++ : l++
        }
      };
    });

    console.log(data);
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