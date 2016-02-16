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
    circles,
    college,
    highSchool,
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
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

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
      .call(yAxis);

    college = svg.selectAll("circle.college")
        .data(data)
      .enter().append("circle")
        .attr("class", "college")
          .attr("cx", function(d) { return x(d.natural.college); })
          .attr("cy", function(d) { return y(d.foreign.college); })
          .attr("r", radius);
          
    highSchool = svg.selectAll("circle.high-school")
        .data(data)
      .enter().append("circle")
        .attr("class", "high-school")
          .attr("cx", function(d) { return x(d.natural.hs); })
          .attr("cy", function(d) { return y(d.foreign.hs); })
          .attr("r", radius);

    // Menu selection
    // -------------------------------------------------
    select.on("change", function() {
      var
      cities,
      selection = this.value;
      
      if (selection == "all") {
        cities = data
      } else {
        data.forEach(function(state) {
          if (state.id == selection) { cities = state.cities; }
        });  
      }
      
      if (cities) {
        college.remove();
        highSchool.remove();  
      }

      college = svg.selectAll("circle.college")
          .data(cities)
        .enter().append("circle")
          .attr("class", "college")
          .attr("cx", function(d) { return x(d.natural.college); })
          .attr("cy", function(d) { return y(d.foreign.college); })
          .attr("r", radius);

      highSchool = svg.selectAll("circle.high-school")
          .data(cities)
        .enter().append("circle")
          .attr("class", "high-school")
          .attr("cx", function(d) { return x(d.natural.hs); })
          .attr("cy", function(d) { return y(d.foreign.hs); })
          .attr("r", radius);
    });
  } // End of drawGraphic()
  

  // Load and map data
  // -------------------------------------------------
  d3.csv("data.csv", type, function(error, csv) {
    if (error) throw error;

    // Create parent (state) nodes
    data = csv.filter(function(row) {
        return row.city == "Statewide";
      }).map(function(row) {
        return {
          id: row.state,
          foreign: { hs: +row["foreign_hs"], college: +row["foreign_college"] },
          natural: { hs: +row["natural_hs"], college: +row["natural_college"] },
          cities: []
        };
      });

    // Add child (city) nodes
    csv.forEach(function(city) {
      if (city.city != "Statewide") {
        data.forEach(function(state) {
          if (city.state == state.id) {
            
            state.cities.push({
              id: city.city,
              state: city.state,
              foreign: { hs: +city["foreign_hs"], college: +city["foreign_college"] },
              natural: { hs: +city["natural_hs"], college: +city["natural_college"] }
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