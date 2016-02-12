(function() {
  var
  data,
  pymChild,
  container      = document.querySelector("#graphic"),
  url            = "data.csv",
  aspect_ratio   = { width: 3, height: 2 },
  dateFmt        = d3.time.format("%Y")
  ;

  function drawGraphic(container_width) {

    var
    x,
    y,
    color,
    xAxis,
    yAxis,
    ticks,
    svg,
    legend,
    key,
    keys           = d3.keys(data[0]).filter(function(k) { return k !== "year"; }), // Excludes year
    margin         = { top: 24, right: 48, bottom: 24, left: 48 },
    width          = calculateWidth(),
    mobile         = (width <= 512) ? true : false,
    columns        = (mobile) ? 2 : 4,   // legend columns (qty) for mobile and desktop 
    row            = (mobile) ? 16 : 24  // legend row height (px) for mobile and desktop
    ;

    // Check aspect ratio and calculate height
    dimensions();
    var height = calculateHeight();

    // Empty #graphic container
    container.innerHTML = "";

    // Scales
    // -------------------------------------------------
    x = d3.time.scale()
      .range([0, width])
      .domain(d3.extent(data, function(d) { return d.year; }));

    y = d3.scale.linear()
      .range([height, 0])
      .domain([0, d3.max(data, function(row) {
        return d3.max(keys, function(key) { return row[key]; });
      })]);

    color = d3.scale.category10().domain(keys);

    // Axis
    // -------------------------------------------------
    xAxis = d3.svg.axis()
      .orient("top")
      .scale(x)
      .ticks(4)
      .tickSize(-height, 0, 0);

    yAxis = d3.svg.axis()
      .orient("left")
      .scale(y)
      .ticks(6, "%")
      .tickSize(-width, 0, 0);

    // Chart
    // -------------------------------------------------
    svg = d3.select("#graphic").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("g")
      .attr("class", "x axis")
      .call(xAxis)
      .attr("transform", "translate(0," + height + ")")
      ;

    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
      // Removes first 0 tick
      .selectAll(".tick").each(function(d,i) {
          if (i == 0) {
            this.remove();
          };
        });

    var line = d3.svg.line()
      // f
      .x(function(d) { return x(+d.year); })
      .y(function(d) { return y(+d.rate); })
      ;

    var education = keys.map(function(key) {
      return {
        id: key,
        unemployment: data.map(function(row) {
          return { year: row.year, rate: row[key] };
        })
      };
    });

    svg.selectAll("path.line")
        .data(education)
      .enter().append("path")
        .attr("class", "line")
        .attr("d", function(d) { return line(d.unemployment); })
        .style("stroke", function(d) { return color(d.id); })
        .style("fill", "transparent")
        .attr("stroke-width", 3);



    // Legend and keys
    // -------------------------------------------------
    legend = d3.select("#graphic").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", function() {
          return rows(keys.length, columns) * (row * 2);
        })
      .append("g")
        .attr("transform", function() {
          var offset = (mobile) ? 1 : 1.5;
          return "translate(" + margin.left * offset + ",0)";
        })
        .attr("class", "legend");

    key = legend.selectAll("g.key")
        .data(keys)
      .enter().append("g")
        .attr("class", "key")
        .attr("transform", function(d, i) {
          var
          x = width / columns * (i % columns),
          y = rows(i+1, columns) * row
          ;

          return "translate(" + x + "," + y + ")";
        });

    key.append("rect")
      .attr("fill", function(d) { return color(d); });

    key.append("text")
      .attr("x", 18)
      .attr("dy", 12)
      .text(function(d) { return d; });



    // Helper functions
    // -------------------------------------------------
    
    // Calculate row numbers for item in legend
    function rows(n, col) { return Math.ceil(n / col); }

    function dimensions() {
      aspect_ratio = (mobile) ? { width: 2, height: 3 } : { width: 3, height: 2 };
    }

    // Container width
    function calculateWidth() {
      var m = margin.left + margin.right;
      
      if (!container_width) {
        var container_width = +(container.offsetWidth);
      }

      return Math.ceil(container_width - m);
    }

    // Container height
    function calculateHeight() {

      var m = margin.top + margin.bottom;
      
      return Math.ceil(width * aspect_ratio.height / aspect_ratio.width) - m;
    }
  }
  // End of drawGraphic()
  // -------------------------------------------------


  // Load data
  // -------------------------------------------------
  d3.csv(url, type, function(error, csv) {
    if (error) throw error;

    data = csv;

    pymChild = new pym.Child({ renderCallback: drawGraphic });
  });

  function type(d) {
    d.year  = dateFmt.parse(d.year);
    return d;
  }
})();