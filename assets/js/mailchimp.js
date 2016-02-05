// Ajax overrides default subscription forms.
// Requires jQuery primarily to handle wonky jsonp submission
(function($, document) {

  // Sitewide footer form
  var ftr  = document.querySelector(".footer form.js-mc-form");
  
  // About page call-to-action form w/ ZIP code field
  var cta   = document.querySelector(".call-to-action form.js-mc-form");

  if (ftr) {
    ftr.addEventListener("submit", function(e) {
      submitMailchimpForm(e);
    });  
  }
  
  if (cta) {
    cta.addEventListener("submit", function(e) {
      submitMailchimpForm(e);
    });  
  }

  var submitMailchimpForm = function(event) {
    event.preventDefault();

    var email = event.target.elements.EMAIL.value;
    var url   = event.target.action.replace(/\/post\?/, "/post-json?").concat("&c=?"); // Amends form action for jsonp

    if (email.length == 0 || email == undefined) {
      return ;
    } else {
    $.ajax({
        type: "GET",
        url: url,
        data: $(event.target).serialize(),
        cache: false,
        dataType: "jsonp",
        jsonp: "c",
        contentType: "application/json; charset=utf-8",
        
        success: function(resp) {
          // Get .mc-response element
          var status = $(event.target).find(".js-mc-response");

          // To do: Replace text color with colored alert
          // 
          // Clear any existing text and color classes
          // status.html("");
          // status.removeClass("text-error").removeClass("text-primary").removeClass("text-success");

          // if (resp.msg.includes("already subscribed") && resp.result == "error") {
          //   status.addClass("text-primary");
          // } else if (resp.result == "error") {
          //   status.addClass("text-error");
          // } else {
          //   status.addClass("text-success");
          // }

          // Add resp.msg to .mc-response element
          status.html(resp.msg);

          return ;
        }
      });
    }
  };

})(jQuery, document);