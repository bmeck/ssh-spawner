var _spawn = require('child_process').spawn;

// THESE CAN BE COMBINED (GOD KNOWS WHY YOU WOULD WANT THAT)
var ENV_INLINE = 1; // ssh HOME=... PATH=... -- ls # PRETTY STANDARD
var ENV_CMD = 2; // ssh -- 'HOME=...; export HOME; ls') # WILL MAKE IT WORK UNCONDITIONALLY
var ENV_DEFAULT = 4; // ssh -o SendEnv=* -- ls # SYSADMIN PREF

// opts
// user: 'name'
// server: 'address'
// strictHostKeyChecking: true # only turn off for testing scenarios 
// envMode: 'inline' 'cmd' 'default' # How env should be synced
// allowPasswords: false # if password prompts should be allowed (will fail for keys as well as auth algo)
// raw: false # should we let ssh commands be logged
//    # note that these setting will not surpress if the cmd was piped directly to ssh, use a shell
// port: 22
// proxyCommand: 'some-cmd string'
exports.createSpawner = function (opts) {
  var sshcmd = 'ssh';
  // BatchMode will prevent some fun errors like bad port number from creating output for us
  // -q will quiet the other ssh specific errors
  var sshargv = [opts.user + '@' + opts.server];
  if (opts.port) {
    sshargv.push('-p', Number(opts.port));
  }
  if (opts.identityFile) {
    sshargv.push('-i', opts.identityFile);
  }
  if (opts.strictHostKeyChecking === false) {
    sshargv.push('-o', 'StrictHostKeyChecking=no');
  }
  // turn off password prompts (login and on keys)
  if (!opts.allowPasswords) {
    // not all ssh allow turning of motd and last log
    sshargv.push('-o', 'PasswordAuthentication=no', '-o', 'NumberOfPasswordPrompts=0');
  }
  if (!opts.raw) {
    sshargv.push('-q');
    if (!opts.allowPasswords) {
      sshargv.push('-o', 'BatchMode=yes');
    }
  }
  // mostly used for logging and hopping
  if (opts.proxyCommand) {
    sshargv.push('-o', 'ProxyCommand='+opts.proxyCommand);
  }
  var envMode = ENV_DEFAULT;
  if (opts.envMode == 'inline') {
    envMode = ENV_INLINE;
  }
  else if (opts.envMode == 'cmd') {
    envMode = ENV_CMD;
  }
  if (envMode === ENV_DEFAULT) {
    sshargv.push('-o', 'SendEnv=*')
  }
  opts = null;

  return function spawn(bin, argv, opts) {
    if (argv != null && !Array.isArray(argv)) {
      throw new Error('argv must be an array')
    }
    bin = String(bin);
    // spawn fails on non array args, we should too 
    var args = [];
    var send_opts = opts;
    if (envMode === ENV_INLINE) {
      send_opts = inline_env(opts, args);
    }
    else if (envMode === ENV_CMD) {
      bin = cmd_env(opts, bin);
    }
    args = sshargv.concat('--', bin);
    if (argv != null) args = args.concat(argv);
    return _spawn(sshcmd, args, send_opts); 
  }
}

function inline_env(opts, args) {
  if (opts.env) {
    for (var k in opts.env) {
      var name = k.replace(/\W/g,'\\$&');
      var value = String(opts.env[k]).replace(/\W/g,'\\$&');
      args.push(name + '=' + value);
    }
  }
  var send_opts = Object.create(opts);
  send_opts.env = {
    PATH: process.env.PATH,
    HOME: process.env.HOME,
    USER: process.env.USER
  };
  return send_opts;
}

function cmd_env(opts, bin) {
  if (opts.env) {
    for (var k in opts.env) {
      // protect against injection
      var name = k.replace(/\W/g,'\\$&');
      var value = String(opts.env[k]).replace(/\W/g,'\\$&');
      bin = 'export ' + name + '=' + value + ';';
    }
  }
  return bin;
}
