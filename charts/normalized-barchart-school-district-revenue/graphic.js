(function() {
  var
  data,
  keys,
  chart = document.querySelector(".chart")
  ;

  function drawGraphic(containerWidth) {
    chart.innerHTML = "";

    var
    x,
    y,
    xAxis,
    yAxis,
    color,
    legend,
    svg,
    margin = { top: 0, right: 18, bottom: 16, left: 80 },
    width  = calculateWidth(),
    mobile = (width <= 320),
    ratio  = (mobile) ? { width: 1, height: 2 } : { width: 1, height: 1 },
    height = calculateHeight()
    ;

    // Helper functions for chart dimensions
    // ---------------------------------------------------------------------------
    function marginWidth()  { return margin.left + margin.right; }
    function marginHeight() { return margin.top + margin.bottom; }

    function calculateWidth() {
      if (!containerWidth) { var containerWidth = +chart.offsetWidth; }
      return Math.ceil(containerWidth - marginWidth());
    }
    
    function calculateHeight() {
      return Math.ceil(width * ratio.height / ratio.width) - marginHeight();
    }

    // Legend
    // ---------------------------------------------------------------------------
    d3.select(".legend").style("margin-left", (mobile) ? "7px" : margin.left + "px");

    // Scales and axis
    // ---------------------------------------------------------------------------
    x = d3.scale.linear()
      .domain([0, 1])
      .range([0, width]);

    y = d3.scale.ordinal()
      .domain(data.map(function(d) { return d.district; }))
      .rangeRoundBands([0, height], 0.25);

    xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom")
      .ticks(4, "%")
      .tickValues((mobile) ? [ 0, 0.5, 1 ]: [ 0, 0.25, 0.5, 0.75, 1 ])
      .tickSize(-height,0,0);

    yAxis = d3.svg.axis()
      .scale(y)
      .orient("left");

    color = d3.scale.ordinal()
      .domain(keys)
      .range(["#0060ae","#8dbd45","#df2027","#ff6d74","#ffb9c0"]);

    // svg setup
    // ---------------------------------------------------------------------------
    svg = d3.select(chart).append("svg")
        .attr("width", width + marginWidth())
        .attr("height", height + marginHeight())
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")" )
      .call(xAxis);

    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis);

    // First tick mark
    d3.select(".tick text").remove();
    d3.select(".tick line").attr("stroke-dasharray", "0.9");

    // School district bar graphs
    // ---------------------------------------------------------------------------
    svg.selectAll("g.district")
        .data(data)
      .enter().append("g")
        .attr("class", "district")
        .attr("transform", function(d) { return "translate(0," + y(d.district) + ")"; });

    svg.selectAll("g.district").selectAll("rect")
        .data(function(d) { return d.revenues; })
      .enter().append("rect")
        .attr("x", function(d) { return x(d.x); })
        .attr("width", function(d) { return x(d.width); })
        .attr("height", y.rangeBand())
        .attr("fill", function(d) { return color(d.key); });

    // Tooltip on hover
    // ---------------------------------------------------------------------------
    if (!mobile) {
      svg.selectAll("g.district")
        .on("mouseover", function() {
          var hover = d3.select(this).classed("hover", true);

          hover.append("rect")
            .attr("id", "tooltip")
            .attr("fill", "white")
            .attr("fill-opacity", 0.8)
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", width)
            .attr("height", y.rangeBand())
            .attr("pointer-events", "none");

          hover.selectAll("text")
              .data(function(d) { return d.revenues; })
            .enter().append("text")
              .attr("x", function(d, i) { return x(i/width * 100); })
              .attr("y", y.rangeBand() / 2)
              .attr("dx", 7)
              .attr("dy", 1)
              .attr("alignment-baseline", "middle")
              .attr("class", "label")
              .attr("pointer-events", "none")
              .text(function(d) {
                function label(key) {
                  switch (key) {
                    case "local":
                      return "Local";
                    case "state":
                      return "State";
                    case "title":
                      return "Title I";
                    case "idea":
                      return "IDEA";
                    case "other":
                      return "Other federal"
                  }
                }

                function value(decimal) {
                  var pct = Math.round(decimal * 100);
                  return (pct == 0) ? "~0" : pct;
                }

                return label(d.key) + ": " + value(d.width) + "%";
              });

          d3.select(".label:last-child").attr("dx", 0);
        })
        // Remove tooltip and associated text labels
        .on("mouseout", function() {
          d3.select("rect#tooltip").remove();
          d3.selectAll(".label").remove();
          d3.select(this).classed("hover", false);
        });
    }    
  } // End of drawGraphic()

  d3.csv("data.csv", type, function(error, csv) {
    if (error) throw error;

    keys  = ["local","state","title","idea","other"];

    data = csv.map(function(d) {
      var x = 0;

      return {
        district: d.district,
        revenues: keys.map(function(key) {
          x += d[key];

          return {
            key:   key,
            width: d[key],
            x:     x - d[key]
          };
        })
      };
    });

    new pym.Child({ renderCallback: drawGraphic });
  });

  function type(d) {
    for (var key in d) {
      if (key != "district") {
        d[key] = +d[key];
      }
    }

    return d;
  }
})();