#!/usr/bin/env node

import fs from 'fs';
import YAML from 'yaml';
import blessed from 'blessed';
import { spawn, ChildProcess } from 'child_process';
import { program } from 'commander';

type Workspaces = {
  [key: string]:
    | undefined
    | {
        path: string;
        tasks: {
          [key: string]: undefined | string;
        }[];
      };
};

const runCommands = (
  commandsData: {
    name: string;
    command: string;
    path: string;
  }[]
) => {
  const processes: ChildProcess[] = commandsData.map((commandData) =>
    spawn(
      commandData.command.split(' ')[0],
      commandData.command.split(' ').slice(1),
      {
        cwd: commandData.path
      }
    )
  );

  const screen = blessed.screen({
    smartCSR: true
  });

  screen.title = 'Hellbell';

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

  commandsData.forEach((commandData) => commandList.addItem(commandData.name));

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
    scrollbar: {
      ch: ' ',
      track: {
        bg: 'grey'
      },
      style: {
        inverse: true
      }
    },
    alwaysScroll: true,
    scrollable: true,
    keys: true,
    vi: true,
    mouse: true,
    tags: true // Habilita el procesamiento de etiquetas de estilo
  });

  let currentProcessIndex = 0;
  const logBuffers = processes.map(() => '');

  const handleProcessOutput = (data: Buffer, index: number) => {
    logBuffers[index] += data;
    if (index === currentProcessIndex) {
      logBox.setContent(logBuffers[index]);
      logBox.setScrollPerc(100);
      screen.render();
    }
  };

  processes.forEach((proc, index) => {
    proc.stdout?.on('data', (data: Buffer) => handleProcessOutput(data, index));
    proc.stderr?.on('data', (data: Buffer) => handleProcessOutput(data, index));
  });

  const updateLogs = (index: number) => {
    currentProcessIndex = index;
    logBox.setContent(logBuffers[index]);
    logBox.setScrollPerc(100);
    screen.render();
  };

  commandList.select(0);
  updateLogs(0);

  commandList.on('select item', (_, index) => {
    updateLogs(index);
  });

  // Hacer clic en el cuadro de comandos vuelve a enfocar la lista
  commandList.on('focus', () => {
    commandList.style.border.fg = 'blue';
    logBox.style.border.fg = 'default';
    screen.render();
  });

  // Hacer clic en el cuadro de logs enfoca el cuadro de logs
  logBox.on('focus', () => {
    commandList.style.border.fg = 'default';
    logBox.style.border.fg = 'blue';
    screen.render();
  });

  // Cambiar foco con las flechas izquierda y derecha
  screen.key(['left', 'right'], (ch, key) => {
    if (key.name === 'left') {
      commandList.focus();
    } else if (key.name === 'right') {
      logBox.focus();
    }
  });

  const handleExit = async () => {
    // Detener todos los procesos hijos con SIGTERM
    processes.forEach((proc) => {
      proc.kill('SIGTERM');
    });

    // Esperar a que todos los procesos terminen
    Promise.all(
      processes.map(
        (proc) => new Promise((resolve) => proc.on('exit', resolve))
      )
    );

    process.exit(0);
  };

  // Manejar la señal de interrupción (C-c)
  process.on('SIGINT', handleExit);

  // Manejar la tecla 'q'
  screen.key(['q', 'C-c'], handleExit);

  // Establecer foco inicial en commandList
  commandList.focus();

  screen.render();
};

const getCommandsData = (taskName: string) => {
  const file = fs.readFileSync('./hellbell.yml', 'utf8');
  const yml = YAML.parse(file);
  const workspaces: Workspaces = yml.workspaces;

  const workspaceNames = Object.keys(workspaces);
  const data = workspaceNames
    .map((workspaceName) => {
      const path = workspaces[workspaceName]?.path;
      const task = workspaces[workspaceName]?.tasks.find(
        (task) => task[taskName] !== undefined
      );
      if (task === undefined) return;
      const script = task[taskName];
      return {
        name: workspaceName,
        command: script as string,
        path: path as string
      };
    })
    .filter((script) => script !== undefined) as {
    name: string;
    command: string;
    path: string;
  }[];
  return data;
};

program
  .command('run <task>')
  .description('Ejecuta una acción específica')
  .action((task) => {
    const commandsData = getCommandsData(task);
    runCommands(commandsData);
  });

program.parse(process.argv);
