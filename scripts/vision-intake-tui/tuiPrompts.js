const readline = require('readline/promises');
const fs = require('fs');
const { stdin: input, stdout: output } = require('process');

function createPromptSession() {
  if (!input.isTTY) {
    const answers = fs.readFileSync(0, 'utf8').split(/\r?\n/);
    return {
      async question(message) {
        output.write(message);
        return answers.shift() || '';
      },
      close() {},
    };
  }
  return readline.createInterface({ input, output });
}

async function askText(rl, message, { defaultValue = '', optional = false } = {}) {
  while (true) {
    const suffix = defaultValue ? ` (${defaultValue})` : '';
    const answer = String(await rl.question(`${message}${suffix}: `)).trim();
    const value = answer || defaultValue;
    if (value || optional) return value;
    console.log('Required.');
  }
}

async function askEnter(rl, message = 'Press ENTER to continue.') {
  await rl.question(`${message}\n`);
}

async function askSelect(rl, message, choices = []) {
  if (!choices.length) throw new Error(`No choices available for ${message}`);
  while (true) {
    console.log('');
    console.log(message);
    choices.forEach((choice, index) => {
      console.log(`  ${index + 1}. ${choice.label}`);
    });
    const answer = String(await rl.question('Choose: ')).trim();
    const selectedIndex = Number.parseInt(answer, 10) - 1;
    if (Number.isInteger(selectedIndex) && choices[selectedIndex]) {
      return choices[selectedIndex].value;
    }
    console.log('Choose a listed number.');
  }
}

async function askConfirm(rl, message, { defaultValue = true } = {}) {
  const hint = defaultValue ? 'Y/n' : 'y/N';
  const answer = String(await rl.question(`${message} (${hint}): `)).trim().toLowerCase();
  if (!answer) return defaultValue;
  return ['y', 'yes'].includes(answer);
}

module.exports = {
  askConfirm,
  askEnter,
  askSelect,
  askText,
  createPromptSession,
};
