# Azure cloud concepts: local labs

Original practice for AZ-900 skills measured 2026-07-20, checked against the
linked Microsoft Learn pages on 2026-11-08. Study those sources first, then
attempt the requirements before opening a reference. No account, login,
subscription, deployment or paid service is needed. Grade your attempt in
Knowclick after the stated checks. The optional code reference was tested with
Python 3.14.4 and uses only its standard library.

## service-responsibility-design

A small organization has three workloads:

1. A legacy application requires a customer-installed guest-kernel extension
   and a customer-controlled OS patch schedule on rented compute.
2. A team is writing its own web application for a supported managed runtime.
   It explicitly delegates the runtime and guest OS to its provider.
3. Staff want a finished vendor-operated mail application. They configure
   accounts and data; they do not build or deploy its application source.

Create a local Markdown decision record. For each workload, choose IaaS, PaaS
or SaaS and identify the requirement that determines the choice. Then record
Microsoft's matrix responsibility labels for operating system, customer data,
applications and network controls. Distinguish owning application code from
owning the whole application layer. Explain why outsourcing a platform does
not outsource customer identity and access decisions. Finally, explain why a
service-model label alone cannot promise a zero bill during inactivity.

Local checks: compare each requirement with its service-model source and each
control with the responsibility matrix. Your record should contain three
justified model choices and twelve control labels, plus the two explanations.
This is a design check, not a live authorization, pricing or service test.

Sources:
[service-model overview](https://learn.microsoft.com/en-us/training/modules/describe-cloud-service-types/),
[IaaS](https://learn.microsoft.com/en-us/training/modules/describe-cloud-service-types/2-describe-infrastructure-service),
[PaaS](https://learn.microsoft.com/en-us/training/modules/describe-cloud-service-types/3-describe-platform-service),
[SaaS](https://learn.microsoft.com/en-us/training/modules/describe-cloud-service-types/4-describe-software-service),
[responsibility matrix](https://learn.microsoft.com/en-us/azure/security/fundamentals/shared-responsibility),
[hosting/billing distinctions](https://learn.microsoft.com/en-us/azure/azure-functions/functions-scale).

<details>
<summary>Reference decisions and checking rubric</summary>

The legacy workload needs IaaS because it retains guest-OS authority. The custom
web application fits PaaS because the provider maintains its platform while the
team supplies application logic. The finished mail product fits SaaS.

| Matrix control   | Legacy / IaaS | Custom web / PaaS | Finished mail / SaaS |
| ---------------- | ------------- | ----------------- | -------------------- |
| Operating system | Customer      | Microsoft         | Microsoft            |
| Customer data    | Customer      | Customer          | Customer             |
| Applications     | Customer      | Shared            | Shared               |
| Network controls | Customer      | Shared            | Microsoft            |

Shared does not mean that the provider secures every line of customer code or
chooses every customer setting. Retained customer responsibilities include
identities, access decisions and data protection. Apply the matrix's categories
without treating them as a complete service-specific security design.

A service model describes operational responsibility. Charges depend on the
actual service, resources and hosting plan. Idle application code can coexist
with provisioned capacity; check the hosting plan’s billing rather than infer
that stopping work releases that capacity. No price is estimated in this lab.

Check every table cell against the current matrix. A good attempt justifies
all three choices from the requirements, records all twelve labels correctly,
and explains the two limitations without claiming a deployed result.

</details>

## scaling-policy-model

Study [scaling directions](https://learn.microsoft.com/en-us/azure/architecture/best-practices/auto-scaling)
and [capacity and per-rule stabilization settings](https://learn.microsoft.com/en-us/azure/azure-monitor/autoscale/autoscale-understanding-settings).

Work through a local worksheet for one hypothetical scaling rule. Its policy
keeps at least one worker warm; this is a requirement of this exercise, not a
universal Azure service limit. Given current count, requested count, lower and
upper bounds, and whether this rule is cooling down:

- Reject noninteger counts (including booleans), a nonboolean cooling flag,
  a lower bound below one, reversed bounds, a negative requested count, or a
  current count outside the bounds.
- For valid input, keep the current count while this rule is cooling down.
- Otherwise constrain the requested count to the inclusive bounds.

Predict the following results before opening the reference:

| Current | Requested | Minimum | Maximum | Cooling |
| ------- | --------- | ------- | ------- | ------- |
| 3       | 5         | 2       | 6       | false   |
| 3       | 0         | 2       | 6       | false   |
| 3       | 20        | 2       | 6       | false   |
| 3       | 5         | 2       | 6       | true    |
| 2       | 2         | 2       | 6       | false   |
| 6       | 6         | 2       | 6       | false   |

For each accepted change, identify scale out, scale in or no count change.
Explain how increasing one worker's memory differs from adding workers.
Explain why a rule's cooldown is not a global pause on all other rules.

You may complete the worksheet on paper or in a local text file. For coding
practice, implement `target_count(current, requested, minimum, maximum, cooling)`
in Python 3 and test the contract above. Check rejected inputs and enumerate
small valid combinations to prove that outputs stay within the chosen bounds.
Save the implementation/tests as `scaling_policy.py` and run
`python3 scaling_policy.py`; no third-party packages are needed.

This fixture is not the Azure Monitor algorithm or SDK. It omits metric
collection, lookback windows, multiple-rule conflicts, startup/drain delays,
platform limits and the fallback used when metrics are unavailable. Real Azure
Monitor also handles an out-of-range current capacity differently. Executing
this model proves only the stated local policy, not real cloud behavior.

<details>
<summary>Reference worksheet and optional Python solution</summary>

The six target counts are 5, 2, 6, 3, 2 and 6 respectively. Their directions
are out, in, out, unchanged, unchanged and unchanged. Changing a worker's
memory is vertical scaling; changing worker count is horizontal scaling.
Azure Monitor evaluates each rule's stabilization interval independently.

```python
import unittest


def target_count(current, requested, minimum, maximum, cooling):
    counts = (current, requested, minimum, maximum)
    if any(type(value) is not int for value in counts):
        raise ValueError("counts must be integers, not booleans")
    if type(cooling) is not bool:
        raise ValueError("cooling must be boolean")
    if minimum < 1 or maximum < minimum or requested < 0:
        raise ValueError("invalid local policy bounds or requested count")
    if not minimum <= current <= maximum:
        raise ValueError("current count must already satisfy local bounds")
    if cooling:
        return current
    return max(minimum, min(requested, maximum))


class ScalingPolicyTests(unittest.TestCase):
    def test_increasing_count(self):
        self.assertEqual(target_count(3, 5, 2, 6, False), 5)

    def test_lower_and_upper_bounds(self):
        self.assertEqual(target_count(3, 0, 2, 6, False), 2)
        self.assertEqual(target_count(3, 20, 2, 6, False), 6)

    def test_cooling_keeps_current(self):
        self.assertEqual(target_count(3, 5, 2, 6, True), 3)

    def test_exact_boundaries(self):
        self.assertEqual(target_count(2, 2, 2, 6, False), 2)
        self.assertEqual(target_count(6, 6, 2, 6, False), 6)
        self.assertEqual(target_count(4, 9, 4, 4, False), 4)

    def test_invalid_counts(self):
        for args in [(3, -1, 2, 6, False), (3, 4, 0, 6, False),
                     (3, 4, 6, 2, False), (1, 4, 2, 6, False),
                     (7, 4, 2, 6, True)]:
            with self.subTest(args=args), self.assertRaises(ValueError):
                target_count(*args)

    def test_types_are_explicit(self):
        for args in [(True, 4, 2, 6, False), (3, 4.0, 2, 6, False),
                     (3, 4, 2, 6, "false"), (3, 4, False, 6, False)]:
            with self.subTest(args=args), self.assertRaises(ValueError):
                target_count(*args)

    def test_all_small_valid_requests(self):
        for current in range(2, 7):
            for requested in range(10):
                for cooling in (False, True):
                    result = target_count(current, requested, 2, 6, cooling)
                    self.assertGreaterEqual(result, 2)
                    self.assertLessEqual(result, 6)
                    if cooling:
                        self.assertEqual(result, current)


if __name__ == "__main__":
    unittest.main()
```

The bounds/cooling assertions verify the teaching contract, not service
availability, throughput, costs or live autoscale operation. Keep a distinction
between predicting an intended count and proving that real instances can serve
useful work. Grade the worksheet even if you do not choose the coding extension.

</details>
