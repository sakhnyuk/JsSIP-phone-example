JsSIP.debug.enable("JsSIP:*");

var webrtcPhone = (function() {
  var server, wssAddress, name, exten, impi, impu, phone, activeCall;
  var registered = false;

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
      password: password,
      no_answer_timeout: 20,
      session_timers: false,
      register: true,
      trace_sip: true,
      connection_recovery_max_interval: 30,
      connection_recovery_min_interval: 2
    };

    phone = new JsSIP.UA(configuration);

    phone.on("connected", function(e) {
      console.log("CONNECTED");
    });

    phone.on("disconnected", function(e) {
      console.log("DISCONNECTED");
    });

    phone.on("newRTCSession", function(e) {
      console.debug("New session created");

      if (activeCall === undefined && e.session !== undefined) {
        // new incoming call
        activeCall = e.session;
        activeCall.on("failed", function(e) {
          console.log("call failed with cause: " + e.cause);
          activeCall = undefined;
        });

        activeCall.on("progress", function(e) {
          if (e.originator === "remote") e.response.body = null;
        });

        activeCall.on("confirmed", function(e) {
          console.log("call confirmed");
          callStart = new Date().getTime();
        });

        activeCall.on("ended", function(e) {
          console.debug("Call terminated");

          activeCall = undefined;
        });

        activeCall.on("reinvite", function(e) {
          console.log("call reinvited with request: " + e.request);
        });
      } else {
        e.session.terminate({ status_code: 486 });
        activeCall = undefined;
      }
    });

    phone.on("sipEvent", function(e) {
      console.log("sipEvent", e);
    });

    phone.start();
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

  function answer() {
    if (activeCall) {
      activeCall.answer({ mediaConstraints: { audio: true, video: false } });
    }
  }

  function hangup() {
    if (activeCall) {
      activeCall.terminate();
    }
  }

  return {
    init,
    call,
    answer,
    hangup
  };
})();
