for i in dist.zip debug.zip log.txt
do
	if [ -f "$i" ]
	then
		echo "Deleting old file $i..."
		rm "$i"
	fi
done

for i in dist debug
do
	if [ -d "$i" ]
	then
		echo "Deleting old dir $i..."
		rm -rf $i
	fi
done

#check if system has java installed for compression of .js and .css files
if command -v java >/dev/null 2>&1
then
	export JAVAEXISTS=true
else
	export JAVAEXISTS=false
	echo "Java not found. Will continue without compacting .js and .css files." | tee -a log.txt
fi

for i in dist debug
do
	cp -r source $i

	if [ $JAVAEXISTS == true ]; then	#only try to compress the files if Java is available
		if [ $i == "dist" ]; then		#only compress files on the distributed version, not the debug version
			echo "Compacting javascript files..." | tee -a log.txt
			for j in ./$i/js/*.js
			do
				echo "### Processing $j" | tee -a log.txt
				java -jar yuicompressor-2.4.8.jar --type js "$j" -o "$j" -v --charset utf-8 2>&1 | tee -a log.txt
				#java -jar closure.jar --compilation_level SIMPLE_OPTIMIZATIONS --language_in ECMASCRIPT5 --js "$i" --js_output_file "./dist/$i" 2>>log.txt
			done

			echo "Compacting css files..." | tee -a log.txt
			for j in ./$i/css/*.css
			do
				echo "### Processing $j" | tee -a log.txt
				java -jar yuicompressor-2.4.8.jar --type css "$j" -o "$j" -v --charset utf-8 2>&1 | tee -a log.txt
			done
		fi
	fi

	if [ -e $i.pem ]; then	#if there's an extension certificate file, then use chrome to build with that certificate
		echo "Creating $i .crx" | tee -a log.txt
		google-chrome --pack-extension=source/ --pack-extension-key=$i.pem | tee -a log.txt
		mv source.crx $i.crx
	fi

	echo "Compressing $i" | tee -a log.txt
	pushd $i >/dev/null
	zip -r -9 ../$i.zip * 2>&1 | tee -a ../log.txt
	popd >/dev/null

	#cleanup
	rm -rf $i

done

echo "Done" | tee -a log.txt
