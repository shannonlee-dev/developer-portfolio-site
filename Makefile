PYTHON ?= python3
.PHONY: setup check format test smoke run

setup:
	npm ci

check:
	$(PYTHON) scripts/check.py
	@for file in $$(find src -name "*.js"); do node --check "$$file" || exit $$?; done
	npm run format:check

format:
	npm run format

test:
	npm test

smoke:
	npm run test:smoke

run:
	$(PYTHON) -m http.server 5500 --bind 127.0.0.1
