build:
	cargo build --release --target wasm32-unknown-unknown
	rm -rf .././std
	mkdir .././std
	find ./target/wasm32-unknown-unknown -maxdepth 2 -name "*.wasm" -type f | xargs cp -vt .././std
