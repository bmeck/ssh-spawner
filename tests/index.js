var test = require('tape');
var spawner = require('../').createSpawner({
  user: process.env.HOST_USER, 
  server: process.env.HOST,
  port: process.env.PORT,
  identityFile: process.env.IDENTITY
});

test(function (t) {
  t.plan(3);
  var stream = require('concat-stream')(function (data) {
    t.equal(String(data).replace(/\r?\n$/, ''), process.env.EXPECTED, 'should have the same output as manually running ssh');
  })
  var child = spawner('id', null, {
    stdio: 'pipe'
  });
  child.on('exit', function (code, signal) {
    t.equal(code, 0, 'should exit cleanly');
    t.equal(signal, null, 'should not be killed by a signal');
  })
  child.stdout.pipe(stream);
});
