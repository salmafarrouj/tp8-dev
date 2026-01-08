const fs = require('fs');
const path = require('path');

function parseEnv(file) {
  if (!fs.existsSync(file)) return {};
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  const out = {};
  for (const l of lines) {
    const m = l.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) {
      let val = m[2].trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      out[m[1]] = val;
    }
  }
  return out;
}

function checkDeps(pkg) {
  const deps = pkg.dependencies || {};
  const wants = ['expo', 'firebase', 'expo-notifications', 'expo-sqlite'];
  const missing = wants.filter(w => !deps[w]);
  return { present: wants.filter(w => !!deps[w]), missing };
}

(async () => {
  const root = path.resolve(__dirname, '..');
  const envFile = path.join(root, '.env');
  console.log('Workspace:', root);

  const env = parseEnv(envFile);
  console.log('\n.env variables:');
  const keys = [
    'EXPO_PUBLIC_FIREBASE_API_KEY',
    'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    'EXPO_PUBLIC_FIREBASE_APP_ID',
    'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID'
  ];
  for (const k of keys) {
    console.log(` - ${k}:`, env[k] ? 'OK' : 'MISSING');
  }

  // check .gitignore
  const gi = path.join(root, '.gitignore');
  const giHasEnv = fs.existsSync(gi) && fs.readFileSync(gi, 'utf8').includes('.env');
  console.log('\n.gitignore contains .env:', giHasEnv ? 'YES' : 'NO');

  // check package.json deps
  const pkgFile = path.join(root, 'package.json');
  if (!fs.existsSync(pkgFile)) {
    console.log('\npackage.json not found');
    process.exit(1);
  }
  const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
  const depCheck = checkDeps(pkg);
  console.log('\nDependencies present:', depCheck.present.join(', ') || '(none)');
  console.log('Dependencies missing (recommended):', depCheck.missing.join(', ') || '(none)');

  // check critical files
  const files = [
    'services/firebase.js',
    'services/firestore.js',
    'screens/TodoListOfflineScreen.js',
  ];
  console.log('\nCritical files:');
  for (const f of files) {
    const p = path.join(root, f);
    console.log(` - ${f}:`, fs.existsSync(p) ? 'OK' : 'MISSING');
  }

  console.log('\nQuick sanity checks completed.');
  console.log('If any items are MISSING, fix them before running the app.');
  process.exit(0);
})();
