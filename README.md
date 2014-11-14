# SSH Spawner

Creates a `spawn(bin, argv, opts)` function for a given configuration.
Generally to be used with `npm i process-queue`.

## usage

It should generate a spawn function just like node would have with the minor exception of the SSH env setup being preserved. So things like HOME and PATH for the remote end can be used in your scripts.

```javascript
var spawner = require('ssh-spawner').createSpwaner({
  user: 'root',
  server: 'myserver.local',
  allowPasswords: false, // defaults to false
  port: 22, // defaults to 22
  envMode: 'cmd' // one of 'inline' 'cmd' or 'default'
});
spawner('env', null, {
  env: {
    FOO: 123 
  },
  stdio: 'pipe'
})
```
