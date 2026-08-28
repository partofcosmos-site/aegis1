import os
import subprocess

node_dir = r"C:\Program Files\nodejs"
env = os.environ.copy()
env["PATH"] = node_dir + os.pathsep + os.path.join(r"C:\Users\white\master-hub\aegis1\node_modules\.bin") + os.pathsep + env.get("PATH", "")

aegis_dir = r"C:\Users\white\master-hub\aegis1"
vite_cmd = os.path.join(aegis_dir, "node_modules", ".bin", "vite.cmd")

print("Building aegis1 with vite.cmd...")
res = subprocess.run(f'"{vite_cmd}" build', cwd=aegis_dir, env=env, shell=True, capture_output=True, text=True)
print("Build exit code:", res.returncode)
print("Build stdout:\n", res.stdout)
if res.stderr:
    print("Build stderr:\n", res.stderr)
