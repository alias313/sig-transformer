import { execFile } from "node:child_process";

const a_argpos = 2;
const b_argpos = 3;
const sig_argpos = 4;
const amp_argpos = 5;
const freq_argpos = 6;
const phase_argpos = 7;
const interval_argpos = 8;

console.log(parseFloat(process.argv[a_argpos]));
console.log(parseFloat(process.argv[b_argpos]));
console.log(parseFloat(process.argv[amp_argpos]));
console.log(parseFloat(process.argv[freq_argpos]));
console.log(parseFloat(process.argv[phase_argpos]));
console.log(parseFloat(process.argv[interval_argpos]));

if (
  parseFloat(process.argv[b_argpos]) - parseFloat(process.argv[a_argpos]) <=
  0
) {
  console.log(
    "The first argument has to be larger than the second to define a valid interval"
  );
  process.exit(1);
}

const child = execFile(
  "./signal_computer_exec",
  [
    process.argv[a_argpos],
    process.argv[b_argpos],
    process.argv[sig_argpos],
    process.argv[amp_argpos],
    process.argv[freq_argpos],
    process.argv[phase_argpos],
    process.argv[interval_argpos],
  ],
  (error, stdout, stderr) => {
    if (error) {
      throw error;
    }
  }
);
