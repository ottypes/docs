.PHONY: all, test

all:
	coffee -o lib -cb src 

test:
	node_modules/.bin/mocha
