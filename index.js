#!/usr/bin/env node
import { input, select } from "@inquirer/prompts";
import figlet from "figlet";
import boxen from "boxen";
import chalk from "chalk";
import gradient from "gradient-string";
import { createSpinner } from "nanospinner";
import { Command } from "commander";

import path from "path";
import sharp from "sharp";
import fs from "fs";

async function title() {
  // Use AbortController for knowing when figlet finishes
  const abortController = new AbortController();
  const abortPromise = new Promise((res, rej) =>
    abortController.signal.addEventListener("abort", res)
  );
  figlet("PICVERT", (err, data) => {
    if (err) {
      console.error(err);
      return;
    }

    console.log(
      gradient.pastel.multiline(
        boxen(data, { borderStyle: "double", padding: 0.5 })
      )
    );
    abortController.abort();
  });
  await abortPromise;
}

async function getOutputDir(inputDir) {
  return await input({
    message: "Output directory",
    default: inputDir + "\\converted",
  });
}

async function getFormat() {
  return await select({
    message: "Select a format",
    choices: [
      {
        name: "webp (RECOMMENDED)",
        value: "webp",
        description: "Preserves transparency",
      },
      { name: "jpeg", value: "jpeg" },
      { name: "aviff", value: "aviff" },
      { name: "jxl", value: "jxl" },
      { name: "png", value: "png" },
    ],
  });
}

async function convert(inputDir, options) {
  const spinner = createSpinner("Converting images...").start();

  if (!fs.existsSync(options.output)) {
    fs.mkdirSync(options.output, { recursive: true });
  }

  fs.readdir(inputDir, { withFileTypes: true }, async (err, files) => {
    const promises = files
      .filter((item) => !item.isDirectory())
      .map((item) => item.name)
      .map((file) => {
        return sharp(`${inputDir}\\${file}`).toFile(
          `${options.output}\\${file.substr(0, file.lastIndexOf("."))}.${
            options.format
          }`
        );
      });

    await Promise.allSettled(promises);
    spinner.success();
  });
}

const program = new Command();
program
  .name("picvert")
  .description("CLI for compressing and converting images")
  .version("1.0.0")
  .argument("<string>", "Input directory")
  .option("-o, --output <string>", "Output directory")
  .option("-f, --format <string>", "Format to convert to")
  .action(async (inputDir, options) => {
    inputDir = path.resolve(inputDir);
    if (!fs.existsSync(inputDir)) {
      console.log(chalk.red(`Input directory doesn't exist`));
      return;
    }

    await title();

    if (!options.output) options.output = await getOutputDir(inputDir);

    if (!options.format) options.format = await getFormat();

    await convert(inputDir, options);
  });
program.parse();
