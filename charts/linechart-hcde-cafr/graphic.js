(function() {
  var
  data,
  keys,
  students,
  chart = document.querySelector(".chart")
  ;

  function drawGraphic(containerWidth) {
    chart.innerHTML = "";

    var 
    x,
    y,
    adm,
    color,
    dates, 
    xAxis,
    yAxis,
    line,
    legend,
    revenue,
    enrollment,
    margin = { top: 16, right: 16, bottom: 32 , left: 64 },
    width  = calculateWidth(),
    mobile = (width <= 320),
    ratio  = (mobile) ? { width: 1, height: 2 } : { width: 3, height: 2 },
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

    // Header container: Title, description, legend and adjustment button
    // ---------------------------------------------------------------------------
    if (mobile) {
      d3.select(".header").style({
        "margin-left": margin.left * .25 + "px",
        "margin-right": margin.right * .25 + "px"
      })
    } else {
      d3.select(".header").style({
        "margin-left": margin.left + "px",
        "margin-right": margin.right + "px"
      });
    }

    // Legend
    // ---------------------------------------------------------------------------
    legend = d3.select(".legend svg")
      .attr("width", width)
      .attr("height", (mobile) ? marginHeight() * 1.75 : marginHeight())
      .style("margin-top", "8px");

    d3.selectAll(".key-group")
      .attr("transform", function(d, i) {
        var x, y;

        if (mobile) {
          x = 0;
          y = i
        } else {
          x = (i <= 2) ? 0 : width / 2;
          y = (i <= 2) ? i : i - 3;
        }

        return "translate(" + x + "," + (y * 16 + 16) + ")";
      });

    // Scales, axes
    // ---------------------------------------------------------------------------
    dates = data[0].revenue.map(function(d) { return d.date; });

    // x scale by year
    x = d3.time.scale()
      .range([0, width])
      .domain(d3.extent(dates));

    // y scale by revenue
    y = d3.scale.linear()
      .range([height, 0])
      .domain([
        0,
        d3.max(data, function(d) {
          return d3.max(d.revenue, function(r) {
            return r.adjusted;
          })
        })
      ]);

    // y scale by enrollment
    adm = d3.scale.linear()
      .range([height / 2, 0])
      .domain(d3.extent(students, function(d) { return d.enrollment; }));

    // lines excluding enrollment
    color = d3.scale.ordinal()
      .domain(keys)
      .range(["#0060ae", "#0060ae", "#0060ae", "#8dbd45", "#df2027"]);

    xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom")
      .tickValues(dates.filter(function(d, i) {
        return (mobile) ? !(i % 4) : !(i % 2);
      }))
      .tickFormat(d3.time.format("%Y"));

    yAxis = d3.svg.axis()
      .scale(y)
      .tickFormat(function(d) { return "$" + d3.format(".2s")(d); })
      .tickSize(-width, 0, 0)
      .orient("left");

    aAxis = d3.svg.axis()
      .scale(adm)
      .orient("left")
      .tickSize(-width, 0, 0)
      .ticks(4);

    // svg setup
    // ---------------------------------------------------------------------------
    revenue = d3.select(chart).append("svg")
        .attr("width", width + marginWidth())
        .attr("height", height + marginHeight())
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    revenue.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

    revenue.append("g")
      .attr("class", "y axis")
      .call(yAxis);

    d3.select(".y.axis .tick").remove(); // Removes first tick mark

    enrollment = d3.select(chart).append("svg")
        .attr("width", width + marginWidth())
        .attr("height", height / 2 + marginHeight())
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    enrollment.append("g")
      .attr("class", "a axis")
      .call(aAxis);

    // y axis labels
    d3.select(".y.axis")
      .append("text")
      .attr("class", "label")
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .attr("x", -height / 2)
      .attr("y", -margin.left * .8)
      .text("Revenue");

    d3.select(".a.axis")
      .append("text")
      .attr("class", "label")
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .attr("x", -height / 4)
      .attr("y", -margin.left * .8)
      .text("Enrollment");

    // Revenue line graphs
    // ---------------------------------------------------------------------------
    line = d3.svg.line()
      .x(function(d) { return x(d.date); })
      .y(function(d) { return y(d.unadjusted); });

    revenue.selectAll("g.revenue-source")
        .data(data)
      .enter().append("g")
        .attr("class", "revenue-source");

    d3.selectAll("g.revenue-source").append("path")
      .attr("class", "line")
      .attr("d", function(d) { return line(d.revenue); })
      .attr("stroke-dasharray", function(d) {
        switch (d.name) {
          case "Property tax":
            return "5,5";
          case "Sales tax":
            return "0.9";
          default:
            return false;
        }
      })
      .style("stroke", function(d) { return color(d.name); });

    document.querySelector("#adjustment").addEventListener("click", function() {
      var button = this;
      
      if (button.innerHTML == "Reset to nominal") {
        line.y(function(d) { return y(d.unadjusted); });
        button.innerHTML = "Adjust for inflation";
      } else {
        line.y(function(d) { return y(d.adjusted); });
        button.innerHTML = "Reset to nominal";
      }
     
      d3.selectAll(".revenue-source .line")
        .transition()
          .delay(100)
          .duration(500)
        .attr("d", function(d) { return line(d.revenue); });
    });

    // Enrollment line graph
    // ---------------------------------------------------------------------------
    enrollment.append("path")
      .datum(students)
      .attr("class", "line")
      .attr("d", d3.svg.line()
        .x(function(d) { return x(d.date); })
        .y(function(d) { return adm(d.enrollment); }));

  } //  End of drawGraphic()


  // Adjusts for inflation using CPI-U for South region
  // http://data.bls.gov/pdq/SurveyOutputServlet?series_id=CUUR0300SA0,CUUS0300SA0
  // ---------------------------------------------------------------------------
  function adjustForInflation(amount, current, previous) {
    var cpi = {
      1998: 158.9,   1999: 162.0,   2000: 167.2,   2001: 171.1,   2002: 173.3,
      2003: 177.3,   2004: 181.8,   2005: 188.3,   2006: 194.7,   2007: 200.361,
      2008: 208.681, 2009: 207.845, 2010: 211.338, 2011: 218.618, 2012: 223.242,
      2013: 226.721, 2014: 230.552, 2015: 230.147
    };

    return amount * cpi[previous] / cpi[current];
  };

  
  // Load and map data
  // ---------------------------------------------------------------------------
  d3.csv("data.csv", function(error, csv) {
    if (error) throw error;

    keys = d3.keys(csv[0]).filter(function(key) {
      return key != "year" && key != "adm";
    });

    data = keys.map(function(key) {
      return {
        name: key,
        revenue: csv.map(function(row) {
          return {
            date: d3.time.format("%Y%m%d").parse(row.year + "0630"),
            unadjusted: +row[key],
            adjusted: Math.round(adjustForInflation(row[key], row.year, 2015))
          };
        })
      };
    });

    students = csv.map(function(row) {
      return {
        date: d3.time.format("%Y%m%d").parse(row.year + "0630"),
        enrollment: +row.adm
      };
    });

    console.log(students);

    new pym.Child({ renderCallback: drawGraphic });
  });
})()