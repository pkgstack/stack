compile:
	bun build ./src/index.ts --compile --outfile ./bin/stack-linux-x64/stack

bundle:
	make compile && (cd bin/ && rm ../release/stack-linux-x64.zip && zip -r ../release/stack-linux-x64.zip ./stack-linux-x64/stack)