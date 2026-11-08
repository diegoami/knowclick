# Rust language core labs

Original exercises for Rust 1.99.1, edition 2024, with the standard library.
Read the linked sources and try the requirements before opening a solution.
Create disposable projects outside this repository. Unless stated otherwise,
use `cargo new --lib --vcs none --edition 2024 rust-core-lab`, place the solution
in `src/lib.rs` and run `cargo test --offline`. No external crates are required.
Grade your attempt in Knowclick after running its local checks.

## cargo-counter

Study [Cargo](https://doc.rust-lang.org/book/ch01-03-hello-cargo.html),
[functions](https://doc.rust-lang.org/book/ch03-03-how-functions-work.html) and
[control flow](https://doc.rust-lang.org/book/ch03-05-control-flow.html).

Create a binary with `cargo new --bin --vcs none --edition 2024 cargo-counter`.
Inspect its `Cargo.toml` and `src/main.rs`. Implement
`step(value: u32, limit: u32) -> u32`: add one when below the limit, otherwise
return the limit, including when value already exceeds it. Avoid overflow at
u32::MAX. Make the executable print `next=4` followed by a newline by evaluating
step(3, 5). Test zero, below, equal, above and maximum boundaries.

Local checks, from the project directory: `cargo check --offline`,
`cargo build --offline`, `cargo test --offline`, then
`cargo run --offline --quiet`. Explain which command runs the program and which
only checks it. Expect `next=4` from the last command.

<details>
<summary>Reference src/main.rs</summary>

<!-- verify-rust: {"cargo":"bin","stdin":"","stdout":"next=4\n"} -->

```rust
fn step(value: u32, limit: u32) -> u32 {
    if value < limit { value + 1 } else { limit }
}
fn main() { println!("next={}", step(3, 5)); }
#[test]
fn boundary_cases() {
    assert_eq!(step(0, 0), 0);
    assert_eq!(step(0, 3), 1);
    assert_eq!(step(3, 5), 4);
    assert_eq!(step(5, 5), 5);
    assert_eq!(step(9, 5), 5);
    assert_eq!(step(u32::MAX, u32::MAX), u32::MAX);
    assert_eq!(step(u32::MAX - 1, u32::MAX), u32::MAX);
}
```

check type-checks without producing the final executable; build produces it;
test runs tests; run builds as needed and runs the executable. For this project,
offline commands need only the installed toolchain because there are no crates
to download.

</details>

## bounded-total

Study [data types](https://doc.rust-lang.org/book/ch03-02-data-types.html),
[control flow](https://doc.rust-lang.org/book/ch03-05-control-flow.html) and
[u64 conversions](https://doc.rust-lang.org/std/primitive.u64.html).

Implement `odd_total(limit: u32) -> u64`, summing odd integers from 1 through
limit inclusively. Use a for loop and continue, without allocating a collection.
Widen each value before adding it. Test zero, limits on both sides of an odd
boundary, and a larger limit. Explain why a u32 accumulator could overflow even
though each individual input fits u32. Local check: `cargo test --offline`.

<details>
<summary>Reference solution</summary>

```rust
fn odd_total(limit: u32) -> u64 {
    let mut total = 0_u64;
    for value in 1..=limit {
        if value % 2 == 0 { continue; }
        total += u64::from(value);
    }
    total
}
#[test]
fn inclusive_boundaries() {
    assert_eq!(odd_total(0), 0);
    assert_eq!(odd_total(1), 1);
    assert_eq!(odd_total(2), 1);
    assert_eq!(odd_total(5), 9);
    assert_eq!(odd_total(6), 9);
    assert_eq!(odd_total(10_000), 25_000_000);
}
```

</details>

## private-meter

Study [module privacy](https://doc.rust-lang.org/book/ch07-03-paths-for-referring-to-an-item-in-the-module-tree.html)
and [methods](https://doc.rust-lang.org/book/ch05-03-method-syntax.html).

Inside module meter, define public struct Meter with private value and limit
fields of type u32. Expose new(limit), value(&self) and tick(&mut self) -> bool.
A new meter starts at zero; tick increments and returns true only below the
limit. At the limit it returns false without changing anything. Test zero and
two-step limits, repeated failed updates and a maximum limit. Outside the
module, access the value field directly and confirm E0616, then remove that
invalid access and use the public getter.

Local checks: `cargo test --offline`; compile the separate failing program below
with `rustc --edition=2024 private-access.rs` and expect E0616. Keep the failing
program outside the working Cargo project.

<details>
<summary>Reference solution and separate expected failure</summary>

```rust
mod meter {
    pub struct Meter { value: u32, limit: u32 }
    impl Meter {
        pub fn new(limit: u32) -> Self { Self { value: 0, limit } }
        pub fn value(&self) -> u32 { self.value }
        pub fn tick(&mut self) -> bool {
            if self.value < self.limit {
                self.value += 1;
                true
            } else { false }
        }
    }
}
#[test]
fn public_behavior() {
    let mut zero = meter::Meter::new(0);
    assert!(!zero.tick());
    assert_eq!(zero.value(), 0);
    let mut two = meter::Meter::new(2);
    assert!(two.tick());
    assert!(two.tick());
    assert!(!two.tick());
    assert!(!two.tick());
    assert_eq!(two.value(), 2);
    let mut large = meter::Meter::new(u32::MAX);
    assert!(large.tick());
    assert_eq!(large.value(), 1);
}
```

Save the following as private-access.rs; it must fail with E0616:

<!-- verify-rust: {"error":"E0616"} -->

```rust
mod meter {
    pub struct Meter { value: u32 }
    impl Meter { pub fn new() -> Self { Self { value: 0 } } }
}
fn main() { println!("{}", meter::Meter::new().value); }
```

</details>

## facade-paths

Study [module paths](https://doc.rust-lang.org/book/ch07-03-paths-for-referring-to-an-item-in-the-module-tree.html)
and [imports/re-exports](https://doc.rust-lang.org/book/ch07-04-bringing-paths-into-scope-with-the-use-keyword.html).

Expose api::Reading with public value: u32 through a re-export from a private
implementation module. Define a crate-root constant BASE = 10. Provide
api::make(raw: u32) -> Reading that adds BASE via a parent-relative helper in
the implementation module; the helper must use a crate-root path for BASE.
Keep tests outside api and import Reading through the facade under an alias.
Test raw values 0 and 7. Restrict input to 0..=u32::MAX - BASE so the addition is
representable. Explain why publishing the implementation module is unnecessary.
Local check: `cargo test --offline`.

<details>
<summary>Reference solution</summary>

```rust
const BASE: u32 = 10;
mod api {
    fn offset() -> u32 { crate::BASE }
    mod implementation {
        pub struct Reading { pub value: u32 }
        impl Reading {
            pub fn new(raw: u32) -> Self {
                Self { value: raw + super::offset() }
            }
        }
    }
    pub use self::implementation::Reading;
    pub fn make(raw: u32) -> Reading { Reading::new(raw) }
}
#[test]
fn facade_only() {
    use crate::api::Reading as PublicReading;
    let first: PublicReading = crate::api::make(0);
    let second = PublicReading::new(7);
    assert_eq!(first.value, 10);
    assert_eq!(second.value, 17);
    assert_eq!(crate::api::make(u32::MAX - BASE).value, u32::MAX);
}
```

</details>

## word-tally

Study [hash maps](https://doc.rust-lang.org/book/ch08-03-hash-maps.html),
[entry updates](https://doc.rust-lang.org/std/collections/hash_map/enum.Entry.html)
and [Unicode lowercase](https://doc.rust-lang.org/std/primitive.str.html#method.to_lowercase).

Implement `tally(&str) -> HashMap<String, usize>` counting whitespace-separated
words after Unicode lowercasing. Own the keys; do not strip punctuation or claim
Unicode normalization. Test repeated mixed-case words, accented letters,
whitespace-only input and punctuation retained in a token. Query the owned keys
with borrowed &str. Never assert iteration order. Local check:
`cargo test --offline`. Explain why sorting only matters if you later print a
deterministic list, not for key-based lookup assertions.

<details>
<summary>Reference solution</summary>

```rust
use std::collections::HashMap;
fn tally(text: &str) -> HashMap<String, usize> {
    let mut counts = HashMap::new();
    for word in text.split_whitespace() {
        *counts.entry(word.to_lowercase()).or_insert(0) += 1;
    }
    counts
}
#[test]
fn words_and_keys() {
    let counts = tally("Red red BLUE É é red!");
    assert_eq!(counts.get("red"), Some(&2));
    assert_eq!(counts.get("blue"), Some(&1));
    assert_eq!(counts.get("é"), Some(&2));
    assert_eq!(counts.get("red!"), Some(&1));
    assert_eq!(counts.get("missing"), None);
    assert_eq!(counts.len(), 4);
    assert!(tally("").is_empty());
    assert!(tally(" \t\n").is_empty());
}
```

</details>

## clean-readings

Study [vectors](https://doc.rust-lang.org/book/ch08-01-vectors.html),
[Vec::retain](https://doc.rust-lang.org/std/vec/struct.Vec.html#method.retain)
and [dedup](https://doc.rust-lang.org/std/vec/struct.Vec.html#method.dedup).

Implement `clean(&mut Vec<i32>)` that removes negative values, sorts ascending
and removes duplicates. Zero is valid. Modify the caller's vector rather than
returning a replacement or cloning it. Test an empty vector, all-invalid values,
nonadjacent duplicates, zero, and a second call on the cleaned vector. Explain
why dedup alone does not remove separated duplicate values. Local check:
`cargo test --offline`; inspect that no replacement vector is allocated.

<details>
<summary>Reference solution</summary>

```rust
fn clean(values: &mut Vec<i32>) {
    values.retain(|value| *value >= 0);
    values.sort_unstable();
    values.dedup();
}
#[test]
fn cleanup_and_reuse() {
    let mut values = vec![3, -1, 0, 3, 2, 0, -9, 2];
    clean(&mut values);
    assert_eq!(values, vec![0, 2, 3]);
    clean(&mut values);
    assert_eq!(values, vec![0, 2, 3]);
    let mut empty = Vec::new();
    clean(&mut empty);
    assert!(empty.is_empty());
    let mut invalid = vec![-1, -2];
    clean(&mut invalid);
    assert!(invalid.is_empty());
    values.push(4);
    assert_eq!(values, vec![0, 2, 3, 4]);
}
```

</details>

## generic-clamp

Study [generics](https://doc.rust-lang.org/book/ch10-01-syntax.html),
[trait bounds](https://doc.rust-lang.org/book/ch10-02-traits.html),
[Ord](https://doc.rust-lang.org/std/cmp/trait.Ord.html) and
[Copy](https://doc.rust-lang.org/std/marker/trait.Copy.html).

Implement `clamp<T: Ord + Copy>(value: &T, low: &T, high: &T) -> Option<T>`.
Return None for reversed bounds. Otherwise return a copied value constrained to
the inclusive interval. Do not clone. Test below, inside, above, equal bounds,
reversed bounds, negative numbers and characters. Keep the borrowed arguments
usable afterwards. Local check: `cargo test --offline`. Explain which operations
need ordering and which require Copy; the standard library's clamp behavior for
invalid bounds is not this exercise's policy.

<details>
<summary>Reference solution</summary>

```rust
fn clamp<T: Ord + Copy>(value: &T, low: &T, high: &T) -> Option<T> {
    if low > high { return None; }
    Some(if value < low { *low } else if value > high { *high } else { *value })
}
#[test]
fn generic_boundaries() {
    let value = 4_i32;
    assert_eq!(clamp(&value, &1, &9), Some(4));
    assert_eq!(value, 4);
    assert_eq!(clamp(&0, &1, &9), Some(1));
    assert_eq!(clamp(&10, &1, &9), Some(9));
    assert_eq!(clamp(&4, &3, &3), Some(3));
    assert_eq!(clamp(&4, &9, &1), None);
    assert_eq!(clamp(&-7, &-5, &-1), Some(-5));
    assert_eq!(clamp(&'z', &'a', &'m'), Some('m'));
    assert_eq!(clamp(&'a', &'a', &'m'), Some('a'));
}
```

</details>

## named-report

Study [traits, default methods and bounds](https://doc.rust-lang.org/book/ch10-02-traits.html).

Define trait Named with required `name(&self) -> &str` and default
`caption(&self) -> String` surrounding the name with square brackets. Implement
it for Person { name: String } using the default, and Device { name: String }
overriding caption with `device:` immediately followed by the name. Implement
`report<T: Named>(&[T]) -> Vec<String>` borrowing a slice and rendering every
caption in order. Test multiple people, an empty name, a device and an empty
slice. Confirm the input values remain usable. Local check:
`cargo test --offline`.

<details>
<summary>Reference solution</summary>

```rust
trait Named {
    fn name(&self) -> &str;
    fn caption(&self) -> String { format!("[{}]", self.name()) }
}
struct Person { name: String }
struct Device { name: String }
impl Named for Person { fn name(&self) -> &str { &self.name } }
impl Named for Device {
    fn name(&self) -> &str { &self.name }
    fn caption(&self) -> String { format!("device:{}", self.name()) }
}
fn report<T: Named>(values: &[T]) -> Vec<String> {
    values.iter().map(|value| value.caption()).collect()
}
#[test]
fn generic_reports() {
    let people = [Person { name: String::from("Mira") }, Person { name: String::new() }];
    assert_eq!(report(&people), vec![String::from("[Mira]"), String::from("[]")]);
    assert_eq!(people[0].name, "Mira");
    let devices = [Device { name: String::from("sensor") }];
    assert_eq!(report(&devices), vec![String::from("device:sensor")]);
    assert_eq!(devices[0].name, "sensor");
    let empty: [Person; 0] = [];
    assert!(report(&empty).is_empty());
}
```

</details>
