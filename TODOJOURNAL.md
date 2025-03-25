# Setting up a consistent system path to dynamically point to the shared OneDrive directory, ensuring the app functions across all employee machines by leveraging the common synced folder structure.

### add a check at the start of your app’s launch script. If the symlink doesn’t exist, create it. Quick, silent, one-time setup per machine.

In Python:

```
import os
import subprocess

link_path = r"C:\HohimerShared"
target_path = os.path.expandvars(r"%USERPROFILE%\Hohimer Wealth Management\Hohimer Company Portal - Company\Hohimer Team Shared 4-15-19")

if not os.path.exists(link_path):
    try:
        subprocess.run(['cmd', '/c', 'mklink', '/D', link_path, target_path], check=True)
    except subprocess.CalledProcessError:
        print("Symlink creation failed. Make sure the app is run as admin.")
        ```

Or in a .bat launcher:

```
@echo off
if not exist "C:\HohimerShared" (
    mklink /D "C:\HohimerShared" "%USERPROFILE%\Hohimer Wealth Management\Hohimer Company Portal - Company\Hohimer Team Shared 4-15-19"
)
start your_app.exe
```

You can wrap this into your installer or launch entry point. No setup headaches, and it gives you a clean, stable path across every system. Let me know what language/platform the app’s in and I’ll wire it in tight.

---

