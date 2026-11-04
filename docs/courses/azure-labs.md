# Azure developer foundations labs

These original exercises supplement Microsoft Learn. They are local practice,
not an AI-200 exam simulator. No login, subscription or deployment is needed.
Read the sources linked from each lesson, then attempt the exercise before
opening its reference solution. Grade your attempt in Knowclick.

## identity-design

A Function must read blobs from one storage container. Describe its identity,
the required data-plane role, the narrowest useful scope, and how credentials
are obtained. Explain why subscription-wide Contributor and a connection
string committed to source are unsuitable. Do not create the resources.

<details>
<summary>Reference design</summary>

Use a managed identity supported by the hosting service, and assign Storage
Blob Data Reader at the target container scope. The application requests an
access token through the platform identity mechanism; it stores no account key.
An RBAC role assignment associates the identity, role and scope. Contributor
is unnecessarily broad and does not itself grant blob data access. If a separate
external service requires a secret, keep that secret in Key Vault and grant
only the necessary read permission; Key Vault is not a replacement for a
managed identity. This is a design check, not a claim that access was tested.

Sources: [managed identities](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/overview),
[blob data access roles](https://learn.microsoft.com/en-us/azure/storage/blobs/assign-azure-role-data-access).

</details>

## compile-bicep

With Bicep 0.48.1, author `main.bicep` with a string parameter defaulting to the
resource group's location and an output exposing that parameter. Compile it
locally. Inspect the resulting template: the parameter is a string, its default
is an expression, and the output references the parameter. Explain why building
a template is different from deploying it. Do not run a deployment command.

<details>
<summary>Reference solution</summary>

```bicep
param location string = resourceGroup().location
output selectedLocation string = location
```

Run `bicep build main.bicep --outfile main.json`. The output value should be
`[parameters('location')]`; no resource is created. To extend the exercise,
change the parameter default to a literal and compare the generated template.

Sources: [parameters](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/parameters),
[outputs](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/outputs).

</details>

## repeat-safe-handler

Implement a pure Python handler for messages containing an operation ID and an
amount. Applying the same ID again must not add the amount twice. Test a first
delivery, a duplicate and a different ID. Explain why an in-memory set is only
a local teaching model: it is neither durable across restarts nor safe across
multiple workers, and does not provide an atomic commit with an external side
effect. Explain which service fits business commands, event notifications and
telemetry streams. An HTTP-triggered Function is one possible entry point, but
this exercise needs neither the Functions SDK nor a cloud account.

<details>
<summary>Reference solution</summary>

```python
import unittest

def apply(seen, total, operation_id, amount):
    if operation_id in seen:
        return total
    seen.add(operation_id)
    return total + amount

class HandlerTests(unittest.TestCase):
    def test_duplicate_and_distinct_ids(self):
        seen = set()
        total = apply(seen, 0, "order-1", 5)
        self.assertEqual(total, 5)
        total = apply(seen, total, "order-1", 5)
        self.assertEqual(total, 5)
        total = apply(seen, total, "order-2", 3)
        self.assertEqual(total, 8)

if __name__ == "__main__":
    unittest.main()
```

Save as `handler.py` and run `python3 handler.py`. The test must pass. Real
systems need a durable, concurrency-safe mechanism that coordinates deduplication
with the side effect. Retrying a delivery alone cannot guarantee this.
Service Bus fits enterprise commands; Event Grid routes discrete notifications;
Event Hubs ingests telemetry streams. Choose based on requirements rather than
assuming any service gives arbitrary external side effects exactly-once behavior.

Sources: [idempotent Functions](https://learn.microsoft.com/en-us/azure/azure-functions/functions-idempotent),
[messaging comparison](https://learn.microsoft.com/en-us/azure/service-bus-messaging/compare-messaging-services).

</details>
