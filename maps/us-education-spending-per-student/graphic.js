(function() {
  var
  data,
  container = document.querySelector("#container"),
  chart     = document.querySelector("#chart")
  ;

  // Draw chart
  // ---------------------------------------------------------------------------
  function draw(containerWidth) {
    var
    // Map variables
    color,
    projection,
    path,
    svg,
    states,
    // Legend variables
    legend,
    m,
    w,
    h,
    x,
    y
    ;

    // Dimensions
    // ---------------------------------------------------------------------------
    var mobile = (+container.offsetWidth <= 414);

    var margin = {
      top: 16, right: 0, bottom: 16, left: 0,
      width: function() { return this.right + this.left; },
      height: function() { return this.top + this.bottom; }
    };
    
    var ratio  = (mobile) ? { width: 5, height: 3 } : { width: 8, height: 5 };
    
    var width  = function() {
      if (!containerWidth) {
        var containerWidth = +container.offsetWidth;
      }

      return containerWidth - margin.width();
    }();
    
    var height = function() {
      var f = ratio.height / ratio.width;

      return Math.round(width * f - margin.height());
    }();

    // Map
    // ---------------------------------------------------------------------------
    // Clear existing contents
    chart.innerHTML = "";

    color = d3.scale.quantize()
      .range(['rgb(204,236,230)','rgb(153,216,201)','rgb(102,194,164)','rgb(44,162,95)','rgb(0,109,44)'])
      .domain(d3.extent(data.features, function(d) { return d.properties.average; }));

    // Scales and svg setup
    svg = d3.select(chart).append("svg")
        .attr("width", width + margin.width())
        .attr("height", height + margin.height())
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    projection = d3.geo.albersUsa()
      .scale([width * 1.4])
      .translate([width / 2, height / 2]);

    path = d3.geo.path()
      .projection(projection);

    states = svg.selectAll("path")
        .data(data.features)
      .enter().append("path")
        .attr("d", path)
        .attr("class", "state");

    // Color encode spending per student
    states.attr("stroke", "white")
      .attr("fill", function(d) { return color(d.properties.average); });

    // Tooltip on hover
    states.on("mouseover", function(d) {
      var
      tooltip = d3.select("#tooltip").classed("hidden", false),
      left    = d3.event.pageX,
      top     = d3.event.pageY
      ;

      // Values
      tooltip.select("[data-item=name]").html(d.properties.name);
      tooltip.select("[data-item=average]").html(d3.format("$,")(d.properties.average));
      tooltip.select("[data-item=rank]").html(function() {
        function suffix(n) {
          if (n > 3 && n < 21) return "th";
          switch (n % 10) {
            case 1:  return "st";
            case 2:  return "nd";
            case 3:  return "rd";
            default: return "th";
          }
        };
        
        return d.properties.rank.toString() + suffix(d.properties.rank);
      });
      
      // Position
      // tooltip.style("left", left + 15 + "px");
      tooltip.style("left", (left > w / 2) ? left - 165 + "px" : left + 15 + "px");
      tooltip.style("top", (top > h / 2) ? top - 50 + "px": top - 15 + "px");
    })
    .on("mouseout", function() {
      d3.select("#tooltip").classed("hidden", true);
    });

    // Bar chart/legend
    // ---------------------------------------------------------------------------
    // Clear legend
    document.querySelector("#legend").innerHTML = "";
    // Legend dimensions
    // Margins
    m = { top: 0, right: 0, bottom: 16, left: 72 };

    m.width  = function() { return this.left + this.right; };
    m.height = function() { return this.top + this.bottom; };

    // Width and height
    w = (mobile) ? width - m.width() : width * .75 - m.width();
    h = color.range().length * 20 - m.height();

    // Data generated from path(s) fill
    data.count = color.range().map(function(rgb) {
      var s = "path.state[fill='" + rgb + "']";
      
      // Number of states with a particular color
      var value = svg.selectAll(s)[0].length;

      // Range of values to a string
      var description = function() {
        var r   = color.invertExtent(rgb);
        var fmt = d3.format("$.2s");
        
        return fmt(r[0]) + " to " + fmt(r[1]);
      }();

      return { color: rgb, value: value, description: description };
    });

    // x and y scales
    x = d3.scale.linear()
      .domain([0, d3.max(data.count, function(d) { return d.value; })])
      .range([0, w]);

    y = d3.scale.ordinal()
      .domain(data.count.map(function(d) { return d.description; }))
      .rangeRoundBands([0, h], 0.1);

    // Axes
    var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left");

    d3.select("#legend").append("p")
      .attr("class", "lead")
      .style("margin", "1em 0")
    // ---------------------------------------------------------------------------
      .html(function() {
        var str = "Many states, including Tennessee, spend between $7,500 and $11,000 per student.";
        str += (+container.offsetWidth < 568) ? " " : "<br>";
        str += "Rankings of elementary and secondary school expenditure include the District of Columbia."
        return str;
      });

    legend = d3.select("#legend").append("svg")
        .attr("width", w + m.width())
        .attr("height", h + m.height())
      .append("g")
        .attr("transform", "translate(" + m.left + "," + m.top + ")");

    legend.append("g")
      .attr("class", "y axis")
      .call(yAxis);

    legend.selectAll("g.bar")
        .data(data.count)
      .enter().append("g")
        .attr("class", "bar")
        .attr("transform", function(d) {
          return "translate(0," + y(d.description) + ")";
        });

    legend.selectAll("g.bar").append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", function(d) { return x(d.value); })
      .attr("height", y.rangeBand())
      .attr("fill", function(d) { return d.color; });

    legend.selectAll("g.bar").append("text")
      .attr("class", "tick")
      .attr("x", function(d) { return x(d.value); })
      .attr("y", y.rangeBand() / 2)
      .attr("dx", -3)
      .attr("dy", 1)
      .attr("text-anchor", "end")
      .attr("dominant-baseline", "middle")
      .attr("fill", function(d) { return (d.value < 5) ? "white" : ""; })
      .text(function(d) { return d.value; });

    legend.select("g.bar text").text(function(d) { return d.value + " states"; });
  } // End of draw(containerWidth)

  // Load and map data
  // --------------------------------------------------------------------------- 
  d3.csv("us-education-spending-by-state.csv", type, function(error, csv) {
    if (error) throw error;

    d3.json("us-states.json", function(error, json) {
      if (error) throw error;

      // Merge csv to geojson
      for (var i = 0; i < csv.length; i++) {
        var csvName              = csv[i].state;
        var total                = csv[i].total;
        var averagePerEnrollment = csv[i].adm;
        var rank                 = csv[i].rank;

        for (var j = 0; j < json.features.length; j++) {
          var jsonName = json.features[j].properties.name;

          if (csvName == jsonName) {
            json.features[j].properties.total = total;
            json.features[j].properties.average = averagePerEnrollment;
            json.features[j].properties.rank = rank;
          }
        }
      }

      data = json;

      new pym.Child({ renderCallback: draw });
    });
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