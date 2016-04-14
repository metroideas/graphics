(function() {
  var
  data,
  keys,
  container = document.querySelector("#container"),
  chart     = document.querySelector("#chart")
  ;

  // Draw chart
  // ---------------------------------------------------------------------------
  function draw(containerWidth) {
    // Generic variables:
    var
    x,
    y,
    color,
    axis,
    svg,
    grades,
    legend
    ;

    // Chart dimensions: 
    // Width breakpoint
    var mobile = (+container.offsetWidth <= 414);

    // Conventional margin with accessors
    var margin = {
      top: 16,
      right: 16,
      bottom: 16,
      left: 72,
      width: function() { return this.right + this.left; },
      height: function() { return this.top + this.bottom; }
    };
    
    // Aspect ratio
    var ratio  = (mobile) ? { width: 1, height: 1 } : { width: 8, height: 5 };
    
    // Container width minus left/right margin
    var width  = function() {
      if (!containerWidth) {
        var containerWidth = +container.offsetWidth;
      }

      return containerWidth - margin.width();
    }();
    
    // Chart height minus top/bottom margin
    var height = function() {
      var f = ratio.height / ratio.width;

      return Math.round(width * f - margin.height());
    }();
    
    // Clear existing contents
    chart.innerHTML = "";

    // Scales and svg setup
    // ---------------------------------------------------------------------------
    x = d3.scale.linear()
      .domain([0, 1])
      .range([0, width]);

    y = d3.scale.ordinal()
      .domain(data.map(function(d) { return d.grade; }))
      .rangeRoundBands([0, height], 0.25);

    color = d3.scale.ordinal()
      .domain(keys)
      .range(['#ccece6','#99d8c9','#66c2a4','#2ca25f','#006d2c']);

    axis = d3.svg.axis()
      .scale(x)
      .orient("bottom")
      .tickSize(-height, 0, 0)
      .tickValues([.25, .5, .75, 1])
      .ticks(null, "%");

    svg = d3.select(chart).append("svg")
        .attr("width", width + margin.width())
        .attr("height", height + margin.height())
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("g")
      .attr("class", "axis")
      .call(axis)
      .attr("transform", "translate(0," + height + ")");

    // Normalized bar chart
    // ---------------------------------------------------------------------------
    grades = svg.selectAll("g.grades")
        .data(data)
      .enter().append("g")
        .attr("class", "grades")
        .attr("transform", function(d) {
          return "translate(0," + y(d.grade) + ")";
        });

    // Labels
    grades.append("text")
      .attr("class", "label")
      .attr("x", 0)
      .attr("y", y.rangeBand() / 2)
      .attr("dx", -6)
      .attr("dominant-baseline", "middle")
      .attr("text-anchor", "end")
      .text(function(d) { return d.grade; });

    // Rows
    grades.selectAll("g.spending")
        .data(function(d) { return d.spending; })
      .enter().append("g")
        .attr("class", "spending");

    // Rects
    d3.selectAll("g.spending").append("rect")
      .attr("x", function(d) { return x(d.x); })
      .attr("width", function(d) { return x(d.width); })
      .attr("height", y.rangeBand())
      .attr("fill", function(d) { return color(d.range); })
      .attr("fill-opacity", 0.95);

    // Rect labels
    d3.selectAll("g.spending").append("text")
      .attr("x", function(d) { return x(d.x) + x(d.width) / 2; })
      .attr("y", y.rangeBand() / 2)
      .attr("dominant-baseline", "middle")
      .attr("text-anchor", "middle")
      .style("font-size", (+container.offsetWidth <= 375) ? "8px" : "12px")
      .text(function(d) { return d3.format("%")(d.width); });

    // Legend
    // ---------------------------------------------------------------------------
    // Clear .legend on resize
    document.querySelector(".legend").innerHTML = "";

    // Legend scale (horizontal and ordinal)
    legend = d3.scale.ordinal()
      .domain(keys)
      .rangeRoundBands([0, y.rangeBand() * keys.length], 0.1);

    axis = d3.svg.axis()
      .scale(legend)
      .orient("bottom")
      .tickValues(keys.filter(function(k,i) { return i % 2 == 0; })); // Even tick labels

    // Repurpose svg variable
    svg = d3.select(".legend").append("svg")
        .attr("width",  y.rangeBand() * keys.length + 32)
        .attr("height", legend.rangeBand() + 64)
      .append("g")
        .attr("transform", "translate(16,16)");
    
    // Legend axis
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + legend.rangeBand() + ")")
        .call(axis)
      .selectAll(".tick text")
        .call(wrap, legend.rangeBand() * 1.25);

    // Legend rects
    svg.selectAll("rect.key")
        .data(keys)
      .enter().append("rect")
        .attr("class", "key")
        .attr("y", 0)
        .attr("x", function(d) { return legend(d); })
        .attr("width", legend.rangeBand())
        .attr("height", legend.rangeBand())
        .attr("fill", function(d) { return color(d); })
        .attr("fill-opacity", 0.95);

    // Wrap axis labels to width.
    // https://bl.ocks.org/mbostock/7555321
    function wrap(text, width) {
      text.each(function() {
        var text = d3.select(this),
          words = text.text().split(/\s+/).reverse(),
          word,
          line = [],
          lineNumber = 0,
          lineHeight = 1.1, // ems
          y = text.attr("y"),
          dy = parseFloat(text.attr("dy")),
          tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");

        while (word = words.pop()) {
          line.push(word);
          tspan.text(line.join(" "));
          if (tspan.node().getComputedTextLength() > width) {
            line.pop();
            tspan.text(line.join(" "));
            line = [word];
            tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
          }
        }
      });
    } // End of wrap()
    
  } // End of draw()

  // Load and map data
  // --------------------------------------------------------------------------- 
  d3.csv("data.csv", type, function(error, csv) {
    if (error) throw error;

    keys = d3.keys(csv[0]).filter(function(k) { return k != "grade" && k != "total"; });

    data = csv.map(function(d) {
      var x = 0;      
      return {
        grade:    d.grade,
        total:    d.total,
        spending: keys.map(function(k) {
          x += d[k];
          return { range: k, width: d[k], x: x - d[k] };
        })
      };
    });

    new pym.Child({ renderCallback: draw });
  });

  // Type coercion
  function type(d) {
    for (var key in d) {
      if (+d[key]) {
        d[key] = +d[key];
      } else {
        d[key] = d[key];
      }
    }

    return d;
  }

})()