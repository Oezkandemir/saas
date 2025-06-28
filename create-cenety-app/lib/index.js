const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const { execa } = require('execa');
const inquirer = require('inquirer');
const validateNpmName = require('validate-npm-package-name');

async function createApp(projectName, options) {
  // Get project name through prompt if not provided
  if (!projectName) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'What is your project name?',
        default: 'my-cenety-app',
        validate: (input) => {
          const validation = validateNpmName(input);
          if (!validation.validForNewPackages) {
            return 'Invalid project name. Please use a valid npm package name.';
          }
          return true;
        }
      }
    ]);
    projectName = answers.projectName;
  }

  // Additional prompts if not provided via options
  const questions = [];
  
  if (!options.template) {
    questions.push({
      type: 'list',
      name: 'template',
      message: 'Which template would you like to use?',
      choices: [
        { name: '🚀 Full Stack (Web + Mobile + Landing)', value: 'full' },
        { name: '💻 Web Only (Next.js + Landing)', value: 'web' },
        { name: '📱 Mobile Only (Expo)', value: 'mobile' }
      ],
      default: 'full'
    });
  }

  if (!options.packageManager) {
    questions.push({
      type: 'list',
      name: 'packageManager',
      message: 'Which package manager would you like to use?',
      choices: ['pnpm', 'npm', 'yarn'],
      default: 'pnpm'
    });
  }

  questions.push({
    type: 'confirm',
    name: 'installDeps',
    message: 'Install dependencies?',
    default: !options.skipInstall
  });

  questions.push({
    type: 'confirm',
    name: 'initGit',
    message: 'Initialize git repository?',
    default: !options.skipGit
  });

  let answers = {};
  if (questions.length > 0) {
    answers = await inquirer.prompt(questions);
  }

  // Merge options with answers
  const config = {
    projectName,
    template: options.template || answers.template || 'full',
    packageManager: options.packageManager || answers.packageManager || 'pnpm',
    installDeps: answers.installDeps !== undefined ? answers.installDeps : !options.skipInstall,
    initGit: answers.initGit !== undefined ? answers.initGit : !options.skipGit
  };

  const projectPath = path.resolve(process.cwd(), config.projectName);

  // Check if directory already exists
  if (fs.existsSync(projectPath)) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: `Directory ${config.projectName} already exists. Overwrite?`,
        default: false
      }
    ]);

    if (!overwrite) {
      console.log(chalk.yellow('❌ Operation cancelled'));
      return;
    }

    await fs.remove(projectPath);
  }

  console.log(chalk.green(`\n✨ Creating ${config.projectName}...\n`));

  // Copy template
  const spinner = ora('Copying template files...').start();
  try {
    await copyTemplate(config.template, projectPath);
    spinner.succeed('Template files copied');
  } catch (error) {
    spinner.fail('Failed to copy template files');
    throw error;
  }

  // Update package.json with project name
  await updatePackageJson(projectPath, config.projectName);

  // Initialize git
  if (config.initGit) {
    const gitSpinner = ora('Initializing git repository...').start();
    try {
      await execa('git', ['init'], { cwd: projectPath });
      await execa('git', ['add', '.'], { cwd: projectPath });
      await execa('git', ['commit', '-m', 'Initial commit'], { cwd: projectPath });
      gitSpinner.succeed('Git repository initialized');
    } catch (error) {
      gitSpinner.warn('Git initialization failed (continuing...)');
    }
  }

  // Install dependencies
  if (config.installDeps) {
    const installSpinner = ora(`Installing dependencies with ${config.packageManager}...`).start();
    try {
      await execa(config.packageManager, ['install'], { cwd: projectPath });
      installSpinner.succeed('Dependencies installed');
    } catch (error) {
      installSpinner.fail('Failed to install dependencies');
      console.log(chalk.yellow('You can install them manually later by running:'));
      console.log(chalk.cyan(`cd ${config.projectName} && ${config.packageManager} install`));
    }
  }

  // Success message
  console.log(chalk.green.bold('\n🎉 Success! Your Cenety app has been created.'));
  console.log(chalk.gray('\nNext steps:'));
  console.log(chalk.cyan(`  cd ${config.projectName}`));
  
  if (!config.installDeps) {
    console.log(chalk.cyan(`  ${config.packageManager} install`));
  }
  
  console.log(chalk.cyan(`  ${config.packageManager} dev`));
  
  console.log(chalk.gray('\n📚 Don\'t forget to:'));
  console.log(chalk.yellow('  • Set up your .env.local files'));
  console.log(chalk.yellow('  • Configure Supabase'));
  console.log(chalk.yellow('  • Configure Stripe (if needed)'));
  
  console.log(chalk.gray('\n🚀 Happy coding!'));
}

async function copyTemplate(template, targetPath) {
  const templatePath = path.join(__dirname, '..', 'templates');
  
  // For now, we copy the full template and then remove parts based on template choice
  await fs.copy(templatePath, targetPath, {
    filter: (src) => {
      // Skip node_modules, .git, .next, .expo, etc.
      const relativePath = path.relative(templatePath, src);
      const skipPatterns = [
        'node_modules',
        '.git',
        '.next',
        '.expo',
        'dist',
        '.turbo',
        '.env.local',
        '.DS_Store',
        'pnpm-lock.yaml',
        'package-lock.json',
        'yarn.lock'
      ];
      
      return !skipPatterns.some(pattern => relativePath.includes(pattern));
    }
  });

  // Remove apps based on template choice
  if (template === 'web') {
    await fs.remove(path.join(targetPath, 'apps', 'mobile'));
  } else if (template === 'mobile') {
    await fs.remove(path.join(targetPath, 'apps', 'web'));
    await fs.remove(path.join(targetPath, 'apps', 'landing'));
  }
}

async function updatePackageJson(projectPath, projectName) {
  const packageJsonPath = path.join(projectPath, 'package.json');
  const packageJson = await fs.readJson(packageJsonPath);
  
  packageJson.name = projectName;
  packageJson.version = '0.1.0';
  
  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
}

module.exports = { createApp }; 