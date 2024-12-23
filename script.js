var curr_index = -1;
var viewed_svgs = [];
var viewed_names = [];
var dropArea = $("#dropArea");

// file name sorting

function compare_filename(file_a, file_b) {
  function alphanum(a, b) {
    function chunkify(t) {
      var tz = new Array();
      var x = 0,
        y = -1,
        n = 0,
        i,
        j;

      while ((i = (j = t.charAt(x++)).charCodeAt(0))) {
        var m = i == 46 || (i >= 48 && i <= 57);
        if (m !== n) {
          tz[++y] = "";
          n = m;
        }
        tz[y] += j;
      }
      return tz;
    }

    var aa = chunkify(a);
    var bb = chunkify(b);

    for (x = 0; aa[x] && bb[x]; x++) {
      if (aa[x] !== bb[x]) {
        var c = Number(aa[x]),
          d = Number(bb[x]);
        if (c == aa[x] && d == bb[x]) {
          return c - d;
        } else return aa[x] > bb[x] ? 1 : -1;
      }
    }
    return aa.length - bb.length;
  }
  return alphanum(file_a.name, file_b.name);
}

// rendering

draw_svg = function (doc, name, lock_zoom) {
  var matrix_s = "";
  if (lock_zoom) {
    matrix_s = $("#viewport").attr("transform");
  } else {
    $("#dropArea").html(doc);
    var doc_width = $(dropArea).width();
    var doc_height = $(dropArea).height();
    var svg_width = parseInt($("svg").attr("width"));
    var svg_height = parseInt($("svg").attr("height"));
    var scale = Math.min(doc_width / svg_width, doc_height / svg_height);
    var top = (doc_height - svg_height * scale) * 0.5;
    var left = (doc_width - svg_width * scale) * 0.5;
    matrix_s =
      "translate(" +
      left +
      "," +
      top +
      ")" +
      " scale(" +
      scale +
      "," +
      scale +
      ")";
  }
  $("#info").html(name);
  $("#info").css({ "background-color": "#ddd" });
  doc = doc.replace(
    /<svg.*?>/g,
    '<svg xmlns="http://www.w3.org/2000/svg" ' +
      'version="1.1"><g id="viewport">'
  );
  doc = doc.replace(/<\/svg>/g, "</g></svg>");
  $("#dropArea").html(doc);
  $("#viewport").attr("transform", matrix_s);
  $("svg").svgPan("viewport", true, true, false, 0.5);
};

// control

dropArea.ondragover = function () {
  this.className = "hover";
  return false;
};
dropArea.ondragend = function () {
  this.className = "";
  return false;
};
dropArea.ondrop = function (e) {
  this.className = "";
  e.preventDefault();

  var is_first = curr_index < 0;
  var files = [].slice.call(e.dataTransfer.files);
  files.sort(compare_filename);
  for (var i = 0, file; (file = files[i]); i++) {
    if (file.name !== "image.svg" || !file.type.match("image/svg.*")) {
      continue;
    }
    var reader = new FileReader();
    reader.onload = (function (theFile) {
      return function (e) {
        doc = e.target.result;
        if (doc != null && doc != "") {
          var lock_zoom = !is_first && $("#lock-zoom").prop("checked");
          draw_svg(doc, theFile.name, lock_zoom);
          viewed_svgs.push(doc);
          viewed_names.push(theFile.name);
          curr_index++;
        }
      };
    })(file);
    reader.readAsText(file);
  }
  return false;
};

$(document).keydown(function (e) {
  var need_redraw = false;
  switch (e.which) {
    case 37: // left
      if (curr_index > 0) {
        curr_index--;
        need_redraw = true;
      }
      break;

    case 39: // right
      if (curr_index < viewed_names.length - 1) {
        curr_index++;
        need_redraw = true;
      }
      break;

    case 38: // up
      if (viewed_names.length > 0) {
        curr_index = 0;
        need_redraw = true;
      }
      break;

    case 40: // down
      if (viewed_names.length > 0) {
        curr_index = viewed_names.length - 1;
        need_redraw = true;
      }
      break;

    default:
      break;
  }
  if (need_redraw) {
    e.preventDefault();
    var curr_svg = viewed_svgs[curr_index];
    var curr_name = viewed_names[curr_index];
    var lock_zoom = $("#lock-zoom").prop("checked");
    draw_svg(curr_svg, curr_name, lock_zoom);
  }
  return !need_redraw;
});

// layout

applyLayout = function () {
  $("#dropArea").width($(window).width() - 50);
  $("#dropArea").height($(window).height() - 50);
  $("#dropArea").css({ top: 16 + "px", left: 16 + "px" });
  $("#info").width($("#dropArea").width() - 30);
  $("#info").css({ top: 36 + "px", left: 36 + "px" });
  $("#control").css({
    top: $("#dropArea").height() - $("#control").height() - 30 + "px",
    left: 36 + "px",
  });
};
$(window).resize(applyLayout);
$(document).ready(function () {
  applyLayout();
  // Load image.svg on page load
  fetch("image.svg")
    .then((response) => response.blob())
    .then((blob) => {
      var reader = new FileReader();
      reader.onload = function (e) {
        draw_svg(e.target.result, "image.svg", true);
        viewed_svgs.push(e.target.result);
        viewed_names.push("image.svg");
        curr_index++;
      };
      reader.readAsText(blob);
    });
});