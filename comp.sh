rm dist.zip
rm debug.zip
rm log.txt

mkdir "dist"
cp -R "./source" "./dist/"

for i in ./dist/source/js/*.js
do
	echo "Processing $i" | tee -a log.txt
	java -jar yuicompressor.jar --type js "$i" -o "$i" -v --charset utf-8 2>>log.txt
done

for i in ./dist/source/css/*.css
do
	echo "Processing $i" | tee -a log.txt
	java -jar yuicompressor.jar --type css "$i" -o "$i" -v --charset utf-8 2>>log.txt
done

echo "Compressing dist" | tee -a log.txt
7z a -tzip -mx=9 dist.zip ./dist/source/* 2>>log.txt 

echo "Compressing debug" | tee -a log.txt
7z a -tzip -mx=9 debug.zip ./source/* 2>>log.txt 

rm -rf "dist"

cat log.txt
