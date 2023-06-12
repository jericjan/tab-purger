@REM RUN THIS FOR GENERATING THE MINIFIED "DIST" FOLDER

rmdir dist /s /q
robocopy src/ dist/ /NFL /NDL /NJH /NJS /nc /ns /np /E
start /B terser --compress --mangle -o dist/script.js --module -- dist/script.js
start /B terser --compress --mangle -o dist/classes.js --module -- dist/classes.js
start /B cleancss -o dist/styles.css dist/styles.css
start /B html-minifier --collapse-whitespace --remove-comments -o dist/index.html dist/index.html