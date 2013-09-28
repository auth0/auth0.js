build: clean
	@node_modules/.bin/browserify index.js > build/auth0.js 
	@node_modules/.bin/uglifyjs build/auth0.js > build/auth0.min.js 
	@cp build/auth0.js example/auth0.js
	@cp build/auth0.js test/auth0.js

clean:
	rm -rf build/ && mkdir build/

.PHONY: all test clean