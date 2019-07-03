var webrtcPhone = (function() {
  var server, wssAddress, name, exten, impi, impu, phone;

  var ringing = new Audio("sounds/ringing.mp3");
  var calling = new Audio("sounds/calling.mp3");
  ringing.loop = true;
  calling.loop = true;

  function init(data) {
    server = data.server;
    name = data.name;
    exten = data.exten;
    password = data.password;
    impi = exten;
    impu = "sip:" + exten + "@" + server;
    wssAddress = "ws://" + server + ":8088/ws";

    var socket = new JsSIP.WebSocketInterface(wssAddress);
    var configuration = {
      sockets: [socket],
      uri: impu,
      password: password
    };

    phone = new JsSIP.UA(configuration);

    phone.start();

    phone.on("connected", function(e) {
      console.log("CONNECTED");
    });

    phone.on("disconnected", function(e) {
      console.log("DISCONNECTED");
    });

    phone.on("newRTCSession", function(e) {
      console.log("newRTCSession", e);
    });
  }

  function call(to) {
    var eventHandlers = {
      progress: function(e) {
        console.log("call is in progress");
      },
      failed: function(e) {
        console.log("call failed with cause: " + e.cause, e);
      },
      ended: function(e) {
        console.log("call ended with cause: " + e.cause, e);
      },
      confirmed: function(e) {
        console.log("call confirmed");
      }
    };

    var options = {
      eventHandlers: eventHandlers,
      mediaConstraints: { audio: true, video: false }
    };

    var session = phone.call("sip:" + to + "@" + server, options);
  }

  return {
    init: init,
    call: call
  };
})();
