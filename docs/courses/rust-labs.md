# Rust foundations labs

Use Rust 1.99.1, edition 2024. These original exercises supplement the linked
[Rust Book](https://doc.rust-lang.org/book/). Read the lesson sources first.
Create a disposable project with `cargo new --edition 2024 recall-lab` and run
`cargo test --offline`. No external crates are needed. Do the exercise before
opening its reference solution. Grade your own attempt in Knowclick.

## move-or-borrow

Write a function that takes a `String` by value. Call it and then try printing
the original binding. Predict the result before compiling. Confirm the compiler
reports E0382, then change the parameter to `&str` and borrow at the call site.
Explain why borrowing is sufficient without cloning. Check that the original
string remains usable after the function returns.

<details>
<summary>Reference solution and expected compiler failure</summary>

Save this as `move.rs`; `rustc --edition=2024 move.rs` must fail with E0382:

```rust
fn consume(value: String) { assert_eq!(value, "cloud"); }
fn main() {
    let name = String::from("cloud");
    consume(name);
    println!("{name}");
}
```

The replacement borrows without transferring ownership:

```rust
fn inspect(value: &str) -> usize { value.len() }
fn main() {
    let name = String::from("cloud");
    assert_eq!(inspect(&name), 5);
    assert_eq!(name, "cloud");
}
```

</details>

## job-transition

Define a struct containing a numeric job ID and a state enum with Waiting and
Ready variants. Implement an exhaustive transition that preserves the ID,
changes Waiting to Ready and leaves Ready unchanged. Test both cases. Explain
why adding a third variant requires revisiting the match.

<details>
<summary>Reference solution</summary>

```rust
#[derive(Debug, PartialEq)]
enum State { Waiting, Ready }
struct Job { id: u32, state: State }
fn advance(job: Job) -> Job {
    let state = match job.state {
        State::Waiting => State::Ready,
        State::Ready => State::Ready,
    };
    Job { id: job.id, state }
}
#[test]
fn waiting_becomes_ready() {
    let job = advance(Job { id: 7, state: State::Waiting });
    assert_eq!(job.id, 7);
    assert_eq!(job.state, State::Ready);
}
#[test]
fn ready_stays_ready() {
    let job = advance(Job { id: 8, state: State::Ready });
    assert_eq!(job.id, 8);
    assert_eq!(job.state, State::Ready);
}
```

Place the solution in `src/lib.rs` and run `cargo test --offline`.

</details>

## parse-count

Implement `count(&str) -> Result<u32, ParseIntError>` using `?`. Then implement
`optional_count(Option<&str>) -> Result<Option<u32>, ParseIntError>`. Missing
input is a successful absence, not zero and not a parse error. Test a valid
number, zero, invalid text, a negative number, and missing input.

<details>
<summary>Reference solution</summary>

```rust
use std::num::ParseIntError;
fn count(text: &str) -> Result<u32, ParseIntError> {
    let value = text.parse::<u32>()?;
    Ok(value)
}
fn optional_count(text: Option<&str>) -> Result<Option<u32>, ParseIntError> {
    match text {
        Some(value) => Ok(Some(count(value)?)),
        None => Ok(None),
    }
}
#[test]
fn values_and_failures() {
    assert_eq!(count("27").unwrap(), 27);
    assert_eq!(count("0").unwrap(), 0);
    assert!(count("many").is_err());
    assert!(count("-1").is_err());
    assert_eq!(optional_count(None).unwrap(), None);
    assert_eq!(optional_count(Some("3")).unwrap(), Some(3));
    assert!(optional_count(Some("bad")).is_err());
}
```

Place the solution in `src/lib.rs` and run `cargo test --offline`.

</details>

## text-summary

Build a CLI that reads UTF-8 text from standard input and prints the number of
nonempty lines and whitespace-separated words. A line containing only whitespace
is empty for this exercise. Separate counting from I/O and test empty input,
blank lines, spaces, tabs and a final line without a newline. Use iterators;
do not allocate a vector just to count its length.

<details>
<summary>Reference solution</summary>

```rust
use std::io::{self, Read};
fn summary(text: &str) -> (usize, usize) {
    let lines = text.lines().filter(|line| !line.trim().is_empty()).count();
    (lines, text.split_whitespace().count())
}
fn main() -> io::Result<()> {
    let mut text = String::new();
    io::stdin().read_to_string(&mut text)?;
    let (lines, words) = summary(&text);
    println!("{lines} lines, {words} words");
    Ok(())
}
#[test]
fn empty_and_whitespace() {
    assert_eq!(summary(""), (0, 0));
    assert_eq!(summary(" \n\t\n"), (0, 0));
}
#[test]
fn normal_text() {
    assert_eq!(summary("one two\n\nthree\tfour"), (2, 4));
    assert_eq!(summary("last"), (1, 1));
}
```

Place the solution in `src/main.rs`. Run `cargo test --offline`, then
`printf 'one two\n\nthree\tfour' | cargo run --offline --quiet`.
Expected output: `2 lines, 4 words`.

</details>
