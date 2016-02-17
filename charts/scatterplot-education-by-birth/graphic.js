(function() {
  var
  data,
  container        = document.querySelector("#graphic")
  ;

  function drawGraphic(containerWidth) {
    var
    x,
    y,
    xAxis,
    yAxis,
    select,
    legend,
    hs,
    college,
    points,
    svg            = undefined, // Resets svg on resize
    margin         = { top: 48, right: 24, bottom: 48, left: 48 },
    width          = calculateWidth(),
    mobile         = (width <= 512) ? true : false,
    height         = calculateHeight(),
    radius         = (mobile) ? 2 : 3
    ;


    // Helper functions
    // -------------------------------------------------
    function dimensions() {
      return (mobile)
        ? { width: 2, height: 3 }
        : { width: 1, height: 1 };
    }

    function marginWidth()  { return margin.left + margin.right; }
    function marginHeight() { return margin.top + margin.bottom; }

    function calculateHeight() {
      return Math.ceil(width * dimensions().height / dimensions().width) - marginHeight();
    }
    function calculateWidth() {
      if (!containerWidth) {
        var containerWidth = +(container.offsetWidth);
      }

      return Math.ceil(containerWidth - marginWidth());
    }

    // Dropdown selector
    // -------------------------------------------------
    select = d3.select("#graphic").append("select")
      .style({
        "margin-top": (mobile)
                      ? margin.top / 2 + "px"
                      : margin.top + "px",
        "margin-left": (mobile)
                      ? margin.left / 2 + "px"
                      : margin.left + "px"
      });

    select.selectAll("option")
        .data(data)
      .enter().append("option")
        .attr("value", function(d) { return d.id; })
        .html(function(d) { return d.id; });

    select.insert("option", ":first-child")
      .attr("value", "all")
      .attr("selected", true)
      .html("State averages");

    // Legend
    // -------------------------------------------------
    legend = d3.select("#graphic").append("div")
      .attr("class", "legend")
      .style({
        "margin-top": margin.top / 2 + "px",
        "margin-left": (mobile)
                      ? margin.left / 2 + "px"
                      : margin.left + "px"
      });
      
      legend.append("h3").attr("class", "name").html("&nbsp;");
      
      hs      = legend.append("div").attr("class", "hs span-6");
      college = legend.append("div").attr("class", "college span-6");

      hs.append("div").attr("class", "key");

      hs.append("span").html("High school graduates");

      var list = hs.append("ul").attr("class", "list-unstyled");
      list.append("li").html("Foreign born: ")
        .append("span").attr("class", "foreign-data");
      list.append("li").html("Native born: ")
        .append("span").attr("class", "natural-data");

      college.append("div").attr("class", "key");

      college.append("span").html("College graduates");

      var list = college.append("ul").attr("class", "list-unstyled");
      list.append("li").html("Foreign born: ")
        .append("span").attr("class", "foreign-data");
      list.append("li").html("Native born: ")
        .append("span").attr("class", "natural-data");


    // Scales, axes
    // -------------------------------------------------
    x = d3.scale.linear()
      .domain([0, 1])
      .range([0, width]);

    y = d3.scale.linear()
      .domain([0, 1])
      .range([height, 0]);

    function tickValues(start) {
      var ticks = (mobile) ? [0.25, 0.5, 0.75, 1.0] : [0.2, 0.4, 0.6, 0.8, 1.0];

      return (start != undefined) ? [start].concat(ticks) : ticks;
    }

    xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom")
      .ticks(null, "%")
      .tickValues(tickValues(0))
      .tickSize(-height, 0, 0);

    yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")
      .ticks(null, "%")
      .tickValues(tickValues)
      .tickSize(-width, 0, 0);

    // Scatterplot
    // -------------------------------------------------
    svg = d3.select("#graphic").append("svg")
        .attr("width", width + marginWidth())
        .attr("height", height + marginHeight())
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top / 4 + ")");

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
      .append("text")
        .text("Native born")
        .attr("x", width / 2)
        .attr("y", margin.bottom * 0.75)
        .attr("text-anchor", "middle")
        .attr("class", "label");

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
      .append("text")
        .text("Foreign born")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left * 0.75 + 2)
        .attr("text-anchor", "middle")
        .attr("class", "label");

    points = svg.selectAll("g.point")
        .data(data)
      .enter().append("g")
        .attr("class", "point");

    scatterplot(points);

    function scatterplot(group, selector) {
      addPoint("college");
      addPoint("hs");

      function addPoint(selector) {
        var g = group.append("circle")
          .attr("class", selector)
          .attr("cx", function(d) { return x(d.natural[selector]); })
          .attr("cy", function(d) { return y(d.foreign[selector]); })
          .attr("r", radius)
          .on("mouseover", onHover)
          .on("mouseout", offHover);
      }

      function onHover(d) {
        function pctFmt(decimal) { return Math.round(decimal * 100) + "%" }

        d3.selectAll(this.parentNode.children).attr("r", radius * 2);
        d3.select(".legend .name").html(function() {
          return (d.state) ? d.id + ", " + d.state : d.id;
        });

        d3.select(".legend .hs .foreign-data").html(pctFmt(d.foreign.hs));
        d3.select(".legend .hs .natural-data").html(pctFmt(d.natural.hs));
        d3.select(".legend .college .foreign-data").html(pctFmt(d.foreign.college));
        d3.select(".legend .college .natural-data").html(pctFmt(d.natural.college));
      }

      function offHover() {
        d3.selectAll(this.parentNode.children).attr("r", radius);
        d3.select(".legend .name").html("&nbsp;")
        d3.selectAll(".legend .foreign-data").html("&nbsp;")
        d3.selectAll(".legend .natural-data").html("&nbsp;")
      }
    } // End of scatterplot()


    // Menu selection
    // -------------------------------------------------
    select.on("change", function() {
      var
      cities,
      option = this.value;
      
      if (option == "all") {
        cities = data
      } else {
        data.forEach(function(state) {
          if (state.id == option) {
            cities = state.cities;
          }
        });  
      }
      
      // Clear and bind data selection
      points.remove();
      
      points = svg.selectAll("g.point")
          .data(cities)
        .enter().append("g")
          .attr("class", "point");

      scatterplot(points);
    });
  } // End of drawGraphic()
  

  // Load and map data
  // -------------------------------------------------
  d3.csv("data.csv", type, function(error, csv) {
    if (error) throw error;

    // Create parent nodes
    data = csv.filter(function(parent) { return parent.city == "Statewide";
      }).map(function(parent) {
        return {
          id: parent.state,
          foreign: { hs: parent["foreign_hs"], college: parent["foreign_college"] },
          natural: { hs: parent["natural_hs"], college: parent["natural_college"] },
          cities: []
        };
      });

    // Add child nodes
    csv.forEach(function(child) {
      if (child.city != "Statewide") {
        data.forEach(function(parent) {
          if (child.state == parent.id) {
            
            parent.cities.push({
              id: child.city,
              state: child.state,
              foreign: { hs: child["foreign_hs"], college: child["foreign_college"] },
              natural: { hs: child["natural_hs"], college: child["natural_college"] }
            });
          }
        })
      }
    });

    // Empty #graphic container
    if (data) { container.innerHTML = ""; }

    new pym.Child({ renderCallback: drawGraphic });
  });

  function type(d) {
    d["foreign_hs"]      = +d["foreign_hs"];
    d["natural_hs"]      = +d["natural_hs"];
    d["foreign_college"] = +d["foreign_college"]
    d["natural_college"] = +d["natural_college"]
    return d;
  }
})();