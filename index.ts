/* // eslint-disable-next-line @typescript-eslint/no-unused-vars
import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs';
import YAML from 'yaml';
import { spawn } from 'child_process';
import readline from 'readline';

const promptMainMenu = () => {
  const file = fs.readFileSync('./workspaces.yml', 'utf8');
  const yml = YAML.parse(file);

  const workspacesArray = Object.keys(yml.workspaces);
  const [firstworkspaceName, ...otherWorkspaceNames] = workspacesArray;

  // Si no hay worspaces
  if (firstworkspaceName === undefined) throw 'No hay workspace';

  for (let otherWorkspaceName of otherWorkspaceNames) {
    const workspace = yml.workspaces[otherWorkspaceName];

  }
  // revisar que los workspaces tienen los mismos scripts
  // const sameScripts

  console.log(yml.workspaces.backend.scripts);
  const options = ['View All Loans', 'Update Loan', 'Add a new loan', 'Exit'];
  inquirer
    .prompt([
      {
        type: 'list',
        name: 'choice',
        message: 'What would you like to do?',
        choices: options
      }
    ])

    .then((choices) => {
      const index = options.indexOf(choices.choice);
      if (index === -1) return console.log('Option not available');

      console.log(`Option chosen is ${index}`);
    });
};
promptMainMenu();

// { YAML:
//   [ 'A human-readable data serialization language',
//     'https://en.wikipedia.org/wiki/YAML' ],
//   yaml:
//   [ 'A complete JavaScript implementation',
//     'https://www.npmjs.com/package/yaml' ] }

type Workspace = {
  path: string;
  scripts: {
    [key: string]: string;
  }[];
};
 */

import { spawn } from 'child_process';
import readline from 'readline';

// Configurar readline para escuchar entradas del teclado
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

// Ejecutar el comando en la terminal
const command = 'node borrar.js'; // Reemplaza 'your_command_here' con el comando que deseas ejecutar
const commandProcess = spawn(command, [], { shell: true });

// Variable para controlar si se muestran los mensajes
let showOutput = true;

// Manejar las entradas del teclado
process.stdin.on('keypress', (str, key) => {
  if (key.name === 'up') {
    showOutput = true;
  } else if (key.name === 'down') {
    showOutput = false;
  } else if (key.ctrl && key.name === 'c') {
    process.exit();
  }
});

// Manejar la salida del comando
commandProcess.stdout.on('data', (data) => {
  if (showOutput) {
    process.stdout.write(data);
  }
});

// Manejar la salida de errores del comando
commandProcess.stderr.on('data', (data) => {
  if (showOutput) {
    process.stderr.write(data);
  }
});

// Manejar la finalización del comando
commandProcess.on('close', (code) => {
  console.log(`El comando terminó con el código ${code}`);
  process.exit();
});
