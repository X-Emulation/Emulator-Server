@echo off
echo Pushing to EmulatorX repository...

:: Initialize git if not already done
if not exist .git (
    git init
    git remote add origin https://github.com/X-Emulation/Emulator-Server.git
)

:: Create and switch to dev branch if it doesn't exist
git checkout dev 2>nul || git checkout -b archive

:: Add all files
git add .

:: Prompt for commit message
set /p commit_msg="Enter commit message: "

:: Commit with message
git commit -m "%commit_msg%"

:: Push to dev branch
git push -u origin archive

echo Push completed!
pause 