! function(a) {
  function b(b) {
    a(b.target).each(function() {
      if (b.stars > 1 && "" == b.range && 1 == b.count) {
        for (var c = 1; c <= b.stars; c++) c > b.disable && b.stars > b.disable && b.disable > 0 ? a(this).append("<span class='" + b.star + " " + b.disable_class + "' data-value='" + c + "'></span>") : b.stars > b.disable && 0 == b.disable ? a(this).append("<span class='" + b.star + " " + b.disable_class + "' data-value='" + c + "'></span>") : a(this).append("<span class='" + b.star + "' data-value='" + c + "'></span>");
        a(this).append("<input type='hidden' class='" + b.input_class + "' value=''>")
      } else if (b.stars > 1 && "" == b.range && b.count > 1) {
        var c = 1,
          d = c;
        for (c; c <= b.stars; c++) c > b.disable && b.stars > b.disable && b.disable > 0 ? (a(this).append("<span class='" + b.star + " " + b.disable_class + "' data-value='" + d + "'></span>"), d += b.count) : b.stars > b.disable && 0 == b.disable ? (a(this).append("<span class='" + b.star + " " + b.disable_class + "' data-value='" + d + "'></span>"), d += b.count) : (a(this).append("<span class='" + b.star + "' data-value='" + d + "'></span>"), d += b.count);
        a(this).append("<input type='hidden' class='" + b.input_class + "' value=''>")
      }
      if (b.range && 2 == b.range.length && 1 == b.count) {
        for (var e = 0, f = b.range[0]; f < b.range[1]; f++) f > b.disable && b.range[1] > b.disable && b.disable > 0 && b.disable <= e ? a(this).append("<span class='" + b.star + " " + b.disable_class + "' data-value='" + f + "'></span>") : 0 == b.disable ? a(this).append("<span class='" + b.star + " " + b.disable_class + "' data-value='" + f + "'></span>") : a(this).append("<span class='" + b.star + "' data-value='" + f + "'></span>"), e++;
        a(this).append("<input type='hidden' class='" + b.input_class + "' value=''>")
      } else if (b.range && 2 == b.range.length && b.count > 1) {
        var f = b.range[0],
          d = f,
          e = 0;
        for (f; f < b.range[1]; f++) f >= b.disable && b.range[1] > b.disable && b.disable > 0 && b.disable <= e ? (a(this).append("<span class='" + b.star + " " + b.disable_class + "' data-value='" + d + "'></span>"), d += b.count) : 0 == b.disable ? (a(this).append("<span class='" + b.star + " " + b.disable_class + "' data-value='" + d + "'></span>"), d += b.count) : (a(this).append("<span class='" + b.star + "' data-value='" + d + "'></span>"), d += b.count), e++;
        a(this).append("<input type='hidden' class='" + b.input_class + "' value=''>")
      }
    })
  }

  function c(b) {
    if (b.stars) {
      var c;
      return a(b.target + " ." + b.star).each(function(d, e) {
        a(this).hover(function() {
          a(this).prevAll().andSelf().addClass("over")
        }, function() {
          a(this).prevAll().andSelf().removeClass("over")
        }), a(this).on("click", function() {
          c = a(this).attr("data-value"), a(this).siblings("input." + b.input_class).val(c), a(this).prevAll().andSelf().addClass(b.checked_class), a(this).nextAll().removeClass(b.checked_class), b.on_select && "function" == typeof b.on_select && b.on_select(c)
        })
      }), a(b.target).each(function(c, d) {
        if (b.default_stars > 0 && c <= b.default_stars && b.stars >= b.default_stars) {
          a(b.target).find("input." + b.input_class).attr("default-stars", b.default_stars);
          var f, e = a(b.target).find("input." + b.input_class).attr("default-stars");
          if (b.disable > 0 && b.default_stars < b.disable) {
            for (var g = 0; g < e; g++) a(this).find(".rate_star").eq(g).addClass(b.checked_class);
            f = a(b.target).find("span.checked:last").attr("data-value"), a(this).find("input." + b.input_class).val(f)
          } else if (b.disable <= 0) {
            for (var g = 0; g < e; g++) a(this).find(".rate_star").eq(g).addClass(b.checked_class);
            f = a(b.target).find("span.checked:last").attr("data-value"), a(this).find("input." + b.input_class).val(f)
          }
        }
        b.stars <= b.default_stars && console.warn("The number of stars in a row should be bigger than the number of default stars."), b.default_stars < 0 && console.warn("The number of default stars should be bigger than 0."), b.key >= b.default_stars && console.warn("The number of Rows should be less than the number of default stars."), b.disable > 0 && b.default_stars > 0 && b.default_stars >= b.disable && console.warn("The number of disabled stars should not overlap with the number of default stars."), b.disable > 0 && b.disable >= b.range[1] - b.range[0] && console.warn("The number of disabled stars should be less than the last number defined in range.")
      }), c
    }
  }
  a.fn.starwarsjs = function(d) {
    var e = a.extend({
        target: this.selector,
        stars: 1,
        range: [],
        count: 1,
        disable: -1,
        default_stars: 0,
        on_select: null
      }, d),
      f = {
        target: e.target,
        star: "rate_star",
        stars: e.stars,
        range: e.range,
        count: e.count,
        disable: e.disable,
        checked_class: "checked",
        disable_class: "disable",
        input_class: "get_rate",
        default_stars: e.default_stars,
        on_select: e.on_select
      };
    return b(f), c(f), this
  }
}(jQuery);
