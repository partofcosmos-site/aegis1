import os
import subprocess

node_dir = r"C:\Program Files\nodejs"
npm_cli = os.path.join(node_dir, "node_modules", "npm", "bin", "npm-cli.js")
aegis_dir = r"C:\Users\white\master-hub\aegis1"
node_bin = os.path.join(aegis_dir, "node_modules", ".bin")

env = os.environ.copy()
env["PATH"] = f"{node_dir};{node_bin};" + env.get("PATH", "")

print("=== 1. Node and NPM Versions ===")
res_node = subprocess.run([os.path.join(node_dir, "node.exe"), "--version"], env=env, capture_output=True, text=True)
print("Node:", res_node.stdout.strip())
res_npm = subprocess.run([os.path.join(node_dir, "node.exe"), npm_cli, "--version"], env=env, capture_output=True, text=True)
print("NPM:", res_npm.stdout.strip())

print("\n=== 2. TypeScript Compilation Check (tsc --noEmit) ===")
tsc_cmd = os.path.join(node_bin, "tsc.cmd")
res_tsc = subprocess.run(f'"{tsc_cmd}" --noEmit', cwd=aegis_dir, env=env, shell=True, capture_output=True, text=True)
print("TSC returncode:", res_tsc.returncode)
print("TSC stdout:\n", res_tsc.stdout)
print("TSC stderr:\n", res_tsc.stderr)

print("\n=== 3. Vite Build Check (npm run build) ===")
res_build = subprocess.run([os.path.join(node_dir, "node.exe"), npm_cli, "run", "build"], cwd=aegis_dir, env=env, capture_output=True, text=True)
print("Build returncode:", res_build.returncode)
print("Build stdout:\n", res_build.stdout)
print("Build stderr:\n", res_build.stderr)

print("\n=== 4. Test Suite Execution (verify_features.js) ===")
test_script = os.path.join(aegis_dir, "scripts", "verify_features.js")
res_test = subprocess.run([os.path.join(node_dir, "node.exe"), test_script], cwd=aegis_dir, env=env, capture_output=True, text=True)
print("Test returncode:", res_test.returncode)
print("Test stdout:\n", res_test.stdout)
print("Test stderr:\n", res_test.stderr)
