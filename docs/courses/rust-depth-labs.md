# Rust: deeper foundations labs

Original exercises for Rust 1.99.1, edition 2024, using only the standard library.
Study the linked references first. Create a disposable project with
`cargo new --lib --edition 2024 rust-depth-lab`. Put each solution in `src/lib.rs`
and run `cargo test --offline`. Attempt the requirements before opening the
reference. Self-assess the attempt in Knowclick after checking it locally.

## borrowed-prefix

Study [borrowing](https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html),
[slices](https://doc.rust-lang.org/book/ch04-03-slices.html) and
[str::split_once](https://doc.rust-lang.org/std/primitive.str.html#method.split_once).

Implement `prefix(&str) -> &str` returning the part before the first colon, or
the entire input when no colon exists. Do not allocate or clone. An empty prefix
is allowed. Test empty input, missing colon, leading colon, multiple colons and
non-ASCII text. Also demonstrate a mutable owned string: inspect its prefix,
then append a character after the view's last use and check the owner.

Local checks: `cargo test --offline`; inspect the implementation for allocation
or cloning, which output comparisons alone cannot detect.

<details>
<summary>Reference solution</summary>

```rust
fn prefix(text: &str) -> &str {
    match text.split_once(':') {
        Some((head, _)) => head,
        None => text,
    }
}
#[test]
fn prefixes_and_owner() {
    assert_eq!(prefix(""), "");
    assert_eq!(prefix("plain"), "plain");
    assert_eq!(prefix(":tail"), "");
    assert_eq!(prefix("a:b:c"), "a");
    assert_eq!(prefix("é:ok"), "é");
    let mut owner = String::from("log:ready");
    let view = prefix(&owner);
    assert_eq!(view, "log");
    owner.push('!');
    assert_eq!(owner, "log:ready!");
}
```

The returned reference borrows input text. Its last use precedes the mutation;
trying to use that view after the mutation would overlap the shared borrow
with an exclusive one.

</details>

## event-reducer

Study [enum matching](https://doc.rust-lang.org/book/ch06-02-match.html) and
[method receivers](https://doc.rust-lang.org/book/ch05-03-method-syntax.html).

Define `State { paused: bool, messages: u32 }` and `Event` with Pause, Resume
and Text(String). Implement `apply(&mut State, Event) -> Option<String>`.
Pause sets paused, Resume clears it, and neither returns text. Text increments
messages and returns the owned payload only while active; paused Text is
discarded without incrementing. Do not clone any payload. Test pause/resume
idempotence, active empty text, active nonempty text, and discarded paused text.

Local checks: `cargo test --offline`; inspect that a Text payload is moved into
the returned Option rather than duplicated. An exhaustive match should require
a new case if a variant is added.

<details>
<summary>Reference solution</summary>

```rust
struct State { paused: bool, messages: u32 }
enum Event { Pause, Resume, Text(String) }
fn apply(state: &mut State, event: Event) -> Option<String> {
    match event {
        Event::Pause => { state.paused = true; None }
        Event::Resume => { state.paused = false; None }
        Event::Text(text) => {
            if state.paused { None } else {
                state.messages += 1;
                Some(text)
            }
        }
    }
}
#[test]
fn every_event_path() {
    let mut state = State { paused: false, messages: 0 };
    assert_eq!(apply(&mut state, Event::Text(String::from("hello"))), Some(String::from("hello")));
    assert_eq!(apply(&mut state, Event::Text(String::new())), Some(String::new()));
    assert_eq!(state.messages, 2);
    assert_eq!(apply(&mut state, Event::Pause), None);
    assert_eq!(apply(&mut state, Event::Pause), None);
    assert!(state.paused);
    assert_eq!(apply(&mut state, Event::Text(String::from("drop"))), None);
    assert_eq!(state.messages, 2);
    assert_eq!(apply(&mut state, Event::Resume), None);
    assert_eq!(apply(&mut state, Event::Resume), None);
    assert!(!state.paused);
    assert_eq!(apply(&mut state, Event::Text(String::from("back"))), Some(String::from("back")));
    assert_eq!(state.messages, 3);
}
```

</details>

## parse-pair

Study [Result and propagation](https://doc.rust-lang.org/book/ch09-02-recoverable-errors-with-result.html),
[Result::map_err](https://doc.rust-lang.org/std/result/enum.Result.html#method.map_err)
and [str::split_once](https://doc.rust-lang.org/std/primitive.str.html#method.split_once).

Implement `pair(&str) -> Result<(u32, u32), PairError>` for input `left=right`.
Split at the first equals sign, trim both sides, parse the left side then the
right side as u32, then reject zero on either side. Error variants are Shape
(no equals sign), Left, Right (parse failures), and Zero. This ordering decides
precedence: `0=bad` is Right; `bad=0` is Left. Do not panic or supply a default.
An additional equals sign remains in the right side and therefore fails parsing.
Test valid whitespace, absent separator, empty sides, negative input, invalid
right input, extra separators, overflow, both zero cases and precedence.

Local check: `cargo test --offline`. A parse failure must remain distinguishable
from missing structure and range validation.

<details>
<summary>Reference solution</summary>

```rust
#[derive(Debug, PartialEq)]
enum PairError { Shape, Left, Right, Zero }
fn pair(text: &str) -> Result<(u32, u32), PairError> {
    let (left, right) = text.split_once('=').ok_or(PairError::Shape)?;
    let left = left.trim().parse::<u32>().map_err(|_| PairError::Left)?;
    let right = right.trim().parse::<u32>().map_err(|_| PairError::Right)?;
    if left == 0 || right == 0 { return Err(PairError::Zero); }
    Ok((left, right))
}
#[test]
fn pair_cases() {
    assert_eq!(pair(" 2 = 3 "), Ok((2, 3)));
    assert_eq!(pair("2"), Err(PairError::Shape));
    assert_eq!(pair("=3"), Err(PairError::Left));
    assert_eq!(pair("2="), Err(PairError::Right));
    assert_eq!(pair("-1=3"), Err(PairError::Left));
    assert_eq!(pair("2=bad"), Err(PairError::Right));
    assert_eq!(pair("2=3=4"), Err(PairError::Right));
    assert_eq!(pair("4294967296=1"), Err(PairError::Left));
    assert_eq!(pair("0=3"), Err(PairError::Zero));
    assert_eq!(pair("2=0"), Err(PairError::Zero));
    assert_eq!(pair("0=bad"), Err(PairError::Right));
    assert_eq!(pair("bad=0"), Err(PairError::Left));
}
```

</details>

## indexed-values

Study [iterators](https://doc.rust-lang.org/book/ch13-02-iterators.html) and the
[Iterator API](https://doc.rust-lang.org/std/iter/trait.Iterator.html).

Implement `indexed(&str) -> Vec<(usize, u32)>`. Iterate text lines in order,
number them from one before filtering, trim each, and retain successfully parsed
u32 values with their original line numbers. Empty, negative, overflowing and
malformed lines are skipped; zero is retained. Use an iterator pipeline rather
than pushing inside a loop. Test empty input, all invalid input, interleaved
invalid input, CRLF, whitespace and a final line without a newline. Confirm
that an owned input string remains usable. Compute a u64 total of retained
values separately without consuming the vector.

Local checks: `cargo test --offline`; inspect that enumeration occurs before
filtering and that the aggregation borrows rather than consumes the result.

<details>
<summary>Reference solution</summary>

```rust
fn indexed(text: &str) -> Vec<(usize, u32)> {
    text.lines().enumerate().filter_map(|(index, line)| {
        line.trim().parse::<u32>().ok().map(|value| (index + 1, value))
    }).collect()
}
#[test]
fn original_positions_and_total() {
    assert_eq!(indexed(""), vec![]);
    assert_eq!(indexed("bad\n-1\n4294967296"), vec![]);
    let input = String::from(" 4 \r\nbad\r\n\r\n0\r\n 9");
    let values = indexed(&input);
    assert_eq!(values, vec![(1, 4), (4, 0), (5, 9)]);
    let total: u64 = values.iter().map(|(_, value)| u64::from(*value)).sum();
    assert_eq!(total, 13);
    assert_eq!(values.len(), 3);
    assert!(input.starts_with(" 4 "));
}
```

</details>
