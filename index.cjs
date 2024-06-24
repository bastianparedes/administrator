const blessed = require('blessed');
const { spawn } = require('child_process');

// Lista de comandos a ejecutar
const commands = ['ping google.com', 'ping bing.com'];

// Ejecutar comandos y almacenar los procesos
const processes = commands.map((command) =>
  spawn(command.split(' ')[0], command.split(' ').slice(1))
);

// Crear la pantalla de blessed
const screen = blessed.screen({
  smartCSR: true
});

screen.title = 'Parallel Command Runner';

// Crear una lista para seleccionar comandos
const commandList = blessed.list({
  parent: screen,
  width: '20%',
  height: '100%',
  keys: true,
  vi: true,
  label: 'Commands',
  border: {
    type: 'line'
  },
  style: {
    selected: {
      bg: 'blue'
    }
  }
});

// Añadir los comandos a la lista
commands.forEach((command) => commandList.addItem(command));

// Crear un box para mostrar los logs
const logBox = blessed.box({
  parent: screen,
  width: '80%',
  height: '100%',
  left: '20%',
  label: 'Logs',
  border: {
    type: 'line'
  },
  style: {
    fg: 'white',
    bg: 'black'
  },
  scrollable: true,
  alwaysScroll: true,
  scrollbar: {
    bg: 'blue'
  }
});

// Variables para controlar el proceso actual
let currentProcessIndex = 0;
let logBuffers = processes.map(() => '');

// Función para manejar la salida de los procesos
const handleProcessOutput = (data, index) => {
  logBuffers[index] += data.toString();
  if (index === currentProcessIndex) {
    logBox.setContent(logBuffers[index]);
    logBox.setScrollPerc(100);
    screen.render();
  }
};

// Adjuntar listeners de stdout y stderr a cada proceso
processes.forEach((proc, index) => {
  proc.stdout.on('data', (data) => handleProcessOutput(data, index));
  proc.stderr.on('data', (data) => handleProcessOutput(data, index));
});

// Función para actualizar los logs
const updateLogs = (index) => {
  currentProcessIndex = index;
  logBox.setContent(logBuffers[index]);
  logBox.setScrollPerc(100);
  screen.render();
};

// Seleccionar el primer comando por defecto
commandList.select(0);
updateLogs(0);

// Manejar la selección de la lista
commandList.on('select', (item, index) => {
  updateLogs(index);
});

// Manejar teclas
screen.key(['q', 'C-c'], () => process.exit(0));

// Renderizar la pantalla
screen.render();
