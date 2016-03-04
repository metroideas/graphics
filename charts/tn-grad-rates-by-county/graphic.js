(function() {
  var
  data,
  container = document.querySelector("#graphic"),
  chart     = document.querySelector(".chart")
  ;

  
  function drawGraphic(containerWidth) {
    chart.innerHTML = ""; // Removes existing svg on resize

    var
    svg,
    x,
    y,
    xScale,
    yScale,
    xLabel,
    ticks,
    tickValues,
    legend     = d3.select(".legend"),
    dropdown   = d3.select("#dropdown-menu"),
    margin     = { top: 8, right: 48, bottom: 48, left: 48 },
    width      = calculateWidth(),
    mobile     = (width <= 320) ? true : false,
    ratio      = (mobile) ? { width: 1, height: 2 } : { width: 1, height: 1 }, // Aspect ratio
    height     = calculateHeight(),
    keys       = [
      { name: "Per pupil expenditure", key: "perStudentCost" },
      { name: "Median income", key: "medianIncome" },
      { name: "Economically disadvantaged", key: "econDisadvantage" },
      { name: "Black students", key: "black" },
      { name: "White students", key: "white" },
      { name: "Hispanic students", key: "hispanic" },
      { name: "Asian students", key: "asian" },
      { name: "Minority students", key: "minority" },
      { name: "Limited English proficiency", key: "limitedEnglish" }
    ];

    // Helper functions for chart dimensions
    // ---------------------------------------------------------------------------
    function marginWidth()  { return margin.left + margin.right; }
    function marginHeight() { return margin.top + margin.bottom; }

    function calculateWidth() {
      if (!containerWidth) { var containerWidth = +container.offsetWidth; }
      return Math.ceil(containerWidth - marginWidth());
    }
    
    function calculateHeight() {
      return Math.ceil(width * ratio.height / ratio.width) - marginHeight();
    }
    
    // Legend
    // ---------------------------------------------------------------------------
    legend.style({
      "margin-left": (mobile) ? "16px" : margin.left + "px",
      "margin-right": (mobile) ? "16px" : margin.right + "px",
      "margin-bottom": "16px"
    });

    dropdown.selectAll("option")
        .data(keys)
      .enter().append("option")
        .attr("value", function(d) { return d.key; })
        .attr("selected", function(d) { if (d.key == "perStudentCost") return true; })
        .html(function(d) { return d.name; });

    // Data source
    // ---------------------------------------------------------------------------
    d3.select(".data-source").style({
      "margin-left": (mobile) ? "16px" : margin.left + "px",
      "margin-right": (mobile) ? "16px" : margin.right + "px"
    });

    // SVG
    // ---------------------------------------------------------------------------
    x = d3.scale.linear()
      .range([0, width]);

    y = d3.scale.linear()
      .domain([0.65, 1.0])
      .range([height, 0]);

    // x axis
    ticks = (mobile) ? 4 : null
    
    // y axis
    tickValues = (mobile)
      ? [ 0.7, 0.8, 0.9, 1.0 ]
      : [ 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1.0 ];

    xAxis = d3.svg.axis()
      .orient("bottom")
      .scale(x)
      .tickSize(-height, 0, 0)
      .ticks(ticks, "$");

    yAxis = d3.svg.axis()
      .orient("left")
      .scale(y)
      .tickSize(-width, 0, 0)
      .ticks(null, "%")
      .tickValues(tickValues);

    svg = d3.select(chart).append("svg")
        .attr("width", width + marginWidth())
        .attr("height", height + marginHeight())
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .attr("class", "chart");

    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

    d3.select(".x.axis .tick").remove();
    
    xLabel = d3.select(".x.axis").append("text")
      .attr("x", width / 2)
      .attr("y", margin.bottom * .9)
      .attr("text-anchor", "middle")
      .attr("class", "label");

    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis);
    
    d3.select(".y.axis").append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -margin.left * 0.75)
      .attr("text-anchor", "middle")
      .attr("class", "label")
      .text("Overall graduation rate");

    svg.selectAll("circle")
        .data(data)
      .enter().append("circle")
        .attr("class", function(d) { return d.id.toLowerCase(); })
        .attr("cy", function(d) { return y(d.graduationRate); })
        .attr("r", function(d) {
          if (d.id == "Tennessee") {
            return 15;
          } else if (d.attendance > 25000) {
            return 8;
          } else {
            return 3;
          }
        });

    // Point labels for large districts
    if (!mobile) {
      svg.selectAll("text.district-label")
          .data(data.filter(function(d) { return d.attendance >= 25000; }))
        .enter().append("text")
          .attr("class", "district-label")
          .attr("y", function(d) { return y(d.graduationRate); })
          .attr("alignment-baseline", "central")
          .text(function(d) { if (d.attendance > 25000) return d.id; }); 
    }

    // Updates
    // --------------------------------------------------------------------------- 

    function updateGraphic(selection) {
      var
      option   = this.value || selection,
      delay    = (selection) ? 0 : 100,
      duration = (selection) ? 0 : 1000
      ;

      // Update on menu change:
      // x scale
      x.domain(d3.extent(data, function(d) { return d[option]; }));
      
      // x axis
      xAxis.scale(x).ticks(
        (mobile) ? 4 : 6,
        (option == "medianIncome" || option == "perStudentCost") ? "$" : "%"
      );

      d3.select(".x.axis")
        .transition()
          .delay(delay)
          .duration(duration)
        .call(xAxis);

      // x label
      d3.select(".x.axis .label")
        .transition()
          .delay(delay)
          .duration(duration)
        .text(keys.filter(function(d) {
          return d.key == option;
        })[0].name);

      // x position of scatterplot points
      d3.selectAll("circle")
        .transition()
          .delay(delay)
          .duration(duration)
        .attr("cx", function(d) { return x(d[option]); })
        .style("fill-opacity", function(d) {
          return (d[option] == null) ? 0 : 0.8; // Hide null values
        });

      // Point labels for larger districts
      if (!mobile) {
        // Shift label?
        function labelShift(d) {
          var
          position = x(d[option]),
          midpoint = (width / 2)
          ;

          return (position >= midpoint);
        }
        // Label positions
        svg.selectAll("text.district-label")
        .transition()
          .delay(delay * 1.5)
          .duration(duration)
        .attr("x", function(d) { return x(d[option]); })
        .attr("text-anchor", function(d) { return labelShift(d) ? "end" : "start"; })
        .attr("dx", function(d) {
          var dx = (d.id == "Tennessee") ? 16 : 9
          return labelShift(d) ? -dx : dx;
        });
      }

      // Mouseover/click events
      d3.selectAll("circle").on("mouseover", activePoint);
      d3.selectAll("circle").on("click", activePoint);

      function activePoint(d) {
        function pctFmt(decimal) { return Math.round(decimal * 100) + "%" }

        legend.select(".county-name-data")
          .html((d.id != "Tennessee") 
                 ? d.id + " County, Tenn." 
                 : d.id + " average");
        
        legend.select(".graduation-rate-data")
          .html(pctFmt(d.graduationRate));

        legend.select(".cost-per-student-data")
          .html("$" + Math.round(d.perStudentCost));

        legend.select(".econ-disadvantage-data")
          .html(pctFmt(d.econDisadvantage));

        legend.select(".minority-data")
          .html(pctFmt(d.minority));
      }
    }


    // Dropdown menu update
    // ---------------------------------------------------------------------------
    dropdown.on("load", updateGraphic(dropdown.node().value));
    dropdown.on("change", updateGraphic);
  }

  // Data loading and mapping + pym callback
  // ---------------------------------------------------------------------------
  d3.csv("data.csv", type, function(error, csv) {
    if (error) throw error;
   
    data = csv.map(function(d) {
      return {
        id:               d["district"],
        attendance:       d["average_daily_attendance"],
        medianIncome:     d["median_income_2014"],
        perStudentCost:   d["per_pupil_expenses_ada"],
        graduationRate:   d["graduation_rate_pct"],
        econDisadvantage: d["econ_disadvantaged_pct"],
        black:            d["black_students_pct"],
        white:            d["white_students_pct"],
        hispanic:         d["hispanic_students_pct"],
        asian:            d["asian_students_pct"],
        minority:         (1 - d["white_students_pct"]),
        limitedEnglish:   d["limited_english_proficient_pct"]
      }
    });

    new pym.Child({ renderCallback: drawGraphic });
  });

  // Data formatting
  function type(d) {
    for (var key in d) {
      if (key == "district") {
        d[key] = d[key].replace("State of ", "");
        d[key] = d[key].replace(" County","");
      } else {
        d[key] = (d[key] == "null") ? null : +d[key];
      } 
    }

    return d;
  }
})()