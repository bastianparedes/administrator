// eslint-disable-next-line @typescript-eslint/no-unused-vars
import chalk from 'chalk';
import inquirer from 'inquirer';

const promptMainMenu = () => {
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
