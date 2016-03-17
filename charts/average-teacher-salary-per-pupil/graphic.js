(function() {
  var
  data,
  chart     = document.querySelector("#chart"),
  container = document.querySelector("#graphic")
  ;

  function graphic(containerWidth) {
    var
    x,        // Horizontal bar graph scale
    y,        // Ordinal vertical scale by school
    curve,    // Linear vertical scale used with area/line section
    schools,
    gradient,
    barHeight,
    color     = { "2008": "#df2027", "2016": "#56678d", "average": "#b1b3b5" },
    mobile    = (+container.offsetWidth <= 414),
    margin    = (mobile)
                ? { top: 12, right: 12, bottom: 12, left: 12 }
                : { top: 12, right: 34, bottom: 12, left: 12 },
    width     = calculateWidth(),
    height    = data.length * 48 - margin.top - margin.bottom,
    svg,
    legend
    ;

    // Clear existing chart contents
    chart.innerHTML = "";

    // Scales, SVG
    // ---------------------------------------------------------------------------
    x = d3.scale.linear();

    y = d3.scale.ordinal()
      .domain(data.map(function(d) { return d.name; }))
      .rangeRoundBands([0, height]);

    curve =  d3.scale.linear();

    // Curve is larger on desktop
    if (mobile) {
      x.range([0, width * .3])
        .domain([-.4, .4]);
      
      curve.range([width * .55, width])
        .domain([-.3, .9]);
    } else {
      x.range([0, width * .4])
        .domain([-.25, .8]);

      curve.range([width * .35, width + margin.right * .6])
        .domain([-.1, .9]);
    }

    svg = d3.select(chart).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Legend
    // ---------------------------------------------------------------------------
    // This section relies heavily on the mobile boolean for display text and placement
    // Additionally, there are too many magic numbers used. Sorry, future me.
    legend = svg.append("g").attr("class", "legend");

    // Bar graph labels
    legend.append("text")
      .attr("x", x(x.domain()[0]))
      .attr("y", margin.top * 1.25)
      .attr("font-size", "14px")
      .text("–");

    legend.append("text")
      .attr("x", x(0))
      .attr("y", margin.top * 1.25)
      .style("font-size", "11px")
      .attr("text-anchor", "middle")
      .text((mobile) ? "Avg" : "Average");  
    
    legend.append("text")
      .attr("x", x(x.domain()[0] * -1))
      .attr("y", margin.top * 1.25)
      .text("+");

    legend.append("text")
      .attr("x", x(0))
      .attr("text-anchor", "middle")
      .text((mobile) ? "Salaries" : "Salaries per pupil")

    // Area labels
    legend.append("text")
      .attr("x", curve(-0.071376381)) // Hamilton County High 2008 value
      .attr("y", margin.top * 1.25)
      .attr("text-anchor", "middle")
      .style("font-size", "11px")
      .text("2008");

    legend.append("text")
      .attr("x", curve(0.339573416))  // Hamilton County High 2016 value
      .attr("y", margin.top * 1.25)
      .attr("text-anchor", "middle")
      .style("font-size", "11px")
      .text("2016");

     legend.append("text")
      .attr("x", curve(0.339573416 / 2 ))
      .attr("y", (mobile) ? 0 : margin.top * 1.25)
      .attr("dx", (mobile) ? -6 : -8)
      .attr("text-anchor", "middle")
      .text("Change");

    // Legend for difference labels (Desktop only)
    if (!mobile) {
      legend.append("text")
        .attr("x", width + margin.right - margin.left)
        .attr("y", margin.top * 1.25)
        .attr("text-anchor", "end")
        .text("Since 2008")  
    }    

    // School groups
    // ---------------------------------------------------------------------------
    schools = svg.selectAll("g.school")
        .data(data)
      .enter().append("g")
        .attr("class", "school")
        .attr("transform", function(d) {
          return "translate(0," + y(d.name) + ")";
        });

    // Guide lines
    schools.append("line")
      .attr("class", "guide-line")
      .attr("x1", 0)
      .attr("x2", width + margin.right - margin.left)
      .attr("y1", y.rangeBand())
      .attr("y2", y.rangeBand());

    // First guide line (top)
    d3.select("g.school").append("line")
      .attr("class", "guide-line")
      .attr("x1", 0)
      .attr("x2", width + margin.right - margin.left)
      .attr("y1", 0)
      .attr("y2", 0);

    // Remove last guide line
    d3.select("g.school:last-of-type").select(".guide-line").remove();

    // Bar graphs
    // Label
    schools.append("text")
      .attr("class", "label")
      .attr("x", 0)
      .attr("y", 4)
      .attr("dy", 8)
      .attr("text-anchor", "start")
      .text(function(d) { return d.name; });

    // Bar graph average
    barHeight = y.rangeBand() - y.rangeBand() * .55;

    schools.append("line")
      .attr("x1", x(0))
      .attr("x2", x(0))
      .attr("y1", barHeight)
      .attr("y2", barHeight * 2 - 1)
      .attr("stroke", color["average"]);

    // 2008 bar
    schools.append("rect")
      .attr("fill", color["2008"])
      .attr("x", function(d) { return rect(d, "2008").x; })
      .attr("y", barHeight)
      .attr("height", barHeight / 2 - 1)
      .attr("width", function(d) { return rect(d, "2008").width; });

    // 2016 bar
    schools.append("rect")
      .attr("fill", color["2016"])
      .attr("x", function(d) { return rect(d, "2016").x; })
      .attr("y", barHeight * 1.5)
      .attr("height", barHeight / 2 - 1)
      .attr("width", function(d) { return rect(d, "2016").width; });

    // Year labels for bar graphs
    d3.select("g.school").append("text")
      .attr("class", "label")
      .attr("x", function(d) { return rect(d, "2008").x; })
      .attr("y", barHeight)
      .attr("dx", -4)
      .attr("dy", 8)
      .attr("text-anchor", "end")
      .style("font-size", "10px")
      .text("2008");

    d3.select("g.school").append("text")
      .attr("class", "label")
      .attr("x", function(d) {
        var bar = rect(d, "2016");
        return bar.width + bar.x;
      })
      .attr("y", barHeight * 1.5)
      .attr("dx", 4)
      .attr("dy", 8)
      .attr("text-anchor", "start")
      .style("font-size", "10px")
      .text("2016");

    // Difference labels
    schools.append("text")
      .attr("x", width + margin.right - margin.left)
      .attr("y", y.rangeBand() / 2)
      .attr("text-anchor", "end")
      .attr("class", "label")
      .style("alignment-baseline", "middle")
      .text(function(d) {
        var fmt = (mobile) ? d3.format("+%") : d3.format("+.01%");
        return fmt(d.change);
      });

    // Shift Lookout Mtn. on mobile
    if (mobile) {
      d3.select("g.school:last-of-type text.label:last-of-type")
        .attr("x", curve(0.124262438)) //-y.rangeBand() * 2.25)
        .attr("dx", -6)
        .attr("dy", 4)
        .attr("text-anchor", "end")
        .text(function(d) { return d3.format("+%")(d.change); });  
    }

    //[{year: "2008", title: false, value: 0.901725692}, {year: "2016", title: true, value: 0.124262438}]
    
    // Area curve showing change
    // ---------------------------------------------------------------------------
    // Gradient
    gradient = svg.append("defs").append("linearGradient")
      .attr("id", "gradient")
      .attr("x2", "0%")
      .attr("y2", "100%");

    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", color["2016"])
      .attr("stop-opacity", 0.8);

    gradient.append("stop")
      .attr("offset", "54%")
      .attr("stop-color", color["average"])
      .attr("stop-opacity", 0.8);

    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", color["2008"])
      .attr("stop-opacity", 0.8);

    // Clip path
    svg.append("clipPath")
        .attr("id", "clip")
      .append("rect")
        .attr("x", curve(-.3))
        .attr("y", margin.top)
        .attr("width", curve(.9) - curve(-.3))
        .attr("height", height);

    // Area
    svg.append("path")
      .datum(data)
      .attr("d", function(d) { return area()(d); })
      .attr("clip-path", "url(#clip)")
      .style("fill", "url(#gradient)");
    
    // 2008 line
    svg.append("path")
      .datum(data)
      .attr("d", function(d) { return line("2008")(d); })
      .attr("stroke", color["2008"])
      .attr("stroke-width", 3)
      .attr("fill", "none")
      .attr("stroke-linecap", "miter");

    // 2016 line
    svg.append("path")
      .datum(data)
      .attr("d", function(d) { return line("2016")(d); })
      .attr("stroke", color["2016"])
      .attr("stroke-width", 3)
      .attr("fill", "none")
      .attr("stroke-linecap", "miter");

    // Helper functions
    // ---------------------------------------------------------------------------
    // Determines chart width
    function calculateWidth() {
      if (!containerWidth) {
       var containerWidth = +container.offsetWidth;
      }
      return containerWidth - margin.left - margin.right;
    }

    // Accessor queries each school's 2008 and 2016 objects
    function plot(d, year) {
      var value = d.years.filter(function(y) {
        return y.year == year;
      })[0].value;

      return value;
    }

    // Bar graph function handles x and width based on whether a value is 
    // greater than or less than zero
    function rect(d, year) {
      var start = x(plot(d, year));
      
      return (start < x(0))
             ? { x: start, width: x(0) - start  }
             : { x: x(0),  width: start - x(0) };
    }

    // Returns function to be invoked with bound data:
    //   line(year)(d)
    function line(year) {
      return d3.svg.line()
        .x(function(d) { return curve(plot(d, year)); })
        .y(function(d) {
          switch(d.name) {
            case "Hamilton County High":
              return y(d.name);
            case "Lookout Mountain Elementary":
              return y(d.name) + y.rangeBand();
            default:
              return y(d.name) + y.rangeBand() / 2;
          }
        })
        .interpolate("basis");
    }
    // Returns function to be invoked with bound data:
    //   area()(d)
    function area() {
      return d3.svg.area()
        .x0(function(d) { return curve(plot(d, "2008")); })
        .x1(function(d) { return curve(plot(d, "2016")); })
        .y(function(d)  {
          switch(d.name) {
            case "Hamilton County High":
              return y(d.name);
            case "Lookout Mountain Elementary":
              return y(d.name) + y.rangeBand();
            default:
              return y(d.name) + y.rangeBand() / 2;
          }
        })
        .interpolate("basis");
    }
  } // End of graphic()

  // Load, map data
  // ---------------------------------------------------------------------------
  d3.csv("data.csv", cast, function(error, csv) {
    if (error) throw error;

    data = csv.sort(function(a,b) { return b.change - a.change; })
      .map(function(row) {
        return {
          nces: row.nces,
          name: row.name,
          change: row.change,
          years: ["2008","2016"].map(function(year) {
            return {
              year: year,
              title: row[year + "_title"],
              value: row[year + "_difference"]  
            };
          })
        };
      });

    new pym.Child({ renderCallback: graphic });
  });

  function cast(d) {
    for (var key in d) {
      switch(key) {
        case "nces":
        case "name":
          d[key] = d[key];
          break;
        case "2008_title":
        case "2016_title":
          d[key] = (d[key] == "1");
          break;
        default:
          d[key] = +d[key];
      }
    }
    return d;
  }

})()