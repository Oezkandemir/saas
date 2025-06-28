#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const { createApp } = require('../lib/index.js');

// CLI Header
console.log(chalk.cyan.bold(`
 ██████╗███████╗███╗   ██╗███████╗████████╗██╗   ██╗
██╔════╝██╔════╝████╗  ██║██╔════╝╚══██╔══╝╚██╗ ██╔╝
██║     █████╗  ██╔██╗ ██║█████╗     ██║    ╚████╔╝ 
██║     ██╔══╝  ██║╚██╗██║██╔══╝     ██║     ╚██╔╝  
╚██████╗███████╗██║ ╚████║███████╗   ██║      ██║   
 ╚═════╝╚══════╝╚═╝  ╚═══╝╚══════╝   ╚═╝      ╚═╝   
 NEXT.JS - SUPABASE - EXPO - SHADCN/UI - RESEND - AUTHJS
`));

console.log(chalk.gray('Create a new Cenety SaaS app with Next.js, Expo, and more\n'));

program
  .name('create-cenety-app')
  .description('Create a new Cenety SaaS application')
  .version('1.0.0')
  .argument('[project-name]', 'Name of the project')
  .option('-t, --template <template>', 'Template to use (full, web, mobile)', 'full')
  .option('-p, --package-manager <pm>', 'Package manager to use (npm, pnpm, yarn)', 'pnpm')
  .option('--skip-install', 'Skip installing dependencies')
  .option('--skip-git', 'Skip git initialization')
  .action(async (projectName, options) => {
    try {
      await createApp(projectName, options);
    } catch (error) {
      console.error(chalk.red('❌ Error creating app:'), error.message);
      process.exit(1);
    }
  });

program.parse(); 