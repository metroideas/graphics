(function() {
  var
  data,
  container = document.querySelector("#container"),
  chart     = document.querySelector("#chart")
  ;

  // Draw chart
  // ---------------------------------------------------------------------------
  function draw(containerWidth) {
    // Generic variables:
    var
    year,
    x,
    y,
    xAxis,
    yAxis,
    svg,
    bars,
    legend
    ;

    // Chart dimensions: 
    // Width breakpoint
    var mobile = (+container.offsetWidth <= 414);

    // Conventional margin with accessors
    var margin = (mobile)
                 ? { top: 48, right: 0, bottom: 32, left: 30 }
                 : { top: 48, right: 0, bottom: 32, left: 48 };

    margin.width  = function() { return this.right + this.left; };
    margin.height =  function() { return this.top + this.bottom; };
    
    // Aspect ratio
    var ratio  = (mobile) ? { width: 3, height: 2 } : { width: 8, height: 5 };
    
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
    year = d3.scale.ordinal()
      .domain(data.map(function(d) { return d.year; }))
      .rangeRoundBands([0, width], 0.2);

    color = d3.scale.ordinal()
      .domain(data[0].values.map(function(d) { return d.name; }))
      .range(['rgb(102,194,164)','rgb(44,162,95)','rgb(0,109,44)']);

    x = d3.scale.ordinal()
      .domain(color.domain())
      .rangeRoundBands([0, year.rangeBand()], 0.1);

    y = d3.scale.linear()
      .range([height, 0])
      .nice()
      .domain([
        0,
        d3.max(data, function(d) {
          return d3.max(d.values, function(v) {
            return v.value;
          })
        })
      ]);

    xAxis = d3.svg.axis()
      .scale(year)
      .orient("bottom");

    yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")
      .tickSize(-width, 0, 0)
      .tickValues([2000, 4000, 6000, 8000, 10000, 12000])
      .tickFormat((mobile) ? d3.format("$s") : d3.format("$,"));

    svg = d3.select(chart).append("svg")
        .attr("width", width + margin.width())
        .attr("height", height + margin.height())
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("g")
      .attr("class", "x axis")
      .call(xAxis)
      .attr("transform", "translate(0," + height + ")");

    if (mobile) {
      d3.selectAll(".x.axis .tick").filter(function(t) { return t % 2 == 0 })
        .selectAll("text").remove();
    }

    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis);

    svg.selectAll("g.year")
        .data(data)
      .enter().append("g")
      .attr("class", "year")
      .attr("transform", function(d) {
        return "translate(" + year(d.year) + ",0)";
      });

    bars = svg.selectAll("g.year").selectAll("rect.bar")
        .data(function(d) { return d.values; })
      .enter().append("rect")
        .attr("class", "bar")
        .attr("class", function(d) { return "bar " + d.name; });

    bars.attr({
      "x": function(d) { return x(d.name); },
      "y": function(d) { return y(d.value); },
      "width": x.rangeBand(),
      "height": function(d) { return height - y(d.value); },
      "fill": function(d) { return color(d.name); }
    });

    // Legend


  } // End of draw(containerWidth)

  // Load and map data
  // --------------------------------------------------------------------------- 
  d3.csv("data.csv", type, function(error, csv) {
    if (error) throw error;

    var keys = d3.keys(csv[0]).filter(function(k) { return k != "year"; });
    
    data = csv.sort(function(a,b) { return a.year - b.year; }).map(function(row) {
      return {
        year: row.year,
        values: keys.map(function(k) {
          return { name: k, value: row[k] };
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