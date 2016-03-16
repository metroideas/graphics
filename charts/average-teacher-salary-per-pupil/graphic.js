(function() {
  var
  data,
  chart     = document.querySelector("#chart"),
  container = document.querySelector("#graphic")
  ;

  function graphic(containerWidth) {
    var
    x,
    y,
    l,
    axis,
    margin = { top: 24, right: 12, bottom: 12, left: 180 },
    width  = calculateWidth(),
    height = data.length * 48 - margin.top - margin.bottom,
    mobile = (width <= 414),
    svg
    ;

    // Clear existing chart contents
    chart.innerHTML = "";

    // Scales and axes
    // ---------------------------------------------------------------------------
    x = d3.scale.ordinal()
      .rangeRoundBands([0, width])
      .domain(["2008", "2016", "Change"]);

    y = d3.scale.ordinal()
      .rangeRoundBands([0, height], 0.1)
      .domain(data.map(function(d) { return d.name; }));

    l = d3.scale.linear()
      .range([y.rangeBand(), 0])
      .domain([-0.9, 0.9]);

    axis = d3.svg.axis()
      .scale(x)
      .orient("top");

    svg = d3.select(chart).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("g")
      .attr("class", "x axis")
      .call(axis);

    // Add school group
    svg.selectAll("g.school")
        .data(data)
      .enter().append("g")
        .attr("class", "school")
        .attr("transform", function(d) {
          return "translate(0," + y(d.name) + ")";
        });

    // School labels
    svg.selectAll("g.school").append("text")
      .attr("y", y.rangeBand() / 2)
      .style("text-anchor", "end")
      .style("alignment-baseline", "middle")
      .text(function(d) { return d.name; });

    // Guide lines for each group
    svg.selectAll("g.school").append("line")
      .attr("class", "y axis")
      .attr({ x1: 0, x2: width, y1: y.rangeBand(),  y2: y.rangeBand() });

    // Guide line above first group
    svg.select("g.school").append("line")
      .attr("class", "y axis")
      .attr({ x1: 0, x2: width, y1: 0,  y2: 0 });

    // Average line
    svg.selectAll("g.school").append("line")
      .attr("class", "average")
      .attr({
        x1: x.rangeBand() / 4,
        x2: width - x.rangeBand() * 1.25,
        y1: y.rangeBand() / 2,
        y2: y.rangeBand() / 2
      });

    if (!mobile) {
      svg.select("g.school").append("text")
        .attr("x", width - x.rangeBand() * 1.25)
        .attr("y", y.rangeBand() * .2)
        .attr("dx", 5)
        .style("font-size", "10px")
        .style("text-anchor", "start")
        .style("alignment-baseline", "middle")
        .text("+");

      svg.select("g.school").append("text")
        .attr("x", width - x.rangeBand() * 1.25)
        .attr("y", y.rangeBand() / 2)
        .attr("dx", 5)
        .style("font-size", "10px")
        .style("text-anchor", "start")
        .style("alignment-baseline", "middle")
        .text("Average");

      svg.select("g.school").append("text")
        .attr("x", width - x.rangeBand() * 1.25)
        .attr("y", y.rangeBand() * .8)
        .attr("dx", 6)
        .style("font-size", "10px")
        .style("text-anchor", "start")
        .style("alignment-baseline", "middle")
        .text("–");
    }

    svg.selectAll("g.school").append("line")
      .attr("class", "difference")
      .attr({
        x1: x.rangeBand() / 4,
        x2: width - x.rangeBand() * 1.25,
        y1: function(d) { return lineY(d, "2008"); },
        y2: function(d) { return lineY(d, "2016"); }
      });

      function lineY(d, year) {
        var value = d.years.filter(function(y) {
          return y.year == year;
        })[0].value;

        return l(value);
      }

    // Text difference for change
    svg.selectAll("g.school")
      .append("text").attr("class", "change")
        .attr({ x: x("Change") + x.rangeBand() / 2, y: y.rangeBand() / 2 })
        .style({
          "text-anchor": "middle",
          "alignment-baseline": "middle"
        })
        .text(function(d) {
          var start, end;
          
          d.years.forEach(function(year) {
            if (year.year == "2008") {
              start = year.value;
            } else {
              end = year.value;
            }
          });

          return d3.format("+.01%")((end - start));
        });


    // Helper functions
    // ---------------------------------------------------------------------------
    function calculateWidth() {
      if (!containerWidth) {
       var containerWidth = +container.offsetWidth;
      }
      return containerWidth - margin.left - margin.right;
    }
  } // End of graphic()



  // Load, map data
  // ---------------------------------------------------------------------------
  d3.csv("data.csv", cast, function(error, csv) {
    if (error) throw error;

    var years = ["2008", "2016"];

    data = csv.map(function(row) {
      return {
        nces: row.nces,
        name: row.name,
        years: years.map(function(year) {
          return {
            year: year,
            title: row[year + "_title"],
            value: row[year + "_difference"]  
          };
        })
      };
    });

    console.log(data);

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