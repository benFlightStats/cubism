cubism_contextPrototype.horizon = function() {
  var context = this,
      xScale = context.xScale(),
      mode = "offset",
      buffer = document.createElement("canvas"),
      dataSize =  context.size(),
      height = buffer.height = 30,
      scale = d3.scale.linear().interpolate(d3.interpolateRound),
      metric = cubism_identity,
      extent = null,
      title = cubism_identity,
      format = d3.format(".2s"),
      colors = ["#08519c","#3182bd","#6baed6","#bdd7e7","#bae4b3","#74c476","#31a354","#006d2c"];
    var rLeft, rWidth;
    buffer.width = dataSize * xScale;

  function horizon(selection) {

    selection
        //here focus is being set to mouse x, but other places it corresponds to the data array index.
        .on("mousemove.horizon", function() { context.focus(Math.round(d3.mouse(this)[0])); })
        .on("mouseout.horizon", function() { context.focus(null); });


    selection.append("canvas")
        .attr("width", dataSize * xScale)
        .attr("height", height);

    selection.append("span")
        .attr("class", "title")
        .text(title);

    selection.append("span")
        .attr("class", "value");

    selection.each(function(d, i) {
      var that = this,
          id = ++cubism_id,
          metric_ = typeof metric === "function" ? metric.call(that, d, i) : metric,
          colors_ = typeof colors === "function" ? colors.call(that, d, i) : colors,
          extent_ = typeof extent === "function" ? extent.call(that, d, i) : extent,
          start = -Infinity,
          step = context.step(),
          canvas = d3.select(that).select("canvas"),
          span = d3.select(that).select(".value"),
          max_,
          m = colors_.length >> 1,
          ready;

      canvas.datum({id: id, metric: metric_});
      canvas = canvas.node().getContext("2d");

      function change(start1, stop) {
        canvas.save();

        // compute the new extent and ready flag
        var extent = metric_.extent();
        ready = extent.every(isFinite);
        if (extent_ != null) extent = extent_;

        // if this is an update (with no extent change), copy old values!
        var i0 = 0, max = Math.max(-extent[0], extent[1]);
        if (this === context) {
          if (max == max_) {
            i0 = dataSize - (cubism_metricOverlap);
            var dx = (start1 - start) / step;
            if (dx < dataSize) {
                buffer.width = dataSize * xScale;
              var canvas0 = buffer.getContext("2d");
                rWidth = dataSize * xScale;
              canvas0.clearRect(0, 0, rWidth, height);
                rLeft = dx * xScale;
                rWidth = (dataSize - dx) * xScale;
              canvas0.drawImage(canvas.canvas, rLeft, 0, rWidth, height, 0, 0, rWidth, height);
                rWidth = dataSize * xScale ;
              canvas.clearRect(0, 0, rWidth, height);
              canvas.drawImage(canvas0.canvas, 0, 0);
            }
          }
          start = start1;
        }

        // update the domain
        scale.domain([0, max_ = max]);

        // clear for the new data
          rWidth = (dataSize - i0) * xScale;
          rLeft = i0 * xScale;
        canvas.clearRect(rLeft, 0, rWidth, height);

        // record whether there are negative values to display
        var negative;

        // positive bands
        var time = new Date();

        for (var j = 0; j < m; ++j) {
          canvas.fillStyle = colors_[m + j];

          // Adjust the range based on the current band index.
          var y0 = (j - m + 1) * height;
          scale.range([m * height + y0, y0]);
          y0 = scale(0);

          for (var i = i0, n = dataSize, y1; i < n; ++i) {
            y1 = metric_.valueAt(i);
              rLeft = Math.round(i*xScale);
              rWidth = Math.round(xScale);
            if (y1 <= 0) { negative = true; continue; }
            if (y1 === undefined) continue;
            canvas.fillRect(rLeft, y1 = scale(y1), rWidth, y0 - y1);
          }
        }

        if (negative) {
          // enable offset mode
          if (mode === "offset") {
            canvas.translate(0, height);
            canvas.scale(1, -1);
          }

          // negative bands
          for (var j = 0; j < m; ++j) {
            canvas.fillStyle = colors_[m - 1 - j];

            // Adjust the range based on the current band index.
            var y0 = (j - m + 1) * height;
            scale.range([m * height + y0, y0]);
            y0 = scale(0);

            for (var i = i0, n = dataSize, y1; i < n; ++i) {
              y1 = metric_.valueAt(i);
              if (y1 >= 0) continue;
              canvas.fillRect(Math.round(i*xScale), scale(-y1),
                  Math.round(xScale), y0 - scale(-y1));
            }
          }
        }

        canvas.restore();
      }

      function focus(mouse_x) {
        if (mouse_x == null) mouse_x = dataSize - 1;
        // since we are getting mouse_x and it's a scaled value,
        // need to convert this back to an index to look up
        var index = Math.round(mouse_x/xScale);
        var value = metric_.valueAt(index);
        span.datum(value).text(isNaN(value) ? null : format);
          span.style("left", mouse_x+"px");
      }

      // Update the chart when the context changes.
      context.on("change.horizon-" + id, change);
      context.on("focus.horizon-" + id, focus);

      // Display the first metric change immediately,
      // but defer subsequent updates to the canvas change.
      // Note that someone still needs to listen to the metric,
      // so that it continues to update automatically.
      metric_.on("change.horizon-" + id, function(start, stop) {
        change(start, stop), focus();
        if (ready) metric_.on("change.horizon-" + id, cubism_identity);
      });
    });
  }

  horizon.remove = function(selection) {

    selection
        .on("mousemove.horizon", null)
        .on("mouseout.horizon", null);

    selection.selectAll("canvas")
        .each(remove)
        .remove();

    selection.selectAll(".title,.value")
        .remove();

    function remove(d) {
      d.metric.on("change.horizon-" + d.id, null);
      context.on("change.horizon-" + d.id, null);
      context.on("focus.horizon-" + d.id, null);
    }
  };

  horizon.mode = function(_) {
    if (!arguments.length) return mode;
    mode = _ + "";
    return horizon;
  };

  horizon.height = function(_) {
    if (!arguments.length) return height;
    buffer.height = height = +_;
    return horizon;
  };

  horizon.metric = function(_) {
    if (!arguments.length) return metric;
    metric = _;
    return horizon;
  };

  horizon.scale = function(_) {
    if (!arguments.length) return scale;
    scale = _;
    return horizon;
  };

  horizon.extent = function(_) {
    if (!arguments.length) return extent;
    extent = _;
    return horizon;
  };

  horizon.title = function(_) {
    if (!arguments.length) return title;
    title = _;
    return horizon;
  };

  horizon.format = function(_) {
    if (!arguments.length) return format;
    format = _;
    return horizon;
  };

  horizon.colors = function(_) {
    if (!arguments.length) return colors;
    colors = _;
    return horizon;
  };

  return horizon;
};
