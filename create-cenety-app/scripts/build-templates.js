const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

async function buildTemplates() {
  console.log(chalk.blue('📦 Building templates...'));
  
  const sourceDir = path.join(__dirname, '../../');
  const templateDir = path.join(__dirname, '../templates');
  
  // Remove existing templates
  if (fs.existsSync(templateDir)) {
    await fs.remove(templateDir);
  }
  
  // Copy entire project as template
  const items = await fs.readdir(sourceDir);
  
  for (const item of items) {
    const srcPath = path.join(sourceDir, item);
    const destPath = path.join(templateDir, item);
    
    // Skip patterns
    const skipPatterns = [
      'create-cenety-app',
      'node_modules',
      '.git',
      '.next',
      '.expo',
      'dist',
      '.turbo',
      '.DS_Store',
      'pnpm-lock.yaml',
      'package-lock.json',
      'yarn.lock',
      'TASK.md'
    ];
    
    if (skipPatterns.includes(item)) {
      continue;
    }
    
    await fs.copy(srcPath, destPath, {
      filter: (src) => {
        const relativePath = path.relative(srcPath, src);
        
                 // Skip nested patterns
         const nestedSkipPatterns = [
           'node_modules',
           '.git',
           '.next',
           '.expo',
           'dist',
           '.turbo',
           '.env.local',
           '.DS_Store',
           'ios/Pods',
           'ios/build',
           'android/build',
           'android/.gradle',
           '.contentlayer',
           'tsconfig.tsbuildinfo',
           'package-lock.json',
           'pnpm-lock.yaml',
           'yarn.lock'
         ];
        
        const shouldSkip = nestedSkipPatterns.some(pattern => {
          return relativePath.includes(pattern);
        });
        
        return !shouldSkip;
      }
    });
  }
  
  // Create .env.example files from .env.local if they exist
  const envPaths = [
    'apps/web/.env.local',
    'apps/landing/.env.local', 
    'apps/mobile/.env.local'
  ];
  
  for (const envPath of envPaths) {
    const fullEnvPath = path.join(templateDir, envPath);
    const examplePath = fullEnvPath.replace('.env.local', '.env.example');
    
    if (fs.existsSync(fullEnvPath)) {
      const envContent = await fs.readFile(fullEnvPath, 'utf8');
      
      // Replace actual values with placeholders
      const exampleContent = envContent
        .replace(/EXPO_PUBLIC_SUPABASE_URL=.*/g, 'EXPO_PUBLIC_SUPABASE_URL=your_supabase_url')
        .replace(/EXPO_PUBLIC_SUPABASE_ANON_KEY=.*/g, 'EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key')
        .replace(/NEXT_PUBLIC_SUPABASE_URL=.*/g, 'NEXT_PUBLIC_SUPABASE_URL=your_supabase_url')
        .replace(/NEXT_PUBLIC_SUPABASE_ANON_KEY=.*/g, 'NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key')
        .replace(/SUPABASE_SERVICE_ROLE_KEY=.*/g, 'SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key')
        .replace(/STRIPE_SECRET_KEY=.*/g, 'STRIPE_SECRET_KEY=your_stripe_secret_key')
        .replace(/NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=.*/g, 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key')
        .replace(/STRIPE_WEBHOOK_SECRET=.*/g, 'STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret');
      
      await fs.writeFile(examplePath, exampleContent);
      await fs.remove(fullEnvPath); // Remove the original .env.local
    }
  }
  
  console.log(chalk.green('✅ Templates built successfully'));
}

buildTemplates().catch(console.error); 