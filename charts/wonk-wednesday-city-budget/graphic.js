(function() {
  var
  data,
  categories,
  container   = document.querySelector("#container"),
  chart       = document.querySelector("#chart"),
  spreadsheet = 'https://docs.google.com/spreadsheets/d/1Gfl4BPql-mx5Ba3yfSV4FYeYqyiVJIMrdNjXu2h0ZKM/pubhtml'
  ;

  // Dimensions
  var margin = {
    top: 48,
    right: 24,
    bottom: 24,
    left: 24,
    width: function() { return this.right + this.left; },
    height: function() { return this.top + this.bottom; }
  };

  var ratio  = { width: 1, height: 0.9 };

  var width  = function() {
    if (!containerWidth) {
      var containerWidth = +chart.offsetWidth;
    }

    return containerWidth - margin.width();
  }();

  var height = function() {
    var f = ratio.height / ratio.width;

    return Math.round(width * f - margin.height());
  }();

  var radius = Math.min(width, height) / 2;

  // Draw chart
  // ---------------------------------------------------------------------------
  function draw() {
    var color = d3.scale.ordinal()
      .range(['#d7191c','#fdae61','#ffffbf','#abd9e9','#2c7bb6'])
      .domain(categories);

    // Scales and svg setup
    var svg = d3.select(chart).append("svg")
        .attr("width", width + margin.width())
        .attr("height", height + margin.height())
      .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    var arc = d3.svg.arc()
      .outerRadius(radius - 30)
      .innerRadius(0);

    var labelArc = d3.svg.arc()
      .outerRadius(radius - 40)
      .innerRadius(radius - 40);

    var pie = d3.layout.pie()
      .sort(null)
      .value(function(d) { return d.value; });

    var g = svg.selectAll(".arc")
        .data(pie(data))
      .enter().append("g")
        .attr("class", "arc");

    g.append("path").call(pathAttr);
    g.append("text").call(textAttr);

    function pathAttr() {
      this
        .attr("d", arc)
        .style("fill", function(d) { return color(d.data.name); })
    };

    function textAttr(d) {
      this
        .attr("transform", function(d) {
          return "translate(" + labelArc.centroid(d) + ")";
        })
        .style("font-size", "32px")
        .text(function(d) {
          var
          total  = 0,
          amount = d.data.value
          ;

          data.forEach(function(d) { total += d.value; });
          
          return d3.format("$.2s")(amount * 220000000 / total);
        })
      ;
    }

    setInterval(function() {
      Tabletop.init({
        key: spreadsheet,
        callback: update,
        simpleSheet: true
      });

      function update(json) {
        map(json);
        console.log(data);

        g = svg.selectAll(".arc")
            .data(pie(data));
        
        g.enter();

        g.select("path")
          .transition()
            .duration(500)
          .call(pathAttr);

        g.select("text")
          .transition()
            .duration(500)
          .call(textAttr);
      }
    }, 15000); // 1-minute interval

  } // End of draw(containerWidth)

  // Load and map data
  // ---------------------------------------------------------------------------
  function load() {
    Tabletop.init({
      key: spreadsheet,
      callback: function(json) {
        map(json);
        draw();
      },
      simpleSheet: true
    });
  };

  function map(json) {
    categories = d3.keys(json[0]).filter(function(k) { return k != "Timestamp"; });

    data = categories.map(function(category) {
      // var sum = parseInt((Math.random() * 10), 10)
      var sum = 0;

      json.forEach(function(row) { sum += +row[category]; });

      return {
        name: category,
        value: sum
      };
    });
  }

  load();
})();