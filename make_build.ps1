Write-Debug "Make Build for Bulbizarre"

if (Test-Path "../bulbizarre-build") {
    Remove-Item "../bulbizarre-build" -Recurse -Force
}
New-Item "../bulbizarre-build" -ItemType "directory"


Copy-Item -Path "./*" -Destination "../bulbizarre-build/" -Recurse -Force -Exclude ".git", "src", "lib", ".vscode"

New-Item "../bulbizarre-build/lib" -ItemType "directory"
New-Item "../bulbizarre-build/lib/mummu" -ItemType "directory"
Copy-Item -Path "./lib/mummu/mummu.js" -Destination "../bulbizarre-build/lib/mummu/mummu.js"
New-Item "../bulbizarre-build/lib/nabu" -ItemType "directory"
Copy-Item -Path "./lib/nabu/nabu.js" -Destination "../bulbizarre-build/lib/nabu/nabu.js"
Copy-Item -Path "./lib/babylon.js" -Destination "../bulbizarre-build/lib/babylon.js"
Copy-Item -Path "./lib/babylonjs.loaders.js" -Destination "../bulbizarre-build/lib/babylonjs.loaders.js"

Get-ChildItem -Path "../bulbizarre-build/" "*.blend" -Recurse | ForEach-Object { Remove-Item -Path $_.FullName }
Get-ChildItem -Path "../bulbizarre-build/" "*.blend1" -Recurse | ForEach-Object { Remove-Item -Path $_.FullName }
Get-ChildItem -Path "../bulbizarre-build/" "*.babylon.manifest" -Recurse | ForEach-Object { Remove-Item -Path $_.FullName }
Get-ChildItem -Path "../bulbizarre-build/" "*.log" -Recurse | ForEach-Object { Remove-Item -Path $_.FullName }
Get-ChildItem -Path "../bulbizarre-build/" "*.xcf" -Recurse | ForEach-Object { Remove-Item -Path $_.FullName }
Get-ChildItem -Path "../bulbizarre-build/" "*.d.ts" -Recurse | ForEach-Object { Remove-Item -Path $_.FullName }
Get-ChildItem -Path "../bulbizarre-build/" "*.pdn" -Recurse | ForEach-Object { Remove-Item -Path $_.FullName }
Remove-Item -Path "../bulbizarre-build/.gitignore"
Remove-Item -Path "../bulbizarre-build/init_repo.bat"
Remove-Item -Path "../bulbizarre-build/make_build.ps1"
Remove-Item -Path "../bulbizarre-build/tsconfig.json"

(Get-Content "../bulbizarre-build/index.html").Replace('./lib/babylon.max.js', './lib/babylon.js') | Set-Content "../bulbizarre-build/index.html"