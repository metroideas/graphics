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
    x,
    y,
    xAxis,
    yAxis,
    svg,
    schools
    ;

    // Dimensions
    var mobile = (+container.offsetWidth <= 414);

    var margin = {
      top: 0,
      right: 16,
      bottom: 32,
      left: 16,
      width: function() { return this.right + this.left; },
      height: function() { return this.top + this.bottom; }
    };
    
    var ratio  = (mobile) ? { width: 1, height: 1 } : { width: 1, height: 1 };
    
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

    // Scale and chart setup
    // ---------------------------------------------------------------------------
    // Clear existing contents
    chart.innerHTML = "";

    // Horizontal scale for average funding
    x = d3.scale.linear()
      .domain([2900,12000])
      .range([0, width])
      .nice();

    // Vertical scale for test scores
    y = d3.scale.linear()
      .domain([-.5, .5])
      .range([height, 0]);

    xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom")
      .tickValues([7200])
      .tickSize(-height, 0, 0)
      .tickFormat(d3.format("$,"));

    yAxis = d3.svg.axis()
      .scale(y)
      .orient("right")
      .tickValues([0])
      .tickSize(-width, 0, 0)
      .tickFormat(d3.format("%.1"));

    svg = d3.select(chart).append("svg")
        .attr("width", width + margin.width())
        .attr("height", height + margin.height())
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Axes and labels
    // ---------------------------------------------------------------------------
    svg.append("rect")
      .attr("class", "box")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", width)
      .attr("height", height);

    // Adds x axis
    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

    // Adds y axis
    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .attr("transform", "translate(" + width + ",0)");

    // Remove y axis label
    d3.select("g.y.axis .tick text").remove();

    // Quad labels
    if (!mobile) {
      svg.append("text")
        .attr("class", "quadrant-label")
        .attr("x", x(x.domain()[0]) + 12)
        .attr("y", y(y.domain()[1]))
        .attr("dy", 24)
        .text("Low spending, high achievement");

      svg.append("text")
        .attr("class", "quadrant-label")
        .attr("x", x(x.domain()[1]) - 12)
        .attr("y", y(y.domain()[1]))
        .attr("text-anchor", "end")
        .attr("dy", 24)
        .text("High spending, high achievement");

      svg.append("text")
        .attr("class", "quadrant-label")
        .attr("x", x(x.domain()[0]) + 12)
        .attr("y", y(y.domain()[0]))
        .attr("dy", -24)
        .text("Low spending, low achievement");

      svg.append("text")
        .attr("class", "quadrant-label")
        .attr("x", x(x.domain()[1]) - 12)
        .attr("y", y(y.domain()[0]))
        .attr("dy", -24)
        .attr("text-anchor", "end")
        .text("High spending, low achievement");
    }
     
    // x and y axis label
    svg.append("text")
      .attr("class", "axis")
      .attr("x", (mobile) ? width / 2 : 12)
      .attr("y", height)
      .attr("dy", (mobile) ? 24 : 12)
      .attr("text-anchor", (mobile) ? "middle" : "left")
      .text("Spending per student");

    svg.append("text")
      .attr("class", "axis")
      .attr("x", -height / 2)
      .attr("y", 0)
      .attr("dy", -6)
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .text("Adjusted student proficiency");
    
    // Initial scatterplot
    // ---------------------------------------------------------------------------
    schools = svg.selectAll("circle.school")
        .data(data)
      .enter().append("circle")
        .attr("class", "school")
        .call(attributes);

    // Scatterplot attributes and hover functions
    function attributes() {
      return this.attr({
        cx: function(d) { return x(d.average); },
        cy: function(d) { return y(testScore(d)); },
        r:  4
      }).call(hover);
    }

    // Set schools' y position
    function testScore(d) {
      var subject = (d3.select("#english").classed("primary")) ? "english" : "math";

      return d[subject];
    }

    // Inputs
    // ---------------------------------------------------------------------------
    // Grade selector
    d3.select("#grade-level-select").on("change", filterSchools);

    // Title I filter
    d3.select("#title").on("click", function() {
      var button = d3.select(this);
      var active = button.classed("primary");

      button.classed("primary", !active);
      
      filterSchools();
    });

    // Select test scores for schools' y axis value
    // English
    d3.select("#english").on("click", function() {
      d3.select(this).classed("primary", true);
      d3.select("#math").classed("primary", false);

      schools.transition().call(transition)
        .attr("cy", function(d) { return y(testScore(d)); });
    });

    // Math
    d3.select("#math").on("click", function() {
      d3.select(this).classed("primary", true);
      d3.select("#english").classed("primary", false);

      schools.transition().call(transition)
        .attr("cy", function(d) { return y(testScore(d)); });
    });

    // Transition settings
    function transition(transition) {
      return transition.delay(100).duration(300);
    }

    // Data filter and joins
    function filterSchools() {
      var
      grades   = data,
      title    = d3.select("#title").classed("primary"),
      selected = d3.select("#grade-level-select").property('value');

      if (selected != "all") {
        grades = grades.filter(function(d) { return d.grade == selected; });
      }
      
      schools = svg.selectAll("circle.school")
        .data(grades, function(d) { return d.key; });

      schools.exit()
        .transition().call(transition)
        .attr("r", 0)
        .remove();
      
      schools.enter().append("circle")
        .attr("class", "school")
        .attr("r", 0)
        .transition().call(transition);
        
      schools.call(attributes)
        .style("fill-opacity", function(d) {
          return (title && d.title || !title) ? 0.7 : 0.1;
        });
    }

    // Tooltip called by attributes() for mouseover and mouseout
    // ---------------------------------------------------------------------------
    
    function hover() {
      this.on("mouseover", function(d) {
        var tooltip = d3.select("#tooltip").classed("hidden", false);

        // Text values
        tooltip.select("[data-item=name]").html(d.name);
        console.log(d.name);
        tooltip.select("[data-item=average]").html(d3.format("$,.0f")(d.average));
        tooltip.select("[data-item=english]").html(d3.format("%")(d.scores.english));
        tooltip.select("[data-item=math]").html(d3.format("%")(d.scores.math));

        // Position
        tooltip
          .style("left", function() {

            var left = d3.event.pageX;
            left -= (left >= window.innerWidth * .75) ? 200 : 100;

            return left + "px";
          })
          .style("top", function() {
            var y = d3.event.pageY;
            return y + 15 + "px";
          });
      })

      .on("mouseout", function() {
        d3.select("#tooltip").classed("hidden", true);
      });
    }
  } // End of draw(containerWidth)


  // Load and map data
  // --------------------------------------------------------------------------- 
  d3.csv("data.csv", type, function(error, csv) {
    if (error) throw error;

    var key = 0;
    
    data = csv.map(function(row) {
      return {
        key:     key++,
        name:    row.name,
        title:   (row.title == 1),
        grade:   row.grade,
        math:    row.math_difference,
        english: row.english_difference,
        average: row.average,
        scores:  { math: row.math, english: row.english }
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