# env-to-json

This package converts a given .env file to a JSON file.

## Usage

We can use the package via npx for a one-timer execution:

```bash
npx @datacomsys-montpellier/env-to-json <path/to/input.env> <path/to/output.json>
```

Or we can install it globally:

```bash
npm install -g @datacomsys-montpellier/env-to-json
```

Then we can run the command:

```bash
envToJson <path/to/input.env> <path/to/output.json>
```

## Example

Given a `.env` file:

```
DB_HOST=localhost
DB_USER=root
DB_PASS=s1mpl3
```

The command:

```bash
envToJson .env output.json
```

Will produce an `output.json` file with the content:

```json
{
  "DB_HOST": "localhost",
  "DB_USER": "root",
  "DB_PASS": "s1mpl3"
}
```

You can specify input and output directories as needed:

```bash
envToJson ~/my-project-folder/.env ~/my-infrastructure-folder/result.json
```
