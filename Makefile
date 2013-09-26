build: clean
	@node_modules/.bin/browserify build/index.js > build/auth0.js 
	@node_modules/.bin/uglifyjs build/auth0.js > build/auth0.min.js 

clean:
	rm -rf build/

test: 
	@npm test

.PHONY: all test clean
