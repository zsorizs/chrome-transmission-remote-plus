@echo off
del dist.zip /Q
rd dist /s /Q
del log.txt /Q
xcopy source dist\source /I /s

FOR %%G IN (source\js\*.js) DO java -jar compiler.jar --js %%G --js_output_file dist\%%G --summary_detail_level 3 --compilation_level SIMPLE_OPTIMIZATIONS 2>>log.txt

FOR %%G IN (source\css\*.css) DO java -jar yuicompressor.jar %%G -o dist\%%G -v --charset utf-8 2>>log.txt

"C:\Program Files\7-Zip\7z.exe" -tzip -mx=9 a dist.zip .\dist\source\* 2>>log.txt 

rd dist /s /Q

chrome --pack-extension=%CD%\source --pack-extension-key=%CD%\source.pem