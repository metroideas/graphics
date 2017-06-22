(function() {
  var
  data,
  chart     = document.querySelector("#chart"),
  container = document.querySelector("#graphic")
  ;

  function drawGraphic(containerWidth) {
    chart.innerHTML = "";

    var
    x,
    y,
    axis,
    svg,
    margin   = { top: 24, right: 36, bottom: 12, left: 186 },
    width    = calculateWidth(),
    height   = data.length * 24 - margin.top - margin.bottom,
    averages = [ { name: "county",   label: "Hamilton County",  value: 5633 },
                 { name: "title",    label: "Title I",          value: 5797 },
                 { name: "nontitle", label: "Non-Title I",      value: 5398 } ]
    ;

    function calculateWidth() {
      if (!containerWidth) {
        var containerWidth = +container.offsetWidth;
      }

      return containerWidth - margin.left - margin.right;
    }

    // Header margin adjustment
    // ---------------------------------------------------------------------------
    d3.select(container).select("header")
      .style({
        "margin-left": margin.right + "px",
        "margin-right": margin.right + "px"
      });

    d3.select(container).select(".legend")
      .style({
        "margin-left": margin.right + "px",
        "margin-right": margin.right + "px"
      });

    // Domain min/max rounded up for axis labels
    // ---------------------------------------------------------------------------
    x = d3.scale.linear()
      .range([0, width])
      .domain([
        d3.min(data, function(d) {
          return d3.min(d.differences, function(diff) {
            return Math.ceil(diff.value / 1000) * 1200;
          })
        }),
        
        d3.max(data, function(d) {
          return d3.max(d.differences, function(diff) {
            return Math.ceil(diff.value / 1000) * 900;
          })
        }),
      ]);

    y = d3.scale.ordinal()
      .rangeRoundBands([0, height], .1)
      .domain(data.map(function(d) { return d.name; }));

    axis = d3.svg.axis()
      .scale(x)
      .tickValues(x.domain().concat(0))
      .tickSize(-height)
      .tickFormat(d3.format("+$,"))
      .orient("top");

    svg = d3.select(chart).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("g")
      .attr("class", "x axis")
      .call(axis)
      // Target middle (average) label
        .select(".tick:last-of-type > text")
        .text("Average");

    svg.selectAll("g.school")
        .data(data)
      .enter().append("g")
        .attr("class", "school")
        .attr("transform", function(d) {
          return "translate(0," + y(d.name) + ")";
        });

    svg.selectAll("g.school").append("rect")
      .attr("x", function(d) { return rect(d).x; })
      .attr("y", 0)
      .attr("width", function(d) { return rect(d).width; })
      .attr("height", y.rangeBand())
      .attr("fill", function(d) { return (d.title) ? "#df2027" : "#4689c2"; });

    svg.selectAll("g.school").append("text")
      .attr("x", 0)
      .attr("y", y.rangeBand() / 2)
      .attr("dx", -6)
      .style({
        "text-anchor": "end",
        "alignment-baseline": "middle"
      })
      .text(function(d) { return d.name; });

    function rect(d) {
      var key = "county";

      var value = d.differences.filter(function(k) {
        return k.name == key;
      })[0].value;

      return (value >= 0)
             ? { x: x(0), width: x(value) - x(0) }
             : { x: x(value), width: x(0) - x(value) };      
    }

  }

  // Load and map data
  // ---------------------------------------------------------------------------
  d3.csv("data.csv", cast, function(error, csv) {
    if (error) throw error;

    var keys = d3.keys(csv[0]).filter(function(k) {
      return k != "school" && k != "title";
    });

    data = csv.map(function(d) {
      return {
        name: d.school,
        title: d.title,
        differences: keys.map(function(key) {
          return {
            name: key.split("_")[0],
            value: d[key]
          };
        })
      }
    });



    new pym.Child({ renderCallback: drawGraphic });
  });

  function cast(d) {
    for (var key in d) {
      switch(key) {
        case "school":
          d[key] = d[key];
          break;
        case "title":
          d[key] = (+d[key] == 1);
          break;
        default:
          d[key] = Math.round(+d[key]);
          break;
      }
    }
    return d;
  }
})()