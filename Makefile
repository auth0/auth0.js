build: clean
	@node_modules/.bin/browserify index.js > build/auth0.js 
	@node_modules/.bin/uglifyjs build/auth0.js > build/auth0.min.js 
	@cp build/auth0.js example/auth0.js

clean:
	rm -rf build/ && mkdir build/

test: 
	@npm test

test-interactive:
	@node_modules/.bin/serve example

.PHONY: all test clean
