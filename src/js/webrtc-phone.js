// SIP.debug.enable("JsSIP:*");

var webrtcPhone = (function() {
  var server, wssAddress, name, exten, impi, impu, phone, activeCall, callStart;
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
    impu = exten + "@" + server;
    wssAddress = "wss://" + server + ":8089/ws";

    // var socket = new SIP.WebSocketInterface(wssAddress);
    var configuration = {
      transportOptions: {
        wsServers: [wssAddress],
        traceSip: true
      },
      uri: impu,
      password: password,
      authorizationUser: impi,
      log: {
        builtinEnabled: true, // LOGS
        level: "log"
      },
      noAnswerTimeout: 60,
      userAgentString: "NewVats Phone",
      register: true,
      allowLegacyNotifications: true,
      sessionDescriptionHandlerFactoryOptions: {
        // peerConnectionOptions: {
        //   rtcConfiguration: {
        //     iceServers
        //   }
        // },
        constraints: {
          audio: true,
          video: false
        }
      }
    };

    phone = new SIP.UA(configuration);

    phone.on("registered", function() {
      console.log("registered");
    });

    phone.on("unregistered", function() {
      console.log("unregistered");
    });

    phone.on("transportCreated", function(transport) {
      console.log("transportCreated", transport);
    });

    phone.on("invite", function(session) {
      console.debug("New session created", session);
      session.accept();

      if (activeCall === undefined && session !== undefined) {
        // new incoming call
        activeCall = session;
        ringing.play();

        activeCall.on("progress", function(e) {
          console.log("progress");
        });

        activeCall.on("confirmed", function(e) {
          console.log("call confirmed");
          callStart = new Date().getTime();
          ringing.pause();
        });

        activeCall.on("accepted", function(data) {
          console.log("accepted", data);
          ringing.pause();
        });
      } else {
        session.terminate({ status_code: 486 });
        activeCall = undefined;
        ringing.pause();
        calling.pause();
      }
    });

    phone.on("sipEvent", function(e) {
      console.log("sipEvent", e);
    });

    phone.start();
  }

  function call(to) {
    var options = {
      sessionDescriptionHandlerOptions: {
        constraints: {
          audio: true,
          video: false
        }
      }
    };

    if (phone.isRegistered()) {
      activeCall = phone.invite("sip:" + to + "@" + server, options);

      activeCall.on("progress", function(response) {
        if (response.statusCode === 180) calling.play();
      });

      activeCall.on("accepted", function(data) {
        calling.pause();
      });

      activeCall.on("terminated", function(message, cause) {
        activeCall = undefined;
        calling.pause();
      });
    }
  }

  function answer() {
    if (activeCall) {
      activeCall.answer({
        sessionDescriptionHandlerOptions: {
          constraints: {
            audio: true,
            video: false
          }
        }
      });
      ringing.pause();
    }
  }

  function hangup() {
    if (activeCall) {
      activeCall.terminate();
      calling.pause();
    }
  }

  return {
    init,
    call,
    answer,
    hangup
  };
})();
