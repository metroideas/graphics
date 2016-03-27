(function() {
  var
  data,
  container = document.querySelector("#container"),
  chart     = document.querySelector("#chart")
  ;

  // Draw chart
  // ---------------------------------------------------------------------------
  function draw(containerWidth) {
    // Width breakpoint
    var mobile = (+container.offsetWidth <= 414);

    // Conventional margin with accessors
    var margin = {
      top: 16,
      right: 0,
      bottom: 16,
      left: 0,
      width: function() { return this.right + this.left; },
      height: function() { return this.top + this.bottom; }
    };
    
    // Aspect ratio
    var ratio  = { width: 8, height: 5 };
    
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

    // Chart
    // ---------------------------------------------------------------------------
    // Clear existing contents
    chart.innerHTML = "";

    // ...

  } // End of draw(config)

  // Load and map data
  // --------------------------------------------------------------------------- 
  d3.csv("data.csv", type, function(error, csv) {
    if (error) throw error;

    data = csv;

    // console.log(data);  // You will need this.

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