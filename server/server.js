/* eslint-disable strict */
require('dotenv').config();

const _ = require('lodash');
const loopback = require('loopback');
const boot = require('loopback-boot');
const expressState = require('express-state');
// const pasaporte = require('./componentes-vr');
const createDebugger = require('debug');

const log = createDebugger('sales:server');
log.enabled = true;

const app = loopback();
const isBeta = !!process.env.BETA;
// process.env.PORT = 5000;
console.log(process.env.PORT);
expressState.extend(app);
app.set('state namespace', '__sales__');
app.set('port', process.env.PORT || 5000);
app.use(loopback.token({
  model: app.models.accessToken,
}));
app.disable('x-powered-by');

boot(app, {
  appRootDir: __dirname,
  dev: process.env.NODE_ENV,
});

console.log(app.datasources.on);
const {mongoassy} = app.datasources;
mongoassy.on('connected', _.once(() => log('> BASE DE DATOS Conectada')));
app.start = _.once(function() {
  const server = app.listen(app.get('port'), function() {
    app.emit('started');
    log(
      '> El servidor de API_APP_SALES_IDF está escuchando en el puerto %d modo %s',
      app.get('port'),
      app.get('env')
    );
    if (isBeta) {
      log('> API_APP_SALES_IDF esta en modo BETA');
    }
    log(`> Conectando con la BDD ${mongoassy.settings.url}`);
  });

  process.on('SIGINT', () => {
    log('> Apagando el servidor');
    server.close(() => {
      log('> El servidor ah sido cerrado');
    });
    log('> Cerrando la conexión con la Base de Datos');
    mongoassy.disconnect()
      .then(() => {
        log('> La conexión con la BDD ah sido cerrada');
        // exit process
        // this may close kept alive sockets
        // eslint-disable-next-line no-process-exit
        process.exit(0);
      });
  });
});

module.exports = app;

// start the server if `$ node server.js`
// in production use `$npm start-production`
// or `$node server/production` to start the server
// and wait for DB handshake
if (require.main === module) {
  app.start();
}
