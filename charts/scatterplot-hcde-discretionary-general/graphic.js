(function() {
  'use strict';

  var
  data,
  container = document.querySelector("#container"),
  chart     = document.querySelector("#chart")
  ;

  // Draw chart
  // ---------------------------------------------------------------------------
  function draw(containerWidth) {
    var
    x,
    y,
    xAxis,
    yAxis,
    svg,
    regression
    ;

    // Chart dimensions: 
    // Width breakpoint
    var mobile = (+container.offsetWidth <= 414);

    // Conventional margin with accessors
    var margin = {
      top: 32,
      right: 16,
      bottom: 32,
      left: 44,
      width: function() { return this.right + this.left; },
      height: function() { return this.top + this.bottom; }
    };
    
    // Aspect ratio
    var ratio  = (mobile) ? { width: 1, height: 1.5 } : { width: 8, height: 5 };
    
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

    // Data for screen readers
    d3.select(chart).selectAll("span.invisible")
        .data(data.sort(function(a,b) { return a.poverty - b.poverty; }))
      .enter().append("span")
        .attr("class", "invisible")
        .html(function(d) {
          return d.school + ", Poverty: " +
            d3.format("%")(d.poverty) + ", Discretionary funds: " + 
            d3.format("$,")(Math.round(d.funding))
        });

    // Scales and svg setup
    x = d3.scale.linear()
      .domain([0, 1])
      .range([0, width]);

    y = d3.scale.linear()
      .domain([0, d3.max(data, function(d) { return d.funding; })])
      .range([height, 0]);

    xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom")
      .tickFormat(d3.format("%"))
      .tickValues(function() {
        return (mobile)
          ? [ 0, .25, .5, .75, 1 ]
          : [ 0, .1, .2, .3, .4, .5, .6, .7, .8, .9, 1 ];
      });

    yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")
      .tickFormat(d3.format("$s"))
      .tickValues(
        [ 20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220 ].map(function(d) {
          return d * 1000;
        })
      );

    svg = d3.select(chart).append("svg")
        .attr("width", width + margin.width())
        .attr("height", height + margin.height())
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis);

    // Keep for future reference
    // regression = function(data) {
    //   var
    //   mapData = data.map(function(d) { return [d.poverty, d.funding]; }),
    //   lin     = ss.linearRegressionLine(ss.linearRegression(mapData)),
    //   result  = []
    //   ;
      
    //   for (var i = 0; i < data.length; i++) {
    //     result.push([data[i].poverty, lin(data[i].poverty)]);
    //   }

    //   return result.sort(function(a,b) {
    //     return a[0] - b[0];
    //   });
    // }(data);

    regression = { x1: 0.034482759, y1: 135415.90885343723, x2: 0.9923, y2: 21829.901993697815 }
    
    svg.append("line")
      .attr("x1", x(regression.x1))
      .attr("y1", y(regression.y1))
      .attr("x2", x(regression.x2))
      .attr("y2", y(regression.y2))
      .attr("class", "regression");

    svg.selectAll("circle.school")
        .data(data)
      .enter().append("circle")
        .attr("class", "school")
        .call(circleAttr);

    function circleAttr() {
      return this
        .attr("cx", function(d) { return x(d.poverty); })
        .attr("cy", function(d) { return y(d.funding); })
        .attr("r", 4)
        .attr("stroke", "none")
        .attr("stroke-width", "0")
        .call(hover);
    }

    function hover() {
      this
        .on("mouseover", function(d) {
          d3.select(this)
            .attr("r", 6)
            .attr("fill-opacity", 1)
            .attr("stroke", "rgb(20,133,204)")
            .attr("stroke-width", "3px");

          var tooltip = d3.select("#tooltip").classed("hidden", false);

          tooltip.select("[data-item=name]").html(d.school);
          tooltip.select("[data-item=funding]").html(d3.format("$,")(Math.round(d.funding)));
          tooltip.select("[data-item=poverty]").html(d3.format("%")(d.poverty));

          var matrix = this.getCTM()
              .translate(+ this.getAttribute("cx"), + this.getAttribute("cy"));

          tooltip.style("left", function() {
            var
            w      = +tooltip.style("width").slice(0, -2),
            left   = d3.event.pageX - w / 2,
            adjust
            ;

            // Slide tooltips away from edges
            if (matrix.e <= width * .25) {
              adjust = (width - matrix.e) / width;
              left += adjust * w / 2;
            } else if (matrix.e >= width * .75) {
              adjust = 1 - (width - matrix.e) / width;
              left -= adjust * w / 2;
            }

            return left + "px";
          });

          tooltip.style("top", function() {
            var h   = +tooltip.style("height").slice(0, -2);
            var top = d3.event.pageY;
            
            top = (matrix.f >= height * .5) ? top - h * 1.5 : top + 15;
            
            return top + "px";
          });
        })

        .on("mouseout", function() {
          d3.select(this).call(circleAttr);
          d3.select("#tooltip").classed("hidden", true);
        });
    }
  } // End of draw(containerWidth)

  // Load and map data
  // --------------------------------------------------------------------------- 
  d3.csv("data.csv", type, function(error, csv) {
    if (error) throw error;

    data = csv.filter(function(d) { return d.poverty > 0 && d.funding > 0; });

    new pym.Child({ renderCallback: draw });
  });

  // Type coercion
  function type(d) {
    for (var key in d) {
      if (+d[key] >= 0) {
        d[key] = +d[key];
      } else {
        d[key] = d[key];
      }
    }

    return d;
  }

})()