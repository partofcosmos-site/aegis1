import os
import subprocess

node_dir = r"C:\Program Files\nodejs"
env = os.environ.copy()
env["PATH"] = node_dir + os.pathsep + env.get("PATH", "")

aegis_dir = r"C:\Users\white\master-hub\aegis1"
npx_cmd = os.path.join(node_dir, "npx.cmd")

print("Building aegis1 with npx vite build...")
res = subprocess.run([npx_cmd, "vite", "build"], cwd=aegis_dir, env=env, capture_output=True, text=True)
print("Build exit code:", res.returncode)
print("Build stdout:\n", res.stdout)
if res.stderr:
    print("Build stderr:\n", res.stderr)
