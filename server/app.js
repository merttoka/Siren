import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import errorHandler from './errorHandler';
import express from 'express';
import bodyParser from 'body-parser';

const startSCD = `${__dirname}/scd_start-default.scd`;
const supercolliderjs = require('supercolliderjs');
const socketIo = require('socket.io');

var exec = require('child_process').exec;
var synchs = exec('cd ' + __dirname + ' && runhaskell sync.hs');
var jsonfile = require('jsonfile')

var dcon = socketIo.listen(3004);

class REPL {
  hush() {
    this.tidalSendExpression('hush');
  }

  doSpawn(config, reply) {
    this.repl = spawn(config.ghcipath, ['-XOverloadedStrings']);
    this.repl.stderr.on('data', (data) => {
      console.error(data.toString('utf8'));
      dcon.sockets.emit('dcon', ({dcon: data.toString('utf8')}));
    });
    this.repl.stdout.on('data', data => {
      console.error(data)
      dcon.sockets.emit('dcon', ({dcon: data.toString('utf8')}));
    });
    console.log(" ## -->   GHC Spawned");
  }

  initTidal(config) {
    this.myPatterns = { values: [] };
    const patterns = fs.readFileSync(config.tidal_boot).toString().split('\n');
    for (let i = 0; i < patterns.length; i++) {
      this.tidalSendLine(patterns[i]);
    }
    console.log(" ## -->   Tidal initialized");
  }

  initSC(config, reply) {
    const self = this;
   // console.log("INITSC", req);
    supercolliderjs.resolveOptions(config.path).then((options) => {
      options.sclang = config.sclang;
      options.scsynth = config.scsynth;
      options.sclang_conf = config.sclang_conf;

      supercolliderjs.lang.boot(options).then((sclang) => {
        self.sc = sclang;

        // -- Message Stack --
        let cycleNumber = 0;
        let subCycleNumber = 0;
        let cycleOffset = 9;
        let cycleStack = [[]];


        var dconSC = socketIo.listen(3006);

        var osc = require("osc");
        var udpPort = new osc.UDPPort({
            // This is where sclang is listening for OSC messages.
            remoteAddress: "127.0.0.1",
            remotePort: 3007,
            metadata: true
        });

        // Open the socket.
        udpPort.open();

        sclang.on('stdout', function(d) {
          // Converts 'd' into an object
          var re = /\[.+\]/g, match = re.exec(d);
          if(match !== null && match !== undefined && match[0] !== undefined) {
            var msg = _.split(_.trim(match[0], '[]'), ',')
            _.each(msg, function(m, i) {
              msg[i] = _.trim(m)
            })

            var time = 0;
            re = /(time:).+/g;
            match = re.exec(d);
            if(match !== null && match !== undefined && match[0] !== undefined) {
              time = _.toNumber(_.trim(match[0].substring(5)));
            }

            if (_.trim(msg[0]) === '/play2') {
              let cycleInfo = _.fromPairs(_.chunk(_.drop(msg), 2));
              let cycleTime = time;

              /// Message for unity
              var unityMessage = {
                address: "/siren",
                args: [
                  {
                      type: "s",
                      value: _.toString(_.concat(time,_.drop(msg)))
                  }
                ]
              };
              udpPort.send(unityMessage);

              let obj = { 'time': cycleTime,
                          'cycle': _.toInteger(cycleInfo.cycle),
                          'delta': _.toNumber(cycleInfo.delta)
                        }

              if(_.toInteger(cycleInfo.cycle) - cycleOffset > cycleNumber) {
                cycleNumber = _.toInteger(cycleInfo.cycle);
                console.log('RESET::before', cycleStack);
                cycleStack = [];
                console.log('RESET::after ', cycleStack);
              }

              if (_.toInteger(cycleInfo.cycle) > subCycleNumber) {
                subCycleNumber = _.toInteger(cycleInfo.cycle);
                cycleStack[_.toInteger(cycleInfo.cycle)-cycleNumber] = [];
                cycleStack[_.toInteger(cycleInfo.cycle)-cycleNumber][0] = {
                  's': cycleInfo.s,
                  't': [ obj ]
                };
              }
              else {
                var object = _.find(cycleStack[_.toInteger(cycleInfo.cycle)-cycleNumber],
                                    ['s', cycleInfo.s]);
                if (object !== undefined) {
                  if(object.t[object.t.length-1].time !== cycleTime)
                    object.t[object.t.length] = obj;
                }
                else {
                  cycleStack[_.toInteger(cycleInfo.cycle)-cycleNumber]
                            [cycleStack[_.toInteger(cycleInfo.cycle)-cycleNumber].length] = {
                    's': cycleInfo.s,
                    't': [ obj ]
                  };
                }
              }
              dconSC.sockets.emit('/sclog', {sclog: cycleStack,
                                             number: cycleNumber,
                                             subCycleNumber: subCycleNumber,
                                             cycleOffset: cycleOffset});

            }
          }
        });

        setTimeout(function(){
          var samples_path;
          // Windows
          if (_.indexOf(config.samples_path, '\\') !== -1) {
            samples_path = _.join(_.split(config.samples_path, /\/|\\/), "\\\\");
          }
          // UNIX
          else {
            samples_path = _.join(_.split(config.samples_path, /\/|\\/), path.sep);
          }

          const samples = fs.readFileSync(config.scd_start).toString().replace("{samples_path}", samples_path)
          sclang.interpret(samples).then((samplePromise) => {
            console.log(' ## -->   SuperCollider initialized' );
          });
        }, 4000)
      });
    });
  }

  start(config) {
    this.doSpawn(config);
    this.initTidal(config);
    this.initSC(config);
  }

  stdinWrite(pattern) {
    this.repl.stdin.write(pattern);
  }

  tidalSendLine(pattern) {
    this.stdinWrite(pattern);
    this.stdinWrite('\n');
  }

  tidalSendExpression(expression) {
    this.tidalSendLine(':{');
    this.tidalSendLine(expression);
    this.tidalSendLine(':}');
  }

  sendSC(message) {
    var self = this;
    self.sc.interpret(message).then(function(result) {
      console.log('sendSC:' , result);
      return result;
      // result is a native javascript array
      // dconSC.sockets.emit('dconSC', ({dconSC: result.toString('utf8')}));
    }, function(error) {
      console.error(error);
    });
  }
}

const TidalData = {
  TidalConsole: new REPL()
}

const Siren = () => {
  const app = express();

  var udpHosts = [];
  var dgram = require("dgram");
  var UDPserver = dgram.createSocket("udp4");

  var tick = socketIo.listen(3003);

  //Get tick from sync.hs Port:3002
  UDPserver.on("listening", function () {
    var address = UDPserver.address();
    console.log(" ## -->   UDP server listening on " + address.address + ":" + address.port);
  });

  UDPserver.on("message", function (msg, rinfo) {
    tick.sockets.emit('/tick2react', {osc:msg});
  });

  UDPserver.on("disconnect", function (msg) {
    tick.sockets.emit('/tick2react-done', {osc:msg});
  });

  UDPserver.bind(3002);

  app.use(bodyParser.json())

  app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

  const startTidal = (b_config, reply) => {
    try{
      if (TidalData.TidalConsole.repl && TidalData.TidalConsole.repl.killed === false) {
        reply.status(200).json({ isActive: !TidalData.TidalConsole.repl.killed, pattern: TidalData.TidalConsole.myPatterns });
      } else {
        if (TidalData.TidalConsole.repl && TidalData.TidalConsole.repl.killed) {
          TidalData.TidalConsole = new REPL();
        }
        TidalData.TidalConsole.start(b_config);
        TidalData.TidalConsole.myPatterns.values.push('initiate tidal');
        reply.status(200).json({ isActive: !TidalData.TidalConsole.repl.killed, pattern: TidalData.TidalConsole.myPatterns });
      }
    }catch(e) {
      reply.status(500).json({ isActive: TidalData.TidalConsole.repl.killed, pattern: TidalData.TidalConsole.myPatterns });
    }
  };

  const sendPattern = (expr, reply) => {
    _.each(expr, c => {
      TidalData.TidalConsole.tidalSendExpression(c);
      TidalData.TidalConsole.myPatterns.values.push(c);
      if (TidalData.TidalConsole.myPatterns.values.length > 10)
        TidalData.TidalConsole.myPatterns.values = _.drop( TidalData.TidalConsole.myPatterns.values , 10)
    })
    reply.status(200).json({ isActive: !TidalData.TidalConsole.repl.killed, patterns: TidalData.TidalConsole.myPatterns });
  };

  const sendPatterns = (patterns, reply) => {
    _.each(patterns, c => {
      TidalData.TidalConsole.tidalSendExpression(c[0]);
      TidalData.TidalConsole.tidalSendExpression(c[1]);
    })
    reply.status(200).json({ isActive: !TidalData.TidalConsole.repl.killed, patterns: TidalData.TidalConsole.myPatterns });
  };

  const sendScPattern = (pattern, reply) => {
    const sc_message = TidalData.TidalConsole.sendSC(pattern);
    reply.status(200).json({ pattern, sc_message });
  }

  //// Not working
  const generateConfig = (config,reply) => {
    var configfile = path.join(__dirname, '..', 'config', 'config.json');
    console.log(' - configfile: ', configfile);
    fs.writeFileSync(configfile, JSON.stringify(config), { flag: 'w' }, function(err) {
      if(err) {
          return console.error("home-made write error: ", err);
      }
      console.log(" - Config file is saved");
    });
  }

  app.use("/", express.static(path.join(__dirname, "public")));

  app.post('/tidal', (req, reply) => {
    const { b_config } = req.body;
    generateConfig(b_config,reply);

    startTidal(b_config, reply);
  });

  app.post('/boot', (req, reply) => {
    const { b_config } = req.body;
    generateConfig(b_config, reply);
  });

  app.post('/pattern', (req, reply) => {
    const { pattern } = req.body;
    console.log(' ## -->   Pattern inbound:', pattern);
    sendPattern(pattern, reply);
  });

  app.post('/patterns', (req, reply) => {
    const { patterns } = req.body;
    console.log(' ## -->   Patterns inbound:', patterns);
    sendPatterns(patterns, reply);
  });

  app.post('/scpattern', (req, reply) => {
    const {pattern} = req.body;
    _.replace(pattern, "\\", '');
    console.log(' ## -->   SC Pattern inbound:', pattern);
    sendScPattern(pattern, reply);
  })

  app.get('*', errorHandler);

  app.listen(3001, () => {
    console.log(` ## -->   Server started at http://localhost:${3001}`);
  });

}

process.on('SIGINT', () => {
  if (TidalData.TidalConsole.repl !== undefined) TidalData.TidalConsole.repl.kill();
  process.exit(1)
});

module.exports = Siren;
