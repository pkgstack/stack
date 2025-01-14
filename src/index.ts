#!/usr/bin/env node

import { simpleGit } from 'simple-git';
import { program } from "./shared";
import chalk from "chalk";
import inquirer from "inquirer";
import { randomVerbAndNoun } from "./utils/randomVerbAndNoun";
import * as fs from "fs";
import * as path from "path";
import { templates } from './templates';
import ora from 'ora';
import os from "node:os";
import { readableStreamToText, spawn, type Subprocess } from 'bun';
import "./lib/cascade/index";
import "./lib/build/index";
import "./lib/test/index";

const pwd = process.cwd();

program
	.name("stack")
	.description("CLI for the META Compiler writing library")
	.version("0.1.0")

if (os.platform() === "win32") {
	// Add a warning to the help text if the user is running Windows
	program.addHelpText("beforeAll", `${chalk.bgYellow("Warning")} Please note you are running in Windows Compatibility mode. Not all functionality has been fully tested and you may encounter errors. If you do, please report them to us by creating a new Issue on GitHub.\n`)
}

const primaryColor = chalk.bgHex("#dc8850").bold;
const accentColor = chalk.bgHex("#ef9995").bold.black;

// Add equal amounts of padding to the left and right of a string so that it reaches the specified length
const padHorizontal = (str: string, length: number): string => {
	const paddingLength = Math.round((length - str.length) / 2);
	const padding = " ".repeat(paddingLength);

	return `${padding}${str}${padding}`;
}

const emptyLine = () => console.log();

const defaultPrefix = primaryColor(padHorizontal("stack", 6));

const log = (message: string) => console.log(`${defaultPrefix} ${message}`);

const PADDING_LENGTH = 6;

program
	.command("init")
	.description("Creates a new META project and initializes all needed files")
	.option(
		"--template <STRING>",
		"The template to use for your project",
		"default"
	)
	.action(async (options) => {
		console.log(
			`${chalk.bgGreen(
				"stack"
			)} Initializing project with template ${chalk.bgBlue(
				options.template
			)}`
		);
		console.log();

		const response = await inquirer.prompt([
			{
				message: "Where should we create your new project?",
				prefix: `${accentColor(padHorizontal("dir", PADDING_LENGTH))}`,
				default: `./${randomVerbAndNoun()}`,
				type: "input",
				name: "dir",
			},
			// Optional overwrite
			{
				message:
					"The directory you specified already exists. Would you like to overwrite it?",
				prefix: `${accentColor(padHorizontal("force", PADDING_LENGTH))}`,
				type: "confirm",
				name: "overwrite",
				when: (answers) => {
					// Check if the directory exists
					if (fs.existsSync(path.join(pwd, answers.dir))) {
						return true;
					}

					return false;
				},
				validate: (answer) => {
					if (answer === false) {
						console.log(`${chalk.bgRed("stack")} Aborting...`);
					}
				},
			},
			{
				message:
					"How would you like to get started with your new project?",
				prefix: `${accentColor(padHorizontal("tmp", PADDING_LENGTH))}`,
				type: "list",
				name: "template",
				choices: [{
					name: `Include sample files ${chalk.dim("(recommended)")}`,
					value: "default"
				}, {
					name: "Start with a blank project",
					value: "empty"
				}],
				when: (answers) => {
					if (options.template === "default") {
						return true;
					}

					return false;
				}
			},
			{
				message: `Install dependencies? ${chalk.dim("(recommended)")}`,
				prefix: `${accentColor(padHorizontal("dep", PADDING_LENGTH))}`,
				type: "confirm",
				name: "deps",
				default: true,
			},
			{
				message: "Initialize a new git repository?",
				prefix: `${accentColor(padHorizontal("git", PADDING_LENGTH))}`,
				type: "confirm",
				default: true,
				name: "git",
			},
		]);

		const dir = path.join(pwd, response.dir);

		if (fs.existsSync(dir) && response.overwrite === true) {
			fs.rmSync(dir, { recursive: true, force: true });

			log(
				`Removed existing directory ${chalk.bgBlue(dir)}`
			);
		}

		fs.mkdirSync(dir);

		emptyLine()

		log(
				`Created directory ${chalk.bgBlue(
					response.dir
				)}`
			);

		emptyLine()

		// Create a new git repository if the user wants to
		if (response.git === true) {
			const git = simpleGit(dir);

			git.init();

			emptyLine()

			log(
				`Initialized git repository`
			);

			emptyLine()
		}

		// Copy the template files
		if (options.template) {
			const template = templates[options.template];

			const spinner = ora("Copying template files").start();

			await template(dir, response, spinner);
		}
	});

program
	.command("run <FILE>")
	.description("Takes in a METALS or x86 assembler and compiles the specified file into a compiler executable")
	.option(
		"-i, --x86",
		"Whether or not the assembler is written in x86 instead of METALS. The program will try to figure it out automatically if not specified.",
		false
	)
	.option(
		"-o, --output <FILE>",
		"The file to output the compiler executable to",
		""
	)
	.option(
		"--force",
		"Overwrite the output file if it already exists",
		false
	)
	.option(
		"-l, --lib <FILE>",
		"The file to link the compiler executable against",
		""
	)
	.option(
		"-d, --debug",
		"Run the compiler in debug mode",
		false
	)
	.option(
		"-c, --clean",
		"Clean up temporary files after compilation",
		false
	)
	.option(
		"--compiler <STRING>",
		"The compiler to use for compilation, you can use 'nasm', 'gcc' or 'builtin' as values. More granular control can be achieved by providing a custom command using the --command option or specifying the 'build' options in your local meta-config.json.",
		"builtin"
	)
	.option(
		"--command <STRING>",
		"A custom command to use for compilation, this will override the --compiler option",
		""
	)
	.option(
		"--gyro",
		"Will try to use Gyro as a runtime to compile the file, please note that this is experimental and may not work as expected.",
		false
	)
	.option(
		"--vm",
		"Will spin up a local VM to run the compiler in, this is especially useful for testing, a web interface will be launched on http://localhost to visualize register and memory allocation. Please note that this will automatically enable the --debug flag.",
	)
	.action(async (file: string, options) => {
		// Check if the file exists
		if (!fs.existsSync(file))
			throw new Error(`File ${file} does not exist`);

		if (options.output && !path.isAbsolute(options.output)) {
			options.output = path.join(pwd, options.output);

			// Check if the output file already exists
			if (fs.existsSync(options.output) && !options.force) {
				throw new Error(`Warning: Output file ${options.output} already exists. Use --force to overwrite it.`);
			}
		}

		let filePathCompiler = path.join(pwd, options.compiler);

		if (options.compiler === "builtin" || options.compiler === "") {
			filePathCompiler = path.join(import.meta.dir, "../bin/meta.bin");
		}

		// Check if the compiler is valid
		if (!fs.existsSync(filePathCompiler)) {
			throw new Error(`Compiler ${options.compiler} does not exist`);
		}

		// Compile the file
		const subprocess = spawn({ cmd: [filePathCompiler, file], stdout: "pipe" })
		const output = await readableStreamToText(subprocess.stdout);

		if (options.output) {
			fs.writeFileSync(options.output, output);
		} else {
			console.log(output);
		}
	})




program.parse();
