$(function() {
  $("#init-btn").click(function() {
    webrtcPhone.init({
      server: $("#server-address").val(),
      name: $("#name").val(),
      exten: $("#exten").val(),
      password: $("#password").val()
    });
  });

  $("#call-btn").click(function() {
    var to = $("#call-to").val();
    webrtcPhone.call(to);
  });

  $("#answer-btn").click(function() {
    webrtcPhone.answer();
  });

  $("#hangup-btn").click(function() {
    webrtcPhone.hangup();
  });
});
