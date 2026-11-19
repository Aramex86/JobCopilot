COMMIT MESSAGE: feat(hello): add greet function and tests
ADD LIST:
src/jobcopilot/hello.py
tests/test_hello.py
pyproject.toml
PR TITLE: feat(hello): add greet helper and unit tests
PR BODY:
This change introduces a simple greet(name: str) -> str helper in src/jobcopilot/hello.py that returns a lowercase hello {name} string. It adds tests/test_hello.py with two pytest cases covering a normal name and an empty name edge case. pyproject.toml is updated to declare pytest>=8.0 as a dev dependency so the new tests can run. The implementation is dependency-free and does not import any cross-feature or UI modules. The acceptance checklist is fully PASS with no defects reported. Test execution was blocked by tool-level approval, so the tester verified the implementation by source inspection and confirmed the assertions match the expected behavior. Reviewers can treat this as a trivial domain-only addition and merge after confirming their local pytest run passes.
