.PHONY: all lib test webclient

COFFEE=node_modules/.bin/coffee
UGLIFY=node_modules/.bin/uglifyjs

# Build the types into javascript in lib/ for nodejs
all: lib webclient

clean:
	rm -rf lib
	rm -rf webclient

test:
	node_modules/.bin/mocha

lib:
	rm -rf lib
	coffee -cbo lib src
	cp src/json0.js lib

webclient/%.uncompressed.js: src/%.coffee before.js after.js
	mkdir -p webclient
	cat before.js > $@
	$(COFFEE) -bpc $< >> $@
	cat after.js >> $@

webclient/json0.uncompressed.js: src/json0.js src/helpers.coffee before.js after.js
	mkdir -p webclient
	cat before.js > $@
	$(COFFEE) -bpc src/helpers.coffee >> $@
	cat src/json0.js >> $@
	cat after.js >> $@

# Uglify.
webclient/%.js: webclient/%.uncompressed.js
	$(UGLIFY) $< -cmo $@

# Compile the types for a browser.
webclient: webclient/json0.js webclient/text.js webclient/text-tp2.js
#webclient/json.js won't work yet - it needs the helpers and stuff compiled in as well.


