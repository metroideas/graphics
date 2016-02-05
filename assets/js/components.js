// JavaScript components correspond to items in _components.scss
(function($, document) {
  $(document).ready(function() {

    // Default menu toggle function handles open/close state for navbar, dropdown 
    var menuToggle = function(parent) {
      var
      menu   = $(parent),
      toggle = menu.find(".toggle")
      ;

      menu.unbind().removeClass("open");

      toggle.on("click", function(e) {
        var parent = $(e.currentTarget).closest(menu);
        
        parent.toggleClass("open");

        e.preventDefault();
      });
    };

    var dropdown = function() {
      menuToggle(".js-dropdown-menu");
    }();

    var navbar = function() {
      menuToggle(".js-navbar");
    }();

    var accordion = function() {
      var
      menu   = $(".js-accordion"),
      items  = menu.children("li"),
      toggle = items.find(".toggle")
      ;

      items.removeClass("open");

      toggle.on("click", function(e) {
        var parent = $(e.currentTarget.parentNode);

        parent.toggleClass("open");
        parent.siblings().removeClass("open");

        e.preventDefault();
      });
    }();

    var selector = function() {
      var
      menu      = $(".js-menu-selector"),
      selectors = menu.find(".selector a"),
      targets   = menu.find(".target")
      ;

      selectors.on("click", function(e) {
        var id = "#" + e.currentTarget.dataset.target;

        // Open target
        targets.removeClass("open");
        $(id).addClass("open");

        // Selected menu item is active
        selectors.parents(".selector").removeClass("active");
        $(e.currentTarget).parents(".selector").addClass("active");

        e.preventDefault();
      });
    }();
  });
})(jQuery, document);
